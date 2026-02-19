import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  User,
  Settings,
  CreditCard,
  Shield,
  Camera,
  Loader2,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Crown,
  Lock,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  XCircle,
  AlertTriangle,
  Receipt,
  Calendar
} from "lucide-react";

const AccountDetails = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  
  // Profile data
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    address: "",
    company_name: "",
    designation: ""
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  
  // Subscription data
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // Dialogs
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchSubscription();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get("/account/profile");
      setProfile(response.data);
      setProfileForm({
        name: response.data.name || "",
        phone: response.data.phone || "",
        address: response.data.address || "",
        company_name: response.data.company_name || "",
        designation: response.data.designation || ""
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const [subRes, plansRes, txnRes] = await Promise.all([
        apiClient.get("/account/subscription"),
        apiClient.get("/account/subscription/plans"),
        apiClient.get("/account/billing/transactions")
      ]);
      setSubscription(subRes.data);
      setPlans(plansRes.data.plans);
      setTransactions(txnRes.data.transactions);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await apiClient.put("/account/profile", profileForm);
      toast.success("Profile updated successfully");
      setEditMode(false);
      fetchProfile();
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePictureUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    
    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      await apiClient.post("/account/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      toast.success("Profile picture updated");
      fetchProfile();
    } catch (error) {
      console.error("Failed to upload picture:", error);
      toast.error("Failed to upload picture");
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;
    
    setUpgradeLoading(true);
    try {
      const response = await apiClient.post(`/account/subscription/upgrade?plan_id=${selectedPlan.plan_id}`);
      toast.success(response.data.message);
      setShowUpgradeDialog(false);
      fetchSubscription();
    } catch (error) {
      console.error("Failed to upgrade:", error);
      toast.error(error.response?.data?.detail || "Failed to upgrade subscription");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    
    try {
      await apiClient.post("/account/subscription/cancel");
      toast.success("Subscription cancelled");
      fetchSubscription();
    } catch (error) {
      console.error("Failed to cancel:", error);
      toast.error(error.response?.data?.detail || "Failed to cancel subscription");
    }
  };

  const getRoleBadgeColor = (role) => {
    const roleId = role?.toLowerCase().replace(" ", "_");
    switch (roleId) {
      case "super_admin": return "bg-red-100 text-red-700";
      case "admin": return "bg-purple-100 text-purple-700";
      case "editor": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="account-details-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-border px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {profile?.picture ? (
                <img 
                  src={profile.picture.startsWith('/api') ? profile.picture : profile.picture} 
                  alt={profile.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.name?.charAt(0) || "U"}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPicture}
                className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
              >
                {uploadingPicture ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePictureUpload}
                className="hidden"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">{profile?.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground">{profile?.email}</p>
                <Badge className={getRoleBadgeColor(profile?.role)}>
                  {profile?.role || "Viewer"}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-8 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="w-4 h-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="billing" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Billing
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="border border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Manage your personal details</CardDescription>
                    </div>
                    {!editMode ? (
                      <Button variant="outline" onClick={() => setEditMode(true)}>
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                        <Button onClick={handleSaveProfile} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        Full Name
                      </Label>
                      {editMode ? (
                        <Input
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                        />
                      ) : (
                        <p className="text-black font-medium">{profile?.name || "—"}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        Email Address
                      </Label>
                      <p className="text-black font-medium">{profile?.email}</p>
                      <p className="text-xs text-muted-foreground">Email cannot be changed (Google OAuth)</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        Phone Number
                      </Label>
                      {editMode ? (
                        <Input
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                          placeholder="+91 XXXXX XXXXX"
                        />
                      ) : (
                        <p className="text-black font-medium">{profile?.phone || "—"}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        Designation
                      </Label>
                      {editMode ? (
                        <Input
                          value={profileForm.designation}
                          onChange={(e) => setProfileForm({...profileForm, designation: e.target.value})}
                          placeholder="CFO, Company Secretary, etc."
                        />
                      ) : (
                        <p className="text-black font-medium">{profile?.designation || "—"}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        Company Name
                      </Label>
                      {editMode ? (
                        <Input
                          value={profileForm.company_name}
                          onChange={(e) => setProfileForm({...profileForm, company_name: e.target.value})}
                          placeholder="Your company name"
                        />
                      ) : (
                        <p className="text-black font-medium">{profile?.company_name || "—"}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        Address
                      </Label>
                      {editMode ? (
                        <Input
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                          placeholder="Your address"
                        />
                      ) : (
                        <p className="text-black font-medium">{profile?.address || "—"}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold text-black mb-3">Account Info</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Role: </span>
                        <Badge className={getRoleBadgeColor(profile?.role)}>{profile?.role || "Viewer"}</Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Member Since: </span>
                        <span className="font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-black">Google Authentication</p>
                        <p className="text-sm text-muted-foreground">Your account is secured via Google OAuth</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Lock className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-black">Password</p>
                        <p className="text-sm text-muted-foreground">Not applicable for OAuth users</p>
                      </div>
                    </div>
                    <Button variant="outline" disabled>
                      Change Password
                    </Button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Your account uses Google OAuth for authentication. Password management is handled by Google. To change your password, visit your Google account settings.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing">
              <div className="space-y-6">
                {/* Current Plan */}
                <Card className="border-2 border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Crown className="w-5 h-5 text-blue-600" />
                          Current Plan: {subscription?.plan_details?.name || "Free"}
                        </CardTitle>
                        <CardDescription>
                          {subscription?.plan_details?.billing_cycle === "monthly" ? "Billed monthly" : "One-time"}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-black">
                          ₹{subscription?.plan_details?.price?.toLocaleString() || 0}
                          <span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {subscription?.plan_details?.features?.map((feature, idx) => (
                        <Badge key={idx} variant="secondary">{feature}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => setShowUpgradeDialog(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
                        <ArrowUpCircle className="w-4 h-4" />
                        Upgrade Plan
                      </Button>
                      {subscription?.plan_id !== "free" && (
                        <Button variant="outline" onClick={handleCancelSubscription} className="gap-2 text-red-600 hover:text-red-700">
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* MOCKED Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Payment Integration Placeholder</p>
                    <p className="text-sm text-amber-700">
                      Billing functionality is currently MOCKED. Razorpay integration will be added for production use.
                    </p>
                  </div>
                </div>

                {/* Transaction History */}
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-gray-600" />
                      Transaction History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Invoice</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No transactions yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactions.map((txn) => (
                            <TableRow key={txn.transaction_id}>
                              <TableCell className="text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(txn.created_at).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{txn.description}</TableCell>
                              <TableCell>
                                ₹{txn.amount?.toLocaleString() || 0}
                              </TableCell>
                              <TableCell>
                                <Badge className={txn.status === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                                  {txn.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <Download className="w-4 h-4" />
                                  Download
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose a Plan</DialogTitle>
            <DialogDescription>Select a plan that fits your needs</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            {plans.filter(p => p.plan_id !== "free").map((plan) => (
              <Card
                key={plan.plan_id}
                className={`cursor-pointer transition-all ${
                  selectedPlan?.plan_id === plan.plan_id
                    ? "border-2 border-blue-500 bg-blue-50"
                    : "border border-border hover:border-blue-300"
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-2xl font-bold">
                    ₹{plan.price.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleUpgrade} 
              disabled={!selectedPlan || upgradeLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {upgradeLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              ) : (
                <>Upgrade to {selectedPlan?.name || "..."}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountDetails;
