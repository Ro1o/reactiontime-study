function Debrief() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl shadow-lg backdrop-blur-md bg-white/30 dark:bg-gray-800/50 p-8 text-gray-900 dark:text-gray-100 text-center">
        <h2 className="text-2xl font-bold mb-3">Thank You! 🎉</h2>
        <p className="mb-2">Your responses have been recorded anonymously.</p>
        <p className="text-sm opacity-80">
          If you have questions about the study, please contact the researchers.
        </p>
      </div>
    </div>
  );
}
export default Debrief;
