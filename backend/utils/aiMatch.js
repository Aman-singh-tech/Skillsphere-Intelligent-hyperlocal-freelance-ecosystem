/**
 * Module 2 — AI-Powered Job Matching
 *
 * Primary path: calls the Hugging Face Inference API (sentence-transformers
 * embedding model) to compute semantic similarity between a gig's required
 * skills/description and a freelancer's skills/title.
 *
 * Fallback path (no HUGGINGFACE_API_KEY set, or the API call fails/rate-limits):
 * a local Jaccard + weighted-overlap skill-similarity scorer. This keeps the
 * matching feature fully demoable without depending on an external key.
 */

const HF_URL = (model) => `https://api-inference.huggingface.co/models/${model}`;

// ── Local fallback: skill-similarity scoring ────────────────────────────
function localSkillSimilarity(requiredSkills = [], freelancerSkills = []) {
  const req = requiredSkills.map((s) => s.toLowerCase().trim());
  const fl = freelancerSkills.map((s) => s.toLowerCase().trim());

  if (req.length === 0 || fl.length === 0) return 0;

  const reqSet = new Set(req);
  const flSet = new Set(fl);
  const intersection = [...reqSet].filter((s) => flSet.has(s));
  const union = new Set([...reqSet, ...flSet]);

  const jaccard = intersection.length / union.size; // 0-1
  const coverage = intersection.length / reqSet.size; // how much of the gig's needs are covered

  // Weighted: coverage matters more than raw overlap ratio
  const score = coverage * 0.7 + jaccard * 0.3;
  return Math.round(score * 100);
}

// ── Hugging Face embedding-based similarity ─────────────────────────────
async function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

async function huggingFaceSimilarity(gigText, freelancerText) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) return null; // signal caller to use fallback

  const model = process.env.HUGGINGFACE_MODEL || "sentence-transformers/all-MiniLM-L6-v2";

  const res = await fetch(HF_URL(model), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: { source_sentence: gigText, sentences: [freelancerText] },
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  // sentence-similarity pipeline returns an array of similarity scores [0..1]
  if (Array.isArray(data) && typeof data[0] === "number") {
    return Math.round(data[0] * 100);
  }
  return null;
}

/**
 * Returns a 0-100 match score between a gig and a freelancer.
 */
async function computeMatchScore(gig, freelancer) {
  const fp = freelancer.freelancerProfile || {};
  const freelancerSkillNames = (fp.skills || []).map((s) => s.name);

  try {
    const gigText = `${gig.title}. ${gig.description}. Skills: ${(gig.skillsRequired || []).join(", ")}`;
    const freelancerText = `${fp.title || ""}. Skills: ${freelancerSkillNames.join(", ")}`;
    const hfScore = await huggingFaceSimilarity(gigText, freelancerText);
    if (hfScore !== null) return hfScore;
  } catch (err) {
    console.warn("HuggingFace matching failed, using local fallback:", err.message);
  }

  return localSkillSimilarity(gig.skillsRequired, freelancerSkillNames);
}

/**
 * Ranks a list of freelancers against a gig, highest match first.
 * Also factors in reputation score and location proximity as tie-breakers.
 */
async function rankFreelancersForGig(gig, freelancers) {
  const scored = await Promise.all(
    freelancers.map(async (f) => {
      const matchScore = await computeMatchScore(gig, f);
      const reputationBoost = (f.freelancerProfile?.reputationScore || 0) * 0.1;
      const sameCity =
        gig.location?.city &&
        f.location?.city &&
        gig.location.city.toLowerCase() === f.location.city.toLowerCase()
          ? 5
          : 0;
      return {
        freelancer: f,
        matchScore,
        finalScore: Math.min(100, matchScore + reputationBoost + sameCity),
      };
    })
  );

  return scored.sort((a, b) => b.finalScore - a.finalScore);
}

module.exports = { computeMatchScore, rankFreelancersForGig, localSkillSimilarity };
