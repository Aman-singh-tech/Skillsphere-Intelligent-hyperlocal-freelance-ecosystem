const mongoose = require("mongoose");

// Module 6 - Real-time chat + collaboration (Socket.IO)
const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true }, // deterministic id: sorted userIds (+gigId)
    gig: { type: mongoose.Schema.Types.ObjectId, ref: "Gig" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    text: String,
    fileUrl: String,
    fileName: String,

    readAt: Date,
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
