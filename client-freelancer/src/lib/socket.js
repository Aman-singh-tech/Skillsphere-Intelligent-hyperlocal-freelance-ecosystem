import { io } from "socket.io-client";
import { getToken } from "./api";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

let socket = null;

export function connectSocket() {
  // Return existing connected socket to avoid duplicate connections
  if (socket?.connected) return socket;

  // Disconnect a stale/disconnected socket before creating a new one
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token: getToken() },
    // Explicitly list transports: Render's reverse proxy supports WebSocket
    // upgrades, but we fall back to polling so the connection always works
    // even if the upgrade is temporarily blocked.
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    // Raise timeout so Render's cold-start (~10 s) doesn't kill the handshake
    timeout: 20000,
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
