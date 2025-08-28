// src/Debrief.jsx
import { useMemo } from "react";
import { Link } from "react-router-dom";

export default function Debrief() {
  // Pull small summary saved from Results.jsx (use try/catch to avoid SSR issues)
  const resultId = useMemo(() => {
    try { return localStorage.getItem("lastResultId") || null; } catch { return null; }
  }, []);

  const overallMedian = useMemo(() => {
    try {
      const raw = localStorage.getItem("lastOverallMedian");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const medians = useMemo(() => {
    try {
      const raw = localStorage.getItem("lastMedians");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const university = useMemo(() => {
    try {
      const raw = localStorage.getItem("lastUniversity");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const completionCode = resultId ? `RT-${resultId.slice(0, 6).toUpperCase()}` : "N/A";

  const downloadReceipt = () => {
    const lines = [
      "Reaction Time Study — Participation Receipt",
      `Date: ${new Date().toLocaleString()}`,
      `Completion code: ${completionCode}`,
      overallMedian != null ? `Overall median (ms): ${overallMedian}` : null,
      university ? `University / Site: ${university}` : null,
      medians?.visual   != null ? `Visual median (ms): ${medians.visual}`       : null,
      medians?.auditory != null ? `Auditory median (ms): ${medians.auditory}`   : null,
      medians?.tactile  != null ? `Tactile median (ms): ${medians.tactile}`     : null,
      "Thank you for participating in this research project — we truly value the time and effort you contributed.",
    ].filter(Boolean);

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reaction_time_receipt.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center px-4 py-10 text-white">
      <div className="w-full max-w-xl rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl p-8">
        <h1 className="text-2xl font-extrabold text-center">Thank you</h1>
        <p className="text-center text-white/70 mt-1">Reaction Time Study</p>

        <div className="mt-6 space-y-3 text-white/90 text-sm leading-relaxed text-center">
          <p>Your responses have been recorded.</p>
          <p>
            Thank you for participating in this research project — we truly value the time and effort you contributed.
          </p>
          <div className="mt-2">
            <span className="text-white/70">Completion code: </span>
            <span className="font-semibold">{completionCode}</span>
          </div>
          {overallMedian != null && (
            <p className="text-white/80">
              Overall median reaction time: <b>{overallMedian}</b> ms
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={downloadReceipt}
            className="w-full text-center rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 py-3 font-semibold shadow"
          >
            Download Receipt
          </button>
          <Link
            to="/"
            className="w-full text-center rounded-xl bg-indigo-500 hover:bg-indigo-400 py-3 font-semibold shadow-lg"
          >
            Return to Start
          </Link>
        </div>
      </div>
    </div>
  );
}
