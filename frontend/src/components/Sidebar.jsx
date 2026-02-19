import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  LayoutDashboard,
  FileText,
  CheckCircle2,
  TrendingUp,
  Users,
  BarChart3,
  LogOut,
  Settings,
  ChevronDown,
  Loader2,
  Scale,
  Shield,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Sidebar = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiClient.post("/auth/logout");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "assessment", label: "IPO Assessment", icon: CheckCircle2, path: "/assessment" },
    { id: "drhp", label: "DRHP Builder", icon: FileText, path: null },
    { id: "funding", label: "IPO Funding", icon: TrendingUp, path: "/funding" },
    { id: "matchmaker", label: "Match Maker", icon: Users, path: "/matchmaker" },
    { id: "analytics", label: "Analytics", icon: BarChart3, path: null, disabled: true },
    { id: "admin", label: "Admin Center", icon: Shield, path: "/admin" },
  ];

  const isActive = (path, itemId) => {
    if (!path) return false;
    if (itemId === 'funding' && location.pathname.startsWith('/funding')) return true;
    if (itemId === 'assessment' && location.pathname.startsWith('/assessment')) return true;
    if (itemId === 'admin' && location.pathname.startsWith('/admin')) return true;
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-border flex flex-col z-20" data-testid="sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-[#1DA1F2] rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tighter text-black block">IntelliEngine</span>
            <span className="text-xs text-muted-foreground">by IPO Labs</span>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => item.path && !item.disabled && navigate(item.path)}
            disabled={item.disabled}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
              ${isActive(item.path, item.id) || (item.id === 'drhp' && location.pathname.includes('drhp-builder'))
                ? "bg-[#1DA1F2]/10 text-[#1DA1F2] border-r-2 border-[#1DA1F2]"
                : item.disabled
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            data-testid={`nav-${item.id}`}
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1">{item.label}</span>
            {item.disabled && (
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">Soon</span>
            )}
          </button>
        ))}
      </nav>

      <Separator />

      {/* User Section */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors" data-testid="user-menu-trigger">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.picture} alt={user?.name} />
                <AvatarFallback className="bg-[#1DA1F2] text-white text-sm">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-black truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/account")}>
              <User className="w-4 h-4 mr-2" />
              Account Details
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/admin")}>
              <Shield className="w-4 h-4 mr-2" />
              Admin Center
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={handleLogout}
              disabled={loggingOut}
              data-testid="logout-btn"
            >
              {loggingOut ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Logging out...</>
              ) : (
                <><LogOut className="w-4 h-4 mr-2" />Log out</>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};

export default Sidebar;