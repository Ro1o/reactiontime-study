// src/ResearcherSignup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export default function ResearcherSignup() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false); // 👁️ Show password toggle
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSignup = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      const emailNorm = (email || "").trim().toLowerCase();

      // Create auth account
      const cred = await createUserWithEmailAndPassword(auth, emailNorm, pw);

      // Create Firestore user doc (default researcher, needs approval)
      await setDoc(doc(db, "users", cred.user.uid), {
        email: emailNorm,
        approved: false,
        role: "researcher",
        createdAt: serverTimestamp(),
      });

      // Optional UI message (won’t be seen after navigate)
      setMsg("Signup complete. Your account is pending approval.");

      // ✅ Ensure we land on the login screen (not Pending) by signing out first
      try {
        await auth.signOut();
      } catch {
        /* no-op */
      }

      // Then go to login (your login is at /admin)
      navigate("/admin");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-teal-500 to-cyan-600">
      <div className="w-full max-w-md bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 shadow">
        <h1 className="text-2xl font-bold text-center mb-4">Create Researcher Account</h1>

        {msg && <p className="text-green-600 text-sm mb-3">{msg}</p>}
        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}

        <form onSubmit={onSignup} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            autoComplete="username"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded border"
            required
          />

          <div>
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={pw}
              autoComplete="new-password"
              onChange={(e) => setPw(e.target.value)}
              className="w-full px-3 py-2 rounded border"
              required
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 select-none">
              <input
                type="checkbox"
                className="accent-current"
                checked={showPw}
                onChange={() => setShowPw((s) => !s)}
              />
              Show password
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        {/* Back to login should sign out first so /admin shows the login form */}
        <button
          onClick={async (e) => {
            e.preventDefault();
            try { await auth.signOut(); } catch {}
            navigate("/admin");
          }}
          className="block w-full text-center mt-4 text-sm text-blue-700 underline"
        >
          Back to login
        </button>
      </div>
    </div>
  );
}
