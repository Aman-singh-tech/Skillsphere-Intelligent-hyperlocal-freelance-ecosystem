import { useState, useEffect } from "react";
import { authApi, getToken, setToken } from "./lib/api";
import { connectSocket, disconnectSocket } from "./lib/socket";

import Navbar from "./components/Navbar";
import LandingView from "./pages/LandingView";
import MarketplaceView from "./pages/MarketplaceView";
import FreelancerDashboardView from "./pages/FreelancerDashboardView";
import ClientDashboardView from "./pages/ClientDashboardView";
import ChatView from "./pages/ChatView";
import SignInView from "./pages/SignInView";
import SignUpView from "./pages/SignUpView";
import ResetPasswordView from "./pages/ResetPasswordView";

export default function App() {
  const [view, setView] = useState("signin");
  const [user, setUser] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);

  function openChat(target) {
    setChatTarget(target);
    setView("chat");
  }

  // Restore session on load if a token exists
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

      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get("accessToken");
      if (accessToken) {
        setToken(accessToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (getToken()) {
        try {
          const data = await authApi.me();
          setUser(data.user);
          connectSocket();
          setView(data.user.role === "client" ? "client" : "freelancer");
        } catch {
          setToken(null);
        }
      }
      setAuthChecked(true);
    })();
  }, []);

  function handleAuthSuccess(loggedInUser) {
    setUser(loggedInUser);
    connectSocket();
    setView(loggedInUser.role === "client" ? "client" : "freelancer");
  }

  function handleLogout() {
    authApi.logout();
    disconnectSocket();
    setUser(null);
    setView("signin");
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Loading SkillSphere…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar view={view} setView={setView} user={user} onLogout={handleLogout} />
      {view === "landing" && <LandingView setView={setView} />}
      {view === "marketplace" && <MarketplaceView user={user} />}
      {view === "freelancer" && <FreelancerDashboardView user={user} onOpenChat={openChat} />}
      {view === "client" && <ClientDashboardView user={user} onOpenChat={openChat} />}
      {view === "chat" && <ChatView user={user} chatTarget={chatTarget} setView={setView} />}
      {view === "signin" && <SignInView setView={setView} onAuthSuccess={handleAuthSuccess} />}
      {view === "signup" && <SignUpView setView={setView} onAuthSuccess={handleAuthSuccess} />}
      {view === "reset_password" && <ResetPasswordView token={resetToken} setView={setView} />}
    </div>
  );
}
