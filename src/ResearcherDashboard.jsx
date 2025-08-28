// src/ResearcherDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import {
  collection,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

function ResearcherDashboard({ researcher, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [results, setResults] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);

  // 🔄 Live profile (for welcome name)
  useEffect(() => {
    if (!researcher) return;
    const ref = doc(db, "users", researcher.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => snap.exists() && setProfile(snap.data()),
      (e) => console.error("Profile watch error:", e)
    );
    return () => unsub();
  }, [researcher]);

  // 🔄 Live results
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "results"),
      (snap) => setResults(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => console.error("Results watch error:", e)
    );
    return () => unsub();
  }, []);

  // 🔄 Live pending approvals
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const pend = users
          .filter((u) => !u.approved)
          .sort((a, b) => {
            const ta = a.createdAt?.seconds || 0;
            const tb = b.createdAt?.seconds || 0;
            return tb - ta; // newest first
          });
        setPendingUsers(pend);
      },
      (e) => console.error("Users watch error:", e)
    );
    return () => unsub();
  }, []);

  // Approve a user
  const approveUser = async (uid) => {
    try {
      await updateDoc(doc(db, "users", uid), { approved: true });
      setPendingUsers((prev) => prev.filter((u) => u.id !== uid));
    } catch (err) {
      console.error("Error approving user:", err);
    }
  };

  // ---------- Decryption helpers ----------
  const SECRET_B64 = import.meta.env.VITE_RESULTS_SECRET || null; // optional AES-GCM key (base64)

  const isLikelyBase64 = (s) =>
    typeof s === "string" &&
    /^[A-Za-z0-9+/=]+$/.test(s) &&
    s.length % 4 === 0;

  const b64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const bytesToText = (bytes) => new TextDecoder().decode(bytes);

  const tryBase64Decode = (s) => {
    try {
      if (!isLikelyBase64(s)) return s;
      const txt = bytesToText(b64ToBytes(s));
      // Heuristic: if decoding yields lots of control chars, keep original
      const printable = txt.replace(/[^\x20-\x7E\n\r\t]/g, "");
      return printable.length / txt.length < 0.9 ? s : txt;
    } catch {
      return s;
    }
  };

  // Optional AES-GCM decrypt for objects like:
  // { __enc: "aes-gcm", iv: "<base64>", data: "<base64>" }
  const aesGcmDecrypt = async (payload) => {
    try {
      if (!SECRET_B64) return null;
      if (!payload || payload.__enc !== "aes-gcm") return null;

      const keyRaw = b64ToBytes(SECRET_B64);
      const key = await crypto.subtle.importKey(
        "raw",
        keyRaw,
        "AES-GCM",
        false,
        ["decrypt"]
      );
      const iv = b64ToBytes(payload.iv);
      const data = b64ToBytes(payload.data);
      const buf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
      return bytesToText(new Uint8Array(buf));
    } catch {
      return null;
    }
  };

  const decryptValue = async (val) => {
    // string → try base64
    if (typeof val === "string") {
      return tryBase64Decode(val);
    }
    // aes-gcm wrapper object
    if (val && typeof val === "object" && val.__enc === "aes-gcm") {
      const plain = await aesGcmDecrypt(val);
      if (plain != null) return plain;
      return val; // fallback to original if no key or failed
    }
    // arrays/objects → recurse
    if (Array.isArray(val)) {
      const out = [];
      for (const item of val) out.push(await decryptValue(item));
      return out;
    }
    if (val && typeof val === "object") {
      const out = {};
      for (const [k, v] of Object.entries(val)) {
        out[k] = await decryptValue(v);
      }
      return out;
    }
    return val;
  };

  const formatDateTime = (ts) => {
    if (!ts) return "";
    const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(String(ts));
    return isNaN(d.getTime()) ? "" : d.toLocaleString();
  };

  // Build table rows
  const tableRows = useMemo(
    () =>
      results.map((r) => ({
        id: r.id,
        participantId: r.participantId ?? r.participant?.participantId ?? "",
        university: r.university ?? r.participant?.university ?? "",
        condition: r.condition ?? r.participant?.condition ?? "",
        visual: r.medians?.visual ?? "",
        auditory: r.medians?.auditory ?? "",
        tactile: r.medians?.tactile ?? "",
        overall: r.overallMedian ?? "",
        date: formatDateTime(r.createdAt ?? r.participant?.timestamp) || "",
      })),
    [results]
  );

  // CSV download with decryption
  const handleDownloadCSV = async () => {
    try {
      setCsvLoading(true);

      // 1) Decrypt each results doc deeply (strings + supported wrappers)
      const decrypted = [];
      for (const r of results) {
        decrypted.push(await decryptValue(r));
      }

      // 2) Normalize obvious date for readability
      const normalized = decrypted.map((r) => ({
        ...r,
        createdAt: formatDateTime(r.createdAt ?? r.participant?.timestamp) || r.createdAt,
      }));

      // 3) Build stable columns across all rows AFTER decryption
      const cols = Array.from(
        normalized.reduce((set, row) => {
          Object.keys(row).forEach((k) => set.add(k));
          return set;
        }, new Set())
      );

      const header = cols.join(",");
      const rows = normalized.map((r) =>
        cols
          .map((c) => {
            const val = r[c];
            const out =
              val == null
                ? ""
                : typeof val === "object"
                ? JSON.stringify(val)
                : String(val);
            return /[",\n]/.test(out) ? `"${out.replace(/"/g, '""')}"` : out;
          })
          .join(",")
      );

      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "results_decrypted.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("CSV download error:", e);
    } finally {
      setCsvLoading(false);
    }
  };

  // Display name: First Last → First → email
  const displayName = useMemo(() => {
    const fn = (profile?.firstName || "").trim();
    const ln = (profile?.lastName || "").trim();
    return fn || ln ? `${fn}${fn && ln ? " " : ""}${ln}` : researcher?.email;
  }, [profile, researcher]);

  const initials = (first, last) => {
    const a = (first || "").trim()[0] || "";
    const b = (last || "").trim()[0] || "";
    return (a + b).toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-4 pt-8 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Researcher Dashboard
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadCSV}
              disabled={csvLoading || results.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 transition shadow"
            >
              {/* download icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                   viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 14a1 1 0 011-1h3v-3h4v3h3a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
                <path d="M7 7h6l-3 4-3-4z" />
              </svg>
              {csvLoading ? "Preparing CSV..." : "Download CSV"}
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 transition shadow"
            >
              {/* logout icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                   viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 17l5-5-5-5v3H9v4h7v3z" />
                <path d="M4 5h6V3H4a2 2 0 00-2 2v14a2 2 0 002 2h6v-2H4V5z" />
              </svg>
              Log Out
            </button>
          </div>
        </div>

        <p className="mt-3 text-slate-300">
          Welcome <span className="font-semibold text-white">{displayName}</span>
        </p>
      </header>

      {/* Main */}
      <main className="w-full max-w-6xl mx-auto px-4 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending approvals (only if any) */}
        {pendingUsers.length > 0 && (
          <section className="lg:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Pending Approvals</h2>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {pendingUsers.length}
              </span>
            </div>

            <ul className="space-y-3">
              {pendingUsers.map((u) => {
                const fn = (u.firstName || "").trim();
                const ln = (u.lastName || "").trim();
                const name = fn || ln ? `${fn}${fn && ln ? " " : ""}${ln}` : "Unnamed";
                return (
                  <li
                    key={u.id}
                    className="flex items-center justify-between rounded-xl bg-black/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                        {initials(fn, ln)}
                      </div>
                      <div className="leading-tight">
                        <div className="font-medium">{name}</div>
                        <div className="text-xs text-slate-300">{u.email || u.id}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => approveUser(u.id)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 transition"
                    >
                      Approve
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Results table */}
        <section className={`bg-white/10 backdrop-blur-md rounded-2xl p-5 shadow-xl ${pendingUsers.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Results</h2>
            <span className="text-xs text-slate-300">
              {results.length} record{results.length === 1 ? "" : "s"}
            </span>
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-300 py-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6H4l-2 7v7h20v-7l-2-7zM6.16 8h11.68l1.14 4H15l-2 2h-2l-2-2H5.02L6.16 8z" />
              </svg>
              <div className="text-sm">No data yet.</div>
            </div>
          ) : (
            <>
              <div className="overflow-auto rounded-xl border border-white/10">
                <table className="min-w-full text-sm">
                  <thead className="bg-black/30 text-slate-200">
                    <tr>
                      <th className="text-left px-3 py-2">Participant</th>
                      <th className="text-left px-3 py-2">University</th>
                      <th className="text-left px-3 py-2">Condition</th>
                      <th className="text-right px-3 py-2">Visual</th>
                      <th className="text-right px-3 py-2">Auditory</th>
                      <th className="text-right px-3 py-2">Tactile</th>
                      <th className="text-right px-3 py-2">Overall</th>
                      <th className="text-left px-3 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {tableRows.map((r) => (
                      <tr key={r.id} className="hover:bg-white/5">
                        <td className="px-3 py-2 font-medium">{r.participantId || "—"}</td>
                        <td className="px-3 py-2">{r.university || "—"}</td>
                        <td className="px-3 py-2">{r.condition || "—"}</td>
                        <td className="px-3 py-2 text-right">{r.visual ?? "—"}</td>
                        <td className="px-3 py-2 text-right">{r.auditory ?? "—"}</td>
                        <td className="px-3 py-2 text-right">{r.tactile ?? "—"}</td>
                        <td className="px-3 py-2 text-right">{r.overall ?? "—"}</td>
                        <td className="px-3 py-2">{r.date || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-slate-300 hover:text-white">
                  Show raw JSON
                </summary>
                <pre className="mt-2 text-xs bg-black/40 p-3 rounded-lg max-h-72 overflow-auto">
{JSON.stringify(results, null, 2)}
                </pre>
              </details>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default ResearcherDashboard;
