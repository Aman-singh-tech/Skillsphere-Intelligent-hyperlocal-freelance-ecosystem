import { Sparkles, LogIn } from "lucide-react";

export default function AdminNavbar({ onLogout, adminUser }) {
  return (
    <header className="sticky top-0 z-50 bg-sidebar border-b border-sidebar-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-6">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-extrabold text-sidebar-foreground text-lg tracking-tight">
            Skill<span className="text-sidebar-primary">Sphere</span>{" "}
            <span className="text-sidebar-accent-foreground font-medium text-sm">Admin</span>
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sidebar-accent-foreground text-sm">{adminUser?.email}</span>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-sidebar-foreground bg-sidebar-accent px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
          >
            <LogIn size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
