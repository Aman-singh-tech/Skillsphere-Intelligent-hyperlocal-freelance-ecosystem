const Message = require("../models/Message");

function conversationId(userA, userB) {
  return [String(userA), String(userB)].sort().join("_");
}

exports.getConversation = async (req, res, next) => {
  try {
    const convId = conversationId(req.user._id, req.params.otherUserId);
    const messages = await Message.find({ conversationId: convId })
      .sort({ createdAt: 1 })
      .limit(200);

    // mark as read
    await Message.updateMany(
      { conversationId: convId, recipient: req.user._id, readAt: null },
      { readAt: new Date() }
    );

    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};

exports.getMyConversations = async (req, res, next) => {
  try {
    const messages = await Message.aggregate([
      { $match: { $or: [{ sender: req.user._id }, { recipient: req.user._id }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$recipient", req.user._id] }, { $eq: ["$readAt", null] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);
    res.json({ success: true, conversations: messages });
  } catch (err) {
    next(err);
  }
};

exports.conversationId = conversationId;
