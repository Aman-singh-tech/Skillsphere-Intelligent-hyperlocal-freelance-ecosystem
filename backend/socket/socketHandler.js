const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const { conversationId } = require("../controllers/messageController");

// userId -> Set of connected socket ids (supports multiple tabs/devices)
const onlineUsers = new Map();

function initSocket(io) {
  // Auth handshake: client connects with `auth: { token }`
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    socket.join(`user:${userId}`);
    io.emit("presence:update", { userId, online: true });

    // ── Instant messaging ──────────────────────────────────
    socket.on("message:send", async ({ recipientId, gigId, text, fileUrl, fileName }) => {
      try {
        const convId = conversationId(userId, recipientId);
        const message = await Message.create({
          conversationId: convId,
          gig: gigId,
          sender: userId,
          recipient: recipientId,
          text,
          fileUrl,
          fileName,
        });

        io.to(`user:${recipientId}`).emit("message:new", message);
        socket.emit("message:sent", message);

        // Fire a persistent notification too (Module 11)
        await Notification.create({
          user: recipientId,
          type: "message_received",
          title: "New message",
          message: text ? text.slice(0, 80) : "Sent a file",
          link: `/chat/${userId}`,
        });
        io.to(`user:${recipientId}`).emit("notification:new");
      } catch (err) {
        socket.emit("message:error", { message: err.message });
      }
    });

    // ── Typing indicators ──────────────────────────────────
    socket.on("typing:start", ({ recipientId }) => {
      io.to(`user:${recipientId}`).emit("typing:start", { userId });
    });
    socket.on("typing:stop", ({ recipientId }) => {
      io.to(`user:${recipientId}`).emit("typing:stop", { userId });
    });

    // ── Read receipts ───────────────────────────────────────
    socket.on("message:read", async ({ otherUserId }) => {
      const convId = conversationId(userId, otherUserId);
      await Message.updateMany(
        { conversationId: convId, recipient: userId, readAt: null },
        { readAt: new Date() }
      );
      io.to(`user:${otherUserId}`).emit("message:readReceipt", { by: userId });
    });

    // ── WebRTC signaling relay (optional video calls) ──────
    socket.on("call:offer", ({ recipientId, offer }) => {
      io.to(`user:${recipientId}`).emit("call:offer", { from: userId, offer });
    });
    socket.on("call:answer", ({ recipientId, answer }) => {
      io.to(`user:${recipientId}`).emit("call:answer", { from: userId, answer });
    });
    socket.on("call:ice-candidate", ({ recipientId, candidate }) => {
      io.to(`user:${recipientId}`).emit("call:ice-candidate", { from: userId, candidate });
    });

    socket.on("disconnect", () => {
      const set = onlineUsers.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          onlineUsers.delete(userId);
          io.emit("presence:update", { userId, online: false });
        }
      }
    });
  });
}

module.exports = { initSocket, onlineUsers };
