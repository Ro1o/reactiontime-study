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
  const [showPw, setShowPw] = useState(false); // 🔹 Show password toggle
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

      // Owner shortcut
      if (cred.user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
        await ensureOwnerAndGoToDashboard(cred.user);
        return;
      }

      // ✅ Non-owner: go to /admin; App.jsx decides Pending vs Dashboard
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

      // ✅ Non-owner Google sign-in → let /admin gate them
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

          <div>
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded text-black"
              required
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-white/90 select-none">
              <input
                type="checkbox"
                checked={showPw}
                onChange={() => setShowPw((s) => !s)}
                className="accent-white"
              />
              Show password
            </label>
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
