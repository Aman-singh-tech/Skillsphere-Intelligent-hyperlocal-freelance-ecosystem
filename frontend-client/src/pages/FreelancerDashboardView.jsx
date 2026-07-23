import { useState, useEffect } from "react";
import { Home, Briefcase, UserCheck, MessageSquare, Star, Award, DollarSign, Eye, FileText, AlertTriangle, X } from "lucide-react";
import { pill } from "../utils/constants";
import { userApi, proposalApi, reviewApi, disputeApi, gigApi } from "../lib/api";
import Avatar from "../components/Avatar";
import StatCard from "../components/StatCard";
import SectionHeader from "../components/SectionHeader";
import StatusBadge from "../components/StatusBadge";

export default 
function FreelancerDashboardView({ user, onOpenChat, }) {
    const [activeSection, setActiveSection] = useState("overview");
    const [analytics, setAnalytics] = useState(null);
    const [myProposals, setMyProposals] = useState([]);
    const [loadingProposals, setLoadingProposals] = useState(true);
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ title: "", bio: "", city: "", hourlyRate: "", skills: "" });
    const [profileError, setProfileError] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [liveUser, setLiveUser] = useState(user);
    const [myReviews, setMyReviews] = useState([]);
    const [reviewGig, setReviewGig] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
    const [reviewError, setReviewError] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [disputeGig, setDisputeGig] = useState(null);
    const [disputeForm, setDisputeForm] = useState({ reason: "payment_issue", description: "" });
    const [disputeError, setDisputeError] = useState("");
    const [submittingDispute, setSubmittingDispute] = useState(false);
    const [myDisputes, setMyDisputes] = useState([]);
    const [loadingDisputes, setLoadingDisputes] = useState(true);
    const [portfolioRows, setPortfolioRows] = useState([{ title: "", description: "", projectUrl: "" }]);
    const [certRows, setCertRows] = useState([""]);
    const [uploadingResume, setUploadingResume] = useState(false);
    const [resumeError, setResumeError] = useState("");

    function loadDisputes() {
        setLoadingDisputes(true);
        disputeApi.mine().then((d) => setMyDisputes(d.disputes || [])).catch(() => setMyDisputes([])).finally(() => setLoadingDisputes(false));
    }

    async function handleRaiseDispute(e) {
        e.preventDefault();
        setDisputeError("");
        setSubmittingDispute(true);
        try {
            await disputeApi.raise({
                gigId: disputeGig._id,
                reason: disputeForm.reason,
                description: disputeForm.description,
            });
            setDisputeGig(null);
            setDisputeForm({ reason: "payment_issue", description: "" });
            loadProposals();
            loadDisputes();
        } catch (err) {
            setDisputeError(err.message || "Failed to raise dispute");
        } finally {
            setSubmittingDispute(false);
        }
    }

    async function handleUpdateMilestone(gigId, milestoneId, payload) {
        await gigApi.updateMilestone(gigId, milestoneId, payload);
        loadProposals();
    }

    function loadProposals() {
        proposalApi.mine().then((d) => setMyProposals(d.proposals || [])).catch(() => setMyProposals([]));
    }

    async function handleSubmitReview(e) {
        e.preventDefault();
        setReviewError("");
        setSubmittingReview(true);
        try {
            await reviewApi.create({
                gigId: reviewGig._id,
                rating: Number(reviewForm.rating),
                comment: reviewForm.comment,
            });
            setReviewGig(null);
            setReviewForm({ rating: 5, comment: "" });
            loadProposals();
        } catch (err) {
            setReviewError(err.message || "Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    }

    useEffect(() => {
        userApi.myAnalytics().then((d) => setAnalytics(d.analytics)).catch(() => setAnalytics(null));
        loadProposals();
        loadDisputes();
        if (user?.id || user?._id) {
            reviewApi.forUser(user.id || user._id).then((d) => setMyReviews(d.reviews || [])).catch(() => setMyReviews([]));
        }
        setLoadingProposals(false);
    }, []);

    function startEditProfile() {
        const fp = liveUser?.freelancerProfile || {};
        setProfileForm({
            title: fp.title || "",
            bio: liveUser?.bio || "",
            city: liveUser?.location?.city || "",
            hourlyRate: fp.hourlyRate || "",
            skills: (fp.skills || []).map((s) => `${s.name}:${s.proficiency || "Intermediate"}`).join(", "),
        });
        setPortfolioRows(fp.portfolio?.length ? fp.portfolio.map((p) => ({ title: p.title || "", description: p.description || "", projectUrl: p.projectUrl || "" })) : [{ title: "", description: "", projectUrl: "" }]);
        setCertRows(fp.certifications?.length ? fp.certifications : [""]);
        setEditingProfile(true);
    }

    const [availabilitySlots, setAvailabilitySlots] = useState((liveUser?.freelancerProfile?.availability || []));
    const [savingAvailability, setSavingAvailability] = useState(false);
    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    function addSlot() {
        setAvailabilitySlots([...availabilitySlots, { day: "Mon", startTime: "09:00", endTime: "17:00" }]);
    }
    function updateSlot(i, field, value) {
        setAvailabilitySlots(availabilitySlots.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
    }
    function removeSlot(i) {
        setAvailabilitySlots(availabilitySlots.filter((_, idx) => idx !== i));
    }
    async function saveAvailability() {
        setSavingAvailability(true);
        try {
            await userApi.updateAvailability(availabilitySlots);
            setLiveUser({ ...liveUser, freelancerProfile: { ...liveUser.freelancerProfile, availability: availabilitySlots } });
        } finally {
            setSavingAvailability(false);
        }
    }

    async function saveProfile(e) {
        e.preventDefault();
        setProfileError("");
        setSavingProfile(true);
        try {
            const skills = profileForm.skills.split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
                const [name, proficiency] = s.split(":").map((x) => x.trim());
                return { name, proficiency: proficiency || "Intermediate" };
            });
            const portfolio = portfolioRows.filter((p) => p.title.trim());
            const certifications = certRows.map((c) => c.trim()).filter(Boolean);
            const data = await userApi.updateProfile({
                bio: profileForm.bio,
                location: { city: profileForm.city },
                freelancerProfile: { title: profileForm.title, hourlyRate: Number(profileForm.hourlyRate) || 0, skills, portfolio, certifications },
            });
            setLiveUser(data.user);
            setEditingProfile(false);
        } catch (err) {
            setProfileError(err.message || "Failed to update profile");
        } finally {
            setSavingProfile(false);
        }
    }

    async function handleResumeUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setResumeError("");
        setUploadingResume(true);
        try {
            const uploaded = await userApi.uploadFile(file);
            const data = await userApi.updateProfile({ freelancerProfile: { resumeUrl: uploaded.url } });
            setLiveUser(data.user);
        } catch (err) {
            setResumeError(err.message?.includes("cloud_name") || err.message?.includes("Invalid") ? "Resume upload needs Cloudinary API keys configured in the backend .env — see CLOUDINARY_* in .env.example." : (err.message || "Upload failed"));
        } finally {
            setUploadingResume(false);
        }
    }

    const fp = liveUser?.freelancerProfile || {};
    const navItems = [
        { id: "overview", label: "Overview", icon: Home },
        { id: "proposals", label: "Proposals", icon: FileText },
        { id: "disputes", label: "Disputes", icon: AlertTriangle },
        { id: "profile", label: "My Profile", icon: UserCheck },
    ];
    return (<div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar initials={(liveUser?.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()} color="#7C3AED" size="md"/>
            <div>
              <p className="text-sm font-semibold text-white">
                {liveUser?.name}
              </p>
              <div className={`${pill} bg-amber-500/20 text-amber-300 text-[10px] mt-0.5`}>
                <Star size={9} className="fill-amber-300"/> {fp.verificationBadge === "top_rated" ? "Top Rated" : fp.verificationBadge === "verified" ? "Verified" : "New freelancer"}
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (<button key={id} onClick={() => setActiveSection(id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === id
                ? "bg-sidebar-primary text-white"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
              <Icon size={15}/>
              {label}
            </button>))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl">
          {activeSection === "overview" && (<>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Welcome back, {liveUser?.name?.split(" ")[0]} 👋
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Here's your performance overview
                  </p>
                </div>
              </div>

              {/* Stats — real data from /users/analytics/me */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Earnings" value={`₹${analytics?.totalEarnings ?? 0}`} sub="Lifetime" icon={DollarSign} color="#059669"/>
                <StatCard label="Gig Applications" value={analytics?.gigApplications ?? 0} sub="Proposals submitted" icon={Briefcase} color="#1D4ED8"/>
                <StatCard label="Profile Views" value={analytics?.profileViews ?? 0} sub="All time" icon={Eye} color="#7C3AED"/>
                <StatCard label="Reputation Score" value={analytics?.reputationScore ?? 0} sub={`${analytics?.jobsCompleted ?? 0} gigs completed`} icon={Award} color="#D97706"/>
              </div>

              {/* Active Proposals */}
              <div className="bg-card border border-border rounded-xl p-5">
                <SectionHeader title="Recent Proposals" sub="Your recent proposal submissions"/>
                {myProposals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">You haven't applied to any gigs yet — browse the Marketplace to get started.</p>
                ) : (
                  <div className="space-y-3">
                    {myProposals.slice(0, 3).map((p) => (<div key={p._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                        <Avatar initials={(p.gig?.title || "?").slice(0, 2).toUpperCase()} color="#7C3AED" size="sm"/>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {p.gig?.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ₹{p.bidAmount} · {p.estimatedDays} days · Match {p.matchScore}%
                          </p>
                        </div>
                        <StatusBadge status={p.status}/>
                      </div>))}
                  </div>
                )}
              </div>
            </>)}

          {activeSection === "proposals" && (<>
              <SectionHeader title="My Proposals" sub="Track all your submitted proposals"/>
              {loadingProposals ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : myProposals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No proposals yet.</p>
              ) : (
                <div className="space-y-3">
                  {myProposals.map((p) => (<div key={p._id} className="bg-card border border-border rounded-xl p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground text-sm">
                              {p.gig?.title}
                            </h3>
                            <StatusBadge status={p.status}/>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Bid: <span className="font-semibold text-foreground">₹{p.bidAmount}</span> · Timeline: {p.estimatedDays} days
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Match</p>
                          <p className="font-mono font-bold text-primary">{p.matchScore}%</p>
                          {p.status === "accepted" && p.gig?.status === "completed" && (
                            <button onClick={() => setReviewGig(p.gig)} className="text-xs text-primary font-medium hover:underline mt-1 block">
                              Leave review
                            </button>
                          )}
                          {p.status === "accepted" && p.gig?.status !== "completed" && (
                            <button onClick={() => onOpenChat({ otherUserId: p.gig?.client?._id || p.gig?.client, otherUserName: p.gig?.client?.name || "Client", gigId: p.gig?._id, gigTitle: p.gig?.title })} className="text-xs text-primary font-medium hover:underline mt-1 flex items-center gap-1 justify-end">
                              <MessageSquare size={11}/> Message
                            </button>
                          )}
                          {p.status === "accepted" && (p.gig?.status === "in_progress" || p.gig?.status === "completed") && (
                            <button onClick={() => setDisputeGig(p.gig)} className="text-xs text-red-600 font-medium hover:underline mt-1 flex items-center gap-1 justify-end">
                              <AlertTriangle size={11}/> Raise dispute
                            </button>
                          )}
                        </div>
                      </div>

                      {p.status === "accepted" && p.gig?.status === "in_progress" && (p.gig?.milestones || []).length > 0 && (
                        <div className="mt-4 space-y-3 border-t border-border pt-3">
                          {p.gig.milestones.map((m) => (<div key={m._id}>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-foreground">{m.title} <span className="text-muted-foreground font-normal">· ₹{m.amount}</span></p>
                                <span className={`${pill} bg-secondary text-secondary-foreground text-xs`}>{m.status.replace("_", " ")}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="range" min="0" max="100" defaultValue={m.progressPercent || 0} onMouseUp={(e) => handleUpdateMilestone(p.gig._id, m._id, { progressPercent: Number(e.target.value), status: Number(e.target.value) >= 100 ? "submitted" : "in_progress" })} className="flex-1 accent-primary h-2"/>
                                <span className="text-xs text-muted-foreground font-mono w-10 text-right">{m.progressPercent || 0}%</span>
                              </div>
                              {m.status !== "submitted" && m.status !== "paid" && (m.progressPercent || 0) >= 100 && (
                                <p className="text-xs font-medium text-emerald-700 mt-1">Marked ready for review ✓</p>
                              )}
                            </div>))}
                        </div>
                      )}
                    </div>))}
                </div>
              )}
            </>)}

          {activeSection === "disputes" && (<>
              <SectionHeader title="My Disputes" sub={loadingDisputes ? "Loading…" : `${myDisputes.length} total`}/>
              {!loadingDisputes && myDisputes.length === 0 && (
                <p className="text-sm text-muted-foreground">No disputes raised — good sign. You can raise one from an accepted gig in "My Proposals" if something goes wrong.</p>
              )}
              <div className="space-y-3">
                {myDisputes.map((d) => (<div key={d._id} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-muted-foreground">{d._id.slice(-6).toUpperCase()}</span>
                      <StatusBadge status={d.status}/>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{d.gig?.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">Reason: {d.reason.replace(/_/g, " ")} · Filed {new Date(d.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-foreground mt-2">{d.description}</p>
                  </div>))}
              </div>
            </>)}

          {activeSection === "profile" && (<>
              <SectionHeader title="My Profile" sub="Your public freelancer profile"/>

              {editingProfile ? (
                <form onSubmit={saveProfile} className="bg-card border border-border rounded-xl p-6 space-y-4">
                  {profileError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{profileError}</p>}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Title</label>
                    <input className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Full-Stack React Developer" value={profileForm.title} onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}/>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Bio</label>
                    <textarea rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">City</label>
                      <input className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}/>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">Hourly rate (₹)</label>
                      <input type="number" className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={profileForm.hourlyRate} onChange={(e) => setProfileForm({ ...profileForm, hourlyRate: e.target.value })}/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Skills (format: name:level, comma separated)</label>
                    <input className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="React:Expert, Node.js:Intermediate" value={profileForm.skills} onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}/>
                    <p className="text-xs text-muted-foreground mt-1">Level: Beginner, Intermediate, Advanced, or Expert</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Portfolio</label>
                    <div className="space-y-2">
                      {portfolioRows.map((p, i) => (<div key={i} className="border border-border rounded-lg p-3 space-y-2">
                          <div className="flex gap-2">
                            <input placeholder="Project title" className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary" value={p.title} onChange={(e) => setPortfolioRows(portfolioRows.map((row, idx) => idx === i ? { ...row, title: e.target.value } : row))}/>
                            {portfolioRows.length > 1 && (
                              <button type="button" onClick={() => setPortfolioRows(portfolioRows.filter((_, idx) => idx !== i))} className="text-red-500 px-2"><X size={14}/></button>
                            )}
                          </div>
                          <input placeholder="Link (GitHub, live site, Behance…)" className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary" value={p.projectUrl} onChange={(e) => setPortfolioRows(portfolioRows.map((row, idx) => idx === i ? { ...row, projectUrl: e.target.value } : row))}/>
                          <textarea placeholder="Short description" rows={2} className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary" value={p.description} onChange={(e) => setPortfolioRows(portfolioRows.map((row, idx) => idx === i ? { ...row, description: e.target.value } : row))}/>
                        </div>))}
                    </div>
                    <button type="button" onClick={() => setPortfolioRows([...portfolioRows, { title: "", description: "", projectUrl: "" }])} className="text-xs text-primary font-medium mt-2 hover:underline">+ Add project</button>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Certifications</label>
                    <div className="space-y-2">
                      {certRows.map((c, i) => (<div key={i} className="flex gap-2">
                          <input placeholder="e.g. AWS Certified Developer" className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary" value={c} onChange={(e) => setCertRows(certRows.map((row, idx) => idx === i ? e.target.value : row))}/>
                          {certRows.length > 1 && (
                            <button type="button" onClick={() => setCertRows(certRows.filter((_, idx) => idx !== i))} className="text-red-500 px-2"><X size={14}/></button>
                          )}
                        </div>))}
                    </div>
                    <button type="button" onClick={() => setCertRows([...certRows, ""])} className="text-xs text-primary font-medium mt-2 hover:underline">+ Add certification</button>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Resume</label>
                    {resumeError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">{resumeError}</p>}
                    {liveUser?.freelancerProfile?.resumeUrl && (
                      <a href={liveUser.freelancerProfile.resumeUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline block mb-2">Current resume on file →</a>
                    )}
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} disabled={uploadingResume} className="text-xs"/>
                    {uploadingResume && <p className="text-xs text-muted-foreground mt-1">Uploading…</p>}
                  </div>

                  <div className="flex gap-2">
                    <button disabled={savingProfile} className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
                      {savingProfile ? "Saving…" : "Save profile"}
                    </button>
                    <button type="button" onClick={() => setEditingProfile(false)} className="border border-border px-4 py-2 rounded-lg text-sm">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
                  <div className="h-24 bg-gradient-to-r from-[#1D4ED8] to-[#7C3AED]"/>
                  <div className="px-6 pb-6">
                    <div className="flex items-end gap-4 -mt-8 mb-4">
                      <div className="w-16 h-16 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white font-bold text-xl border-4 border-white">
                        {(liveUser?.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="pb-1">
                        <h2 className="font-bold text-foreground">
                          {liveUser?.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {fp.title || "No title set"} · {liveUser?.location?.city || "Location not set"}
                        </p>
                      </div>
                      <button onClick={startEditProfile} className="ml-auto text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
                        Edit Profile
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4 mb-4">
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="font-bold text-lg" style={{ color: "#D97706" }}>{fp.reputationScore ? (fp.reputationScore / 20).toFixed(1) : "New"} ★</p>
                        <p className="text-xs text-muted-foreground">Rating</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="font-bold text-lg" style={{ color: "#1D4ED8" }}>{fp.totalReviews || 0}</p>
                        <p className="text-xs text-muted-foreground">Reviews</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="font-bold text-lg" style={{ color: "#059669" }}>{fp.jobsCompleted || 0} gigs</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">Skills</p>
                      {(fp.skills || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">No skills added yet — click Edit Profile to add some.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {fp.skills.map((s) => (<span key={s.name} className={`${pill} bg-secondary text-secondary-foreground border border-blue-200`}>
                              {s.name} <span className="opacity-60 ml-1">· {s.proficiency}</span>
                            </span>))}
                        </div>
                      )}
                    </div>

                    {(fp.portfolio || []).length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-foreground mb-2">Portfolio</p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {fp.portfolio.map((p, i) => (<a key={i} href={p.projectUrl || "#"} target="_blank" rel="noreferrer" className="border border-border rounded-lg p-3 hover:border-primary transition-colors block">
                              <p className="text-xs font-semibold text-foreground">{p.title}</p>
                              {p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}
                            </a>))}
                        </div>
                      </div>
                    )}

                    {(fp.certifications || []).length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-foreground mb-2">Certifications</p>
                        <div className="flex flex-wrap gap-2">
                          {fp.certifications.map((c, i) => (<span key={i} className={`${pill} bg-amber-100 text-amber-700`}>{c}</span>))}
                        </div>
                      </div>
                    )}

                    {fp.resumeUrl && (
                      <div className="mt-4">
                        <a href={fp.resumeUrl} target="_blank" rel="noreferrer" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                          <FileText size={12}/> View resume
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!editingProfile && (
                <div className="bg-card border border-border rounded-xl p-6 mb-5">
                  <SectionHeader title="Availability" sub="Weekly slots clients can see when reviewing your profile"/>
                  <div className="space-y-2 mb-3">
                    {availabilitySlots.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No availability set yet.</p>
                    ) : (
                      availabilitySlots.map((s, i) => (<div key={i} className="flex items-center gap-2">
                          <select value={s.day} onChange={(e) => updateSlot(i, "day", e.target.value)} className="border border-border rounded-lg px-2 py-1.5 text-xs">
                            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <input type="time" value={s.startTime} onChange={(e) => updateSlot(i, "startTime", e.target.value)} className="border border-border rounded-lg px-2 py-1.5 text-xs"/>
                          <span className="text-xs text-muted-foreground">to</span>
                          <input type="time" value={s.endTime} onChange={(e) => updateSlot(i, "endTime", e.target.value)} className="border border-border rounded-lg px-2 py-1.5 text-xs"/>
                          <button onClick={() => removeSlot(i)} className="text-red-500"><X size={13}/></button>
                        </div>))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addSlot} className="text-xs text-primary font-medium hover:underline">+ Add slot</button>
                    <button onClick={saveAvailability} disabled={savingAvailability} className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg ml-auto disabled:opacity-50">
                      {savingAvailability ? "Saving…" : "Save availability"}
                    </button>
                  </div>
                </div>
              )}

              {!editingProfile && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <SectionHeader title="Reviews" sub={`${myReviews.length} review${myReviews.length === 1 ? "" : "s"}`}/>
                  {myReviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reviews yet — they'll show up here once a client reviews a completed gig.</p>
                  ) : (
                    <div className="space-y-4">
                      {myReviews.map((r) => (<div key={r._id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((n) => (<Star key={n} size={13} className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}/>))}
                            </div>
                            <span className="text-xs font-medium text-foreground">{r.reviewer?.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{r.comment}</p>
                        </div>))}
                    </div>
                  )}
                </div>
              )}
            </>)}
        </div>
      </main>

      {/* Review modal */}
      {reviewGig && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setReviewGig(null)}>
          <form onSubmit={handleSubmitReview} onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-foreground">Leave a review for "{reviewGig.title}"</h3>
            {reviewError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{reviewError}</p>}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: n })}>
                    <Star size={22} className={n <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Comment</label>
              <textarea required rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={submittingReview} className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50">
                {submittingReview ? "Submitting…" : "Submit review"}
              </button>
              <button type="button" onClick={() => setReviewGig(null)} className="px-4 border border-border rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Raise dispute modal */}
      {disputeGig && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDisputeGig(null)}>
          <form onSubmit={handleRaiseDispute} onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-foreground">Raise a dispute for "{disputeGig.title}"</h3>
            {disputeError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{disputeError}</p>}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Reason</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={disputeForm.reason} onChange={(e) => setDisputeForm({ ...disputeForm, reason: e.target.value })}>
                <option value="payment_issue">Payment issue</option>
                <option value="quality_issue">Quality issue</option>
                <option value="scope_dispute">Scope dispute</option>
                <option value="timeline_breach">Timeline breach</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Description</label>
              <textarea required rows={4} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={disputeForm.description} onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">Filing a dispute pauses this gig and any held escrow payment until an admin reviews it.</p>
            <div className="flex gap-2">
              <button type="submit" disabled={submittingDispute} className="flex-1 bg-red-600 text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50">
                {submittingDispute ? "Submitting…" : "Submit dispute"}
              </button>
              <button type="button" onClick={() => setDisputeGig(null)} className="px-4 border border-border rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>);
}
