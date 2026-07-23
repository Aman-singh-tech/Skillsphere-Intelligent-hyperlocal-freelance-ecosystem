const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const gig = require("../controllers/gigController");

const router = express.Router();

router.get("/", gig.getGigs);
router.get("/mine", protect, authorize("client"), gig.getMyGigs);
router.get("/search", gig.searchGigs);
router.get("/:id", gig.getGigById);
router.get("/:id/recommendations", protect, authorize("client", "admin"), gig.getRecommendedFreelancers);

router.post("/", protect, authorize("client"), gig.createGig);
router.put("/:id", protect, authorize("client"), gig.updateGig);
router.put("/:id/milestones/:milestoneId", protect, authorize("freelancer"), gig.updateMilestoneProgress);
router.post("/:id/invite", protect, authorize("client"), gig.inviteFreelancer);

module.exports = router;
