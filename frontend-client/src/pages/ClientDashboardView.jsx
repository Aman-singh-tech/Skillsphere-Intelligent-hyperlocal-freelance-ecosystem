import { useState, useEffect } from "react";
import { Home, Briefcase, Sparkles, Zap, Package, FileText, AlertTriangle, CreditCard, CheckCircle, CircleCheck, Clock, Lock, MessageSquare, Activity, Star, X } from "lucide-react";
import { pill } from "../utils/constants";
import { gigApi, proposalApi, reviewApi, disputeApi, paymentApi } from "../lib/api";
import Avatar from "../components/Avatar";
import StatCard from "../components/StatCard";
import SectionHeader from "../components/SectionHeader";
import StatusBadge from "../components/StatusBadge";

export default 
function ClientDashboardView({ user, onOpenChat, }) {
    const [activeSection, setActiveSection] = useState("overview");
    const [myGigs, setMyGigs] = useState([]);
    const [loadingGigs, setLoadingGigs] = useState(true);
    const [showPostForm, setShowPostForm] = useState(false);
    const [postForm, setPostForm] = useState({ title: "", description: "", category: "", skillsRequired: "", budgetMin: "", budgetMax: "" });
    const [milestoneRows, setMilestoneRows] = useState([{ title: "", amount: "" }]);
    const [postError, setPostError] = useState("");
    const [posting, setPosting] = useState(false);
    const [selectedGigId, setSelectedGigId] = useState(null);
    const [gigProposals, setGigProposals] = useState([]);
    const [loadingProposals, setLoadingProposals] = useState(false);
    const [reviewGig, setReviewGig] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
    const [reviewError, setReviewError] = useState("");
    const [reviewSuccess, setReviewSuccess] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [selectedMatchGigId, setSelectedMatchGigId] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [disputeGig, setDisputeGig] = useState(null);
    const [disputeForm, setDisputeForm] = useState({ reason: "payment_issue", description: "" });
    const [disputeError, setDisputeError] = useState("");
    const [submittingDispute, setSubmittingDispute] = useState(false);
    const [myDisputes, setMyDisputes] = useState([]);
    const [loadingDisputes, setLoadingDisputes] = useState(true);
    const [payments, setPayments] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(true);

    function loadPayments() {
        setLoadingPayments(true);
        paymentApi.history().then((d) => setPayments(d.payments || [])).catch(() => setPayments([])).finally(() => setLoadingPayments(false));
    }

    function loadRazorpayScript() {
        return new Promise((resolve) => {
            if (window.Razorpay) return resolve(true);
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    }

    async function handleFundMilestone(gigId, milestone) {
        try {
            const data = await paymentApi.createOrder({ gigId, milestoneId: milestone._id, amount: milestone.amount });
            
            if (data.devMode) {
                // Simulated escrow hold
                loadPayments();
                loadMyGigs();
                return;
            }

            // Load Razorpay script
            const res = await loadRazorpayScript();
            if (!res) {
                alert("Failed to load Razorpay SDK. Are you online?");
                return;
            }

            // Open Razorpay Popup
            const options = {
                key: data.keyId,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "SkillSphere",
                description: `Fund Escrow for ${milestone.title || "Gig"}`,
                order_id: data.order.id,
                handler: async function (response) {
                    try {
                        await paymentApi.verify({
                            paymentId: data.paymentId,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpaySignature: response.razorpay_signature
                        });
                        loadPayments();
                        loadMyGigs();
                    } catch (err) {
                        alert("Payment verification failed: " + err.message);
                    }
                },
                prefill: {
                    name: user?.name || "",
                    email: user?.email || ""
                },
                theme: {
                    color: "#1D4ED8"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response){
                alert("Payment failed: " + response.error.description);
            });
            rzp.open();

        } catch (err) {
            alert(err.message || "Failed to initialize payment");
        }
    }

    async function handleReleasePayment(paymentId) {
        await paymentApi.release(paymentId);
        loadPayments();
        loadMyGigs();
    }

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
            loadMyGigs();
            loadDisputes();
        } catch (err) {
            setDisputeError(err.message || "Failed to raise dispute");
        } finally {
            setSubmittingDispute(false);
        }
    }

    async function loadMatches(gigId) {
        setSelectedMatchGigId(gigId);
        setLoadingMatches(true);
        try {
            const data = await gigApi.recommendations(gigId);
            setMatches(data.recommendations || []);
        } catch {
            setMatches([]);
        } finally {
            setLoadingMatches(false);
        }
    }

    async function handleMarkCompleted(gigId) {
        await gigApi.update(gigId, { status: "completed" });
        loadMyGigs();
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
            setReviewSuccess(`Review submitted for ${reviewGig.title}`);
            setReviewGig(null);
            setReviewForm({ rating: 5, comment: "" });
            loadMyGigs();
        } catch (err) {
            setReviewError(err.message || "Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    }

    async function loadMyGigs() {
        setLoadingGigs(true);
        try {
            const data = await gigApi.mine();
            setMyGigs(data.gigs || []);
        } catch {
            setMyGigs([]);
        } finally {
            setLoadingGigs(false);
        }
    }

    useEffect(() => { loadMyGigs(); loadDisputes(); loadPayments(); }, []);

    async function handlePostGig(e) {
        e.preventDefault();
        setPostError("");
        setPosting(true);
        try {
            await gigApi.create({
                title: postForm.title,
                description: postForm.description,
                category: postForm.category || "General",
                skillsRequired: postForm.skillsRequired.split(",").map((s) => s.trim()).filter(Boolean),
                budgetMin: Number(postForm.budgetMin),
                budgetMax: Number(postForm.budgetMax),
                milestones: milestoneRows
                    .filter((m) => m.title.trim() && m.amount)
                    .map((m) => ({ title: m.title, amount: Number(m.amount) })),
            });
            setShowPostForm(false);
            setPostForm({ title: "", description: "", category: "", skillsRequired: "", budgetMin: "", budgetMax: "" });
            setMilestoneRows([{ title: "", amount: "" }]);
            await loadMyGigs();
            setActiveSection("gigs");
        } catch (err) {
            setPostError(err.message || "Failed to post gig");
        } finally {
            setPosting(false);
        }
    }

    async function loadProposals(gigId) {
        setSelectedGigId(gigId);
        setLoadingProposals(true);
        try {
            const data = await proposalApi.forGig(gigId);
            setGigProposals(data.proposals || []);
        } catch {
            setGigProposals([]);
        } finally {
            setLoadingProposals(false);
        }
    }

    async function handleAccept(id) {
        await proposalApi.accept(id);
        loadProposals(selectedGigId);
        loadMyGigs();
    }
    async function handleReject(id) {
        await proposalApi.reject(id);
        loadProposals(selectedGigId);
    }

    const navItems = [
        { id: "overview", label: "Overview", icon: Home },
        { id: "gigs", label: "My Gigs", icon: Package },
        { id: "matches", label: "AI Matches", icon: Sparkles },
        { id: "proposals", label: "Proposals", icon: FileText },
        { id: "disputes", label: "Disputes", icon: AlertTriangle },
        { id: "payments", label: "Payments", icon: CreditCard },
    ];
    return (<div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#059669] flex items-center justify-center text-white font-bold text-sm">
              {(user?.name || "C").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {user?.clientProfile?.companyName || user?.name || "Client"}
              </p>
              <p className="text-[10px] text-slate-400">
                Client Account
              </p>
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

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl">
          {activeSection === "overview" && (<>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Client Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {user?.name} · {user?.location?.city || "Location not set"}
                  </p>
                </div>
                <button onClick={() => { setActiveSection("gigs"); setShowPostForm(true); }} className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Zap size={14}/> Post New Gig
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Active Gigs" value={myGigs.filter((g) => g.status === "open" || g.status === "in_progress").length} sub="Live count" icon={Briefcase} color="#1D4ED8"/>
                <StatCard label="Total Proposals" value={myGigs.reduce((sum, g) => sum + (g.proposalsCount || 0), 0)} sub="Across all gigs" icon={FileText} color="#7C3AED"/>
                <StatCard label="In Progress" value={myGigs.filter((g) => g.status === "in_progress").length} sub="Assigned to freelancers" icon={Activity} color="#059669"/>
                <StatCard label="Completed" value={myGigs.filter((g) => g.status === "completed").length} sub="Finished gigs" icon={CircleCheck} color="#D97706"/>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <SectionHeader title="Your Gigs" sub={loadingGigs ? "Loading…" : `${myGigs.length} total`}/>
                {myGigs.length === 0 && !loadingGigs && (
                  <p className="text-sm text-muted-foreground">You haven't posted any gigs yet. Click "Post New Gig" to create one.</p>
                )}
                <div className="space-y-2">
                  {myGigs.slice(0, 5).map((g) => (
                    <div key={g._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                      <div>
                        <p className="text-sm font-medium text-foreground">{g.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {g.approvalStatus === "pending" ? "Awaiting admin approval" : g.status.replace("_", " ")} · {g.proposalsCount || 0} proposals
                        </p>
                      </div>
                      <button onClick={() => { setActiveSection("proposals"); loadProposals(g._id); }} className="text-xs text-primary font-medium hover:underline">
                        View proposals
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>)}

          {activeSection === "gigs" && (<>
              <div className="flex items-center justify-between mb-6">
                <SectionHeader title="My Gigs" sub="Manage all your posted gigs"/>
                <button onClick={() => setShowPostForm(!showPostForm)} className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg">
                  <Zap size={14}/> {showPostForm ? "Cancel" : "Post Gig"}
                </button>
              </div>

              {showPostForm && (
                <form onSubmit={handlePostGig} className="bg-card border border-border rounded-xl p-5 mb-6 space-y-3">
                  {postError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{postError}</p>}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Title</label>
                    <input required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}/>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Description</label>
                    <textarea required rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={postForm.description} onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">Category</label>
                      <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Web Development" value={postForm.category} onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}/>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">Skills (comma separated)</label>
                      <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="React, Node.js" value={postForm.skillsRequired} onChange={(e) => setPostForm({ ...postForm, skillsRequired: e.target.value })}/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">Budget min (₹)</label>
                      <input required type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={postForm.budgetMin} onChange={(e) => setPostForm({ ...postForm, budgetMin: e.target.value })}/>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">Budget max (₹)</label>
                      <input required type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={postForm.budgetMax} onChange={(e) => setPostForm({ ...postForm, budgetMax: e.target.value })}/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Milestones (optional)</label>
                    <div className="space-y-2">
                      {milestoneRows.map((m, i) => (
                        <div key={i} className="flex gap-2">
                          <input placeholder="Milestone title" className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={m.title} onChange={(e) => setMilestoneRows(milestoneRows.map((row, idx) => idx === i ? { ...row, title: e.target.value } : row))}/>
                          <input placeholder="₹ amount" type="number" className="w-28 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={m.amount} onChange={(e) => setMilestoneRows(milestoneRows.map((row, idx) => idx === i ? { ...row, amount: e.target.value } : row))}/>
                          {milestoneRows.length > 1 && (
                            <button type="button" onClick={() => setMilestoneRows(milestoneRows.filter((_, idx) => idx !== i))} className="text-red-500 px-2"><X size={14}/></button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setMilestoneRows([...milestoneRows, { title: "", amount: "" }])} className="text-xs text-primary font-medium mt-2 hover:underline">
                      + Add milestone
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">New gigs need admin approval before they appear in the public Marketplace — this matches your platform's Module 9 workflow.</p>
                  <button disabled={posting} className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
                    {posting ? "Posting…" : "Submit gig"}
                  </button>
                </form>
              )}

              {loadingGigs ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : myGigs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No gigs yet.</p>
              ) : (
                <div className="space-y-3">
                  {myGigs.map((g) => (<div key={g._id} className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">
                              {g.title}
                            </h3>
                            <span className={`${pill} ${g.approvalStatus === "pending" ? "bg-amber-100 text-amber-700" : g.status === "in_progress" ? "bg-blue-100 text-blue-700" : g.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-secondary-foreground"}`}>
                              {g.approvalStatus === "pending" ? "Pending approval" : g.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            ₹{g.budgetMin}–₹{g.budgetMax} · {g.budgetType}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {(g.skillsRequired || []).map((s) => (<span key={s} className={`${pill} bg-secondary text-secondary-foreground`}>
                                {s}
                              </span>))}
                          </div>
                          {/* Render custom milestones if present */}
                          {(g.milestones || []).length > 0 ? (
                            <div className="mt-4 space-y-3 border-t border-border pt-3">
                              {g.milestones.map((m) => {
                                  const pay = payments.find((p) => String(p.milestoneId || "") === String(m._id) && String(p.gig?._id || p.gig) === String(g._id));
                                  return (<div key={m._id || m.title}>
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium text-foreground">{m.title} <span className="text-muted-foreground font-normal">· ₹{m.amount}</span></p>
                                        <span className="text-xs text-muted-foreground font-mono">{m.progressPercent || 0}%</span>
                                      </div>
                                      <div className="w-full bg-muted rounded-full h-2 mb-1.5">
                                        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${m.progressPercent || 0}%` }}/>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`${pill} bg-secondary text-secondary-foreground text-xs`}>{m.status ? m.status.replace("_", " ") : "pending"}</span>
                                        {!pay && g.status !== "completed" && g.status !== "cancelled" && (
                                          <button onClick={() => handleFundMilestone(g._id, m)} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-primary/90">Fund escrow (₹{m.amount})</button>
                                        )}
                                        {pay?.status === "escrow_held" && (
                                          <button onClick={() => handleReleasePayment(pay._id)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-700">Release payment</button>
                                        )}
                                        {pay?.status === "released" && (
                                          <span className="text-xs text-emerald-700 font-medium">Paid ✓</span>
                                        )}
                                      </div>
                                    </div>);
                              })}
                            </div>
                          ) : (
                            /* Fallback for gigs without custom milestones */
                            g.status !== "completed" && g.status !== "cancelled" && (() => {
                              const pay = payments.find((p) => String(p.gig?._id || p.gig) === String(g._id));
                              const amount = g.budgetMax || g.budgetMin || 10000;
                              return (
                                <div className="mt-4 border-t border-border pt-3 flex items-center justify-between">
                                  <span className="text-sm font-medium text-foreground">Project Escrow & Payment (₹{amount})</span>
                                  <div>
                                    {!pay && (
                                      <button onClick={() => handleFundMilestone(g._id, { _id: undefined, amount })} className="text-xs bg-primary text-primary-foreground px-3.5 py-1.5 rounded-lg font-medium hover:bg-primary/90">Fund escrow (₹{amount})</button>
                                    )}
                                    {pay?.status === "escrow_held" && (
                                      <button onClick={() => handleReleasePayment(pay._id)} className="text-xs bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg font-medium hover:bg-emerald-700">Release payment</button>
                                    )}
                                    {pay?.status === "released" && (
                                      <span className="text-xs text-emerald-700 font-medium">Paid ✓</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-foreground font-mono">
                            {g.proposalsCount || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">proposals</p>
                          {g.status === "in_progress" && (
                            <button onClick={() => handleMarkCompleted(g._id)} className="text-xs text-emerald-700 font-medium hover:underline mt-1 block">
                              Mark completed
                            </button>
                          )}
                          {g.status === "completed" && (
                            <button onClick={() => setReviewGig(g)} className="text-xs text-primary font-medium hover:underline mt-1 block">
                              Leave review
                            </button>
                          )}
                          <button onClick={() => { setActiveSection("proposals"); loadProposals(g._id); }} className="text-xs text-primary font-medium hover:underline mt-1 block">
                            View
                          </button>
                          {g.approvalStatus === "approved" && (
                            <button onClick={() => { setActiveSection("matches"); loadMatches(g._id); }} className="text-xs text-purple-600 font-medium hover:underline mt-1 flex items-center gap-1 justify-end">
                              <Sparkles size={11}/> Matches
                            </button>
                          )}
                          {(g.status === "in_progress" || g.status === "completed") && (
                            <button onClick={() => setDisputeGig(g)} className="text-xs text-red-600 font-medium hover:underline mt-1 flex items-center gap-1 justify-end">
                              <AlertTriangle size={11}/> Raise dispute
                            </button>
                          )}
                        </div>
                      </div>
                    </div>))}
                </div>
              )}
            </>)}

          {activeSection === "matches" && (<>
              <SectionHeader title="AI Match Recommendations" sub="Skill-similarity ranked freelancers for a selected gig"/>
              {!selectedMatchGigId ? (
                <div className="bg-card border border-border rounded-xl p-5">
                  <p className="text-sm text-muted-foreground mb-3">Pick an approved gig to see recommended freelancers:</p>
                  <div className="space-y-2">
                    {myGigs.filter((g) => g.approvalStatus === "approved").map((g) => (
                      <button key={g._id} onClick={() => loadMatches(g._id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm font-medium text-foreground">
                        {g.title}
                      </button>
                    ))}
                    {myGigs.filter((g) => g.approvalStatus === "approved").length === 0 && (
                      <p className="text-xs text-muted-foreground">No approved gigs yet — post a gig and get it approved first.</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <button onClick={() => setSelectedMatchGigId(null)} className="text-xs text-primary font-medium hover:underline mb-4 inline-block">← Choose a different gig</button>
                  <p className="text-xs text-muted-foreground mb-4">Ranked by skill overlap, proficiency, and freelancer reputation — a rule-based similarity algorithm, not a live external ML call.</p>
                  {loadingMatches ? (
                    <p className="text-sm text-muted-foreground">Computing matches…</p>
                  ) : matches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No matching freelancers found yet — try widening the gig's required skills, or wait for more freelancers to register.</p>
                  ) : (
                    <div className="space-y-3">
                      {matches.map((m) => (<div key={m.freelancer._id} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                          <Avatar initials={(m.freelancer.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()} color="#7C3AED"/>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground text-sm">{m.freelancer.name}</p>
                            <p className="text-xs text-muted-foreground">{m.freelancer.title || "Freelancer"} · {m.freelancer.location?.city || "Remote"}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {(m.freelancer.skills || []).slice(0, 5).map((s) => (<span key={s.name} className={`${pill} bg-secondary text-secondary-foreground`}>{s.name}</span>))}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-purple-600 font-mono">{m.finalScore}%</p>
                            <p className="text-[10px] text-muted-foreground">match score</p>
                          </div>
                        </div>))}
                    </div>
                  )}
                </>
              )}
            </>)}

          {activeSection === "disputes" && (<>
              <SectionHeader title="My Disputes" sub={loadingDisputes ? "Loading…" : `${myDisputes.length} total`}/>
              {!loadingDisputes && myDisputes.length === 0 && (
                <p className="text-sm text-muted-foreground">No disputes raised — good sign. You can raise one from an in-progress or completed gig in "My Gigs" if something goes wrong.</p>
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

          {activeSection === "proposals" && (<>
              <SectionHeader title="Proposals" sub="Review and respond to freelancer proposals"/>
              {!selectedGigId ? (
                <div className="bg-card border border-border rounded-xl p-5">
                  <p className="text-sm text-muted-foreground mb-3">Pick a gig to view its proposals:</p>
                  <div className="space-y-2">
                    {myGigs.map((g) => (
                      <button key={g._id} onClick={() => loadProposals(g._id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm font-medium text-foreground">
                        {g.title} <span className="text-xs text-muted-foreground">({g.proposalsCount || 0} proposals)</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <button onClick={() => setSelectedGigId(null)} className="text-xs text-primary font-medium hover:underline mb-4 inline-block">← Choose a different gig</button>
                  {loadingProposals ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : gigProposals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No proposals for this gig yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {gigProposals.map((p) => (<div key={p._id} className="bg-card border border-border rounded-xl p-5">
                          <div className="flex items-start gap-4">
                            <Avatar initials={(p.freelancer?.name || "?").slice(0, 2).toUpperCase()} color="#1D4ED8"/>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="font-semibold text-foreground">
                                  {p.freelancer?.name}
                                </p>
                                <StatusBadge status={p.status}/>
                                <span className="ml-auto font-mono text-primary font-bold text-sm">
                                  {p.matchScore}% match
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">
                                Bid: <span className="font-semibold text-foreground">₹{p.bidAmount}</span> · Timeline: {p.estimatedDays} days
                              </p>
                              <p className="text-sm text-foreground mb-3">{p.coverLetter}</p>
                              {(p.status === "submitted" || p.status === "under_review" || p.status === "pending") && (
                                <div className="flex gap-2">
                                  <button onClick={() => handleAccept(p._id)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1">
                                    <CheckCircle size={12}/> Accept
                                  </button>
                                  <button onClick={() => handleReject(p._id)} className="text-xs border border-border text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors flex items-center gap-1">
                                    <X size={12}/> Reject
                                  </button>
                                </div>
                              )}
                              {p.status === "accepted" && (
                                <button onClick={() => onOpenChat({ otherUserId: p.freelancer?._id, otherUserName: p.freelancer?.name, gigId: selectedGigId, gigTitle: myGigs.find((g) => g._id === selectedGigId)?.title })} className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
                                  <MessageSquare size={12}/> Message
                                </button>
                              )}
                            </div>
                          </div>
                        </div>))}
                    </div>
                  )}
                </>
              )}
            </>)}

          {activeSection === "payments" && (<>
              <SectionHeader title="Payments & Escrow" sub={loadingPayments ? "Loading…" : "Real transactions from your database"}/>
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <StatCard label="In Escrow" value={`₹${payments.filter((p) => p.status === "escrow_held").reduce((s, p) => s + p.amount, 0).toLocaleString()}`} sub={`${payments.filter((p) => p.status === "escrow_held").length} active`} icon={Lock} color="#1D4ED8"/>
                <StatCard label="Released" value={`₹${payments.filter((p) => p.status === "released").reduce((s, p) => s + p.amount, 0).toLocaleString()}`} sub="Total released" icon={CheckCircle} color="#059669"/>
                <StatCard label="Refunded" value={`₹${payments.filter((p) => p.status === "refunded").reduce((s, p) => s + p.amount, 0).toLocaleString()}`} sub={`${payments.filter((p) => p.status === "refunded").length} refunds`} icon={Clock} color="#D97706"/>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Razorpay isn't configured with live keys, so "Fund escrow" simulates an instant escrow hold for testing — the same code path runs when real keys are added.</p>
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-4">
                  Transaction History
                </h3>
                {payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transactions yet — fund a milestone from "My Gigs" to see one here.</p>
                ) : (
                  <div className="space-y-2">
                    {payments.map((t) => (<div key={t._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                        <div className={`w-2 h-2 rounded-full ${t.status === "released" ? "bg-emerald-500" : t.status === "escrow_held" ? "bg-blue-500" : t.status === "refunded" ? "bg-amber-500" : "bg-gray-400"}`}/>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {t.freelancer?.name} · {t.gig?.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(t.createdAt).toLocaleDateString()} · {t.status.replace("_", " ")}
                          </p>
                        </div>
                        <p className={`font-mono font-semibold text-sm ${t.status === "released" ? "text-emerald-700" : "text-foreground"}`}>
                          ₹{t.amount.toLocaleString()}
                        </p>
                      </div>))}
                  </div>
                )}
              </div>
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
