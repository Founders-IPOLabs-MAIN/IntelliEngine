import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Users, UserCheck, UserPlus, Eye, EyeOff, Loader2, Lock } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LoginPanel = ({ title, roles, selectedRole, onSelectRole, onLogin, loading, error }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const disabled = !selectedRole;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    onLogin({ email, password, name, isSignup });
  };

  const handleGoogle = () => {
    if (disabled) return;
    const redirect = `${window.location.origin}/login#role=${selectedRole}`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirect)}`;
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-8 lg:px-14 py-10">
      <h2 className="text-lg font-bold text-black mb-5 text-center">{title}</h2>

      {/* Role buttons */}
      <div className="flex gap-2 mb-6">
        {roles.map(r => (
          <button key={r.id} onClick={() => onSelectRole(r.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all border-2 ${selectedRole === r.id ? "border-[#003366] bg-[#003366] text-white shadow-md" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}
            data-testid={`role-btn-${r.id}`}>
            <r.icon className="w-3.5 h-3.5" /> {r.label}
          </button>
        ))}
      </div>

      {/* Login form — greyed out until role selected */}
      <div className={`space-y-4 transition-all duration-300 ${disabled ? "opacity-30 pointer-events-none select-none" : "opacity-100"}`}>
        {disabled && (
          <div className="text-center py-3 text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <Lock className="w-4 h-4 mx-auto mb-1 text-gray-300" />
            Select a role above to continue
          </div>
        )}

        {/* Google OAuth */}
        <button onClick={handleGoogle} disabled={disabled}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed"
          data-testid="google-login-btn">
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Sign in with Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center text-[10px]"><span className="bg-white px-2 text-gray-400 uppercase tracking-wider">or continue with email</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignup && (
            <div className="space-y-1">
              <Label className="text-xs">Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="h-9 text-sm" />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" className="h-9 text-sm" data-testid="login-email" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Password</Label>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="h-9 text-sm pr-9" data-testid="login-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded" data-testid="login-error">{error}</p>}
          <Button type="submit" disabled={loading || disabled} className="w-full h-9 bg-[#003366] hover:bg-[#002244] text-sm" data-testid="login-submit">
            {loading ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Authenticating...</> : isSignup ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400">
          {isSignup ? (
            <>Already have an account? <button onClick={() => setIsSignup(false)} className="text-[#003366] font-medium hover:underline">Sign in</button></>
          ) : (
            <>Don't have an account? <button onClick={() => setIsSignup(true)} className="text-[#003366] font-medium hover:underline">Sign up</button></>
          )}
        </p>
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

  const handleLogin = async ({ email, password, name, isSignup }, loginRole) => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        // Register first
        await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, name: name || email.split("@")[0] })
        });
      }

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, login_role: loginRole })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Login failed");
        setLoading(false);
        return;
      }

      if (data.session_token) {
        localStorage.setItem("session_token", data.session_token);
      }

      navigate("/dashboard", { state: { user: data.user } });
    } catch (err) {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  };

  // Handle Google OAuth callback
  if (window.location.hash?.includes("session_id=")) {
    const hash = window.location.hash;
    const sessionId = hash.split("session_id=")[1]?.split("&")[0];
    const roleMatch = hash.match(/role=([^&]+)/);
    const loginRole = roleMatch ? roleMatch[1] : "existing_user";

    if (sessionId) {
      (async () => {
        try {
          const res = await fetch(`${API_URL}/api/auth/session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ session_id: sessionId })
          });
          if (res.ok) {
            window.history.replaceState(null, "", "/login");
            navigate("/dashboard");
          }
        } catch {}
      })();
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" data-testid="login-page">
      {/* Header */}
      <div className="text-center py-6 bg-white border-b">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-8 h-8 bg-[#003366] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-2xl font-bold text-[#003366]">SETU</span>
        </div>
        <h1 className="text-lg font-bold text-black">Login Page</h1>
        <p className="text-xs text-gray-400">Select your role to continue</p>
      </div>

      {/* Split Screen */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* LEFT: Admin / Employee */}
        <div className="flex-1 bg-white border-r border-gray-100 flex flex-col">
          <div className="bg-[#003366]/[0.03] px-6 py-3 text-center border-b">
            <p className="text-[10px] tracking-widest uppercase text-[#003366] font-bold">Internal Access</p>
          </div>
          <LoginPanel
            title="Admin & Employee Login"
            roles={[
              { id: "admin", label: "Admins", icon: Shield },
              { id: "employee", label: "Employees", icon: Users }
            ]}
            selectedRole={leftRole}
            onSelectRole={(r) => { setLeftRole(r); setRightRole(null); setError(""); }}
            onLogin={(data) => handleLogin(data, leftRole)}
            loading={loading}
            error={leftRole ? error : ""}
          />
        </div>

        {/* Divider */}
        <div className="hidden lg:flex items-center">
          <div className="w-px h-full bg-gray-200" />
        </div>
        <div className="lg:hidden border-t border-gray-200" />

        {/* RIGHT: Existing / New Users */}
        <div className="flex-1 bg-white flex flex-col">
          <div className="bg-orange-500/[0.04] px-6 py-3 text-center border-b">
            <p className="text-[10px] tracking-widest uppercase text-orange-600 font-bold">User Access</p>
          </div>
          <LoginPanel
            title="Existing & New User Login"
            roles={[
              { id: "existing_user", label: "Existing Users", icon: UserCheck },
              { id: "new_user", label: "New Users", icon: UserPlus }
            ]}
            selectedRole={rightRole}
            onSelectRole={(r) => { setRightRole(r); setLeftRole(null); setError(""); }}
            onLogin={(data) => handleLogin(data, rightRole)}
            loading={loading}
            error={rightRole ? error : ""}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
