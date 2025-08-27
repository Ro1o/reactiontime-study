import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthProvider";

function downloadCSV(rows, filename) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]);
  const csv = [header.join(",")]
    .concat(rows.map(r => header.map(k => JSON.stringify(r[k] ?? "")).join(",")))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

export default function AdminDashboard() {
  const { user, loading, signOut } = useAuth();
  const [sessions, setSessions] = useState([]); const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const q = query(collection(db, "results"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingData(false);
    })();
  }, [user]);

  const rowsPerSession = useMemo(() => sessions.map(s => ({
    participantId: s.participant?.participantId ?? "",
    university: s.participant?.university ?? "",
    condition: s.participant?.condition ?? "",
    sleepHours: s.participant?.sleepHours ?? "",
    sleepQuality: s.participant?.sleepQuality ?? "",
    startedAt: s.participant?.timestamp ?? "",
    median_visual: s.medians?.visual ?? "",
    median_auditory: s.medians?.auditory ?? "",
    median_tactile: s.medians?.tactile ?? "",
    overallMedian: s.overallMedian ?? "",
    docId: s.id,
  })), [sessions]);

  // OPTIONAL: one row per trial instead of per session
  const rowsPerTrial = useMemo(() => sessions.flatMap(s =>
    (s.trials || []).map((t, i) => ({
      participantId: s.participant?.participantId ?? "",
      modality: t.modality, trialIndex: i + 1, rt_ms: t.rt,
      condition: s.participant?.condition ?? "",
      university: s.participant?.university ?? "",
      startedAt: s.participant?.timestamp ?? "",
      docId: s.id,
    }))
  ), [sessions]);

  if (loading) return null;
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="p-6 rounded-xl bg-white/80 shadow">
        <p>You're signed out. Go to <a className="text-blue-600" href="/admin">/admin</a> to sign in.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Researcher Dashboard</h1>
          <button onClick={signOut} className="px-3 py-2 rounded bg-gray-700 text-white">Sign out</button>
        </div>

        <div className="rounded-xl p-4 bg-white/60 dark:bg-gray-800/60 shadow">
          <p className="mb-3">Sessions collected: <b>{sessions.length}</b></p>
          <div className="flex gap-3 flex-wrap">
            <button
              disabled={!rowsPerSession.length}
              onClick={() => downloadCSV(rowsPerSession, "reaction_sessions.csv")}
              className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
            >
              Download CSV (per session)
            </button>
            <button
              disabled={!rowsPerTrial.length}
              onClick={() => downloadCSV(rowsPerTrial, "reaction_trials.csv")}
              className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
            >
              Download CSV (per trial)
            </button>
          </div>
        </div>

        {loadingData ? (
          <p className="mt-4 opacity-70">Loading…</p>
        ) : (
          <details className="mt-4">
            <summary className="cursor-pointer">Preview (first 5 sessions)</summary>
            <pre className="text-xs bg-black/10 p-3 rounded mt-2 overflow-auto max-h-64">
{JSON.stringify(sessions.slice(0,5), null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
