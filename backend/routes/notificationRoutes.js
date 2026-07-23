const express = require("express");
const { protect } = require("../middleware/auth");
const notif = require("../controllers/notificationController");

const router = express.Router();
router.get("/", protect, notif.getMyNotifications);
router.put("/:id/read", protect, notif.markAsRead);
router.put("/read-all", protect, notif.markAllAsRead);

module.exports = router;
