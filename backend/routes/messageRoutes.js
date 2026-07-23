const express = require("express");
const { protect } = require("../middleware/auth");
const msg = require("../controllers/messageController");

const router = express.Router();

router.get("/conversations", protect, msg.getMyConversations);
router.get("/:otherUserId", protect, msg.getConversation);

module.exports = router;
