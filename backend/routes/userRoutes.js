const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/auth");
const user = require("../controllers/userController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/analytics/me", protect, user.getFreelancerAnalytics);
router.get("/freelancers", user.listFreelancers);
router.get("/:id", user.getProfile);
router.put("/me", protect, user.updateProfile);
router.put("/me/availability", protect, user.updateAvailability);
router.post("/me/upload", protect, upload.single("file"), user.uploadFile);

module.exports = router;
