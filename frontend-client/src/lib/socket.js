import { io } from "socket.io-client";
import { getToken } from "./api";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, { auth: { token: getToken() } });
  return socket;
}
export function getSocket() {
  return socket;
}
export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
