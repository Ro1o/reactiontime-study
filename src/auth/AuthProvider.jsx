import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const Ctx = createContext({ user: null, loading: true, signOut: () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);
  return <Ctx.Provider value={{ user, loading, signOut: () => signOut(auth) }}>{children}</Ctx.Provider>;
}
export function useAuth() { return useContext(Ctx); }
