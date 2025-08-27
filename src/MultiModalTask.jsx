import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "./firebase"; // ✅ Firebase instance
import { collection, addDoc } from "firebase/firestore"; // ✅ Firestore functions

function MultiModalTask({ participantData, onComplete }) {
  // ======= CONFIG =======
  const TRIALS_PER_MODALITY = 5;
  const MIN_DELAY_MS = 1500;
  const MAX_DELAY_MS = 3000;

  // ======= STATE =======
  const [audioReady, setAudioReady] = useState(false);
  const [status, setStatus] = useState("intro"); // intro | arming | go | result | done
  const [message, setMessage] = useState("Press Enable Audio to start.");
  const [trialIndex, setTrialIndex] = useState(0);
  const [visualGo, setVisualGo] = useState(false);

  const [results, setResults] = useState([]);

  const startTimeRef = useRef(null);
  const timeoutRef = useRef(null);
  const audioCtxRef = useRef(null);

  // ======= Sequence =======
  const sequence = useMemo(() => {
    const base = [
      ...Array(TRIALS_PER_MODALITY).fill("visual"),
      ...Array(TRIALS_PER_MODALITY).fill("auditory"),
      ...Array(TRIALS_PER_MODALITY).fill("tactile"),
    ];
    for (let i = base.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    return base;
  }, [TRIALS_PER_MODALITY]);

  const totalTrials = sequence.length;
  const currentModality = sequence[trialIndex] ?? null;

  // ======= Helpers =======
  const randDelay = () =>
    MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));

  const startBeep = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 500;
    o.connect(g).connect(ctx.destination);

    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.0, now);
    g.gain.linearRampToValueAtTime(0.8, now + 0.02);
    g.gain.setValueAtTime(0.8, now + 0.18);
    g.gain.linearRampToValueAtTime(0.0, now + 0.2);

    o.start(now);
    o.stop(now + 0.2);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  };

  const vibrate = (pattern = 80) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
  };

  const resetVisual = () => setVisualGo(false);

  const armTrial = () => {
    setStatus("arming");
    setMessage(
      currentModality === "visual"
        ? "Wait… the box will turn GREEN."
        : currentModality === "auditory"
        ? "Wait… you’ll hear a BEEP."
        : "Wait… you’ll feel a short VIBRATION."
    );
    resetVisual();

    const delay = randDelay();
    timeoutRef.current = setTimeout(async () => {
      if (currentModality === "visual") {
        setVisualGo(true);
      } else if (currentModality === "auditory") {
        if (audioCtxRef.current?.state === "suspended") {
          try { await audioCtxRef.current.resume(); } catch {}
        }
        startBeep();
      } else if (currentModality === "tactile") {
        vibrate();
      }

      startTimeRef.current = performance.now();
      setStatus("go");
      setMessage(""); // ✅ no bias text
    }, delay);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  // ======= Handlers =======
  const handleEnableAudio = async () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = 0;
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop();
      setAudioReady(true);
      setMessage("Audio enabled. Click Start Trial.");
      setStatus("intro");
    } catch {
      setAudioReady(false);
      setMessage("Audio init failed. You can still do visual/tactile trials.");
    }
  };

  const startTaskOrNext = () => {
    if (trialIndex >= totalTrials) return;
    armTrial();
  };

  const registerResponse = () => {
    if (status === "arming") {
      setMessage("Too soon! Wait for the stimulus.");
      return;
    }
    if (status !== "go" || startTimeRef.current == null) return;
    const rt = performance.now() - startTimeRef.current;
    const rec = { modality: currentModality, rt: Math.round(rt) };
    setResults((r) => [...r, rec]);
    setStatus("result");
    setMessage(`RT: ${Math.round(rt)} ms`);
  };

  // ✅ Updated with Firestore saving
  const nextTrialOrFinish = async () => {
    if (trialIndex + 1 >= totalTrials) {
      const byMod = { visual: [], auditory: [], tactile: [] };
      results.forEach((r) => byMod[r.modality]?.push(r.rt));
      const median = (arr) => {
        const s = [...arr].sort((a, b) => a - b);
        const m = Math.floor(s.length / 2);
        return s.length
          ? s.length % 2
            ? s[m]
            : Math.round((s[m - 1] + s[m]) / 2)
          : null;
      };
      const summary = {
        participant: participantData,
        trials: results,
        medians: {
          visual: median(byMod.visual),
          auditory: median(byMod.auditory),
          tactile: median(byMod.tactile),
        },
        overallMedian: median(results.map((x) => x.rt)),
        timestamp: new Date().toISOString(),
      };

      try {
        await addDoc(collection(db, "results"), summary);
        console.log("✅ Results saved to Firestore!");
      } catch (e) {
        console.error("❌ Error saving results:", e);
      }

      setStatus("done");
      setMessage("All trials complete!");
      onComplete(summary);
      return;
    }

    setTrialIndex((i) => i + 1);
    resetVisual();
    setStatus("intro");
    setMessage("Click Start Trial when ready.");
  };

  // Spacebar support
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        registerResponse();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, currentModality]);

  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const check = () => setPortrait(window.innerWidth < window.innerHeight);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const progress = (trialIndex / totalTrials) * 100;
  const isGoActive =
    status === "go" && (currentModality === "visual" ? visualGo : true);

  // ======= UI =======
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-gray-900 dark:text-gray-100">
      {portrait && (
        <div className="mb-2 text-red-100 bg-red-600/70 px-3 py-1 rounded">
          For best results, rotate your phone to landscape 📱
        </div>
      )}

      <div className="w-full max-w-md rounded-2xl shadow-lg backdrop-blur-md bg-white/30 dark:bg-gray-800/50 p-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">Multi-Modal Reaction Time</h1>
          <span className="text-sm opacity-80">
            Trial {Math.min(trialIndex + 1, totalTrials)} / {totalTrials}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-white/40 dark:bg-gray-700 rounded mb-4 overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Target square */}
        <div
          className={`w-full aspect-square rounded-xl text-white text-lg font-bold flex flex-col items-center justify-center transition-colors select-none relative gap-3
            ${
              status === "intro"
                ? "bg-gray-500/80"
                : status === "arming"
                ? "bg-red-600"
                : isGoActive
                ? "bg-green-500 animate-pulse"
                : "bg-gray-500/80"
            }
          `}
          onClick={status === "go" ? registerResponse : undefined}
        >
          {status === "intro" ? (
            <>
              <span>Click Start Trial when ready</span>
              <button
                onClick={startTaskOrNext}
                className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 shadow text-white"
              >
                Start Trial
              </button>
            </>
          ) : status === "arming" ? (
            "WAIT…"
          ) : status === "go" ? (
            "" // ✅ no bias text
          ) : (
            "READY"
          )}
        </div>

        {message && <p className="mt-4 text-center">{message}</p>}

        <div className="mt-4 flex gap-3 justify-center">
          {!audioReady && (
            <button
              onClick={handleEnableAudio}
              className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
            >
              Enable Audio
            </button>
          )}

          {status === "result" && (
            <button
              onClick={nextTrialOrFinish}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              {trialIndex + 1 >= totalTrials ? "Finish" : "Next Trial"}
            </button>
          )}
        </div>

        <p className="text-xs text-center mt-3 opacity-80">
          Tip: You can also press <kbd>Space</kbd> to respond.
        </p>
      </div>
    </div>
  );
}

export default MultiModalTask;
