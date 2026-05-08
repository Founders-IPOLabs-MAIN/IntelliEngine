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
  BarChart3,
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
      case "dashboard": return path === "/dashboard";
      case "assessment": return path.startsWith("/assessment");
      case "drhp":
        return (
          path === "/drhp" ||
          path.startsWith("/drhp/") ||
          path.includes("drhp-builder") ||
          path.includes("command-center")
        );
      case "funding": return path.startsWith("/funding");
      case "matchmaker": return path.startsWith("/matchmaker");
      case "valuation":
        return (
          path === "/valuation" ||
          (path.startsWith("/valuation/") && !path.startsWith("/valuation-2"))
        );
      case "valuation2":
        return path === "/valuation-2" || path.startsWith("/valuation-2/");
      case "admin": return path.startsWith("/admin");
      case "account": return path.startsWith("/account");
      case "payments": return path.startsWith("/payments");
      case "market-analytics": return path.startsWith("/market-analytics");
      default: return false;
    }
  };

  const isAdmin = user?.is_admin || false;
  const loginRole = user?.login_role || user?.user_type || "existing_user";
  const isEmployee = loginRole === "employee";

  // ── Grouped navigation (Remote-style sections) ──────────────────────
  const sections = [
    {
      id: "workspace",
      label: null,
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      ],
    },
    {
      id: "modules",
      label: "Modules",
      items: [
        { id: "assessment", label: "IPO Assessment", icon: CheckCircle2, path: "/assessment" },
        { id: "drhp", label: "DRHP Builder", icon: FileText, path: null, onClick: handleDRHPClick },
        { id: "funding", label: "IPO Funding", icon: TrendingUp, path: null, onClick: handleFundingClick },
        { id: "matchmaker", label: "Match-Making", icon: Users, path: "/matchmaker" },
        { id: "valuation", label: "Valuation", icon: Scale, path: "/valuation" },
        { id: "valuation2", label: "Valuations 2", icon: BarChart3, path: "/valuation-2" },
        { id: "market-analytics", label: "Market Analytics", icon: BarChart3, path: "/market-analytics" },
      ],
    },
    {
      id: "company",
      label: "Company",
      items: [
        ...(isAdmin
          ? [
              { id: "admin", label: "Admin Center", icon: Shield, path: "/admin" },
              { id: "account", label: "Account Details", icon: User, path: "/account" },
            ]
          : isEmployee
          ? [
              { id: "admin", label: "Admin Center", icon: Shield, path: "/admin", disabled: true },
              { id: "account", label: "Account Details", icon: User, path: "/account", disabled: true },
            ]
          : []),
        { id: "payments", label: "Payment Gateway", icon: CreditCard, path: "/payments" },
      ],
    },
  ];

  const renderNavItem = (item) => {
    const active = isActive(item.id);
    const Icon = item.icon;

    const base =
      "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors text-left";
    const stateCls = item.disabled
      ? "text-gray-300 cursor-not-allowed"
      : active
      ? "bg-[#1DA1F2]/10 text-[#0C7ABF]"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900";

    const cls = `${base} ${stateCls}`;

    const inner = (
      <>
        <Icon
          className={`w-4 h-4 flex-shrink-0 ${
            active ? "text-[#1DA1F2]" : item.disabled ? "text-gray-300" : "text-gray-500"
          }`}
          strokeWidth={2}
        />
        <span className="flex-1 truncate">{item.label}</span>
        {item.disabled && (
          <span className="text-[9px] px-1 py-0.5 bg-gray-100 text-gray-400 rounded font-medium">
            Soon
          </span>
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
    <aside
      className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-20"
      data-testid="sidebar"
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center">
        <img
          src="/setu-logo.svg"
          alt="SETU Labs"
          className="h-8 w-auto object-contain"
          data-testid="sidebar-logo"
        />
      </div>

      {/* Navigation — Remote-style grouped sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((sec, idx) => (
          <div key={sec.id} className={`space-y-0.5 ${idx === 0 ? "" : "mt-6"}`}>
            {sec.label && (
              <div className="px-2.5 pb-2 text-[12px] font-semibold tracking-[0.12em] uppercase text-gray-500">
                {sec.label}
              </div>
            )}
            {sec.items.map(renderNavItem)}
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-gray-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-gray-50 transition-colors"
              data-testid="user-menu-trigger"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.picture} alt={user?.name} />
                <AvatarFallback className="bg-[#1DA1F2] text-white text-xs">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[12.5px] font-semibold text-gray-900 truncate leading-tight">
                  {user?.name || "User"}
                </p>
                <p className="text-[10.5px] text-gray-400 truncate leading-tight">{user?.email}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-300" />
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
