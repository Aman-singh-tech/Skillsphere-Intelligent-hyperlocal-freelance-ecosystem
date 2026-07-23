import { useState } from "react";
import { Lock, Eye, EyeOff, RotateCcw, Shield, Sparkles } from "lucide-react";
import { authApi } from "../lib/api";
import { pill } from "../utils/constants";

export default function ResetPasswordView({ token, setView }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to reset password. Link may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#1D4ED8] p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute bottom-10 -left-16 w-64 h-64 rounded-full bg-cyan-400/10" />

        <div className="flex items-center gap-2.5 relative">
          <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-extrabold text-white text-xl">SkillSphere</span>
        </div>

        <div className="relative">
          <div className={`${pill} bg-white/15 text-cyan-300 mb-6`}>
            <Shield size={11} /> Secure · Verified · Trusted
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            Reset Your Password
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">
            Create a new, strong password to secure your account and get back to work.
          </p>
        </div>

        <p className="text-blue-400 text-xs relative">© 2026 Nayoda · SkillSphere</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-foreground mb-1">
              Create New Password
            </h1>
            <p className="text-sm text-muted-foreground">
              Please enter your new password below.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          {success ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <Shield size={32} />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Password Reset Successful!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Your password has been securely updated. You can now sign in with your new password.
              </p>
              <button
                onClick={() => {
                  window.history.replaceState({}, document.title, "/");
                  setView("signin");
                }}
                className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  New Password
                </label>
                <div className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <Lock size={15} className="text-muted-foreground flex-shrink-0" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Confirm Password
                </label>
                <div className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <Lock size={15} className="text-muted-foreground flex-shrink-0" />
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 mt-6"
              >
                {loading ? (
                  <>
                    <RotateCcw size={15} className="animate-spin" /> Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
              
              <div className="mt-4 text-center">
                <button 
                  type="button" 
                  onClick={() => {
                    window.history.replaceState({}, document.title, "/");
                    setView("signin");
                  }} 
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
