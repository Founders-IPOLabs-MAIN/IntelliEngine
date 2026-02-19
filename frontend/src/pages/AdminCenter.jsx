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
import { Checkbox } from "@/components/ui/checkbox";
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
  RefreshCw
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
  const [activeTab, setActiveTab] = useState("roles");
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [roles, setRoles] = useState([]);
  const [features, setFeatures] = useState([]);
  const [permissionMatrix, setPermissionMatrix] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Dialog states
  const [showAssignDialog, setShowAssignDialog] = useState(false);
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
      if (activeTab === "roles" || activeTab === "matrix") {
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
        // Also fetch roles for assignment
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
      case "super_admin": return "bg-red-100 text-red-700";
      case "admin": return "bg-purple-100 text-purple-700";
      case "editor": return "bg-blue-100 text-blue-700";
      case "viewer": return "bg-gray-100 text-gray-700";
      default: return "bg-green-100 text-green-700";
    }
  };

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case "super_admin": return Crown;
      case "admin": return Shield;
      case "editor": return Edit2;
      case "viewer": return Eye;
      default: return User;
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

  if (loading && activeTab === "roles") {
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
            <TabsList className="grid grid-cols-4 w-full max-w-xl mb-6">
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

            {/* Roles Tab */}
            <TabsContent value="roles">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roles.map((role) => {
                  const RoleIcon = getRoleIcon(role.role_id);
                  return (
                    <Card key={role.role_id} className="border border-border">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRoleBadgeColor(role.role_id).replace('text-', 'bg-').split(' ')[0]}`}>
                              <RoleIcon className={`w-5 h-5 ${getRoleBadgeColor(role.role_id).split(' ')[1]}`} />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{role.name}</CardTitle>
                              <CardDescription>{role.description}</CardDescription>
                            </div>
                          </div>
                          {role.is_default && (
                            <Badge variant="outline">Default</Badge>
                          )}
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
                          <div className="pt-2">
                            <p className="text-xs text-muted-foreground mb-2">Permissions:</p>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(role.permissions || {}).slice(0, 4).map(([feature, perms]) => (
                                perms.length > 0 && (
                                  <Badge key={feature} variant="secondary" className="text-xs">
                                    {feature.replace('_', ' ')}
                                  </Badge>
                                )
                              ))}
                              {Object.keys(role.permissions || {}).length > 4 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{Object.keys(role.permissions).length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Permission Matrix Tab */}
            <TabsContent value="matrix">
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle>Permission Matrix</CardTitle>
                  <CardDescription>View and manage role permissions across features</CardDescription>
                </CardHeader>
                <CardContent>
                  {permissionMatrix && (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-48">Feature</TableHead>
                            {permissionMatrix.roles.map(role => (
                              <TableHead key={role.role_id} className="text-center">
                                {role.name}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {permissionMatrix.matrix.map((row) => (
                            <TableRow key={row.feature.id}>
                              <TableCell className="font-medium">
                                <div>
                                  {row.feature.name}
                                  <p className="text-xs text-muted-foreground">{row.feature.description}</p>
                                </div>
                              </TableCell>
                              {permissionMatrix.roles.map(role => {
                                const perms = row[role.role_id] || [];
                                return (
                                  <TableCell key={role.role_id} className="text-center">
                                    <div className="flex justify-center gap-1">
                                      {perms.includes("read") && (
                                        <Badge variant="outline" className="text-xs bg-blue-50">R</Badge>
                                      )}
                                      {perms.includes("write") && (
                                        <Badge variant="outline" className="text-xs bg-green-50">W</Badge>
                                      )}
                                      {perms.includes("delete") && (
                                        <Badge variant="outline" className="text-xs bg-red-50">D</Badge>
                                      )}
                                      {perms.length === 0 && (
                                        <span className="text-muted-foreground">—</span>
                                      )}
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
                  <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                    <span><Badge variant="outline" className="bg-blue-50 mr-1">R</Badge> Read</span>
                    <span><Badge variant="outline" className="bg-green-50 mr-1">W</Badge> Write</span>
                    <span><Badge variant="outline" className="bg-red-50 mr-1">D</Badge> Delete</span>
                  </div>
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
                          <SelectItem value="view">View</SelectItem>
                          <SelectItem value="create">Create</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                          <SelectItem value="delete">Delete</SelectItem>
                          <SelectItem value="download">Download</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={logFilter.module || "all"} onValueChange={(v) => setLogFilter({...logFilter, module: v === "all" ? "" : v})}>
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="All Modules" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Modules</SelectItem>
                          <SelectItem value="dashboard">Dashboard</SelectItem>
                          <SelectItem value="assessment">Assessment</SelectItem>
                          <SelectItem value="drhp_builder">DRHP Builder</SelectItem>
                          <SelectItem value="funding">Funding</SelectItem>
                          <SelectItem value="matchmaker">Match Maker</SelectItem>
                          <SelectItem value="admin_center">Admin Center</SelectItem>
                          <SelectItem value="account">Account</SelectItem>
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
                        <TableHead>Module</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No audit logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log) => {
                          const ActionIcon = ACTION_ICONS[log.action_type] || FileText;
                          return (
                            <TableRow key={log.log_id}>
                              <TableCell className="text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  {new Date(log.timestamp).toLocaleString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{log.user_name || "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground">{log.user_email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="gap-1">
                                  <ActionIcon className="w-3 h-3" />
                                  {log.action_type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{log.module?.replace('_', ' ')}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground max-w-xs truncate">
                                {log.details || "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

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
                  {roles.map(role => (
                    <SelectItem key={role.role_id} value={role.role_id}>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getRoleBadgeColor(role.role_id)} text-xs`}>
                          {role.name}
                        </Badge>
                        {role.max_users && (
                          <span className="text-xs text-muted-foreground">(max {role.max_users})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {assignRole === "super_admin" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Maximum 3 Super Admins allowed. Only existing Super Admins can assign this role.
                </p>
              </div>
            )}
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
