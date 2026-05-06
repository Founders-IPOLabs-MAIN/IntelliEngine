import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  FileText,
  CheckCircle2,
  TrendingUp,
  Users,
  LogOut,
  ChevronDown,
  Loader2,
  Shield,
  User,
  Scale,
  CreditCard,
  BarChart3
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

  const handleDRHPClick = () => {
    const isAdminUser = user?.is_admin === true;
    navigate(isAdminUser ? "/drhp" : "/drhp1");
  };

  const handleFundingClick = () => {
    const isAdminUser = user?.is_admin === true;
    navigate(isAdminUser ? "/funding" : "/funding1");
  };

  const isActive = (itemId) => {
    const path = location.pathname;
    switch (itemId) {
      case 'dashboard': return path === '/dashboard';
      case 'assessment': return path.startsWith('/assessment');
      case 'drhp': return path === '/drhp' || path.startsWith('/drhp/') || path.includes('drhp-builder') || path.includes('command-center');
      case 'funding': return path.startsWith('/funding');
      case 'matchmaker': return path.startsWith('/matchmaker');
      case 'valuation': return path.startsWith('/valuation');
      case 'admin': return path.startsWith('/admin');
      case 'account': return path.startsWith('/account');
      case 'payments': return path.startsWith('/payments');
      case 'market-analytics': return path.startsWith('/market-analytics');
      default: return false;
    }
  };

  const isAdmin = user?.is_admin || false;
  const loginRole = user?.login_role || user?.user_type || "existing_user";
  const isEmployee = loginRole === "employee";

  const moduleItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "assessment", label: "IPO Assessment", icon: CheckCircle2, path: "/assessment" },
    { id: "drhp", label: "DRHP Builder", icon: FileText, path: null, onClick: handleDRHPClick },
    { id: "funding", label: "IPO Funding", icon: TrendingUp, path: null, onClick: handleFundingClick },
    { id: "matchmaker", label: "The Match-Making Platform", icon: Users, path: "/matchmaker" },
    { id: "valuation", label: "Valuation", icon: Scale, path: "/valuation" },
    { id: "valuation2", label: "Valuations 2", icon: Scale, path: "/valuation-2" },
  ];

  let navItems = [...moduleItems];

  if (isAdmin) {
    navItems.push({ id: "admin", label: "Admin Center", icon: Shield, path: "/admin" });
    navItems.push({ id: "account", label: "Account Details", icon: User, path: "/account" });
  } else if (isEmployee) {
    navItems.push({ id: "admin", label: "Admin Center", icon: Shield, path: "/admin", disabled: true });
    navItems.push({ id: "account", label: "Account Details", icon: User, path: "/account", disabled: true });
  }

  // Payment Gateway — visible to ALL login types, sits below Account Details
  navItems.push({ id: "payments", label: "Payment Gateway", icon: CreditCard, path: "/payments" });

  // Market Analytics — visible to ALL login types
  navItems.push({ id: "market-analytics", label: "Market Analytics", icon: BarChart3, path: "/market-analytics" });

  const renderNavItem = (item) => {
    const active = isActive(item.id);
    const Icon = item.icon;

    const activeStyle = active
      ? "bg-[#1DA1F2] text-white shadow-md shadow-[#1DA1F2]/25"
      : "bg-[#E8F5FE] text-[#0C7ABF] hover:bg-[#D0ECFC] hover:shadow-sm";

    const disabledStyle = "bg-gray-50 text-gray-300 cursor-not-allowed";

    const base = `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-left`;

    const cls = item.disabled ? `${base} ${disabledStyle}` : `${base} ${activeStyle}`;

    const inner = (
      <>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${active ? "bg-white/20" : "bg-[#1DA1F2]/10"} ${item.disabled ? "bg-gray-100" : ""}`}>
          <Icon className={`w-4 h-4 ${active ? "text-white" : item.disabled ? "text-gray-300" : "text-[#1DA1F2]"}`} />
        </div>
        <span className="flex-1 truncate">{item.label}</span>
        {item.disabled && (
          <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded-full font-medium">Soon</span>
        )}
      </>
    );

    if (item.disabled) {
      return (
        <button key={item.id} type="button" disabled className={cls} data-testid={`nav-${item.id}`}>
          {inner}
        </button>
      );
    }

    if (item.onClick) {
      return (
        <button key={item.id} type="button" onClick={item.onClick} className={cls} data-testid={`nav-${item.id}`}>
          {inner}
        </button>
      );
    }

    return (
      <Link key={item.id} to={item.path} className={cls} data-testid={`nav-${item.id}`}>
        {inner}
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-20" data-testid="sidebar">
      {/* Logo */}
      <div className="-mt-3 border-b border-gray-100">
        <div className="flex items-center justify-center">
          <img src="/setu-logo.png" alt="SETU Labs" className="h-[150px] w-auto object-contain p-3" data-testid="sidebar-logo" />
        </div>
      </div>

      {/* Navigation — SaaS module buttons */}
      <nav className="flex-1 -mt-7 p-4 space-y-2 overflow-y-auto">
        {navItems.map(renderNavItem)}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#E8F5FE] transition-colors" data-testid="user-menu-trigger">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.picture} alt={user?.name} />
                <AvatarFallback className="bg-[#1DA1F2] text-white text-sm">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-black truncate">{user?.name || "User"}</p>
                <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-300" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link to="/account" className="flex items-center cursor-pointer" data-testid="account-settings-link">
                  <User className="w-4 h-4 mr-2" />
                  Account Details
                </Link>
              </DropdownMenuItem>
            )}
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link to="/admin" className="flex items-center cursor-pointer" data-testid="admin-center-dropdown-link">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Center
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onSelect={handleLogout}
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
