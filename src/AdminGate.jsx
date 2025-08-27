import { auth } from "./firebase";
import ResearcherLogin from "./ResearcherLogin";
import { useResearcherGate } from "./useResearcherGate";

export default function AdminGate({ DashboardComponent }) {
  const { loading, allowed, pending, user, userDoc } = useResearcherGate();

  if (loading) return <div className="p-6 text-center">Checking access…</div>;
  if (!user) return <ResearcherLogin />;     // not logged in → show login
  if (pending) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white/90 dark:bg-gray-800/90 p-6 rounded shadow">
        <p>Your account is pending approval.</p>
        <button
          onClick={() => auth.signOut()}
          className="mt-4 px-4 py-2 rounded bg-gray-700 text-white"
        >
          Sign out
        </button>
      </div>
    </div>
  );
  return <DashboardComponent researcher={user} userDoc={userDoc} onLogout={() => auth.signOut()} />;
}
