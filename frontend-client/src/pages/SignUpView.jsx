import { useState } from "react";
import { ArrowRight, Award, Bot, Briefcase, CheckCircle, ChevronLeft, Eye, EyeOff, Key, Lock, Mail, MessageSquare, RotateCcw, Shield, Smartphone, Sparkles, UserPlus, Users, Zap } from "lucide-react";
import { pill } from "../utils/constants";
import { authApi } from "../lib/api";

export default 
function SignUpView({ setView, onAuthSuccess, }) {
    const [role, setRole] = useState(null);
    const [step, setStep] = useState("role");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
    const [manualEntryKey, setManualEntryKey] = useState("");
    const [twoFaCode, setTwoFaCode] = useState(["", "", "", "", "", ""]);
    const [twoFaError, setTwoFaError] = useState("");
    const [confirming2fa, setConfirming2fa] = useState(false);

    async function handleDetails(e) {
        e.preventDefault();
        setFormError("");
        setLoading(true);
        try {
            await authApi.register({
                name: `${firstName} ${lastName}`.trim(),
                email: signupEmail,
                password: signupPassword,
                role,
            });
            // Auto-login right after registration (email verification isn't required to sign in)
            await authApi.login({ email: signupEmail, password: signupPassword });
            // Generate a real TOTP secret + QR code for this account
            const setup = await authApi.setup2FA();
            setQrCodeDataUrl(setup.qrCodeDataUrl);
            setManualEntryKey(setup.manualEntryKey);
            setStep("verify2fa");
        } catch (err) {
            setFormError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    }
    function handle2faChange(i, val) {
        if (!/^\d?$/.test(val)) return;
        const next = [...twoFaCode];
        next[i] = val;
        setTwoFaCode(next);
        setTwoFaError("");
        if (val && i < 5) document.getElementById(`signup-2fa-${i + 1}`)?.focus();
    }
    function handle2faKey(i, e) {
        if (e.key === "Backspace" && !twoFaCode[i] && i > 0) document.getElementById(`signup-2fa-${i - 1}`)?.focus();
    }
    async function handleConfirm2FA() {
        setConfirming2fa(true);
        setTwoFaError("");
        try {
            await authApi.confirm2FA(twoFaCode.join(""));
            await finishSignup();
        } catch (err) {
            setTwoFaError(err.message || "Invalid code — check your authenticator app and try again");
        } finally {
            setConfirming2fa(false);
        }
    }
    async function finishSignup() {
        const me = await authApi.me();
        onAuthSuccess(me.user);
    }
    return (<div className="min-h-[calc(100vh-64px)] flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#1D4ED8] p-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5"/>
        <div className="absolute bottom-10 -left-16 w-64 h-64 rounded-full bg-cyan-400/10"/>
        <div className="flex items-center gap-2.5 relative">
          <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
            <Sparkles size={18} className="text-white"/>
          </div>
          <span className="font-extrabold text-white text-xl">
            SkillSphere
          </span>
        </div>
        <div className="relative">
          <div className={`${pill} bg-white/15 text-cyan-300 mb-6`}>
            <Zap size={11}/> Free to join — always
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            {role === "client"
            ? "Find the right talent,\nright in your city."
            : role === "freelancer"
                ? "Build your career\non your own terms."
                : "Join 15,000+\nprofessionals today."}
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">
            {role === "client"
            ? "Post gigs, define milestones, and hire verified local freelancers with AI-matched recommendations."
            : "Create your profile, showcase your portfolio, and start receiving AI-matched gig recommendations instantly."}
          </p>
          <div className="space-y-3">
            {[
            { icon: Bot, text: "AI-powered job matching" },
            { icon: Shield, text: "Escrow-secured payments" },
            {
                icon: Award,
                text: "Verified reputation system",
            },
            {
                icon: MessageSquare,
                text: "Real-time chat & collaboration",
            },
        ].map(({ icon: Icon, text }) => (<div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={13} className="text-cyan-300"/>
                </div>
                <p className="text-sm text-blue-100">{text}</p>
              </div>))}
          </div>
        </div>
        <p className="text-blue-400 text-xs relative">
          © 2026 Nayoda · SkillSphere
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          {step === "role" && (<>
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-foreground mb-1">
                  Create your account
                </h1>
                <p className="text-sm text-muted-foreground">
                  Choose how you'll use SkillSphere
                </p>
              </div>

              {/* Google OAuth */}
              <button type="button" onClick={() => window.location.href = authApi.googleLoginUrl()} className="w-full flex items-center justify-center gap-3 border border-border bg-card hover:bg-muted rounded-xl py-3 px-4 text-sm font-semibold text-foreground transition-colors shadow-sm mb-6 group">
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Continue with Google
                <ArrowRight size={14} className="ml-auto text-muted-foreground group-hover:translate-x-0.5 transition-transform"/>
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-border"/>
                <span className="text-xs text-muted-foreground font-medium">
                  or create with email
                </span>
                <div className="flex-1 h-px bg-border"/>
              </div>

              <p className="text-sm font-semibold text-foreground mb-3">
                I want to join as…
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                {
                    id: "freelancer",
                    icon: Users,
                    title: "Freelancer",
                    desc: "Find gigs, build portfolio, earn money",
                },
                {
                    id: "client",
                    icon: Briefcase,
                    title: "Client",
                    desc: "Hire talent, post projects, grow faster",
                },
            ].map(({ id, icon: Icon, title, desc }) => (<button key={id} onClick={() => setRole(id)} className={`p-4 rounded-xl border-2 text-left transition-all ${role === id
                    ? "border-primary bg-secondary"
                    : "border-border bg-card hover:border-blue-300"}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${role === id ? "bg-primary" : "bg-muted"}`}>
                      <Icon size={18} className={role === id
                    ? "text-white"
                    : "text-muted-foreground"}/>
                    </div>
                    <p className={`font-bold text-sm ${role === id ? "text-primary" : "text-foreground"}`}>
                      {title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {desc}
                    </p>
                  </button>))}
              </div>

              <button disabled={!role} onClick={() => setStep("details")} className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                Continue as{" "}
                {role
                ? role.charAt(0).toUpperCase() + role.slice(1)
                : "…"}
                <ArrowRight size={15}/>
              </button>

              <p className="text-sm text-center text-muted-foreground mt-6">
                Already have an account?{" "}
                <button onClick={() => setView("signin")} className="text-primary font-semibold hover:underline">
                  Sign in
                </button>
              </p>
            </>)}

          {step === "details" && (<>
              <button onClick={() => setStep("role")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
                <ChevronLeft size={15}/> Back
              </button>
              <div className="mb-6">
                <div className={`${pill} mb-3 ${role === "freelancer" ? "bg-secondary text-primary" : "bg-amber-100 text-amber-700"}`}>
                  {role === "freelancer" ? (<Users size={11}/>) : (<Briefcase size={11}/>)}
                  Signing up as {role}
                </div>
                <h1 className="text-2xl font-extrabold text-foreground mb-1">
                  Your details
                </h1>
                <p className="text-sm text-muted-foreground">
                  We'll also set up 2FA to keep your account
                  secure.
                </p>
              </div>

              <form onSubmit={handleDetails} className="space-y-4">
                {formError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">First name</label>
                    <input required type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Priya" className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"/>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Last name</label>
                    <input required type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Sharma" className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Email address
                  </label>
                  <div className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Mail size={15} className="text-muted-foreground flex-shrink-0"/>
                    <input required type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="you@example.com" className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground text-foreground"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Phone number
                  </label>
                  <div className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <span className="text-sm text-muted-foreground font-medium flex-shrink-0">
                      +91
                    </span>
                    <div className="w-px h-4 bg-border"/>
                    <input required type="tel" placeholder="98765 43210" className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground text-foreground font-mono"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Password
                  </label>
                  <div className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Lock size={15} className="text-muted-foreground flex-shrink-0"/>
                    <input required type={showPw ? "text" : "password"} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Min 8 characters" className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground text-foreground"/>
                    <button type="button" onClick={() => setShowPw(!showPw)} className="text-muted-foreground hover:text-foreground">
                      {showPw ? (<EyeOff size={15}/>) : (<Eye size={15}/>)}
                    </button>
                  </div>
                </div>

                {/* 2FA opt-in */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone size={15} className="text-primary"/>
                    <p className="text-sm font-semibold text-primary">
                      Enable Two-Factor Authentication
                    </p>
                    <span className={`${pill} bg-primary text-white text-[10px] ml-auto`}>
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 mb-3">
                    Protect your account with an extra layer of
                    security. We'll guide you through setup
                    after registration.
                  </p>
                  <div className="flex gap-2">
                    {[
                {
                    id: "app",
                    label: "Authenticator App",
                    icon: Key,
                },
                {
                    id: "sms",
                    label: "SMS",
                    icon: Smartphone,
                },
            ].map(({ id, label, icon: Icon }) => (<label key={id} className="flex items-center gap-2 flex-1 cursor-pointer bg-white border border-blue-200 rounded-lg px-3 py-2">
                        <input type="radio" name="2fa-method" defaultChecked={id === "app"} className="accent-primary"/>
                        <Icon size={13} className="text-primary"/>
                        <span className="text-xs font-medium text-foreground">
                          {label}
                        </span>
                      </label>))}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input required type="checkbox" id="terms" className="w-4 h-4 mt-0.5 accent-primary"/>
                  <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                    I agree to SkillSphere's{" "}
                    <a href="#" className="text-primary hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </label>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? (<>
                      <RotateCcw size={15} className="animate-spin"/>{" "}
                      Creating account…
                    </>) : (<>
                      <UserPlus size={15}/> Create Account &
                      Setup 2FA
                    </>)}
                </button>
              </form>
            </>)}

          {step === "verify2fa" && (<>
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone size={28} className="text-emerald-600"/>
              </div>
              <h1 className="text-2xl font-extrabold text-foreground mb-1">
                Set up 2FA
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.),
                then enter the 6-digit code to confirm setup.
              </p>

              {twoFaError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{twoFaError}</p>}

              {/* Real QR code from backend TOTP secret */}
              <div className="flex justify-center mb-6">
                <div className="border-2 border-primary rounded-xl p-3 bg-white inline-block">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="2FA QR code" className="w-36 h-36"/>
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center text-xs text-muted-foreground">Loading…</div>
                  )}
                </div>
              </div>

              <div className="bg-muted rounded-xl px-4 py-3 mb-6 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Or enter this setup key manually:
                </p>
                <p className="font-mono text-sm font-bold text-foreground tracking-widest break-all">
                  {manualEntryKey || "—"}
                </p>
              </div>

              <div className="flex gap-2 justify-center mb-6">
                {twoFaCode.map((d, i) => (<input key={i} id={`signup-2fa-${i}`} type="text" inputMode="numeric" maxLength={1} value={d} onChange={(e) => handle2faChange(i, e.target.value)} onKeyDown={(e) => handle2faKey(i, e)} className="w-12 h-14 text-center text-xl font-bold font-mono rounded-xl border border-border bg-card outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"/>))}
              </div>

              <button onClick={handleConfirm2FA} disabled={confirming2fa || twoFaCode.some((d) => !d)} className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <CheckCircle size={15}/> {confirming2fa ? "Verifying…" : "Confirm & Finish Setup"}
              </button>

              <button onClick={finishSignup} className="w-full text-sm text-muted-foreground hover:text-foreground py-3 transition-colors mt-2">
                Skip for now — set up later
              </button>
            </>)}
        </div>
      </div>
    </div>);
}
