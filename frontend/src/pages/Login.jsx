import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, Users, UserCheck, UserPlus, Eye, EyeOff, Loader2, Lock, Phone, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LoginPanel = ({ selectedRole, onLogin, loading, error, onForgotPassword }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const off = !selectedRole;

  const checkAndSignup = async () => {
    if (!email) { toast.error("Enter your email"); return; }
    setCheckingEmail(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/check-email`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.exists) {
        toast.error("This email already exists. Please sign in or use Forgot Password.");
        setIsSignup(false);
        setCheckingEmail(false);
        return;
      }
      setEmailChecked(true);
    } catch { toast.error("Could not verify email"); }
    setCheckingEmail(false);
  };

  const submit = (e) => {
    e.preventDefault();
    if (off) return;
    if (isSignup && !emailChecked) { checkAndSignup(); return; }
    onLogin({ email, password, name, mobile, isSignup });
  };

  const google = () => {
    if (off) return;
    const r = `${window.location.origin}/login#role=${selectedRole}`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(r)}`;
  };

  return (
    <div className={`transition-all duration-300 ${off ? "opacity-30 pointer-events-none" : ""}`}>
      {off && (
        <div className="flex items-center justify-center gap-1.5 py-2.5 mb-3 text-xs text-gray-400 bg-gray-50 rounded border border-dashed border-gray-200">
          <Lock className="w-3.5 h-3.5" /> Select a role above
        </div>
      )}
      <button onClick={google} disabled={off}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors mb-3">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Google
      </button>
      <div className="relative mb-3"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"/></div><div className="relative flex justify-center"><span className="bg-white px-2 text-[11px] text-gray-300 uppercase">or</span></div></div>
      <form onSubmit={submit} className="space-y-2.5">
        {isSignup && !emailChecked && (
          <>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className="h-9 text-sm" data-testid="login-email" />
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <Input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Mobile number" className="h-9 text-sm pl-8" data-testid="login-mobile" />
            </div>
            {error && <p className="text-xs text-red-500 bg-red-50 p-1.5 rounded">{error}</p>}
            <Button type="submit" disabled={checkingEmail || off} className="w-full h-9 text-sm bg-[#003366] hover:bg-[#002244]">
              {checkingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Verify & Continue"}
            </Button>
          </>
        )}
        {isSignup && emailChecked && (
          <>
            <div className="flex items-center gap-1.5 p-2 bg-green-50 rounded text-xs text-green-700"><CheckCircle2 className="w-3.5 h-3.5" /> {email} — available</div>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="h-9 text-sm" />
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <Input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Mobile number" className="h-9 text-sm pl-8" />
            </div>
            <div className="relative">
              <Input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Create password (min 6 chars)" className="h-9 text-sm pr-8" data-testid="login-password" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300">{showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
            </div>
            {error && <p className="text-xs text-red-500 bg-red-50 p-1.5 rounded">{error}</p>}
            <Button type="submit" disabled={loading || off} className="w-full h-9 text-sm bg-[#003366] hover:bg-[#002244]" data-testid="login-submit">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create Account"}
            </Button>
          </>
        )}
        {!isSignup && (
          <>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="h-9 text-sm" data-testid="login-email" />
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <Input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Mobile number (optional)" className="h-9 text-sm pl-8" data-testid="login-mobile" />
            </div>
            <div className="relative">
              <Input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="h-9 text-sm pr-8" data-testid="login-password" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300">{showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
            </div>
            {error && <p className="text-xs text-red-500 bg-red-50 p-1.5 rounded" data-testid="login-error">{error}</p>}
            <Button type="submit" disabled={loading || off} className="w-full h-9 text-sm bg-[#003366] hover:bg-[#002244]" data-testid="login-submit">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sign In"}
            </Button>
          </>
        )}
      </form>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-400">
          {isSignup
            ? <>Have an account? <button onClick={() => { setIsSignup(false); setEmailChecked(false); }} className="text-[#003366] font-medium">Sign in</button></>
            : <>New here? <button onClick={() => setIsSignup(true)} className="text-[#003366] font-medium">Sign up</button></>}
        </p>
        {!isSignup && (
          <button onClick={onForgotPassword} className="text-xs text-orange-600 font-medium hover:underline" data-testid="forgot-password-btn">Forgot password?</button>
        )}
      </div>
    </div>
  );
};

const Login = ({ apiClient }) => {
  const navigate = useNavigate();
  const [leftRole, setLeftRole] = useState(null);
  const [rightRole, setRightRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Forgot Password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotMode, setForgotMode] = useState("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMobile, setForgotMobile] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResult, setForgotResult] = useState(null);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);

  const handleLogin = async ({ email, password, name, mobile, isSignup }, loginRole) => {
    if (!email || !password) { setError("Email and password required"); return; }
    setError(""); setLoading(true);
    try {
      if (isSignup) {
        const regRes = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ email, password, name: name || email.split("@")[0], mobile })
        });
        const regData = await regRes.json();
        if (!regRes.ok) { setError(regData.detail || "Registration failed"); setLoading(false); return; }
      }
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ email, password, login_role: loginRole })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Login failed"); setLoading(false); return; }
      if (data.session_token) localStorage.setItem("session_token", data.session_token);
      // Save mobile if provided
      if (mobile && data.session_token) {
        fetch(`${API_URL}/api/auth/save-mobile`, {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ mobile })
        }).catch(() => {});
      }
      navigate("/dashboard", { state: { user: data.user } });
    } catch { setError("Connection error"); }
    setLoading(false);
  };

  const handleForgotSubmit = async () => {
    setForgotLoading(true);
    try {
      const body = forgotMode === "email" ? { email: forgotEmail } : { mobile: forgotMobile };
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, new_password: newPassword })
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

  // Handle Google OAuth callback
  if (window.location.hash?.includes("session_id=")) {
    const hash = window.location.hash;
    const sessionId = hash.split("session_id=")[1]?.split("&")[0];
    if (sessionId) {
      (async () => {
        try {
          const res = await fetch(`${API_URL}/api/auth/session`, {
            method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
            body: JSON.stringify({ session_id: sessionId })
          });
          if (res.ok) { window.history.replaceState(null, "", "/login"); navigate("/dashboard"); }
        } catch {}
      })();
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#0a0a0a]" data-testid="login-page">
      {/* Mesh gradient background — same palette as landing page */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-500/15 blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-[480px] h-[480px] rounded-full bg-cyan-400/12 blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[420px] h-[420px] rounded-full bg-fuchsia-500/10 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.04]"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
      </div>

      <div className="relative z-10 w-full max-w-2xl -mt-16">
        {/* Header */}
        <div className="text-center mb-7">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Login Page
          </h1>
          <p className="text-base text-white/70 mt-1.5">Select your role to continue</p>
        </div>

        {/* Split panels */}
        <div className="grid grid-cols-2 gap-3">
          {/* LEFT */}
          <div className="bg-white/[0.96] backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="bg-[#003366]/[0.04] px-3 py-2 border-b text-center">
              <p className="text-sm tracking-widest uppercase text-[#003366] font-bold">Internal User Login</p>
            </div>
            <div className="p-5">
              <div className="flex gap-2 mb-4">
                {[{ id: "admin", label: "Admin Login", icon: Shield, active: "border-[#003366] bg-[#003366] text-white", idle: "border-gray-200 text-gray-400 hover:border-[#003366]/40 hover:bg-[#003366]/5" }, { id: "employee", label: "Employee", icon: Users, active: "border-indigo-600 bg-indigo-600 text-white", idle: "border-gray-200 text-gray-400 hover:border-indigo-400/40 hover:bg-indigo-50" }].map(r => (
                  <button key={r.id} onClick={() => { setLeftRole(r.id); setRightRole(null); setError(""); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${leftRole === r.id ? r.active : r.idle}`}
                    data-testid={`role-btn-${r.id}`}>
                    <r.icon className="w-3.5 h-3.5" />{r.label}
                  </button>
                ))}
              </div>
              <LoginPanel selectedRole={leftRole}
                onLogin={(d) => handleLogin(d, leftRole)} loading={loading} error={leftRole ? error : ""}
                onForgotPassword={() => setShowForgot(true)} />
            </div>
          </div>

          {/* RIGHT */}
          <div className="bg-white/[0.96] backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="bg-orange-500/[0.04] px-3 py-1.5 border-b text-center">
              <p className="text-sm tracking-widest uppercase text-orange-600 font-bold">External User Login</p>
            </div>
            <div className="p-5">
              <div className="flex gap-2 mb-4">
                {[{ id: "existing_user", label: "Existing Users", icon: UserCheck, active: "border-teal-600 bg-teal-600 text-white", idle: "border-gray-200 text-gray-400 hover:border-teal-400/40 hover:bg-teal-50" }, { id: "new_user", label: "New Users", icon: UserPlus, active: "border-orange-500 bg-orange-500 text-white", idle: "border-gray-200 text-gray-400 hover:border-orange-400/40 hover:bg-orange-50" }].map(r => (
                  <button key={r.id} onClick={() => { setRightRole(r.id); setLeftRole(null); setError(""); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${rightRole === r.id ? r.active : r.idle}`}
                    data-testid={`role-btn-${r.id}`}>
                    <r.icon className="w-3.5 h-3.5" />{r.label}
                  </button>
                ))}
              </div>
              <LoginPanel selectedRole={rightRole}
                onLogin={(d) => handleLogin(d, rightRole)} loading={loading} error={rightRole ? error : ""}
                onForgotPassword={() => setShowForgot(true)} />
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgot} onOpenChange={closeForgot}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base"><KeyRound className="w-4 h-4 text-[#003366]" /> Forgot Password</DialogTitle>
            <DialogDescription className="text-xs">Recover your account using email or mobile number</DialogDescription>
          </DialogHeader>

          {resetDone ? (
            <div className="py-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-green-700">Password reset successfully!</p>
              <p className="text-xs text-gray-500 mt-1">You can now sign in with your new password.</p>
              <Button onClick={closeForgot} className="mt-4 bg-[#003366] hover:bg-[#002244] text-xs h-8">Back to Login</Button>
            </div>
          ) : forgotResult ? (
            <div className="space-y-3 py-2">
              <div className="p-3 bg-blue-50 rounded text-center">
                <p className="text-[10px] text-gray-500 mb-1">Email Address Used to Login</p>
                <p className="text-sm font-bold text-[#003366]">{forgotResult}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium">Set New Password</p>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" className="h-8 text-xs" data-testid="new-password-input" />
              </div>
              <Button onClick={handleResetPassword} disabled={forgotLoading} className="w-full h-8 text-xs bg-[#003366] hover:bg-[#002244]" data-testid="reset-password-btn">
                {forgotLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reset Password"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="flex gap-1.5">
                <button onClick={() => setForgotMode("email")}
                  className={`flex-1 py-1.5 rounded text-[10px] font-semibold border transition-all ${forgotMode === "email" ? "border-[#003366] bg-[#003366] text-white" : "border-gray-200 text-gray-400"}`}>
                  By Email
                </button>
                <button onClick={() => setForgotMode("mobile")}
                  className={`flex-1 py-1.5 rounded text-[10px] font-semibold border transition-all ${forgotMode === "mobile" ? "border-[#003366] bg-[#003366] text-white" : "border-gray-200 text-gray-400"}`}>
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
              <Button onClick={handleForgotSubmit} disabled={forgotLoading} className="w-full h-8 text-xs bg-[#003366] hover:bg-[#002244]" data-testid="forgot-submit-btn">
                {forgotLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Find Account"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
