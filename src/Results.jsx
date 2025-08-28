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

  // -------- Optional AES-GCM encryption (controlled by VITE_RESULTS_SECRET) --------
  const SECRET_B64 = import.meta.env.VITE_RESULTS_SECRET || null;

  const textToBytes = (t) => new TextEncoder().encode(t);
  const bytesToB64 = (bytes) => btoa(String.fromCharCode(...bytes));

  // Encrypts a value; if no secret is set, returns the value unchanged.
  const aesGcmEncrypt = async (plain) => {
    if (!SECRET_B64) return plain; // no-op when secret is not configured

    const keyRaw = Uint8Array.from(atob(SECRET_B64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("raw", keyRaw, "AES-GCM", false, ["encrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Always encrypt a string; stringify non-strings
    const plaintext = typeof plain === "string" ? plain : JSON.stringify(plain);
    const buf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, textToBytes(plaintext));

    return {
      __enc: "aes-gcm",
      iv: bytesToB64(iv),
      data: bytesToB64(new Uint8Array(buf)),
    };
  };

  // Save exactly once when this screen mounts
  const savedRef = useRef(false);
  useEffect(() => {
    const saveResults = async () => {
      if (savedRef.current) return;
      savedRef.current = true;

      try {
        // Keep summary fields in plaintext for easy querying and dashboard table
        const summary = {
          participantId: participantData?.participantId ?? null,
          university: participantData?.university ?? null,
          condition: participantData?.condition ?? null,
          startedAt: participantData?.timestamp ?? null,
          overallMedian: results?.overallMedian ?? null,
          medians: {
            visual: results?.medians?.visual ?? null,
            auditory: results?.medians?.auditory ?? null,
            tactile: results?.medians?.tactile ?? null,
          },
        };

        // Encrypt detailed blobs if a secret is configured; else store as-is
        const [participantEnc, trialsEnc] = await Promise.all([
          aesGcmEncrypt(participantData ?? {}),
          aesGcmEncrypt(results?.trials ?? []),
        ]);

        // Write to Firestore
        const ref = await addDoc(collection(db, "results"), {
          ...summary,
          // Dashboard CSV exporter knows how to decrypt these if wrapped
          participant: participantEnc,
          trials: trialsEnc,
          createdAt: serverTimestamp(),
        });

        // Persist tiny summary locally for Debrief / Receipt (non-blocking)
        try {
          localStorage.setItem("lastResultId", ref.id);
          localStorage.setItem(
            "lastOverallMedian",
            JSON.stringify(results?.overallMedian ?? null)
          );
          localStorage.setItem(
            "lastMedians",
            JSON.stringify(results?.medians ?? null)
          );
          localStorage.setItem(
            "lastUniversity",
            JSON.stringify(participantData?.university ?? null)
          );
        } catch {
          // ignore storage errors
        }

        // console.log("✅ Results saved to Firestore");
      } catch (err) {
        console.error("❌ Error saving results:", err);
        // Non-blocking: UI still shows results
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

        {/* Keep trial-level data but hide it from the UI */}
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
