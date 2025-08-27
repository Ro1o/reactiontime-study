// src/Results.jsx
import { useMemo, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

function Results({ participantData, results, onFinish }) {
  const data = [
    { modality: "Visual", RT: results.medians.visual ?? null },
    { modality: "Auditory", RT: results.medians.auditory ?? null },
    { modality: "Tactile", RT: results.medians.tactile ?? null },
  ];

  // Save exactly once when this screen mounts
  const savedRef = useRef(false);
  useEffect(() => {
    const saveResults = async () => {
      if (savedRef.current) return;
      savedRef.current = true;

      try {
        // Flatten some fields for easier querying/CSV later
        await addDoc(collection(db, "results"), {
          participantId: participantData?.participantId ?? null,
          university: participantData?.university ?? null,
          condition: participantData?.condition ?? null,
          startedAt: participantData?.timestamp ?? null,

          // Summary stats
          overallMedian: results?.overallMedian ?? null,
          medians: {
            visual: results?.medians?.visual ?? null,
            auditory: results?.medians?.auditory ?? null,
            tactile: results?.medians?.tactile ?? null,
          },

          // Keep full trial data as well
          trials: results?.trials ?? [],

          // Server timestamp for ordering
          createdAt: serverTimestamp(),
        });
        // console.log("✅ Results saved to Firestore");
      } catch (err) {
        console.error("❌ Error saving results:", err);
        // Non-blocking: UI still shows results; you can add a toast if you like
      }
    };

    saveResults();
  }, [participantData, results]);

  // Dynamic theming for axis/tick colors
  const isDark = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }, []);

  const axisColor = isDark ? "#fff" : "#000";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl shadow-lg backdrop-blur-md bg-white/30 dark:bg-gray-800/50 p-6 text-gray-900 dark:text-gray-100">
        <h1 className="text-2xl font-bold text-center mb-4">Your Results</h1>

        <div className="grid grid-cols-1 gap-2 text-sm mb-4">
          <div><b>Participant:</b> {participantData.participantId}</div>
          <div><b>University:</b> {participantData.university}</div>
          <div><b>Condition:</b> {participantData.condition}</div>
          <div><b>Started:</b> {new Date(participantData.timestamp).toLocaleString()}</div>
        </div>

        <div className="rounded-xl bg-white/40 dark:bg-gray-900/40 p-4">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="modality" stroke={axisColor} tick={{ fill: axisColor }} />
                <YAxis stroke={axisColor} tick={{ fill: axisColor }} />
                <Tooltip />
                <Bar dataKey="RT" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center mt-3">
            Overall Median: <b>{results.overallMedian ?? "-"}</b> ms
          </p>
        </div>

        {/* Keep trial-level data but hide it */}
        <details className="mt-4 hidden">
          <summary className="cursor-pointer text-sm opacity-80">Show trial-level data</summary>
          <pre className="text-xs bg-black/20 p-3 rounded mt-2 overflow-auto max-h-48">
{JSON.stringify(results.trials, null, 2)}
          </pre>
        </details>

        <button
          onClick={onFinish}
          className="w-full mt-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Finish & Debrief
        </button>
      </div>
    </div>
  );
}

export default Results;
