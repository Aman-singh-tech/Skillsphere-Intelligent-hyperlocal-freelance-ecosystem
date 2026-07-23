import { useState } from "react";
import { Home, Briefcase, Users, UserCheck, LogIn, UserPlus, Menu, X, Sparkles } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function Navbar({ view, setView, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = [
    { label: "Home", v: "landing", icon: Home },
    { label: "Marketplace", v: "marketplace", icon: Briefcase },
    ...(user?.role === "freelancer" ? [{ label: "Dashboard", v: "freelancer", icon: Users }] : []),
    ...(user?.role === "client" ? [{ label: "Dashboard", v: "client", icon: UserCheck }] : []),
  ];
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-6">
        {/* Logo */}
        <button onClick={() => setView("landing")} className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-extrabold text-foreground text-lg tracking-tight">
            Skill<span className="text-primary">Sphere</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navLinks.map(({ label, v, icon: Icon }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === v ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2 ml-auto">
          {user ? (
            <>
              <NotificationBell user={user} />
              <span className="text-sm text-muted-foreground">
                {user.name} <span className="text-xs text-muted-foreground/60">({user.role})</span>
              </span>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setView("signin")}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <LogIn size={14} />
                Sign In
              </button>
              <button
                onClick={() => setView("signup")}
                className="flex items-center gap-1.5 text-sm font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus size={14} />
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile menu */}
        <button className="md:hidden ml-auto text-muted-foreground" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-3 flex flex-col gap-1">
          {navLinks.map(({ label, v, icon: Icon }) => (
            <button
              key={v}
              onClick={() => {
                setView(v);
                setMenuOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                view === v ? "bg-secondary text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
          {user ? (
            <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground">
              Log out
            </button>
          ) : (
            <>
              <button onClick={() => setView("signin")} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground">
                Sign In
              </button>
              <button onClick={() => setView("signup")} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground">
                Get Started
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
