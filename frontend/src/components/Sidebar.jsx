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
  Save,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Sidebar = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const performLogout = async () => {
    setLoggingOut(true);
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      try { localStorage.removeItem("session_token"); } catch {}
      setLoggingOut(false);
      setConfirmOpen(false);
      navigate("/login");
    }
  };

  // Bridge into any open editor: trigger window-level "save before logout"
  // hooks so individual modules (DRHP editor, BV inputs, Assessment, etc.)
  // get a chance to flush in-flight changes. Each module that wants to
  // persist work just listens to `setu:save-before-logout` on window.
  const saveAndLogout = async () => {
    setSaving(true);
    try {
      // Fire a custom event with a Promise resolver so listeners can save
      // asynchronously before we proceed.
      const savePromises = [];
      const ev = new CustomEvent("setu:save-before-logout", {
        detail: { register: (p) => savePromises.push(p) },
      });
      window.dispatchEvent(ev);
      if (savePromises.length) {
        await Promise.allSettled(savePromises);
        toast.success(`Saved ${savePromises.length} item${savePromises.length > 1 ? "s" : ""} before logout`);
      }
    } catch (e) {
      console.warn("[logout] save hook errored:", e);
    } finally {
      setSaving(false);
      await performLogout();
    }
  };

  const handleLogout = () => setConfirmOpen(true);

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
      <div className="pl-[6px] pr-0 py-0 -mt-[63px] -mb-[88px] border-b border-gray-100 flex items-center">
        <img
          src="/setu-logo.svg"
          alt="SETU Labs"
          className="h-[217px] w-auto object-contain -mr-[2px]"
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

      {/* Standalone Log Out button (always visible) */}
      <div className="px-3 pt-2">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-60"
          data-testid="sidebar-logout-btn"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
          <span className="flex-1 text-left">{loggingOut ? "Logging out…" : "Log Out"}</span>
        </button>
      </div>

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

      {/* ── Save & Logout confirmation dialog ────────────────────────── */}
      <Dialog open={confirmOpen} onOpenChange={(o) => !saving && !loggingOut && setConfirmOpen(o)}>
        <DialogContent className="max-w-sm" data-testid="logout-confirm-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Log out of SETU?
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              You'll be returned to the login screen. Want to save your in-progress work
              first? We'll flush any open editors and forms before signing you out.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={saving || loggingOut}
              className="flex-1 text-xs h-9"
              data-testid="logout-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={performLogout}
              disabled={saving || loggingOut}
              className="flex-1 text-xs h-9 border-red-200 text-red-600 hover:bg-red-50"
              data-testid="logout-discard-btn"
            >
              {loggingOut ? <Loader2 className="w-3 h-3 animate-spin" /> : <>Discard &amp; log out</>}
            </Button>
            <Button
              onClick={saveAndLogout}
              disabled={saving || loggingOut}
              className="flex-1 text-xs h-9 bg-[#1DA1F2] hover:bg-[#0C7ABF] text-white gap-1.5"
              data-testid="logout-save-btn"
            >
              {saving ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</> : <><Save className="w-3 h-3" /> Save &amp; log out</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
};

export default Sidebar;
