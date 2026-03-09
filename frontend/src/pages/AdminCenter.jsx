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
  Send
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
  
  // Dialog states
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [actionType, setActionType] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [assignEmail, setAssignEmail] = useState("");
  const [assignRole, setAssignRole] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  
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
        const [masterRes, statsRes, pendingRes] = await Promise.all([
          apiClient.get("/admin/master-profile"),
          apiClient.get("/admin/registration-stats"),
          apiClient.get("/admin/pending-registrations?limit=50")
        ]);
        setMasterProfile(masterRes.data);
        setRegistrationStats(statsRes.data);
        setPendingRegistrations(pendingRes.data.registrations);
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
        const usersRes = await apiClient.get("/admin/users");
        setUsers(usersRes.data.users);
        const rolesRes = await apiClient.get("/admin/roles");
        setRoles(rolesRes.data.roles);
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
            <Button
              onClick={() => setShowAssignDialog(true)}
              className="bg-purple-600 hover:bg-purple-700 gap-2"
              data-testid="assign-role-btn"
            >
              <UserPlus className="w-4 h-4" />
              Assign Role
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full max-w-2xl mb-6">
              <TabsTrigger value="operations" className="gap-2">
                <Star className="w-4 h-4" />
                Operations
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-2">
                <Shield className="w-4 h-4" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="matrix" className="gap-2">
                <Settings className="w-4 h-4" />
                Permissions
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-2">
                <FileText className="w-4 h-4" />
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
                      <Button variant="outline" size="sm" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
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
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => openActionDialog(reg, "reject")}
                                    disabled={processingId === reg.professional_id}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                    onClick={() => openActionDialog(reg, "reapply")}
                                    disabled={processingId === reg.professional_id}
                                  >
                                    <RotateCcw className="w-4 h-4" />
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

            {/* Users Tab */}
            <TabsContent value="users">
              <Card className="border border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>{users.length} users in system</CardDescription>
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
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.user_id}>
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
                          <TableCell className="text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAssignEmail(u.email);
                                setShowAssignDialog(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
    </div>
  );
};

export default AdminCenter;
