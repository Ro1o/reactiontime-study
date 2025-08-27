function Consent({ onConsent }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl shadow-lg backdrop-blur-md bg-white/30 dark:bg-gray-800/50 p-8 text-gray-900 dark:text-gray-100">
        <h1 className="text-2xl font-bold mb-4">Consent to Participate</h1>
        <p className="mb-4">
          You are invited to take part in a brief reaction time study. Your responses are anonymous and stored securely for research purposes only.
        </p>
        <ul className="list-disc list-inside mb-4 text-sm">
          <li>You may withdraw at any time by closing the page.</li>
          <li>We store non-identifiable device info (browser/OS) to interpret timing differences.</li>
          <li>Data will be analyzed in aggregate.</li>
        </ul>
        <button
          onClick={onConsent}
          className="w-full py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          I Agree & Continue
        </button>
      </div>
    </div>
  );
}
export default Consent;
