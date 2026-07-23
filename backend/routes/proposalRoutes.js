const express = require("express");
const { protect } = require("../middleware/auth");
const proposal = require("../controllers/proposalController");

const router = express.Router();

router.post("/", protect, proposal.submitProposal);
router.get("/mine", protect, proposal.getMyProposals);
router.get("/gig/:gigId", protect, proposal.getProposalsForGig);
router.put("/:id/negotiate", protect, proposal.negotiateProposal);
router.put("/:id/accept", protect, proposal.acceptProposal);
router.put("/:id/reject", protect, proposal.rejectProposal);

module.exports = router;
