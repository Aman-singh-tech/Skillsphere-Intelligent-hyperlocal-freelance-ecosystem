import { useState, useEffect } from "react";
import { authApi, getToken, setToken } from "./lib/api";

import AdminNavbar from "./components/AdminNavbar";
import AdminDashboardView from "./pages/AdminDashboardView";
import AdminSignInView from "./pages/AdminSignInView";
import ResetPasswordView from "./pages/ResetPasswordView";

export default function App() {
  const [view, setView] = useState("signin");
  const [adminUser, setAdminUser] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const pathname = window.location.pathname;
      if (pathname.startsWith("/reset-password/")) {
        const token = pathname.split("/reset-password/")[1];
        if (token) {
          setResetToken(token);
          setView("reset_password");
          setAuthChecked(true);
          return;
        }
      }

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
      ) : view === "reset_password" ? (
        <ResetPasswordView token={resetToken} setView={setView} />
      ) : (
        <AdminSignInView setView={setView} onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}
