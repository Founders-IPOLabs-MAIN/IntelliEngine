import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Users, UserCheck, UserPlus, Eye, EyeOff, Loader2, Lock } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LoginPanel = ({ roles, selectedRole, onSelectRole, onLogin, loading, error }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const off = !selectedRole;

  const submit = (e) => { e.preventDefault(); if (!off) onLogin({ email, password, name, isSignup }); };

  const google = () => {
    if (off) return;
    const r = `${window.location.origin}/login#role=${selectedRole}`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(r)}`;
  };

  return (
    <div className={`transition-all duration-300 ${off ? "opacity-30 pointer-events-none" : ""}`}>
      {off && (
        <div className="flex items-center justify-center gap-1.5 py-2 mb-3 text-[10px] text-gray-400 bg-gray-50 rounded border border-dashed border-gray-200">
          <Lock className="w-3 h-3" /> Select a role above
        </div>
      )}
      <button onClick={google} disabled={off}
        className="w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors mb-3">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Google
      </button>
      <div className="relative mb-3"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"/></div><div className="relative flex justify-center"><span className="bg-white px-2 text-[9px] text-gray-300 uppercase">or</span></div></div>
      <form onSubmit={submit} className="space-y-2">
        {isSignup && <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" className="h-8 text-xs" />}
        <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="h-8 text-xs" data-testid="login-email" />
        <div className="relative">
          <Input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="h-8 text-xs pr-8" data-testid="login-password" />
          <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">{showPw?<EyeOff className="w-3 h-3"/>:<Eye className="w-3 h-3"/>}</button>
        </div>
        {error && <p className="text-[10px] text-red-500 bg-red-50 p-1.5 rounded" data-testid="login-error">{error}</p>}
        <Button type="submit" disabled={loading||off} className="w-full h-8 text-xs bg-[#003366] hover:bg-[#002244]" data-testid="login-submit">
          {loading?<Loader2 className="w-3 h-3 animate-spin"/>:isSignup?"Create Account":"Sign In"}
        </Button>
      </form>
      <p className="text-center text-[10px] text-gray-400 mt-2">
        {isSignup?<>Have an account? <button onClick={()=>setIsSignup(false)} className="text-[#003366] font-medium">Sign in</button></>:<>New here? <button onClick={()=>setIsSignup(true)} className="text-[#003366] font-medium">Sign up</button></>}
      </p>
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
    if (!email||!password) { setError("Email and password required"); return; }
    setError(""); setLoading(true);
    try {
      if (isSignup) {
        await fetch(`${API_URL}/api/auth/register`, {
          method:"POST", headers:{"Content-Type":"application/json"}, credentials:"include",
          body: JSON.stringify({ email, password, name: name||email.split("@")[0] })
        });
      }
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method:"POST", headers:{"Content-Type":"application/json"}, credentials:"include",
        body: JSON.stringify({ email, password, login_role: loginRole })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail||"Login failed"); setLoading(false); return; }
      if (data.session_token) localStorage.setItem("session_token", data.session_token);
      navigate("/dashboard", { state: { user: data.user } });
    } catch { setError("Connection error"); }
    setLoading(false);
  };

  // Handle Google OAuth callback
  if (window.location.hash?.includes("session_id=")) {
    const hash = window.location.hash;
    const sessionId = hash.split("session_id=")[1]?.split("&")[0];
    if (sessionId) {
      (async () => {
        try {
          const res = await fetch(`${API_URL}/api/auth/session`, {
            method:"POST", headers:{"Content-Type":"application/json"}, credentials:"include",
            body: JSON.stringify({ session_id: sessionId })
          });
          if (res.ok) { window.history.replaceState(null,"","/login"); navigate("/dashboard"); }
        } catch {}
      })();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" data-testid="login-page">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <div className="w-7 h-7 bg-[#003366] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">S</span>
            </div>
            <span className="text-xl font-bold text-[#003366]">SETU</span>
          </div>
          <h1 className="text-sm font-bold text-black">Login Page</h1>
          <p className="text-[10px] text-gray-400">Select your role to continue</p>
        </div>

        {/* Split panels side by side */}
        <div className="grid grid-cols-2 gap-4">
          {/* LEFT: Internal */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#003366]/[0.04] px-4 py-2 border-b text-center">
              <p className="text-[9px] tracking-widest uppercase text-[#003366] font-bold">Internal Access</p>
            </div>
            <div className="p-4">
              <div className="flex gap-1.5 mb-4">
                {[{id:"admin",label:"Admins",icon:Shield},{id:"employee",label:"Employees",icon:Users}].map(r=>(
                  <button key={r.id} onClick={()=>{setLeftRole(r.id);setRightRole(null);setError("");}}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-semibold border transition-all ${leftRole===r.id?"border-[#003366] bg-[#003366] text-white":"border-gray-200 text-gray-400 hover:border-gray-300"}`}
                    data-testid={`role-btn-${r.id}`}>
                    <r.icon className="w-3 h-3"/>{r.label}
                  </button>
                ))}
              </div>
              <LoginPanel roles={[]} selectedRole={leftRole} onSelectRole={()=>{}}
                onLogin={(d)=>handleLogin(d,leftRole)} loading={loading} error={leftRole?error:""} />
            </div>
          </div>

          {/* RIGHT: Users */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-orange-500/[0.04] px-4 py-2 border-b text-center">
              <p className="text-[9px] tracking-widest uppercase text-orange-600 font-bold">User Access</p>
            </div>
            <div className="p-4">
              <div className="flex gap-1.5 mb-4">
                {[{id:"existing_user",label:"Existing Users",icon:UserCheck},{id:"new_user",label:"New Users",icon:UserPlus}].map(r=>(
                  <button key={r.id} onClick={()=>{setRightRole(r.id);setLeftRole(null);setError("");}}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-semibold border transition-all ${rightRole===r.id?"border-[#003366] bg-[#003366] text-white":"border-gray-200 text-gray-400 hover:border-gray-300"}`}
                    data-testid={`role-btn-${r.id}`}>
                    <r.icon className="w-3 h-3"/>{r.label}
                  </button>
                ))}
              </div>
              <LoginPanel roles={[]} selectedRole={rightRole} onSelectRole={()=>{}}
                onLogin={(d)=>handleLogin(d,rightRole)} loading={loading} error={rightRole?error:""} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
