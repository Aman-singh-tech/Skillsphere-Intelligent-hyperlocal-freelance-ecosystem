import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { notificationApi } from "../lib/api";
import { connectSocket } from "../lib/socket";

export default function NotificationBell({ user }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  function load() {
    notificationApi
      .list()
      .then((d) => {
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      })
      .catch(() => {});
  }

  useEffect(() => {
    if (!user) return;
    load();
    const socket = connectSocket();
    function onNew() {
      load();
    }
    socket.on("notification:new", onNew);
    return () => socket.off("notification:new", onNew);
  }, [user?.id, user?._id]);

  async function handleOpen() {
    setOpen(!open);
    if (!open && unreadCount > 0) {
      await notificationApi.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative p-2 rounded-lg hover:bg-muted transition-colors">
        <Bell size={17} className="text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b border-border flex justify-between items-center">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground px-4 py-6 text-center">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`px-4 py-3 border-b border-border last:border-0 ${!n.isRead ? "bg-blue-50/50" : ""}`}
              >
                <p className="text-xs font-medium text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
