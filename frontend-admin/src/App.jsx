import { useState, useEffect } from "react";
import { authApi, getToken, setToken } from "./lib/api";

import AdminNavbar from "./components/AdminNavbar";
import AdminDashboardView from "./pages/AdminDashboardView";
import AdminSignInView from "./pages/AdminSignInView";

export default function App() {
  const [view, setView] = useState("signin");
  const [adminUser, setAdminUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          const data = await authApi.me();
          if (data.user.role === "admin") {
            setAdminUser(data.user);
            setView("admin");
          } else {
            setToken(null);
          }
        } catch {
          setToken(null);
        }
      }
      setAuthChecked(true);
    })();
  }, []);

  function handleAuthSuccess(user) {
    setAdminUser(user);
    setView("admin");
  }

  function handleLogout() {
    authApi.logout();
    setAdminUser(null);
    setView("signin");
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {view === "admin" ? (
        <>
          <AdminNavbar onLogout={handleLogout} adminUser={adminUser} />
          <AdminDashboardView />
        </>
      ) : (
        <AdminSignInView setView={setView} onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}
