// src/ResearcherLogin.jsx
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

function ResearcherLogin({ onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 👑 Change this to your owner email
  const OWNER_EMAIL = "grohaj03rk@gmail.com";

  const ensureOwnerAndGoToDashboard = async (user) => {
    // Upsert the owner's Firestore user doc as approved admin
    await setDoc(
      doc(db, "users", user.uid),
      {
        email: user.email,
        role: "admin",
        approved: true,
        createdAt: new Date(),
      },
      { merge: true }
    );
    // Go directly to dashboard
    navigate("/admin");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // Owner shortcut
      if (cred.user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
        await ensureOwnerAndGoToDashboard(cred.user);
        return; // stop; we already navigated
      }

      // Everyone else: your existing onAuthStateChanged flow handles redirect
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);

      // Owner shortcut for Google sign-in too
      if (cred.user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
        await ensureOwnerAndGoToDashboard(cred.user);
        return;
      }

      // Others: approval check happens in App.jsx / dashboard
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
      <div className="w-full max-w-md bg-white/20 backdrop-blur-lg rounded-xl p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Researcher Login</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded text-black"
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded text-black"
          />

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
