// src/ResearcherSignup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export default function ResearcherSignup() {
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false); // 👁️ Toggle with eye icon
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const normalizeEmail = (s) => (s || "").trim().toLowerCase();
  const normalizeUsername = (s) =>
    (s || "").trim().toLowerCase().replace(/\s+/g, "_");

  const onSignup = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      const emailNorm = normalizeEmail(email);
      const userNorm = normalizeUsername(username);

      const cred = await createUserWithEmailAndPassword(auth, emailNorm, pw);

      await setDoc(doc(db, "users", cred.user.uid), {
        firstName: firstName.trim(),
        username: userNorm,
        email: emailNorm,
        approved: false,
        role: "researcher",
        createdAt: serverTimestamp(),
      });

      setMsg("Signup complete. Your account is pending approval.");

      try {
        await auth.signOut();
      } catch {}

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
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 rounded border"
            required
          />

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 rounded border"
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            autoComplete="username"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded border"
            required
          />

          {/* Password with eye toggle */}
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={pw}
              autoComplete="new-password"
              onChange={(e) => setPw(e.target.value)}
              className="w-full px-3 py-2 rounded border pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPw ? (
                // 👁️ Eye Open Icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" 
                     viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                // 👁️ Eye Closed Icon
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

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
