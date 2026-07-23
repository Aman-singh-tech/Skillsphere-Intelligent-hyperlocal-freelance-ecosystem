import { useState } from "react";
import {
  Sparkles,
  Search,
  MapPin,
  Zap,
  ArrowRight,
  Briefcase,
  UserPlus,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { pill } from "../utils/constants";
import { freelancers, gigs, features, categories } from "../utils/mockData";
import FreelancerCard from "../components/FreelancerCard";
import GigCard from "../components/GigCard";

export default function LandingView({ setView }) {
  const [activeTab, setActiveTab] = useState("freelancers");
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#1D4ED8] text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&h=700&fit=crop&auto=format)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className={`${pill} bg-white/15 text-white mb-6`}>
              <Sparkles size={12} />
              AI-Powered Hyperlocal Freelance Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Connect with the Best
              <br />
              <span className="text-cyan-300">Local Freelancers</span>
              <br />
              Near You
            </h1>
            <p className="text-lg text-blue-200 mb-10 max-w-xl">
              SkillSphere uses AI to match verified local professionals with clients. Secure escrow payments,
              real-time collaboration, and smart reputation scoring.
            </p>

            {/* Search bar */}
            <div className="bg-white rounded-xl p-2 flex flex-col sm:flex-row gap-2 max-w-2xl shadow-2xl">
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search size={16} className="text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search skills, gigs, or freelancers…"
                  className="flex-1 text-sm text-foreground bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex items-center gap-2 px-3 border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0">
                <MapPin size={14} className="text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Bengaluru, KA"
                  className="w-28 text-sm text-foreground bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </div>
              <button
                onClick={() => setView("marketplace")}
                className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Search size={14} />
                Find Now
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-5">
              {["React Developer", "UI/UX Designer", "Node.js Expert", "ML Engineer", "DevOps"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setView("marketplace")}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full border border-white/20 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { label: "Verified Freelancers", value: "12,400+" },
              { label: "Gigs Completed", value: "89,200+" },
              { label: "Cities Covered", value: "340+" },
              { label: "Platform Revenue", value: "₹42Cr+" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-white font-mono">{s.value}</p>
                <p className="text-xs text-blue-300 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <div className={`${pill} bg-secondary text-primary mx-auto mb-4`}>
            <Zap size={12} /> 15 Advanced Modules
          </div>
          <h2 className="text-3xl font-extrabold text-foreground">Everything a Freelance Platform Needs</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm">
            Built with MERN stack, AI matching, real-time collaboration, and secure payments — production-ready
            from day one.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow group">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon size={22} style={{ color }} />
              </div>
              <h3 className="font-bold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Browse Tabs */}
      <section className="bg-muted py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-extrabold text-foreground">Browse the Platform</h2>
            <div className="flex rounded-lg overflow-hidden border border-border bg-card">
              {["freelancers", "gigs"].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    activeTab === t ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {activeTab === "freelancers" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {freelancers.slice(0, 3).map((f) => (
                <FreelancerCard key={f.id} f={f} />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gigs.slice(0, 3).map((g) => (
                <GigCard key={g.id} g={g} />
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <button
              onClick={() => setView("marketplace")}
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All {activeTab === "freelancers" ? "Freelancers" : "Gigs"}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold text-foreground">Popular Categories</h2>
          <p className="text-muted-foreground text-sm mt-2">Find talent across every discipline</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((c) => (
            <button
              key={c.name}
              onClick={() => setView("marketplace")}
              className="group rounded-xl p-5 border text-left hover:shadow-md transition-all duration-200"
              style={{ backgroundColor: c.color, borderColor: c.border }}
            >
              <div className="text-3xl mb-3">{c.icon}</div>
              <p className="font-semibold text-foreground text-sm">{c.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{c.count}</p>
            </button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-extrabold">How SkillSphere Works</h2>
            <p className="text-blue-300 text-sm mt-2">Simple. Fast. Secure.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Post a Gig or Search",
                desc: "Clients post projects with budgets and milestones. Freelancers search and apply using the AI-matched feed.",
                icon: Search,
              },
              {
                step: "02",
                title: "Match & Collaborate",
                desc: "AI recommends the best local freelancers. Chat in real-time, share files, and negotiate proposals directly.",
                icon: MessageSquare,
              },
              {
                step: "03",
                title: "Pay Securely",
                desc: "Escrow holds funds. Approve milestones to release payments automatically. Dispute system for any issues.",
                icon: CreditCard,
              },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="relative flex flex-col items-start">
                <div className="font-mono text-5xl font-extrabold text-white/10 mb-2">{step}</div>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={22} className="text-cyan-300" />
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm text-blue-200 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-3xl font-extrabold text-foreground mb-4">Ready to Join SkillSphere?</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm">
          Whether you're a client looking for talent or a freelancer building your career — we have the tools for
          you.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setView("client")}
            className="bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Briefcase size={16} /> I'm Hiring
          </button>
          <button
            onClick={() => setView("freelancer")}
            className="border border-primary text-primary font-semibold px-6 py-3 rounded-lg hover:bg-secondary transition-colors flex items-center gap-2"
          >
            <UserPlus size={16} /> I'm a Freelancer
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-[#0F172A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                  <Sparkles size={13} className="text-white" />
                </div>
                <span className="font-extrabold">SkillSphere</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Intelligent hyperlocal freelance ecosystem powered by AI.
              </p>
            </div>
            {[
              { title: "Platform", links: ["Browse Gigs", "Find Freelancers", "Post a Project", "Pricing"] },
              { title: "For Freelancers", links: ["Create Profile", "Skill Verification", "Analytics", "Payments"] },
              { title: "Company", links: ["About Nayoda", "Blog", "Careers", "Support"] },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-slate-300 hover:text-white transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">© 2026 Nayoda · SkillSphere. All rights reserved.</p>
            <p className="text-xs text-slate-500">MERN Stack · Socket.IO · JWT · Razorpay</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
