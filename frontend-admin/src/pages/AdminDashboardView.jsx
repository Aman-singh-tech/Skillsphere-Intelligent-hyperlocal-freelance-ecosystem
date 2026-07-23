import { useState, useEffect } from "react";
import { Shield, TrendingUp, Users, Briefcase, CheckCircle, BarChart2, AlertTriangle, Package, CircleCheck } from "lucide-react";
import { pill } from "../utils/constants";
import { adminApi } from "../lib/api";
import StatCard from "../components/StatCard";
import SectionHeader from "../components/SectionHeader";
import StatusBadge from "../components/StatusBadge";
import UrgencyDot from "../components/UrgencyDot";

export default 
function AdminDashboardView() {
    const [activeSection, setActiveSection] = useState("analytics");
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [pendingGigs, setPendingGigs] = useState([]);
    const [loadingGigs, setLoadingGigs] = useState(true);
    const [disputes, setDisputes] = useState([]);
    const [loadingDisputes, setLoadingDisputes] = useState(true);

    function loadAnalytics() {
        adminApi.analytics().then((d) => setAnalytics(d.analytics)).catch(() => setAnalytics(null));
    }
    function loadUsers() {
        setLoadingUsers(true);
        adminApi.users().then((d) => setUsers(d.users || [])).catch(() => setUsers([])).finally(() => setLoadingUsers(false));
    }
    function loadPendingGigs() {
        setLoadingGigs(true);
        adminApi.pendingGigs().then((d) => setPendingGigs(d.gigs || [])).catch(() => setPendingGigs([])).finally(() => setLoadingGigs(false));
    }
    function loadDisputes() {
        setLoadingDisputes(true);
        adminApi.disputes().then((d) => setDisputes(d.disputes || [])).catch(() => setDisputes([])).finally(() => setLoadingDisputes(false));
    }

    useEffect(() => {
        loadAnalytics();
        loadUsers();
        loadPendingGigs();
        loadDisputes();
    }, []);

    async function handleSuspend(id) {
        await adminApi.suspendUser(id, "Suspended by admin");
        loadUsers();
    }
    async function handleReinstate(id) {
        await adminApi.reinstateUser(id);
        loadUsers();
    }
    async function handleVerify(id) {
        await adminApi.verifyFreelancer(id, "verified");
        loadUsers();
    }
    async function handleApproveGig(id) {
        await adminApi.approveGig(id);
        loadPendingGigs();
        loadAnalytics();
    }
    async function handleRejectGig(id) {
        await adminApi.rejectGig(id, "Rejected by admin");
        loadPendingGigs();
    }
    async function handleResolveDispute(id, resolution) {
        await adminApi.resolveDispute(id, resolution, "Resolved via admin panel");
        loadDisputes();
    }

    const navItems = [
        { id: "analytics", label: "Analytics", icon: BarChart2 },
        { id: "users", label: "Users", icon: Users },
        { id: "gigs", label: "Gigs", icon: Package },
        { id: "disputes", label: "Disputes", icon: AlertTriangle },
    ];
    return (<div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-[#0F172A] border-r border-sidebar-border flex-shrink-0">
        <div className="p-5 border-b border-sidebar-border flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield size={15} className="text-white"/>
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              SkillSphere
            </p>
            <p className="text-[10px] text-slate-400">
              Admin Panel
            </p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (<button key={id} onClick={() => setActiveSection(id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === id
                ? "bg-primary text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
              <Icon size={15}/>
              {label}
              {id === "gigs" && pendingGigs.length > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingGigs.length}</span>
              )}
            </button>))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl">
          {activeSection === "analytics" && (<>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Platform Analytics
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Live counts from your database
                  </p>
                </div>
                <span className={`${pill} bg-emerald-100 text-emerald-700 font-mono`}>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>{" "}
                  Live
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Users" value={analytics?.totalUsers ?? "…"} sub={`${analytics?.totalFreelancers ?? 0} freelancers · ${analytics?.totalClients ?? 0} clients`} icon={Users} color="#1D4ED8"/>
                <StatCard label="Active Gigs" value={analytics?.activeGigs ?? "…"} sub="Open or in progress" icon={Briefcase} color="#7C3AED"/>
                <StatCard label="Completed Gigs" value={analytics?.completedGigs ?? "…"} sub="All time" icon={CircleCheck} color="#D97706"/>
                <StatCard label="Job Success Rate" value={`${analytics?.jobSuccessRate ?? 0}%`} sub="Completed / total gigs" icon={TrendingUp} color="#059669"/>
              </div>

              <div className="grid lg:grid-cols-2 gap-5">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-1">
                    Platform Revenue
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">From released payments</p>
                  <p className="text-3xl font-bold text-emerald-700 font-mono">₹{(analytics?.platformRevenue ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total payouts to freelancers: ₹{(analytics?.totalPayouts ?? 0).toLocaleString()}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-4">
                    Top Categories
                  </h3>
                  {(!analytics?.topCategories || analytics.topCategories.length === 0) ? (
                    <p className="text-xs text-muted-foreground">No gig category data yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {analytics.topCategories.map((c) => (<div key={c._id || "uncategorized"} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground flex-1">{c._id || "Uncategorized"}</span>
                          <span className="text-xs font-mono font-semibold text-foreground">{c.count}</span>
                        </div>))}
                    </div>
                  )}
                </div>
              </div>
            </>)}

          {activeSection === "users" && (<>
              <div className="flex items-center justify-between mb-6">
                <SectionHeader title="User Management" sub={loadingUsers ? "Loading…" : `${users.length} total users`}/>
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Joined</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Verification</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u) => (<tr key={u._id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{u.name}<br/><span className="text-xs text-muted-foreground font-normal">{u.email}</span></td>
                        <td className="px-4 py-3">
                          <span className={`${pill} ${u.role === "freelancer" ? "bg-secondary text-secondary-foreground" : u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={u.isSuspended ? "suspended" : "active"}/>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {u.role === "freelancer" ? (u.freelancerProfile?.verificationBadge || "unverified") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {u.role === "freelancer" && u.freelancerProfile?.verificationBadge !== "verified" && (
                              <button onClick={() => handleVerify(u._id)} className="text-[11px] px-2 py-1 rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors">
                                Verify
                              </button>
                            )}
                            {u.isSuspended ? (
                              <button onClick={() => handleReinstate(u._id)} className="text-[11px] px-2 py-1 rounded border border-border hover:bg-muted transition-colors">
                                Reinstate
                              </button>
                            ) : u.role !== "admin" && (
                              <button onClick={() => handleSuspend(u._id)} className="text-[11px] px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>))}
                  </tbody>
                </table>
                {!loadingUsers && users.length === 0 && (
                  <p className="text-sm text-muted-foreground p-4">No users found.</p>
                )}
              </div>
            </>)}

          {activeSection === "gigs" && (<>
              <SectionHeader title="Gig Approval Queue" sub={loadingGigs ? "Loading…" : `${pendingGigs.length} gigs awaiting approval`}/>
              {!loadingGigs && pendingGigs.length === 0 && (
                <p className="text-sm text-muted-foreground">No gigs pending approval right now.</p>
              )}
              <div className="space-y-3">
                {pendingGigs.map((g) => (<div key={g._id} className="bg-card border border-border rounded-xl p-5 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {g.title}
                        </h3>
                        <UrgencyDot urgency={g.urgency}/>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {g.client?.name} · ₹{g.budgetMin}–₹{g.budgetMax} · Posted {new Date(g.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(g.skillsRequired || []).map((s) => (<span key={s} className={`${pill} bg-secondary text-secondary-foreground`}>
                            {s}
                          </span>))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => handleApproveGig(g._id)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1">
                        <CheckCircle size={11}/> Approve
                      </button>
                      <button onClick={() => handleRejectGig(g._id)} className="text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1">
                        <AlertTriangle size={11}/> Reject
                      </button>
                    </div>
                  </div>))}
              </div>
            </>)}

          {activeSection === "disputes" && (<>
              <SectionHeader title="Dispute Resolution" sub={loadingDisputes ? "Loading…" : `${disputes.length} open disputes`}/>
              {!loadingDisputes && disputes.length === 0 && (
                <p className="text-sm text-muted-foreground">No open disputes — this list populates once freelancers/clients raise one from a gig.</p>
              )}
              <div className="space-y-4">
                {disputes.map((d) => (<div key={d._id} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-muted-foreground">
                            {d._id.slice(-6).toUpperCase()}
                          </span>
                          <StatusBadge status={d.status}/>
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">
                          {d.raisedBy?.name} vs {d.against?.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {d.reason} · Filed: {new Date(d.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleResolveDispute(d._id, "resolved_favor_client")} className="text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-muted flex items-center gap-1">
                          Favor Client
                        </button>
                        <button onClick={() => handleResolveDispute(d._id, "resolved_favor_freelancer")} className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1">
                          Favor Freelancer
                        </button>
                      </div>
                    </div>
                  </div>))}
              </div>
            </>)}
        </div>
      </main>
    </div>);
}

