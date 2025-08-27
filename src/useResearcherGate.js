import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export function useResearcherGate() {
  const [state, setState] = useState({
    loading: true,
    allowed: false,
    pending: false,
    user: null,
    userDoc: null,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, allowed: false, pending: false, user: null, userDoc: null });
        return;
      }
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.exists() ? snap.data() : null;
      if (data?.approved) {
        setState({ loading: false, allowed: true, pending: false, user, userDoc: data });
      } else {
        setState({ loading: false, allowed: false, pending: true, user, userDoc: data });
      }
    });
    return () => unsub();
  }, []);

  return state;
}
