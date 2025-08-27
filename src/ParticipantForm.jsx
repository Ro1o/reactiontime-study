import { useState } from "react";

function ParticipantForm({ onStart }) {
  const [participantId, setParticipantId] = useState("");
  const [university, setUniversity] = useState("");
  const [condition, setCondition] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState(3);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation rules (unchanged)
    if (!participantId.trim()) {
      setError("Participant ID is required.");
      return;
    }
    if (!university) {
      setError("Please select a university.");
      return;
    }
    if (!condition) {
      setError("Please select a condition.");
      return;
    }
    if (sleepHours === "" || sleepHours < 0 || sleepHours > 24) {
      setError("Sleep hours must be between 0 and 24.");
      return;
    }

    setError("");

    // ✅ Hidden metadata (unchanged)
    const deviceInfo = {
      userAgent: navigator.userAgent,
      browserLanguage: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      platform: navigator.platform,
    };

    onStart({
      participantId,
      university,
      condition,
      sleepHours,
      sleepQuality,
      timestamp: new Date().toISOString(),
      device: deviceInfo, // keep hidden; not shown to participant
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Glassmorphic card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl shadow-lg backdrop-blur-md bg-white/30 dark:bg-gray-800/50 p-8 text-gray-900 dark:text-gray-100 space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Participant Info</h2>

        {/* Error message */}
        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm bg-red-50/70 dark:bg-red-900/30 px-3 py-2 rounded">
            {error}
          </p>
        )}

        {/* Participant ID */}
        <input
          type="text"
          placeholder="Participant ID"
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/70 dark:bg-gray-900/40 border border-white/40 dark:border-gray-700 outline-none"
          required
        />

        {/* University Dropdown */}
        <select
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/70 dark:bg-gray-900/40 border border-white/40 dark:border-gray-700"
          required
        >
          <option value="">-- Select University --</option>
          <option>SSR Medical School</option>
          <option>Middlesex University</option>
          <option>University of Mauritius</option>
          <option>Curtin University</option>
        </select>

        {/* Condition */}
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/70 dark:bg-gray-900/40 border border-white/40 dark:border-gray-700"
          required
        >
          <option value="">-- Select Condition --</option>
          <option>No-Caffeine</option>
          <option>Caffeine</option>
        </select>

        {/* Sleep Hours (0–24) */}
        <input
          type="number"
          placeholder="Sleep Hours (0–24)"
          value={sleepHours}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (val >= 0 && val <= 24) {
              setSleepHours(val);
            } else {
              setSleepHours(""); // reset if invalid
            }
          }}
          min="0"
          max="24"
          className="w-full p-3 rounded-lg bg-white/70 dark:bg-gray-900/40 border border-white/40 dark:border-gray-700"
          required
        />

        {/* Sleep Quality */}
        <div>
          <label className="block mb-1">
            Sleep Quality (1–5): <b>{sleepQuality}</b>
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={sleepQuality}
            onChange={(e) => setSleepQuality(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 text-lg rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
        >
          Start Task
        </button>

        {/* Small note */}
        <p className="text-xs text-center opacity-70">
          Your data is anonymous. You can exit at any time.
        </p>
      </form>
    </div>
  );
}

export default ParticipantForm;
