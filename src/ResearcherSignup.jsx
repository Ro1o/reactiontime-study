import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export default function ResearcherSignup() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignup = async (e) => {
    e.preventDefault();
    setErr(""); setMsg(""); setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        approved: false,           // <-- owner must approve
        role: "researcher",        // default
        createdAt: serverTimestamp(),
      });
      setMsg("Signup complete. Your account is pending approval.");
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
            type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded border"
            autoComplete="username" required
          />
          <input
            type="password" placeholder="Password" value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full px-3 py-2 rounded border"
            autoComplete="new-password" required
          />
          <button
            type="submit" disabled={loading}
            className="w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
        <a href="/admin" className="block text-center mt-4 text-sm text-blue-700 underline">
          Back to login
        </a>
      </div>
    </div>
  );
}
