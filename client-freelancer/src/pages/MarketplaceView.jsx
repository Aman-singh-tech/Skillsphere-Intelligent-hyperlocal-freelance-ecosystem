import { useState, useEffect } from "react";
import { pill } from "../utils/constants";
import { userApi, gigApi, proposalApi } from "../lib/api";
import { mapFreelancer, mapGig } from "../utils/mappers";
import FreelancerCard from "../components/FreelancerCard";
import GigCard from "../components/GigCard";

export default function MarketplaceView({ user }) {
  const [tab, setTab] = useState("freelancers");
  const [skillFilter, setSkillFilter] = useState(null);
  const [cityFilter, setCityFilter] = useState("");
  const [maxRateFilter, setMaxRateFilter] = useState("");
  const [minRatingFilter, setMinRatingFilter] = useState("");
  const [minBudgetFilter, setMinBudgetFilter] = useState("");
  const [maxBudgetFilter, setMaxBudgetFilter] = useState("");
  const [freelancerList, setFreelancerList] = useState([]);
  const [gigList, setGigList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyGig, setApplyGig] = useState(null);
  const [applyForm, setApplyForm] = useState({ coverLetter: "", bidAmount: "", estimatedDays: "" });
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");
  const [applying, setApplying] = useState(false);
  const skillOptions = ["React", "Node.js", "Figma", "Python", "AWS", "Flutter"];

  function loadData() {
    setLoading(true);
    const freelancerParams = {};
    if (skillFilter) freelancerParams.skill = skillFilter;
    if (cityFilter) freelancerParams.city = cityFilter;
    if (maxRateFilter) freelancerParams.maxRate = maxRateFilter;
    if (minRatingFilter) freelancerParams.minRating = minRatingFilter;

    const gigParams = {};
    if (skillFilter) gigParams.skill = skillFilter;
    if (cityFilter) gigParams.city = cityFilter;
    if (minBudgetFilter) gigParams.minBudget = minBudgetFilter;
    if (maxBudgetFilter) gigParams.maxBudget = maxBudgetFilter;
    const hasGigFilters = Object.keys(gigParams).length > 0;

    Promise.all([
      userApi.listFreelancers(freelancerParams).catch(() => ({ freelancers: [] })),
      (hasGigFilters ? gigApi.search(gigParams) : gigApi.list()).catch(() => ({ gigs: [] })),
    ]).then(([fData, gData]) => {
      setFreelancerList(fData.freelancers || []);
      setGigList(gData.gigs || []);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadData();
  }, [skillFilter]);

  function applyFilters(e) {
    e.preventDefault();
    loadData();
  }

  function clearFilters() {
    setCityFilter("");
    setMaxRateFilter("");
    setMinRatingFilter("");
    setMinBudgetFilter("");
    setMaxBudgetFilter("");
    setSkillFilter(null);
  }

  async function handleApplySubmit(e) {
    e.preventDefault();
    setApplyError("");
    setApplying(true);
    try {
      await proposalApi.submit({
        gigId: applyGig.id,
        coverLetter: applyForm.coverLetter,
        bidAmount: Number(applyForm.bidAmount),
        estimatedDays: Number(applyForm.estimatedDays),
      });
      setApplySuccess(`Proposal submitted for "${applyGig.title}"!`);
      setApplyGig(null);
      setApplyForm({ coverLetter: "", bidAmount: "", estimatedDays: "" });
      loadData();
    } catch (err) {
      setApplyError(err.message || "Failed to submit proposal");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Marketplace</h1>
          <p className="text-sm text-muted-foreground">Browse verified freelancers and open gigs near you</p>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-border bg-card">
          {["freelancers", "gigs"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {applySuccess && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 mb-4">
          {applySuccess}
        </p>
      )}

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="text-xs text-muted-foreground font-medium self-center">Skills:</span>
        {skillOptions.map((s) => (
          <button
            key={s}
            onClick={() => setSkillFilter(skillFilter === s ? null : s)}
            className={`${pill} border transition-colors ${
              skillFilter === s
                ? "bg-primary text-white border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary hover:text-primary"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      <form onSubmit={applyFilters} className="bg-card border border-border rounded-xl p-4 mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">City</label>
          <input
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            placeholder="e.g. Bengaluru"
            className="border border-border rounded-lg px-2.5 py-1.5 text-sm w-32 outline-none focus:border-primary"
          />
        </div>
        {tab === "freelancers" ? (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Max rate (₹/hr)</label>
              <input
                type="number"
                value={maxRateFilter}
                onChange={(e) => setMaxRateFilter(e.target.value)}
                placeholder="e.g. 2000"
                className="border border-border rounded-lg px-2.5 py-1.5 text-sm w-28 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Min rating</label>
              <select
                value={minRatingFilter}
                onChange={(e) => setMinRatingFilter(e.target.value)}
                className="border border-border rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary"
              >
                <option value="">Any</option>
                <option value="3">3★ +</option>
                <option value="4">4★ +</option>
                <option value="4.5">4.5★ +</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Min budget (₹)</label>
              <input
                type="number"
                value={minBudgetFilter}
                onChange={(e) => setMinBudgetFilter(e.target.value)}
                placeholder="e.g. 5000"
                className="border border-border rounded-lg px-2.5 py-1.5 text-sm w-28 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Max budget (₹)</label>
              <input
                type="number"
                value={maxBudgetFilter}
                onChange={(e) => setMaxBudgetFilter(e.target.value)}
                placeholder="e.g. 50000"
                className="border border-border rounded-lg px-2.5 py-1.5 text-sm w-28 outline-none focus:border-primary"
              />
            </div>
          </>
        )}
        <button type="submit" className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg">
          Apply filters
        </button>
        <button type="button" onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground px-2 py-2">
          Clear
        </button>
      </form>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4 font-mono">
        {loading ? "Loading…" : tab === "freelancers" ? `${freelancerList.length} freelancers` : `${gigList.length} open gigs`}
      </p>

      {/* Apply modal (inline) */}
      {applyGig && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setApplyGig(null)}>
          <form onSubmit={handleApplySubmit} onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-foreground">Apply to "{applyGig.title}"</h3>
            {applyError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{applyError}</p>}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Cover letter</label>
              <textarea
                required
                rows={4}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                value={applyForm.coverLetter}
                onChange={(e) => setApplyForm({ ...applyForm, coverLetter: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Your bid (₹)</label>
                <input
                  required
                  type="number"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                  value={applyForm.bidAmount}
                  onChange={(e) => setApplyForm({ ...applyForm, bidAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Est. days</label>
                <input
                  required
                  type="number"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                  value={applyForm.estimatedDays}
                  onChange={(e) => setApplyForm({ ...applyForm, estimatedDays: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={applying} className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50">
                {applying ? "Submitting…" : "Submit proposal"}
              </button>
              <button type="button" onClick={() => setApplyGig(null)} className="px-4 border border-border rounded-lg text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Fetching live data from the backend…</p>
      ) : tab === "freelancers" ? (
        freelancerList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No freelancers match yet — register a freelancer account to see them here.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {freelancerList.map((f) => (
              <FreelancerCard key={f._id} f={mapFreelancer(f)} />
            ))}
          </div>
        )
      ) : gigList.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open gigs yet — post one from a client account.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gigList.map((g) => (
            <GigCard key={g._id} g={mapGig(g)} showApply={user?.role === "freelancer"} onApply={setApplyGig} />
          ))}
        </div>
      )}
    </div>
  );
}
