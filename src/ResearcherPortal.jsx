// src/ResearcherPortal.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "./firebase";
import ResearcherLogin from "./ResearcherLogin";
import ResearcherSignup from "./ResearcherSignup";

export default function ResearcherPortal() {
  const [tab, setTab] = useState("login"); // "login" | "signup"
  const [search] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Force sign-out so portal always shows forms
    auth.signOut().catch(() => {});
  }, []);

  useEffect(() => {
    const t = search.get("tab");
    if (t === "signup" || t === "login") setTab(t);
  }, [search]);

  const goLogin = () => {
    setTab("login");
    navigate("/portal?tab=login", { replace: true });
  };

  const goSignup = () => {
    setTab("signup");
    navigate("/portal?tab=signup", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-sky-600 to-indigo-700">
      <div className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 rounded-2xl p-6 shadow-lg">
        <div className="flex gap-2 mb-4">
          <button
            onClick={goLogin}
            className={`flex-1 py-2 rounded ${tab === "login" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800 dark:text-gray-200"}`}
          >
            Login
          </button>
          <button
            onClick={goSignup}
            className={`flex-1 py-2 rounded ${tab === "signup" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800 dark:text-gray-200"}`}
          >
            Sign up
          </button>
        </div>

        {tab === "login" ? (
          <ResearcherLogin />
        ) : (
          <ResearcherSignup />
        )}

        <div className="text-center mt-4">
          {tab === "login" ? (
            <button onClick={goSignup} className="text-sm text-blue-700 underline">
              Don’t have an account? Create one
            </button>
          ) : (
            <button onClick={goLogin} className="text-sm text-blue-700 underline">
              Already have an account? Log in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
