import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Shield, Users, UserCheck, UserPlus, Eye, EyeOff, Loader2, Phone,
  KeyRound, CheckCircle2, ArrowRight, Sparkles, ShieldCheck, BarChart3,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;
const REMEMBER_KEY = "setu_login_remember_v1";

// ── Role definitions (logic unchanged from previous file) ──────────────
const ROLES = [
  { id: "admin",         label: "Admin",         icon: Shield,    accent: "#003366" },
  { id: "employee",      label: "Employee",      icon: Users,     accent: "#4F46E5" },
  { id: "existing_user", label: "Existing User", icon: UserCheck, accent: "#0D9488" },
  { id: "new_user",      label: "New User",      icon: UserPlus,  accent: "#EA580C" },
];

const Login = ({ apiClient }) => {
  const navigate = useNavigate();

  // ── Form state ──────────────────────────────────────────────────────
  const [role, setRole] = useState("existing_user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);

  // ── Forgot password state ───────────────────────────────────────────
  const [showForgot, setShowForgot] = useState(false);
  const [forgotMode, setForgotMode] = useState("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMobile, setForgotMobile] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResult, setForgotResult] = useState(null);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);

  // ── Restore remembered identity on mount ────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      if (raw) {
        const r = JSON.parse(raw);
        if (r?.email) setEmail(r.email);
        if (r?.name)  setName(r.name);
        if (r?.mobile) setMobile(r.mobile);
        if (r?.role)  setRole(r.role);
      }
    } catch { /* ignore */ }
  }, []);

  const isSignup = role === "new_user";

  const persistRemember = () => {
    try {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email, name, mobile, role }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch { /* storage may be blocked */ }
  };

  // ── New-user "verify email is unique" step (preserved logic) ────────
  const checkAndSignup = async () => {
    if (!email) { toast.error("Enter your email"); return; }
    setCheckingEmail(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.exists) {
        toast.error("This email already exists. Please sign in or use Forgot Password.");
        setRole("existing_user");
        setEmailChecked(false);
      } else {
        setEmailChecked(true);
      }
    } catch {
      toast.error("Could not verify email");
    }
    setCheckingEmail(false);
  };

  // ── Submit handler (preserved logic) ────────────────────────────────
  const submit = async (e) => {
    e.preventDefault();
    if (isSignup && !emailChecked) { checkAndSignup(); return; }
    if (!email || !password) { setError("Email and password required"); return; }
    setError(""); setLoading(true);
    try {
      if (isSignup) {
        const regRes = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, name: name || email.split("@")[0], mobile }),
        });
        const regData = await regRes.json();
        if (!regRes.ok) { setError(regData.detail || "Registration failed"); setLoading(false); return; }
      }
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, login_role: role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Login failed"); setLoading(false); return; }
      if (data.session_token) localStorage.setItem("session_token", data.session_token);
      if (mobile && data.session_token) {
        fetch(`${API_URL}/api/auth/save-mobile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ mobile }),
        }).catch(() => {});
      }
      persistRemember();
      navigate("/dashboard", { state: { user: data.user } });
    } catch { setError("Connection error"); }
    setLoading(false);
  };

  // ── Google OAuth (preserved) ────────────────────────────────────────
  const google = () => {
    const r = `${window.location.origin}/login#role=${role}`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(r)}`;
  };

  // ── Handle Google OAuth callback (preserved) ────────────────────────
  if (typeof window !== "undefined" && window.location.hash?.includes("session_id=")) {
    const hash = window.location.hash;
    const sessionId = hash.split("session_id=")[1]?.split("&")[0];
    if (sessionId) {
      (async () => {
        try {
          const res = await fetch(`${API_URL}/api/auth/session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ session_id: sessionId }),
          });
          if (res.ok) { window.history.replaceState(null, "", "/login"); navigate("/dashboard"); }
        } catch {}
      })();
    }
  }

  // ── Forgot password handlers (preserved) ────────────────────────────
  const handleForgotSubmit = async () => {
    setForgotLoading(true);
    try {
      const body = forgotMode === "email" ? { email: forgotEmail } : { mobile: forgotMobile };
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || "Not found"); setForgotLoading(false); return; }
      setForgotResult(data.email_found);
      setResetToken(data.reset_token);
    } catch { toast.error("Connection error"); }
    setForgotLoading(false);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setForgotLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || "Reset failed"); setForgotLoading(false); return; }
      setResetDone(true);
      toast.success("Password reset! You can now sign in.");
    } catch { toast.error("Connection error"); }
    setForgotLoading(false);
  };

  const closeForgot = () => {
    setShowForgot(false); setForgotResult(null); setResetToken(""); setNewPassword("");
    setResetDone(false); setForgotEmail(""); setForgotMobile(""); setForgotMode("email");
  };

  const activeRole = ROLES.find((r) => r.id === role);

  // ──────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-white" data-testid="login-page">
      {/* ────────────── LEFT PANE (marketing / branding) ────────────── */}
      <aside className="hidden lg:flex w-1/2 bg-[#EAF4FB] relative overflow-hidden flex-col p-12">
        <div className="flex items-center gap-2 z-10">
          <img src="/setu-logo.svg" alt="SETU" className="h-10 w-auto" />
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-lg z-10">
          <h2 className="text-[40px] font-semibold tracking-tight text-[#0F1B3A] leading-[1.1]">
            Take any company<br/>public — together.
          </h2>
          <p className="mt-5 text-[15px] text-[#3E4B6A] leading-relaxed">
            One workspace for IPO readiness, DRHP drafting, valuations, funding and matchmaking — built for India's mainboard &amp; SME issuers.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              { icon: ShieldCheck, label: "SEBI-aligned compliance &amp; gap analysis" },
              { icon: BarChart3,   label: "Live market analytics &amp; peer benchmarks" },
              { icon: Sparkles,    label: "AI-drafted DRHP and board-ready valuations" },
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-[14px] text-[#3E4B6A]">
                <span className="w-7 h-7 rounded-full bg-white border border-[#CFE3F2] flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-3.5 h-3.5 text-[#1DA1F2]" strokeWidth={2.2} />
                </span>
                <span dangerouslySetInnerHTML={{ __html: f.label }} />
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative shapes (Overflow-style) */}
        <div className="absolute -bottom-24 -right-24 w-[480px] h-[480px] rounded-full bg-[#1DA1F2]/10 blur-3xl pointer-events-none" />
        <div className="absolute top-32 -right-16 w-[260px] h-[260px] rounded-full bg-orange-300/15 blur-3xl pointer-events-none" />
        <div className="absolute top-44 right-24 w-3 h-3 rounded-full bg-[#1DA1F2]/40" />
        <div className="absolute top-72 right-40 w-2 h-2 rounded-full bg-[#1DA1F2]/30" />
        <div className="absolute bottom-44 right-56 w-2 h-2 rounded-full bg-orange-400/50" />
        <div className="absolute bottom-32 left-48 w-2 h-2 rounded-full bg-[#1DA1F2]/30" />

        <p className="text-[11px] text-[#7A88A8] z-10">© {new Date().getFullYear()} IPO Labs AI Private Limited</p>
      </aside>

      {/* ────────────── RIGHT PANE (form) ────────────── */}
      <main className="flex-1 flex flex-col px-6 sm:px-10 lg:px-16 py-10">
        <div className="lg:hidden mb-6 flex items-center gap-2">
          <img src="/setu-logo.svg" alt="SETU" className="h-7 w-auto" />
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <h1 className="text-[28px] font-semibold tracking-tight text-gray-900">Sign in</h1>
            <p className="text-[13px] text-gray-500 mt-1">Choose your role to continue.</p>

            {/* Role selector — 4 pills */}
            <div className="grid grid-cols-2 gap-2 mt-6" data-testid="role-selector">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const active = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setRole(r.id); setError(""); setEmailChecked(false); }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-semibold border transition-all ${
                      active
                        ? "border-[#1DA1F2] bg-[#1DA1F2]/10 text-[#0C7ABF] shadow-sm"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    data-testid={`role-btn-${r.id}`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                    {r.label}
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <form onSubmit={submit} className="mt-6 space-y-3.5" data-testid="login-form">
              {/* Name (signup only, after email verified) */}
              {isSignup && emailChecked && (
                <Field label="Full name">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="h-10 text-sm"
                    data-testid="login-name"
                  />
                </Field>
              )}

              {/* Email */}
              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="h-10 text-sm"
                  disabled={isSignup && emailChecked}
                  data-testid="login-email"
                />
              </Field>

              {/* Mobile */}
              <Field label={isSignup ? "Mobile number" : "Mobile (optional)"}>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="98765 43210"
                    className="h-10 text-sm pl-9"
                    data-testid="login-mobile"
                  />
                </div>
              </Field>

              {/* Password (skip for new-user pre-verify step) */}
              {(!isSignup || emailChecked) && (
                <Field
                  label="Password"
                  trailing={
                    !isSignup && (
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-[11.5px] text-[#1DA1F2] hover:text-[#0C7ABF] font-medium"
                        data-testid="forgot-password-btn"
                      >
                        Forgot password?
                      </button>
                    )
                  }
                >
                  <div className="relative">
                    <Input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isSignup ? "Create password (min 6 chars)" : "••••••••"}
                      className="h-10 text-sm pr-10"
                      data-testid="login-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
              )}

              {/* Remember me */}
              <label className="flex items-center gap-2 mt-1 cursor-pointer select-none" data-testid="remember-me-row">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#1DA1F2] focus:ring-[#1DA1F2]/40"
                  data-testid="remember-me-checkbox"
                />
                <span className="text-[12.5px] text-gray-600">
                  Remember me {isSignup ? "(stores your name & mobile for next visit)" : ""}
                </span>
              </label>

              {error && (
                <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg" data-testid="login-error">
                  {error}
                </div>
              )}

              {/* Verified pill (signup phase 2) */}
              {isSignup && emailChecked && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {email} is available — set a password to finish creating your account.
                </div>
              )}

              {/* Primary submit */}
              <Button
                type="submit"
                disabled={loading || checkingEmail}
                className="w-full h-11 text-sm font-semibold rounded-xl mt-2 text-white shadow-sm hover:shadow-md transition-all"
                style={{ backgroundColor: activeRole?.accent || "#1DA1F2" }}
                data-testid="login-submit"
              >
                {(loading || checkingEmail) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSignup && !emailChecked ? (
                  <>Verify email <ArrowRight className="w-4 h-4 ml-1.5" /></>
                ) : isSignup ? (
                  <>Create account <ArrowRight className="w-4 h-4 ml-1.5" /></>
                ) : (
                  <>Sign in <ArrowRight className="w-4 h-4 ml-1.5" /></>
                )}
              </Button>
            </form>

            {/* OR divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-[11px] text-gray-400 uppercase tracking-wider">or</span></div>
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={google}
              className="w-full h-11 flex items-center justify-center gap-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              data-testid="login-google"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            {/* New-user CTA strip */}
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 flex items-center justify-between" data-testid="signup-cta">
              <div>
                <div className="text-[13px] font-semibold text-gray-900">First time on SETU?</div>
                <div className="text-[11.5px] text-gray-500">Create an account in under a minute.</div>
              </div>
              <Button
                type="button"
                onClick={() => { setRole("new_user"); setEmailChecked(false); setError(""); }}
                className="h-9 px-4 text-[12.5px] font-semibold bg-[#1DA1F2] hover:bg-[#0C7ABF] text-white rounded-lg"
                data-testid="signup-cta-btn"
              >
                Sign up
              </Button>
            </div>
          </div>
        </div>

        {/* Footer legal links */}
        <div className="mt-8 flex items-center justify-center gap-1 text-[11px] text-gray-400" data-testid="login-legal-links">
          <button onClick={() => navigate("/terms-of-use")} className="hover:text-gray-700 transition-colors px-2" data-testid="login-legal-terms">
            Terms &amp; Conditions
          </button>
          <span className="text-gray-300">·</span>
          <button onClick={() => navigate("/disclaimer")} className="hover:text-gray-700 transition-colors px-2" data-testid="login-legal-cookies">
            Cookies Policy
          </button>
          <span className="text-gray-300">·</span>
          <button onClick={() => navigate("/disclaimer")} className="hover:text-gray-700 transition-colors px-2" data-testid="login-legal-privacy">
            Privacy Policy
          </button>
        </div>
      </main>

      {/* ────────────── Forgot Password Dialog (logic preserved) ────────────── */}
      <Dialog open={showForgot} onOpenChange={closeForgot}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <KeyRound className="w-4 h-4 text-[#1DA1F2]" /> Forgot Password
            </DialogTitle>
            <DialogDescription className="text-xs">Recover your account using email or mobile number</DialogDescription>
          </DialogHeader>

          {resetDone ? (
            <div className="py-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-green-700">Password reset successfully!</p>
              <p className="text-xs text-gray-500 mt-1">You can now sign in with your new password.</p>
              <Button onClick={closeForgot} className="mt-4 bg-[#1DA1F2] hover:bg-[#0C7ABF] text-xs h-8">Back to Login</Button>
            </div>
          ) : forgotResult ? (
            <div className="space-y-3 py-2">
              <div className="p-3 bg-blue-50 rounded text-center">
                <p className="text-[10px] text-gray-500 mb-1">Email Address Used to Login</p>
                <p className="text-sm font-bold text-[#1DA1F2]">{forgotResult}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium">Set New Password</p>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" className="h-8 text-xs" data-testid="new-password-input" />
              </div>
              <Button onClick={handleResetPassword} disabled={forgotLoading} className="w-full h-8 text-xs bg-[#1DA1F2] hover:bg-[#0C7ABF]" data-testid="reset-password-btn">
                {forgotLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reset Password"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="flex gap-1.5">
                <button onClick={() => setForgotMode("email")}
                  className={`flex-1 py-1.5 rounded text-[10px] font-semibold border transition-all ${forgotMode === "email" ? "border-[#1DA1F2] bg-[#1DA1F2] text-white" : "border-gray-200 text-gray-400"}`}>
                  By Email
                </button>
                <button onClick={() => setForgotMode("mobile")}
                  className={`flex-1 py-1.5 rounded text-[10px] font-semibold border transition-all ${forgotMode === "mobile" ? "border-[#1DA1F2] bg-[#1DA1F2] text-white" : "border-gray-200 text-gray-400"}`}>
                  By Mobile
                </button>
              </div>
              {forgotMode === "email" ? (
                <Input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="Enter your registered email" className="h-8 text-xs" data-testid="forgot-email-input" />
              ) : (
                <div className="relative">
                  <Phone className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <Input value={forgotMobile} onChange={e => setForgotMobile(e.target.value)} placeholder="Enter your registered mobile" className="h-8 text-xs pl-7" data-testid="forgot-mobile-input" />
                </div>
              )}
              <Button onClick={handleForgotSubmit} disabled={forgotLoading} className="w-full h-8 text-xs bg-[#1DA1F2] hover:bg-[#0C7ABF]" data-testid="forgot-submit-btn">
                {forgotLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Find Account"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({ label, children, trailing }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-[12px] font-medium text-gray-700">{label}</label>
      {trailing}
    </div>
    {children}
  </div>
);

export default Login;
