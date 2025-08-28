// src/ResearcherLogin.jsx
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

function ResearcherLogin({ onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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

      // Owner shortcut for Google sign-in too
      if (cred.user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
        await ensureOwnerAndGoToDashboard(cred.user);
        return;
      }

      // 🔹 Ensure a user doc exists so the owner can approve later
      const ref = doc(db, "users", cred.user.uid);
      const snap = await getDoc(ref);

      const dn = (cred.user.displayName || "").trim();
      const [fn, ...rest] = dn.split(" ");
      const ln = rest.join(" ");

      if (!snap.exists()) {
        await setDoc(ref, {
          email: cred.user.email,
          firstName: fn || "",
          lastName: ln || "",
          approved: false,
          role: "researcher",
          createdAt: serverTimestamp(),
        });
      } else {
        // Make sure minimal fields exist without clobbering approval
        await setDoc(
          ref,
          {
            email: cred.user.email,
            firstName: snap.data().firstName || fn || "",
            lastName: snap.data().lastName || ln || "",
            role: snap.data().role || "researcher",
          },
          { merge: true }
        );
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl p-7">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-2xl bg-indigo-500/90 flex items-center justify-center shadow">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
              <path d="M12 3l9 7-9 7-9-7 9-7zM3 17l9 7 9-7" opacity=".35" />
              <path d="M12 10l9 7-9 7-9-7 9-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold leading-tight">Researcher Login</h1>
            <p className="text-sm text-white/70">Access your dashboard</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-white/90 text-gray-900 px-4 py-3 shadow-inner outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 13a9 9 0 01-9-9h18a9 9 0 01-9 9zm0 2c-4.97 0-9 2.015-9 4.5V22h18v-2.5c0-2.485-4.03-4.5-9-4.5z" />
              </svg>
            </div>
          </div>

          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-white/90 text-gray-900 px-4 py-3 shadow-inner outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-3 flex items-center justify-center h-full w-10 text-gray-600 hover:text-gray-800"
            >
              {showPw ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M2 4.27L3.28 3 21 20.72 19.73 22l-3.22-3.22A10.91 10.91 0 0112 20C6 20 2 12 2 12a18.5 18.5 0 014.53-5.79L2 4.27zM12 6a6 6 0 015.65 3.78l-2.2 2.2A3.99 3.99 0 0012 8a4 4 0 00-3.09 6.54L7.1 16.35A10.6 10.6 0 014 12s3-6 8-6z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10z" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <div className="text-sm text-rose-300 bg-rose-900/30 border border-rose-500/30 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 py-3 font-semibold shadow-lg"
          >
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-white/70 text-xs">or</span>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        {/* Google sign-in */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-gray-800 hover:bg-gray-100 disabled:opacity-60 shadow"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Continue with Google
        </button>

        {/* Switch to signup (works even if they don't have an account) */}
        <p className="text-sm text-center mt-5 text-white/80">
          Don’t have an account?{" "}
          <Link to="/admin/signup" className="underline hover:text-white">
            Create one
          </Link>
        </p>

        {onBack && (
          <button
            onClick={onBack}
            className="mt-3 w-full rounded-xl bg-black/30 hover:bg-black/40 py-2.5"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}

export default ResearcherLogin;
