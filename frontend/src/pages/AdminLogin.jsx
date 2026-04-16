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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8" data-testid="admin-login-page">
      <Card className="w-full max-w-sm border-0 shadow-2xl bg-white/95 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">Admin Access</CardTitle>
          <CardDescription>Enter admin credentials to continue</CardDescription>
        </CardHeader>
        <CardContent>
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
          <p className="text-center text-xs text-gray-400 mt-4">Restricted access. Unauthorized attempts are logged.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
