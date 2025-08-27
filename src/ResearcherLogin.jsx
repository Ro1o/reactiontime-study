// src/ResearcherLogin.jsx
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

function ResearcherLogin({ onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false); // 👁️ Eye toggle
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 👑 Owner email (bypass approval → /admin dashboard)
  const OWNER_EMAIL = "grohaj03rk@gmail.com";

  const ensureOwnerAndGoToDashboard = async (user) => {
    await setDoc(
      doc(db, "users", user.uid),
      {
        email: user.email,
        role: "admin",
        approved: true,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
    navigate("/admin");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const emailNorm = (email || "").trim().toLowerCase();
      const cred = await signInWithEmailAndPassword(auth, emailNorm, password);

      if (cred.user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
        await ensureOwnerAndGoToDashboard(cred.user);
        return;
      }
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);

      if (cred.user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
        await ensureOwnerAndGoToDashboard(cred.user);
        return;
      }
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
      <div className="w-full max-w-md bg-white/20 backdrop-blur-lg rounded-xl p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Researcher Login</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded text-black"
              required
            />
          </div>

          {/* Password with eye toggle */}
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded text-black pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-800"
            >
              {showPw ? (
                // Eye open
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                // Eye closed
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.543-4.24m3.244-2.268A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.964 9.964 0 01-4.038 5.092M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 3l18 18" />
                </svg>
              )}
            </button>
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 py-2 rounded"
          >
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="h-px flex-1 bg-white/40" />
          <span className="text-white/80 text-sm">or</span>
          <div className="h-px flex-1 bg-white/40" />
        </div>

        {/* Google sign-in with icon */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 rounded bg-white text-gray-800 hover:bg-gray-100 disabled:opacity-60 shadow"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Sign in with Google
        </button>

        {/* Signup link */}
        <p className="text-sm text-center mt-4 text-white/80">
          Don’t have an account?{" "}
          <Link to="/admin/signup" className="underline hover:text-white">
            Sign up
          </Link>
        </p>

        <button
          onClick={onBack}
          className="mt-4 w-full bg-gray-700 hover:bg-gray-600 py-2 rounded"
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default ResearcherLogin;
