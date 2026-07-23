// Map a real backend User doc (freelancer) -> shape FreelancerCard expects
export function mapFreelancer(f) {
  const fp = f.freelancerProfile || {};
  return {
    id: f._id,
    name: f.name,
    title: fp.title || "Freelancer",
    location: f.location?.city || "Remote",
    rating: fp.reputationScore ? (fp.reputationScore / 20).toFixed(1) : "New",
    reviews: fp.totalReviews || 0,
    rate: fp.hourlyRate ? `₹${fp.hourlyRate}/hr` : "Rate not set",
    skills: (fp.skills || []).map((s) => s.name),
    badge: fp.verificationBadge === "top_rated" ? "Top Rated" : fp.verificationBadge === "verified" ? "Verified" : "New",
    available: true,
    score: fp.reputationScore || 0,
    avatar: f.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?",
    color: "#1D4ED8",
  };
}

// Map a real backend Gig doc -> shape GigCard expects
export function mapGig(g) {
  return {
    id: g._id,
    title: g.title,
    client: g.client?.name || "Client",
    skills: g.skillsRequired || [],
    budget: g.budgetMin && g.budgetMax ? `₹${g.budgetMin}–₹${g.budgetMax}` : "Budget TBD",
    duration: g.budgetType || "fixed",
    proposals: g.proposalsCount || 0,
    urgency: g.urgency || "medium",
  };
}
