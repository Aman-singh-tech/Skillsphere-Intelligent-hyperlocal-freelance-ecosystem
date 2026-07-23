import { useState } from "react";
import { Star, Shield, CheckCircle, ArrowRight, Eye, LogIn, X, Lock, Sparkles, Mail, Key, Smartphone, RotateCcw, ChevronLeft, Info, EyeOff } from "lucide-react";
import { pill } from "../utils/constants";
import { authApi } from "../lib/api";

export default 
function AdminSignInView({ setView, onAuthSuccess, }) {
    const [step, setStep] = useState("credentials");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [otpError, setOtpError] = useState(false);
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);
    const [method, setMethod] = useState("app");
    async function handleCredentials(e) {
        e.preventDefault();
        setFormError("");
        setLoading(true);
        try {
            const data = await authApi.login({ email, password });
            if (data.twoFactorRequired) {
                setStep("2fa");
                return;
            }
            const me = await authApi.me();
            if (me.user.role !== "admin") {
                setFormError("This account doesn't have admin access.");
                authApi.logout();
                return;
            }
            onAuthSuccess(me.user);
        } catch (err) {
            setFormError(err.message || "Sign in failed");
        } finally {
            setLoading(false);
        }
    }
    function handleOtpChange(i, val) {
        if (!/^\d?$/.test(val))
            return;
        const next = [...otp];
        next[i] = val;
        setOtp(next);
        setOtpError(false);
        if (val && i < 5) {
            const el = document.getElementById(`otp-${i + 1}`);
            el?.focus();
        }
    }
    function handleOtpKey(i, e) {
        if (e.key === "Backspace" && !otp[i] && i > 0) {
            document.getElementById(`otp-${i - 1}`)?.focus();
        }
    }
    async function handleVerify(e) {
        e.preventDefault();
        const code = otp.join("");
        setLoading(true);
        try {
            await authApi.login({ email, password, twoFactorCode: code });
            const me = await authApi.me();
            if (me.user.role !== "admin") {
                setFormError("This account doesn't have admin access.");
                authApi.logout();
                setStep("credentials");
                return;
            }
            onAuthSuccess(me.user);
        } catch (err) {
            setOtpError(true);
        } finally {
            setLoading(false);
        }
    }
    const filled = otp.every((d) => d !== "");
    return (<div className="min-h-[calc(100vh-64px)] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#1D4ED8] p-12 relative overflow-hidden">
        {/* Decorative circles */}
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
            <Shield size={11}/> Secure · Verified · Trusted
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            Your career starts
            <br />
            with one login.
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">
            Join 12,400+ verified freelancers and 3,200+ clients
            on India's most trusted hyperlocal freelance
            platform.
          </p>

          {/* Testimonial card */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/15">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#7C3AED] flex items-center justify-center text-white font-bold text-sm">
                PS
              </div>
              <div>
                <p className="text-white text-sm font-semibold">
                  Priya Sharma
                </p>
                <p className="text-blue-300 text-xs">
                  Full-Stack Developer · Bengaluru
                </p>
              </div>
              <div className="ml-auto flex">
                {[1, 2, 3, 4, 5].map((i) => (<Star key={i} size={12} className="text-amber-400 fill-amber-400"/>))}
              </div>
            </div>
            <p className="text-blue-100 text-xs leading-relaxed">
              "SkillSphere's AI matched me with 3 perfect
              clients in my first week. Earned ₹3.2L in 6 months
              working locally."
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 mt-6">
            {[
            ["₹42Cr+", "Paid out"],
            ["94.2%", "Success rate"],
            ["340+", "Cities"],
        ].map(([val, lbl]) => (<div key={lbl}>
                <p className="text-white font-extrabold font-mono text-lg">
                  {val}
                </p>
                <p className="text-blue-300 text-[11px]">
                  {lbl}
                </p>
              </div>))}
          </div>
        </div>

        <p className="text-blue-400 text-xs relative">
          © 2026 Nayoda · SkillSphere
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          {step === "credentials" && (<>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-foreground mb-1">
                  Welcome back
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sign in to your SkillSphere account
                </p>
              </div>

              {/* Google OAuth button */}
              <button className="w-full flex items-center justify-center gap-3 border border-border bg-card hover:bg-muted rounded-xl py-3 px-4 text-sm font-semibold text-foreground transition-colors shadow-sm mb-4 group">
                {/* Google SVG */}
                <svg width="18" height="18" viewBox="0 0 48 48" className="flex-shrink-0">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Continue with Google
                <ArrowRight size={14} className="ml-auto text-muted-foreground group-hover:translate-x-0.5 transition-transform"/>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border"/>
                <span className="text-xs text-muted-foreground font-medium">
                  or sign in with email
                </span>
                <div className="flex-1 h-px bg-border"/>
              </div>

              {/* Form */}
              <form onSubmit={handleCredentials} className="space-y-4">
                {formError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
                )}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Email address
                  </label>
                  <div className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Mail size={15} className="text-muted-foreground flex-shrink-0"/>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"/>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-foreground">
                      Password
                    </label>
                    <button type="button" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Lock size={15} className="text-muted-foreground flex-shrink-0"/>
                    <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"/>
                    <button type="button" onClick={() => setShowPw(!showPw)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {showPw ? (<EyeOff size={15}/>) : (<Eye size={15}/>)}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" className="w-4 h-4 accent-primary rounded"/>
                  <label htmlFor="remember" className="text-sm text-muted-foreground select-none">
                    Remember me for 30 days
                  </label>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? (<>
                      <RotateCcw size={15} className="animate-spin"/>{" "}
                      Signing in…
                    </>) : (<>
                      <LogIn size={15}/> Sign In
                    </>)}
                </button>
              </form>

              {/* 2FA info notice */}
              <div className="mt-4 flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <Info size={14} className="text-primary flex-shrink-0 mt-0.5"/>
                <p className="text-xs text-blue-700">
                  If two-factor authentication is enabled on your account, you'll be asked for a verification code after signing in.
                </p>
              </div>

              <p className="text-sm text-center text-muted-foreground mt-6">
                Admin access is invite-only. Contact your platform owner if you need an account.
              </p>
            </>)}

          {step === "2fa" && (<>
              {/* Back */}
              <button onClick={() => setStep("credentials")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
                <ChevronLeft size={15}/> Back to sign in
              </button>

              {/* Icon */}
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone size={28} className="text-primary"/>
              </div>

              <h1 className="text-2xl font-extrabold text-foreground mb-1">
                Two-Factor Verification
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                Signed in as{" "}
                <span className="font-semibold text-foreground">
                  {email}
                </span>
                . Enter your 6-digit code to continue.
              </p>

              {/* Method toggle */}
              <div className="flex gap-2 mb-6">
                {["app", "sms"].map((m) => (<button key={m} onClick={() => setMethod(m)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${method === m
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary hover:text-primary"}`}>
                    {m === "app" ? (<>
                        <Key size={14}/> Authenticator App
                      </>) : (<>
                        <Smartphone size={14}/> SMS Code
                      </>)}
                  </button>))}
              </div>

              {method === "app" ? (<div className="bg-muted rounded-xl px-4 py-3 mb-6 flex items-start gap-2.5">
                  <Info size={14} className="text-muted-foreground flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-muted-foreground">
                    Open your authenticator app (Google
                    Authenticator, Authy, or similar) and enter
                    the 6-digit code shown for{" "}
                    <span className="font-semibold text-foreground">
                      SkillSphere
                    </span>
                    .
                    <br />
                    <span className="text-[10px] opacity-70 mt-1 block font-mono">
                      Enter the code from your authenticator app
                    </span>
                  </p>
                </div>) : (<div className="bg-muted rounded-xl px-4 py-3 mb-6 flex items-start gap-2.5">
                  <Smartphone size={14} className="text-muted-foreground flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-muted-foreground">
                    A 6-digit code has been sent to{" "}
                    <span className="font-semibold text-foreground">
                      +91 98765 ••••1
                    </span>
                    . Valid for 5 minutes.
                    <br />
                    <span className="text-[10px] opacity-70 mt-1 block font-mono">
                      Enter the code from your authenticator app
                    </span>
                  </p>
                </div>)}

              <form onSubmit={handleVerify}>
                {/* OTP boxes */}
                <div className="flex gap-2.5 justify-center mb-2">
                  {otp.map((digit, i) => (<input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKey(i, e)} className={`w-12 h-14 text-center text-xl font-bold font-mono rounded-xl border bg-card outline-none transition-all
                        ${otpError ? "border-red-400 bg-red-50 text-red-600" : digit ? "border-primary bg-secondary text-primary" : "border-border text-foreground"}
                        focus:border-primary focus:ring-2 focus:ring-primary/20`}/>))}
                </div>

                {otpError && (<p className="text-center text-xs text-red-600 mb-4 flex items-center justify-center gap-1">
                    <X size={12}/> Incorrect code. Please try
                    again.
                  </p>)}

                {/* Timer */}
                <p className="text-center text-xs text-muted-foreground mb-6">
                  Code expires in{" "}
                  <span className="font-mono font-semibold text-foreground">
                    04:47
                  </span>
                  <button type="button" className="ml-2 text-primary hover:underline flex items-center gap-1 inline-flex">
                    <RotateCcw size={11}/> Resend
                  </button>
                </p>

                <button type="submit" disabled={!filled || loading} className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? (<>
                      <RotateCcw size={15} className="animate-spin"/>{" "}
                      Verifying…
                    </>) : (<>
                      <CheckCircle size={15}/> Verify & Sign In
                    </>)}
                </button>
              </form>

              {/* Recovery link */}
              <p className="text-center text-xs text-muted-foreground mt-5">
                Can't access your authenticator?{" "}
                <button className="text-primary hover:underline font-medium">
                  Use recovery code
                </button>
              </p>

              {/* Security note */}
              <div className="mt-6 flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <Shield size={14} className="text-emerald-600 flex-shrink-0 mt-0.5"/>
                <p className="text-xs text-emerald-700">
                  2FA protects your account even if your
                  password is compromised. Never share this code
                  with anyone.
                </p>
              </div>
            </>)}
        </div>
      </div>
    </div>);
}
// ─── Sign Up View ─────────────────────────────────────────────────────────────

// ─── Main App (Admin panel only) ──────────────────────────────────────────
