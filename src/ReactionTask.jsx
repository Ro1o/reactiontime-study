import { useState, useEffect } from "react";

function ReactionTask({ participantData, onComplete }) {
  const [status, setStatus] = useState("waiting"); // waiting | ready | click | result
  const [message, setMessage] = useState("Click start to begin.");
  const [startTime, setStartTime] = useState(null);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [trial, setTrial] = useState(0);
  const totalTrials = 5; // number of attempts

  // Start a new trial
  const startTrial = () => {
    setMessage("Wait for GREEN...");
    setStatus("ready");
    setTrial((t) => t + 1);

    // Random delay 2–5s
    const delay = Math.floor(Math.random() * 3000) + 2000;
    setTimeout(() => {
      setStatus("click");
      setMessage("CLICK!");
      setStartTime(Date.now());
    }, delay);
  };

  // Handle click
  const handleClick = () => {
    if (status === "click") {
      const rt = Date.now() - startTime;
      setReactionTimes([...reactionTimes, rt]);
      setStatus("result");
      setMessage(`Reaction time: ${rt} ms`);
    } else if (status === "ready") {
      setMessage("Too soon! Wait for green.");
    }
  };

  // Move to next trial or finish
  const nextStep = () => {
    if (trial >= totalTrials) {
      const avg = Math.round(
        reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
      );
      onComplete({
        participant: participantData,
        trials: reactionTimes,
        average: avg,
      });
    } else {
      startTrial();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-6">
      <h2 className="text-2xl font-bold">
        Trial {trial} of {totalTrials}
      </h2>

      <div
        onClick={handleClick}
        className={`w-64 h-64 flex items-center justify-center text-white text-2xl font-bold rounded-lg cursor-pointer transition-colors duration-200
          ${
            status === "click"
              ? "bg-green-500"
              : status === "ready"
              ? "bg-red-500"
              : "bg-gray-400"
          }`}
      >
        {message}
      </div>

      {status === "waiting" && (
        <button
          onClick={startTrial}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Start
        </button>
      )}

      {status === "result" && (
        <button
          onClick={nextStep}
          className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          {trial >= totalTrials ? "See Results" : "Next Trial"}
        </button>
      )}
    </div>
  );
}

export default ReactionTask;
