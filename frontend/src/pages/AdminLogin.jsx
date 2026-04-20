import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Eye, EyeOff, Lock } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter admin credentials");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      let data;
      try { data = await res.json(); } catch { data = {}; }
      if (!res.ok) {
        setError(typeof data.detail === "string" ? data.detail : `Login failed (${res.status})`);
        setLoading(false);
        return;
      }
      if (data.session_token) {
        localStorage.setItem("session_token", data.session_token);
        localStorage.setItem("admin_authenticated", "true");
      }
      onLoginSuccess(data);
    } catch (err) {
      setError("Unable to connect. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + "/admin";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8" data-testid="admin-login-page">
      <Card className="w-full max-w-sm border-0 shadow-2xl bg-white/95 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">Admin Access</CardTitle>
          <CardDescription>Sign in with your admin account to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google OAuth for admin users */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full h-10 gap-2 font-medium"
            data-testid="admin-google-login-btn"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign in with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-400">OR CONTINUE WITH EMAIL</span></div>
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Admin Email</Label>
              <Input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@ipolabs.com" className="h-10"
                data-testid="admin-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Enter admin password"
                  className="h-10 pr-10" data-testid="admin-password-input"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-md" data-testid="admin-login-error">{error}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full h-10 bg-gray-900 hover:bg-gray-800" data-testid="admin-login-btn">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Authenticating...</> : <><Lock className="w-4 h-4 mr-2" /> Sign in to Admin</>}
            </Button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-2">Restricted access. Unauthorized attempts are logged.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
