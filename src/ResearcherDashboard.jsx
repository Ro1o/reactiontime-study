// src/ResearcherDashboard.jsx
import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";

function ResearcherDashboard({ researcher, onLogout }) {
  const [profile, setProfile] = useState(null);      // ← current user's profile (firstName, username, etc.)
  const [results, setResults] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);

  // Fetch current researcher's profile (for welcome name)
  useEffect(() => {
    const loadProfile = async () => {
      if (!researcher) return;
      try {
        const snap = await getDoc(doc(db, "users", researcher.uid));
        if (snap.exists()) setProfile(snap.data());
      } catch (e) {
        console.error("Failed to load profile:", e);
      }
    };
    loadProfile();
  }, [researcher]);

  // Fetch results
  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDocs(collection(db, "results"));
      setResults(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, []);

  // Fetch users who need approval
  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Only show not-approved accounts; sort by createdAt if present
      const pend = users
        .filter((u) => !u.approved)
        .sort((a, b) => {
          const ta = a.createdAt?.seconds || 0;
          const tb = b.createdAt?.seconds || 0;
          return tb - ta;
        });

      setPendingUsers(pend);
    };
    fetchUsers();
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

  // Download CSV for results
  const downloadCSV = () => {
    if (results.length === 0) return;

    // Build a stable set of columns across rows
    const cols = Array.from(
      results.reduce((set, row) => {
        Object.keys(row).forEach((k) => set.add(k));
        return set;
      }, new Set())
    );

    const header = cols.join(",");
    const rows = results.map((r) =>
      cols
        .map((c) => {
          const val = r[c];
          const out =
            val == null
              ? ""
              : typeof val === "object"
              ? JSON.stringify(val)
              : String(val);
          // Escape CSV cells
          return /[",\n]/.test(out) ? `"${out.replace(/"/g, '""')}"` : out;
        })
        .join(",")
    );

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "results.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const displayName =
    profile?.firstName?.trim()
      ? profile.username
        ? `${profile.firstName} (${profile.username})`
        : profile.firstName
      : researcher?.email;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg rounded-xl p-6">
        <h1 className="text-2xl font-bold text-center mb-4">
          Researcher Dashboard
        </h1>
        <p className="text-center mb-4">Welcome {displayName}</p>

        <div className="flex justify-between mb-6">
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            Download CSV
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            Log Out
          </button>
        </div>

        {/* ✅ Pending approvals */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">
            Pending Approvals {pendingUsers.length ? `(${pendingUsers.length})` : ""}
          </h2>
          {pendingUsers.length === 0 ? (
            <p className="text-sm opacity-80">No pending users.</p>
          ) : (
            <ul className="space-y-2">
              {pendingUsers.map((u) => (
                <li
                  key={u.id}
                  className="flex justify-between items-center bg-black/30 rounded px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {u.firstName ? u.firstName : "Unnamed"}{" "}
                      {u.username ? `(${u.username})` : ""}
                    </span>
                    <span className="text-xs opacity-80">
                      {u.email || u.id}
                    </span>
                  </div>
                  <button
                    onClick={() => approveUser(u.id)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                  >
                    Approve
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ✅ Results viewer */}
        <div>
          <h2 className="text-lg font-bold mb-2">Results Data</h2>
          <div className="max-h-64 overflow-y-auto bg:black/30 bg-black/30 rounded p-3 text-sm">
            {results.length === 0 ? (
              <p>No data yet.</p>
            ) : (
              <pre>{JSON.stringify(results, null, 2)}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResearcherDashboard;
