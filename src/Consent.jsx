// src/Consent.jsx
export default function Consent({ onConsent }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center px-4 py-10 text-white">
      <div className="w-full max-w-xl rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl p-8">
        <h1 className="text-2xl font-extrabold text-center">Participant Consent</h1>
        <p className="text-center text-white/70 mt-1">Reaction Time Study</p>

        <div className="mt-6 space-y-3 text-white/90 text-sm leading-relaxed">
          <p>
            You are invited to take part in a brief study on reaction time. Participation is voluntary.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>You may stop at any time by closing this page.</li>
            <li>The task lasts only a few minutes and involves reacting to simple cues.</li>
            <li>Results are stored securely and analyzed in aggregate for research purposes.</li>
          </ul>
        </div>

        <button
          onClick={onConsent}
          className="mt-6 w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 py-3 font-semibold shadow-lg"
        >
          I Agree & Continue
        </button>
      </div>
    </div>
  );
}
