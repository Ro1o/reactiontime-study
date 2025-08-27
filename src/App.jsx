// src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import ParticipantForm from "./ParticipantForm";
import MultiModalTask from "./MultiModalTask";
import Results from "./Results";
import Consent from "./Consent";
import Debrief from "./Debrief";
import ResearcherLogin from "./ResearcherLogin";
import ResearcherDashboard from "./ResearcherDashboard";
import ResearcherSignup from "./ResearcherSignup"; // 🔹 NEW signup component

import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

function App() {
  const [themeReady, setThemeReady] = useState(false);
  const [consented, setConsented] = useState(false);
  const [participantData, setParticipantData] = useState(null);
  const [results, setResults] = useState(null);
  const [showDebrief, setShowDebrief] = useState(false);

  // 🔐 Researcher state
  const [researcher, setResearcher] = useState(null);
  const [approved, setApproved] = useState(null); // null = loading, true/false = checked

  // Persist dark mode choice in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    }
    setThemeReady(true);
  }, []);

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  // Watch Firebase auth state + check approval
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setResearcher(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setApproved(userDoc.data().approved === true);
          } else {
            setApproved(false);
          }
        } catch (err) {
          console.error("Error fetching approval:", err);
          setApproved(false);
        }
      } else {
        setApproved(null);
      }
    });
    return () => unsub();
  }, []);

  if (!themeReady) return null;

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-green-500 dark:from-gray-900 dark:to-gray-800 relative">
        {/* 🌗 Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="fixed top-3 right-3 px-3 py-1 rounded bg-gray-900 text-white dark:bg-yellow-400 dark:text-black shadow"
        >
          Toggle {document.documentElement.classList.contains("dark") ? "Light" : "Dark"}
        </button>

        <Routes>
          {/* 🔐 Researcher-only route at /admin */}
          <Route
            path="/admin"
            element={
              researcher ? (
                approved === null ? (
                  <p className="text-center mt-10 text-white">Checking approval...</p>
                ) : approved ? (
                  <ResearcherDashboard
                    researcher={researcher}
                    onLogout={() => auth.signOut()}
                  />
                ) : (
                  <div className="min-h-screen flex items-center justify-center text-white">
                    <div className="bg-black/40 p-6 rounded-xl text-center">
                      <h2 className="text-xl font-bold mb-2">Pending Approval</h2>
                      <p>Please wait until the owner approves your account.</p>
                    </div>
                  </div>
                )
              ) : (
                <ResearcherLogin />
              )
            }
          />

          {/* 🔐 Researcher signup route at /admin/signup */}
          <Route path="/admin/signup" element={<ResearcherSignup />} />

          {/* 👨‍🎓 Participant route at / */}
          <Route
            path="/"
            element={
              !consented ? (
                <Consent onConsent={() => setConsented(true)} />
              ) : !participantData ? (
                <ParticipantForm onStart={setParticipantData} />
              ) : !results ? (
                <MultiModalTask
                  participantData={participantData}
                  onComplete={setResults}
                />
              ) : !showDebrief ? (
                <Results
                  participantData={participantData}
                  results={results}
                  onFinish={() => setShowDebrief(true)}
                />
              ) : (
                <Debrief />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
