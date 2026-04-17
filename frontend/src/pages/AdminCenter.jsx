import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  Shield,
  Users,
  FileText,
  Settings,
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Download,
  LogIn,
  Loader2,
  UserPlus,
  Crown,
  User,
  RefreshCw,
  Building2,
  AlertTriangle,
  RotateCcw,
  Star,
  Mail,
  Send,
  Lock,
  ToggleRight,
  ArrowRightLeft,
  Ban,
  UserX,
  Globe,
  Home
} from "lucide-react";

const ACTION_ICONS = {
  login: LogIn,
  logout: LogIn,
  view: Eye,
  create: Plus,
  update: Edit2,
  delete: Trash2,
  download: Download
};

const AdminCenter = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("operations");
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [roles, setRoles] = useState([]);
  const [features, setFeatures] = useState([]);
  const [permissionMatrix, setPermissionMatrix] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Master Admin / Registration states
  const [masterProfile, setMasterProfile] = useState(null);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [registrationStats, setRegistrationStats] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [emailConfig, setEmailConfig] = useState(null);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  
  // Dialog states
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [actionType, setActionType] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [assignEmail, setAssignEmail] = useState("");
  const [assignRole, setAssignRole] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  
  // Module access state
  const [moduleUsers, setModuleUsers] = useState([]);
  const [moduleSearch, setModuleSearch] = useState("");
  const [togglingPerm, setTogglingPerm] = useState(null);
  
  // Add User dialog state
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [addUserEmail, setAddUserEmail] = useState("");
  const [addUserName, setAddUserName] = useState("");
  const [addUserRole, setAddUserRole] = useState("editor");
  const [addUserLoading, setAddUserLoading] = useState(false);

  // External users state
  const [externalUsers, setExternalUsers] = useState([]);
  const [extSearch, setExtSearch] = useState("");

  // User action dialog state
  const [showUserActionDialog, setShowUserActionDialog] = useState(false);
  const [userActionType, setUserActionType] = useState("");
  const [userActionTarget, setUserActionTarget] = useState(null);
  const [userActionLoading, setUserActionLoading] = useState(false);
  
  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [logFilter, setLogFilter] = useState({ action: "", module: "" });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "operations") {
        const [masterRes, statsRes, pendingRes, emailRes] = await Promise.all([
          apiClient.get("/admin/master-profile"),
          apiClient.get("/admin/registration-stats"),
          apiClient.get("/admin/pending-registrations?limit=50"),
          apiClient.get("/admin/email-config").catch(() => ({ data: { email_configured: false } }))
        ]);
        setMasterProfile(masterRes.data);
        setRegistrationStats(statsRes.data);
        setPendingRegistrations(pendingRes.data.registrations);
        setEmailConfig(emailRes.data);
      } else if (activeTab === "roles" || activeTab === "matrix") {
        const [rolesRes, featuresRes, matrixRes] = await Promise.all([
          apiClient.get("/admin/roles"),
          apiClient.get("/admin/features"),
          apiClient.get("/admin/permission-matrix")
        ]);
        setRoles(rolesRes.data.roles);
        setFeatures(featuresRes.data.features);
        setPermissionMatrix(matrixRes.data);
      } else if (activeTab === "users") {
        const usersRes = await apiClient.get("/admin/users?user_type=internal");
        setUsers(usersRes.data.users);
        const rolesRes = await apiClient.get("/admin/roles");
        setRoles(rolesRes.data.roles);
      } else if (activeTab === "external") {
        const extRes = await apiClient.get("/admin/users?user_type=external");
        setExternalUsers(extRes.data.users);
      } else if (activeTab === "access") {
        const usersRes = await apiClient.get("/admin/users");
        setModuleUsers(usersRes.data.users);
      } else if (activeTab === "audit") {
        const logsRes = await apiClient.get("/admin/audit-logs?limit=100");
        setAuditLogs(logsRes.data.logs);
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      if (error.response?.status === 403) {
        toast.error("Admin access required");
        navigate("/dashboard");
      } else {
        toast.error("Failed to load admin data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationAction = async () => {
    if (!selectedRegistration || !actionType) return;
    
    if ((actionType === "reject" || actionType === "reapply") && !actionReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    
    setProcessingId(selectedRegistration.professional_id);
    try {
      await apiClient.post(`/admin/registrations/${selectedRegistration.professional_id}/action`, {
        action: actionType,
        reason: actionReason || null
      });
      
      toast.success(`Registration ${actionType === "approve" ? "approved" : actionType === "reject" ? "rejected" : "sent back for re-application"}`);
      setShowActionDialog(false);
      setSelectedRegistration(null);
      setActionType("");
      setActionReason("");
      fetchData();
    } catch (error) {
      console.error("Failed to process registration:", error);
      toast.error("Failed to process registration");
    } finally {
      setProcessingId(null);
    }
  };

  const openActionDialog = (registration, action) => {
    setSelectedRegistration(registration);
    setActionType(action);
    setActionReason("");
    setShowActionDialog(true);
  };

  const handleSendEmail = async (professional_id, professional_name) => {
    setSendingEmailId(professional_id);
    try {
      const response = await apiClient.post(`/admin/send-email/${professional_id}`);
      toast.success(`Email sent to ${professional_name} and Master Admin`);
    } catch (error) {
      console.error("Failed to send email:", error);
      if (error.response?.data?.detail?.includes("not configured")) {
        toast.error("Email not configured. Please add RESEND_API_KEY to backend/.env");
      } else {
        toast.error("Failed to send email");
      }
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleAssignRole = async () => {
    if (!assignEmail || !assignRole) {
      toast.error("Please fill all fields");
      return;
    }
    
    setAssignLoading(true);
    try {
      await apiClient.post("/admin/users/assign-role", {
        user_email: assignEmail,
        role_id: assignRole
      });
      toast.success(`Role assigned to ${assignEmail}`);
      setShowAssignDialog(false);
      setAssignEmail("");
      setAssignRole("");
      fetchData();
    } catch (error) {
      console.error("Failed to assign role:", error);
      toast.error(error.response?.data?.detail || "Failed to assign role");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleTogglePermission = async (userId, module, currentValue) => {
    const key = `${userId}-${module}`;
    setTogglingPerm(key);
    try {
      const targetUser = moduleUsers.find(u => u.user_id === userId);
      const currentPerms = targetUser?.module_permissions || {};
      const updatedPerms = { ...currentPerms, [module]: !currentValue };
      
      await apiClient.put(`/admin/users/${userId}/permissions`, {
        permissions: updatedPerms
      });

      setModuleUsers(prev => prev.map(u =>
        u.user_id === userId
          ? { ...u, module_permissions: updatedPerms }
          : u
      ));
      
      toast.success(`${module} access ${!currentValue ? "granted" : "revoked"} for ${targetUser?.name || targetUser?.email}`);
    } catch (error) {
      console.error("Failed to toggle permission:", error);
      toast.error("Failed to update permission");
    } finally {
      setTogglingPerm(null);
    }
  };

  const handleAddUser = async () => {
    if (!addUserEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    setAddUserLoading(true);
    try {
      await apiClient.post("/admin/users/add", {
        email: addUserEmail.trim(),
        name: addUserName.trim() || null,
        role: addUserRole
      });
      toast.success(`User ${addUserEmail} added successfully`);
      setShowAddUserDialog(false);
      setAddUserEmail("");
      setAddUserName("");
      setAddUserRole("editor");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add user");
    } finally {
      setAddUserLoading(false);
    }
  };

  const openUserAction = (targetUser, action) => {
    setUserActionTarget(targetUser);
    setUserActionType(action);
    setShowUserActionDialog(true);
  };

  const handleUserAction = async () => {
    if (!userActionTarget) return;
    setUserActionLoading(true);
    try {
      if (userActionType === "delete") {
        await apiClient.delete(`/admin/users/${userActionTarget.user_id}`);
        toast.success(`User ${userActionTarget.email} deleted`);
      } else if (userActionType === "suspend") {
        await apiClient.post(`/admin/users/${userActionTarget.user_id}/suspend`);
        toast.success(`User ${userActionTarget.email} suspended`);
      } else if (userActionType === "unsuspend") {
        await apiClient.post(`/admin/users/${userActionTarget.user_id}/unsuspend`);
        toast.success(`User ${userActionTarget.email} reactivated`);
      } else if (userActionType === "transfer") {
        await apiClient.post(`/admin/users/${userActionTarget.user_id}/transfer`);
        toast.success(`User ${userActionTarget.email} transferred to Internal`);
      }
      setShowUserActionDialog(false);
      setUserActionTarget(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${userActionType} user`);
    } finally {
      setUserActionLoading(false);
    }
  };

  const UserActionButtons = ({ u, showTransfer = false }) => {
    const isCentralAdmin = ["ronraj2312@gmail.com", "founders.ipolabs@gmail.com", "cajagrutisahu@gmail.com"].includes(u.email);
    const isSuspended = u.status === "suspended";
    return (
      <div className="flex items-center justify-end gap-1">
        {showTransfer && (
          <Button size="sm" variant="outline" className="h-7 px-2 text-blue-600 hover:bg-blue-50" title="Transfer to Internal"
            onClick={() => openUserAction(u, "transfer")} disabled={isCentralAdmin}>
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </Button>
        )}
        {isSuspended ? (
          <Button size="sm" variant="outline" className="h-7 px-2 text-green-600 hover:bg-green-50" title="Reactivate"
            onClick={() => openUserAction(u, "unsuspend")}>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="h-7 px-2 text-orange-600 hover:bg-orange-50" title="Suspend"
            onClick={() => openUserAction(u, "suspend")} disabled={isCentralAdmin}>
            <Ban className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 px-2 text-red-600 hover:bg-red-50" title="Delete"
          onClick={() => openUserAction(u, "delete")} disabled={isCentralAdmin}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  };

  const getRoleBadgeColor = (roleId) => {
    switch (roleId) {
      case "master_admin": return "bg-yellow-100 text-yellow-700";
      case "super_admin": return "bg-red-100 text-red-700";
      case "admin": return "bg-purple-100 text-purple-700";
      case "editor": return "bg-blue-100 text-blue-700";
      case "viewer": return "bg-gray-100 text-gray-700";
      default: return "bg-green-100 text-green-700";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending_review": return <Badge className="bg-yellow-100 text-yellow-700">Pending Review</Badge>;
      case "active": return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      case "needs_resubmission": return <Badge className="bg-orange-100 text-orange-700">Needs Re-submission</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredModuleUsers = moduleUsers.filter(u =>
    u.name?.toLowerCase().includes(moduleSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  const filteredExternalUsers = externalUsers.filter(u =>
    u.name?.toLowerCase().includes(extSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(extSearch.toLowerCase())
  );

  const getRegModuleLabel = (mod) => {
    const map = { google_oauth: "Google Sign-in", email_signup: "Email Sign-up", matchmaker: "The Match-Making Platform", assessment: "Assessment", drhp: "DRHP Builder", funding: "Funding", valuation: "Valuation", invited: "Invited" };
    return map[mod] || mod || "—";
  };

  const MODULES = [
    { key: "matchmaker", label: "The Match-Making Platform", color: "blue" },
    { key: "assessment", label: "Assessment", color: "green" },
    { key: "drhp", label: "DRHP Builder", color: "purple" },
    { key: "funding", label: "Funding", color: "orange" },
    { key: "valuation", label: "Valuation", color: "amber" }
  ];

  const filteredLogs = auditLogs.filter(log => {
    if (logFilter.action && log.action_type !== logFilter.action) return false;
    if (logFilter.module && log.module !== logFilter.module) return false;
    return true;
  });

  if (loading && activeTab === "operations") {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="admin-center-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-border px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">Admin Center</h1>
                <p className="text-muted-foreground">Role-Based Access Control & User Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowAddUserDialog(true)}
                variant="outline"
                className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                data-testid="add-user-btn"
              >
                <Plus className="w-4 h-4" />
                Add User
              </Button>
              <Button
                onClick={() => setShowAssignDialog(true)}
                className="bg-purple-600 hover:bg-purple-700 gap-2"
                data-testid="assign-role-btn"
              >
                <UserPlus className="w-4 h-4" />
                Assign Role
              </Button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex w-full max-w-4xl mb-6">
              <TabsTrigger value="operations" className="gap-1.5 flex-1 text-xs">
                <Star className="w-3.5 h-3.5" />
                Operations
              </TabsTrigger>
              <TabsTrigger value="access" className="gap-1.5 flex-1 text-xs" data-testid="module-access-tab">
                <ToggleRight className="w-3.5 h-3.5" />
                Module Access
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-1.5 flex-1 text-xs" data-testid="internal-users-tab">
                <Home className="w-3.5 h-3.5" />
                Internal Users
              </TabsTrigger>
              <TabsTrigger value="external" className="gap-1.5 flex-1 text-xs" data-testid="external-users-tab">
                <Globe className="w-3.5 h-3.5" />
                External Users
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-1.5 flex-1 text-xs">
                <Shield className="w-3.5 h-3.5" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="matrix" className="gap-1.5 flex-1 text-xs">
                <Settings className="w-3.5 h-3.5" />
                Permissions
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-1.5 flex-1 text-xs">
                <FileText className="w-3.5 h-3.5" />
                Audit Log
              </TabsTrigger>
            </TabsList>

            {/* IPO Labs Operations Tab */}
            <TabsContent value="operations">
              <div className="space-y-6">
                {/* Master Admin Profile Card */}
                <Card className="border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center border-2 border-yellow-400">
                          <Crown className="w-8 h-8 text-yellow-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl flex items-center gap-2">
                            IPO Labs Operations
                            <Badge className="bg-yellow-500 text-white">Master Admin</Badge>
                          </CardTitle>
                          <CardDescription className="text-base">
                            {masterProfile?.master_admin?.name || "Ronak Rajan"} • {masterProfile?.master_admin?.email || "ronraj2312@gmail.com"}
                          </CardDescription>
                        </div>
                      </div>
                      {masterProfile?.is_current_user_master && (
                        <Badge className="bg-green-500 text-white text-sm px-4 py-1">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Currently Logged In
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg border border-yellow-200">
                        <p className="text-2xl font-bold text-yellow-600">{registrationStats?.pending || 0}</p>
                        <p className="text-sm text-muted-foreground">Pending Approval</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                        <p className="text-2xl font-bold text-green-600">{registrationStats?.approved || 0}</p>
                        <p className="text-sm text-muted-foreground">Approved</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-red-200">
                        <p className="text-2xl font-bold text-red-600">{registrationStats?.rejected || 0}</p>
                        <p className="text-sm text-muted-foreground">Rejected</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-orange-200">
                        <p className="text-2xl font-bold text-orange-600">{registrationStats?.needs_resubmission || 0}</p>
                        <p className="text-sm text-muted-foreground">Re-apply</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Registrations */}
                <Card className="border border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-yellow-500" />
                          Pending Registrations
                        </CardTitle>
                        <CardDescription>Review and approve professional registrations</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Email Configuration Status */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${
                          emailConfig?.email_configured 
                            ? "bg-green-100 text-green-700" 
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          <Mail className="w-3.5 h-3.5" />
                          {emailConfig?.email_configured ? "Email Enabled" : "Email Not Configured"}
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchData}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {pendingRegistrations.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-300" />
                        <p className="text-lg">No pending registrations</p>
                        <p className="text-sm">All registrations have been processed</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Professional</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Experience</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingRegistrations.map((reg) => (
                            <TableRow key={reg.professional_id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{reg.name}</p>
                                  <p className="text-xs text-muted-foreground">{reg.email}</p>
                                  {reg.agency_name && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Building2 className="w-3 h-3" />
                                      {reg.agency_name}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{reg.category_id?.replace(/_/g, ' ')}</Badge>
                              </TableCell>
                              <TableCell>
                                {reg.locations?.slice(0, 2).join(", ")}
                                {reg.locations?.length > 2 && ` +${reg.locations.length - 2}`}
                              </TableCell>
                              <TableCell>{reg.years_experience} yrs</TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(reg.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{getStatusBadge(reg.status)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-green-600 hover:bg-green-50 hover:text-green-700"
                                    onClick={() => openActionDialog(reg, "approve")}
                                    disabled={processingId === reg.professional_id}
                                    title="Approve"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => openActionDialog(reg, "reject")}
                                    disabled={processingId === reg.professional_id}
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                    onClick={() => openActionDialog(reg, "reapply")}
                                    disabled={processingId === reg.professional_id}
                                    title="Request Re-apply"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                    onClick={() => handleSendEmail(reg.professional_id, reg.name)}
                                    disabled={sendingEmailId === reg.professional_id}
                                    title="Send Email Notification"
                                    data-testid={`send-email-${reg.professional_id}`}
                                  >
                                    {sendingEmailId === reg.professional_id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Mail className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Module Access Tab */}
            <TabsContent value="access">
              <Card className="border border-border" data-testid="module-access-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-purple-500" />
                        Module Access Control
                      </CardTitle>
                      <CardDescription>Toggle module access per user. Changes take effect immediately.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search users..."
                          value={moduleSearch}
                          onChange={(e) => setModuleSearch(e.target.value)}
                          className="pl-9 w-64"
                          data-testid="module-access-search"
                        />
                      </div>
                      <Button variant="outline" size="icon" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    </div>
                  ) : filteredModuleUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No users found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-56">User</TableHead>
                            {MODULES.map(mod => (
                              <TableHead key={mod.key} className="text-center w-24">{mod.label}</TableHead>
                            ))}
                            <TableHead className="text-right w-32">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredModuleUsers.map((u) => {
                            const perms = u.module_permissions || {};
                            const isAdminUser = ["admin", "super_admin", "master_admin"].includes(u.role?.toLowerCase().replace(" ", "_"));
                            const isSuspended = u.status === "suspended";
                            return (
                              <TableRow key={u.user_id} className={isSuspended ? "opacity-50" : ""} data-testid={`module-access-row-${u.user_id}`}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {u.picture ? (
                                      <img src={u.picture} alt={u.name} className="w-7 h-7 rounded-full" />
                                    ) : (
                                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-gray-500" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium text-sm leading-tight">{u.name}</p>
                                      <p className="text-[11px] text-muted-foreground">{u.email}</p>
                                    </div>
                                    {isSuspended && <Badge className="bg-red-100 text-red-600 text-[9px]">Suspended</Badge>}
                                    {isAdminUser && !isSuspended && <Badge className="bg-yellow-100 text-yellow-700 text-[9px]">Admin</Badge>}
                                  </div>
                                </TableCell>
                                {MODULES.map(mod => {
                                  const enabled = !!perms[mod.key];
                                  const toggling = togglingPerm === `${u.user_id}-${mod.key}`;
                                  return (
                                    <TableCell key={mod.key} className="text-center">
                                      <div className="flex items-center justify-center">
                                        {toggling ? (
                                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                        ) : (
                                          <Switch
                                            checked={enabled}
                                            onCheckedChange={() => handleTogglePermission(u.user_id, mod.key, enabled)}
                                            data-testid={`toggle-${mod.key}-${u.user_id}`}
                                          />
                                        )}
                                      </div>
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="text-right">
                                  <UserActionButtons u={u} />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Roles Tab */}
            <TabsContent value="roles">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roles.map((role) => (
                  <Card key={role.role_id} className="border border-border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRoleBadgeColor(role.role_id).split(' ')[0]}`}>
                            <Shield className={`w-5 h-5 ${getRoleBadgeColor(role.role_id).split(' ')[1]}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{role.name}</CardTitle>
                            <CardDescription>{role.description}</CardDescription>
                          </div>
                        </div>
                        {role.is_default && <Badge variant="outline">Default</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Access Level</span>
                          <span className="font-medium">{role.level}/100</span>
                        </div>
                        {role.max_users && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Max Users</span>
                            <span className="font-medium">{role.max_users}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Permission Matrix Tab */}
            <TabsContent value="matrix">
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle>Permission Matrix</CardTitle>
                  <CardDescription>View role permissions across features</CardDescription>
                </CardHeader>
                <CardContent>
                  {permissionMatrix && (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-48">Feature</TableHead>
                            {permissionMatrix.roles.map(role => (
                              <TableHead key={role.role_id} className="text-center">{role.name}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {permissionMatrix.matrix.map((row) => (
                            <TableRow key={row.feature.id}>
                              <TableCell className="font-medium">{row.feature.name}</TableCell>
                              {permissionMatrix.roles.map(role => {
                                const perms = row[role.role_id] || [];
                                return (
                                  <TableCell key={role.role_id} className="text-center">
                                    <div className="flex justify-center gap-1">
                                      {perms.includes("read") && <Badge variant="outline" className="text-xs bg-blue-50">R</Badge>}
                                      {perms.includes("write") && <Badge variant="outline" className="text-xs bg-green-50">W</Badge>}
                                      {perms.includes("delete") && <Badge variant="outline" className="text-xs bg-red-50">D</Badge>}
                                      {perms.length === 0 && <span className="text-muted-foreground">—</span>}
                                    </div>
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Internal Users Tab */}
            <TabsContent value="users">
              <Card className="border border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Home className="w-5 h-5 text-blue-500" />
                        Internal Users
                      </CardTitle>
                      <CardDescription>{filteredUsers.length} internal users</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search users..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="pl-9 w-64"
                        />
                      </div>
                      <Button variant="outline" size="icon" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => {
                        const isSuspended = u.status === "suspended";
                        return (
                        <TableRow key={u.user_id} className={isSuspended ? "opacity-50" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {u.picture ? (
                                <img src={u.picture} alt={u.name} className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="w-4 h-4 text-gray-500" />
                                </div>
                              )}
                              <span className="font-medium">{u.name}</span>
                              {u.email === "ronraj2312@gmail.com" && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(u.role?.toLowerCase().replace(" ", "_"))}>
                              {u.role || "Viewer"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isSuspended
                              ? <Badge className="bg-red-100 text-red-600">Suspended</Badge>
                              : <Badge className="bg-green-100 text-green-700">Active</Badge>}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-7 px-2" title="Edit Role"
                                onClick={() => { setAssignEmail(u.email); setShowAssignDialog(true); }}>
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <UserActionButtons u={u} />
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* External Users Tab */}
            <TabsContent value="external">
              <Card className="border border-border" data-testid="external-users-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-teal-500" />
                        External Users
                      </CardTitle>
                      <CardDescription>{filteredExternalUsers.length} external users (new visitors & registrations)</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search external users..."
                          value={extSearch}
                          onChange={(e) => setExtSearch(e.target.value)}
                          className="pl-9 w-64"
                          data-testid="external-users-search"
                        />
                      </div>
                      <Button variant="outline" size="icon" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredExternalUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">No external users yet</p>
                      <p className="text-sm">New visitors and registrations will appear here</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Registered Via</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredExternalUsers.map((u) => {
                          const isSuspended = u.status === "suspended";
                          return (
                            <TableRow key={u.user_id} className={isSuspended ? "opacity-50" : ""} data-testid={`ext-user-row-${u.user_id}`}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {u.picture ? (
                                    <img src={u.picture} alt={u.name} className="w-8 h-8 rounded-full" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                      <User className="w-4 h-4 text-gray-500" />
                                    </div>
                                  )}
                                  <span className="font-medium">{u.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{u.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{getRegModuleLabel(u.registration_module)}</Badge>
                              </TableCell>
                              <TableCell>
                                {isSuspended
                                  ? <Badge className="bg-red-100 text-red-600">Suspended</Badge>
                                  : <Badge className="bg-green-100 text-green-700">Active</Badge>}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(u.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <UserActionButtons u={u} showTransfer={true} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Log Tab */}
            <TabsContent value="audit">
              <Card className="border border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Master Audit Log</CardTitle>
                      <CardDescription>Track all user actions across the platform</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={logFilter.action || "all"} onValueChange={(v) => setLogFilter({...logFilter, action: v === "all" ? "" : v})}>
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="All Actions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Actions</SelectItem>
                          <SelectItem value="login">Login</SelectItem>
                          <SelectItem value="registration_approve">Approve</SelectItem>
                          <SelectItem value="registration_reject">Reject</SelectItem>
                          <SelectItem value="registration_reapply">Re-apply</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No audit logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log) => (
                          <TableRow key={log.log_id}>
                            <TableCell className="text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{log.user_name || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">{log.user_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.action_type}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-xs truncate">
                              {log.details || "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Registration Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "approve" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              {actionType === "reject" && <XCircle className="w-5 h-5 text-red-600" />}
              {actionType === "reapply" && <RotateCcw className="w-5 h-5 text-orange-600" />}
              {actionType === "approve" ? "Approve Registration" : actionType === "reject" ? "Reject Registration" : "Request Re-application"}
            </DialogTitle>
            <DialogDescription>
              {selectedRegistration?.name} ({selectedRegistration?.category_id?.replace(/_/g, ' ')})
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {actionType === "approve" ? (
              <p className="text-sm text-muted-foreground">
                Are you sure you want to approve this registration? The professional will be visible in the marketplace.
              </p>
            ) : (
              <div className="space-y-3">
                <Label>Reason {actionType === "reject" ? "for Rejection" : "for Re-application"} *</Label>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={actionType === "reject" ? "Explain why the registration is being rejected..." : "What needs to be corrected..."}
                  rows={4}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleRegistrationAction}
              disabled={processingId}
              className={
                actionType === "approve" ? "bg-green-600 hover:bg-green-700" :
                actionType === "reject" ? "bg-red-600 hover:bg-red-700" :
                "bg-orange-600 hover:bg-orange-700"
              }
            >
              {processingId ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              ) : (
                <>Confirm {actionType === "approve" ? "Approval" : actionType === "reject" ? "Rejection" : "Re-apply Request"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-600" />
              Assign Role to User
            </DialogTitle>
            <DialogDescription>
              Search for a user by email and assign them a role
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>User Email *</Label>
              <Input
                type="email"
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={assignRole} onValueChange={setAssignRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="master_admin">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-100 text-yellow-700 text-xs">Master Admin</Badge>
                    </div>
                  </SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.role_id} value={role.role_id}>
                      <Badge className={`${getRoleBadgeColor(role.role_id)} text-xs`}>{role.name}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleAssignRole} 
              disabled={assignLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {assignLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Assigning...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" />Assign Role</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Add a user by email and assign them a role
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={addUserEmail}
                onChange={(e) => setAddUserEmail(e.target.value)}
                placeholder="user@example.com"
                data-testid="add-user-email-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={addUserName}
                onChange={(e) => setAddUserName(e.target.value)}
                placeholder="Full name (optional)"
                data-testid="add-user-name-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={addUserRole} onValueChange={setAddUserRole}>
                <SelectTrigger data-testid="add-user-role-select">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="master_admin">
                    <Badge className="bg-yellow-100 text-yellow-700 text-xs">Master Admin</Badge>
                  </SelectItem>
                  <SelectItem value="super_admin">
                    <Badge className="bg-red-100 text-red-700 text-xs">Super Admin</Badge>
                  </SelectItem>
                  <SelectItem value="admin">
                    <Badge className="bg-purple-100 text-purple-700 text-xs">Admin</Badge>
                  </SelectItem>
                  <SelectItem value="editor">
                    <Badge className="bg-blue-100 text-blue-700 text-xs">Editor</Badge>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <Badge className="bg-gray-100 text-gray-700 text-xs">Viewer</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleAddUser} 
              disabled={addUserLoading}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="add-user-submit-btn"
            >
              {addUserLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" />Add User</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Action Confirmation Dialog */}
      <Dialog open={showUserActionDialog} onOpenChange={setShowUserActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {userActionType === "delete" && <Trash2 className="w-5 h-5 text-red-600" />}
              {userActionType === "suspend" && <Ban className="w-5 h-5 text-orange-600" />}
              {userActionType === "unsuspend" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              {userActionType === "transfer" && <ArrowRightLeft className="w-5 h-5 text-blue-600" />}
              {userActionType === "delete" ? "Delete User" : userActionType === "suspend" ? "Suspend User" : userActionType === "unsuspend" ? "Reactivate User" : "Transfer to Internal"}
            </DialogTitle>
            <DialogDescription>
              {userActionTarget?.name} ({userActionTarget?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {userActionType === "delete" && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                This will permanently delete this user and revoke all access. This action cannot be undone.
              </p>
            )}
            {userActionType === "suspend" && (
              <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
                This will suspend the user and revoke all access to the application. They can be reactivated later.
              </p>
            )}
            {userActionType === "unsuspend" && (
              <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                This will reactivate the user and restore their access to the application.
              </p>
            )}
            {userActionType === "transfer" && (
              <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                This will move the user from External Users to Internal Users.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserActionDialog(false)}>Cancel</Button>
            <Button
              onClick={handleUserAction}
              disabled={userActionLoading}
              className={
                userActionType === "delete" ? "bg-red-600 hover:bg-red-700" :
                userActionType === "suspend" ? "bg-orange-600 hover:bg-orange-700" :
                userActionType === "unsuspend" ? "bg-green-600 hover:bg-green-700" :
                "bg-blue-600 hover:bg-blue-700"
              }
              data-testid="confirm-user-action-btn"
            >
              {userActionLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              ) : (
                <>Confirm {userActionType === "delete" ? "Delete" : userActionType === "suspend" ? "Suspend" : userActionType === "unsuspend" ? "Reactivate" : "Transfer"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCenter;
