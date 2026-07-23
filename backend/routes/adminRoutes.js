const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const admin = require("../controllers/adminController");

const router = express.Router();
router.use(protect, authorize("admin")); // every route below requires an admin

router.get("/users", admin.getAllUsers);
router.put("/users/:id/suspend", admin.suspendUser);
router.put("/users/:id/reinstate", admin.reinstateUser);
router.put("/users/:id/verify", admin.verifyFreelancer);

router.get("/gigs/pending", admin.getPendingGigs);
router.put("/gigs/:id/approve", admin.approveGig);
router.put("/gigs/:id/reject", admin.rejectGig);

router.get("/disputes", admin.getDisputes);
router.put("/disputes/:id/resolve", admin.resolveDispute);

router.get("/analytics", admin.getAnalytics);

module.exports = router;
