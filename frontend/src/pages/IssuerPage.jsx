import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  Building2, ArrowLeft, Loader2, CheckCircle2, CreditCard, Users,
  TrendingUp, Phone, Mail, Briefcase, Wallet, ShieldCheck, Clock,
  ArrowRight, Plus, Coins, X
} from "lucide-react";

const EXPERTISE_OPTIONS = [
  {id: "ca_auditor", label: "Chartered Accountant (CA) / Statutory Auditor"},
  {id: "peer_review_auditor", label: "Peer Review Auditor"},
  {id: "tax_advisor", label: "Tax Advisors"},
  {id: "cfo", label: "CFO (Chief Financial Officer)"},
  {id: "company_secretary", label: "Company Secretary (CS)"},
  {id: "legal_advisor", label: "Legal Advisors (Indian Counsel)"},
  {id: "independent_director", label: "Independent Directors"},
  {id: "valuation_expert", label: "Registered Valuation Expert (RV)"},
  {id: "merchant_banker", label: "Merchant Banker / BRLM"},
  {id: "underwriter", label: "Underwriters"},
  {id: "rta", label: "Registrar & Transfer Agent (RTA)"},
  {id: "credit_rating", label: "Credit Rating Agency (CRA)"},
  {id: "banker_to_issue", label: "Bankers to the Issue"},
  {id: "advertising_agency", label: "Advertising Agency"},
  {id: "market_maker", label: "Market Maker (SME IPOs only)"},
];

const IssuerPage = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(5);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Registration form
  const [form, setForm] = useState({
    company_name: "", cin: "", gstin: "", mobile: "", email: user?.email || "",
    listing_intent: "", contact_persona: "", allow_expert_contact: true, hiring: false, hiring_expertise: "", hiring_experts: []
  });
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, walletRes] = await Promise.all([
        apiClient.get("/matchmaker/issuer/profile"),
        apiClient.get("/matchmaker/wallet")
      ]);
      setProfile(profileRes.data.profile);
      setWallet(walletRes.data);
      if (profileRes.data.profile) {
        const dashRes = await apiClient.get("/matchmaker/issuer/dashboard");
        setDashData(dashRes.data);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!form.company_name || !form.cin || !form.gstin || !form.mobile || !form.email || !form.listing_intent || !form.contact_persona) {
      toast.error("Please fill all required fields");
      return;
    }
    setRegLoading(true);
    try {
      const res = await apiClient.post("/matchmaker/issuer/register", form);
      setProfile(res.data.profile);
      setShowThankYou(true);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Registration failed");
    }
    setRegLoading(false);
  };

  const handleTopUp = async () => {
    setTopUpLoading(true);
    try {
      const res = await apiClient.post("/matchmaker/wallet/topup", { type: "issuer_credits", amount: topUpAmount });
      toast.success(`Added ${topUpAmount} credits (MOCKED)`);
      setWallet(res.data.wallet);
      setShowTopUp(false);
      fetchData();
    } catch (e) { toast.error("Top up failed"); }
    setTopUpLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#003366]" />
        </main>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  if (profile) {
    const stats = dashData?.stats || {};
    return (
      <div className="flex min-h-screen bg-gray-50" data-testid="issuer-dashboard">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64">
          <header className="bg-white border-b border-border px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/matchmaker")}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-black">{profile.company_name}</h1>
                  <p className="text-sm text-muted-foreground">Issuer Dashboard</p>
                </div>
              </div>
              <Button onClick={() => setShowTopUp(true)} className="bg-[#003366] hover:bg-[#002244] gap-2" data-testid="topup-btn">
                <Coins className="w-4 h-4" /> Top Up Credits
              </Button>
            </div>
          </header>

          <div className="max-w-6xl mx-auto px-8 py-6 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-5">
              <Card className="border-2 border-[#003366]/20 bg-gradient-to-br from-[#003366]/5 to-white">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#003366] rounded-xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#003366]" data-testid="credit-balance">{stats.available_credits ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Available Credits</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-black">{stats.ipo_readiness_score ?? "N/A"}</p>
                    <p className="text-sm text-muted-foreground">IPO Readiness Score</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-black">{stats.expert_consultations ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Expert Consultations</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Card */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Company Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><span className="text-muted-foreground">CIN:</span> <span className="font-medium ml-2">{profile.cin}</span></div>
                  <div><span className="text-muted-foreground">GSTIN:</span> <span className="font-medium ml-2">{profile.gstin}</span></div>
                  <div><span className="text-muted-foreground">Contact:</span> <span className="font-medium ml-2">{profile.contact_persona}</span></div>
                  <div><span className="text-muted-foreground">Timeline:</span> <Badge variant="outline" className="ml-2">{profile.listing_intent === "immediate" ? "Next 6-12 Months" : profile.listing_intent === "midterm" ? "12-24 Months" : "Discovery"}</Badge></div>
                  <div><span className="text-muted-foreground">Expert Contact:</span> <Badge className={`ml-2 ${profile.allow_expert_contact !== false ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{profile.allow_expert_contact !== false ? "Yes" : "No"}</Badge></div>
                  <div><span className="text-muted-foreground">Hiring:</span> <Badge className={`ml-2 ${profile.hiring ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{profile.hiring ? "Yes" : "No"}</Badge></div>
                  <div><span className="text-muted-foreground">Pending Requests:</span> <span className="font-medium ml-2">{stats.pending_requests ?? 0}</span></div>
                </div>
                {profile.mca_data && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                    <p className="text-xs text-blue-600 font-medium mb-1">MCA Auto-filled Data (MOCKED)</p>
                    <div className="grid grid-cols-3 gap-2 text-muted-foreground">
                      <span>Address: {profile.mca_data.registered_address}</span>
                      <span>Inc. Date: {profile.mca_data.date_of_incorporation}</span>
                      <span>Auth. Capital: {profile.mca_data.authorized_capital}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-5">
              <Card className="border border-border cursor-pointer hover:border-orange-300 hover:shadow-md transition-all" onClick={() => navigate("/matchmaker/experts")}>
                <CardContent className="p-5 flex items-center gap-4">
                  <Briefcase className="w-8 h-8 text-orange-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-black">Browse Subject Matter Experts</p>
                    <p className="text-xs text-muted-foreground">Find and connect with IPO professionals</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
              <Card className="border border-border cursor-pointer hover:border-green-300 hover:shadow-md transition-all" onClick={() => navigate("/assessment")}>
                <CardContent className="p-5 flex items-center gap-4">
                  <ShieldCheck className="w-8 h-8 text-green-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-black">Take IPO Readiness Assessment</p>
                    <p className="text-xs text-muted-foreground">Check your readiness score</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Top Up Dialog */}
          <Dialog open={showTopUp} onOpenChange={setShowTopUp}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Coins className="w-5 h-5 text-[#003366]" /> Top Up Credits</DialogTitle>
                <DialogDescription>Purchase credits to connect with experts (Razorpay integration pending)</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">MOCKED: Credits are added instantly for demo purposes. Razorpay payment gateway will be integrated before Go-Live.</div>
                <div className="grid grid-cols-3 gap-3">
                  {[5, 10, 25].map(amt => (
                    <Button key={amt} variant={topUpAmount === amt ? "default" : "outline"}
                      onClick={() => setTopUpAmount(amt)} className={topUpAmount === amt ? "bg-[#003366]" : ""}>
                      {amt} Credits
                    </Button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTopUp(false)}>Cancel</Button>
                <Button onClick={handleTopUp} disabled={topUpLoading} className="bg-[#003366] hover:bg-[#002244]" data-testid="confirm-topup-btn">
                  {topUpLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                  Pay (MOCKED)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    );
  }

  // --- REGISTRATION FORM ---
  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="issuer-registration">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64">
        <header className="bg-white border-b border-border px-8 py-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/matchmaker")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-black">IPO Bound Company Registration</h1>
              <p className="text-sm text-muted-foreground">Register your company to connect with IPO professionals</p>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-8 py-8">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-[#003366]" /> Company Details</CardTitle>
              <CardDescription>All fields marked * are required</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} placeholder="ABC Industries Pvt Ltd" data-testid="issuer-company-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CIN *</Label>
                  <Input value={form.cin} onChange={e => setForm({...form, cin: e.target.value.toUpperCase()})} placeholder="U12345MH2020PTC123456" data-testid="issuer-cin" />
                  <p className="text-[11px] text-muted-foreground">Corporate Identity Number from MCA</p>
                </div>
                <div className="space-y-2">
                  <Label>GSTIN *</Label>
                  <Input value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})} placeholder="27AABCU9603R1ZM" data-testid="issuer-gstin" />
                  <p className="text-[11px] text-muted-foreground">GST Identification Number</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Mobile *</Label>
                  <Input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} placeholder="+91 98765 43210" data-testid="issuer-mobile" />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="cfo@company.com" data-testid="issuer-email" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Listing Intent *</Label>
                  <Select value={form.listing_intent} onValueChange={v => setForm({...form, listing_intent: v})}>
                    <SelectTrigger data-testid="issuer-listing-intent"><SelectValue placeholder="Select timeline" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate (Next 6-12 Months)</SelectItem>
                      <SelectItem value="midterm">Mid-term (12-24 Months)</SelectItem>
                      <SelectItem value="discovery">Discovery (Just Exploring)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contact Persona *</Label>
                  <Select value={form.contact_persona} onValueChange={v => setForm({...form, contact_persona: v})}>
                    <SelectTrigger data-testid="issuer-contact-persona"><SelectValue placeholder="Your role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="founder">Founder</SelectItem>
                      <SelectItem value="md">Managing Director</SelectItem>
                      <SelectItem value="cfo">CFO</SelectItem>
                      <SelectItem value="company_ca">Company CA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="font-medium text-sm text-black">Let IPO Experts Contact Me</p>
                  <p className="text-xs text-muted-foreground">Allow verified IPO experts to reach out to you directly</p>
                </div>
                <Switch checked={form.allow_expert_contact} onCheckedChange={v => setForm({...form, allow_expert_contact: v})} data-testid="issuer-allow-expert-contact" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div>
                  <p className="font-medium text-sm text-black">Are you Hiring?</p>
                  <p className="text-xs text-muted-foreground">Looking to hire Subject Matter Experts?</p>
                </div>
                <Switch checked={form.hiring} onCheckedChange={v => setForm({...form, hiring: v, hiring_expertise: v ? form.hiring_expertise : ""})} data-testid="issuer-hiring" />
              </div>

              {form.hiring && (
                <div>
                  <Label className="text-sm font-medium">What expertise are you looking for?</Label>
                  <Select value={form.hiring_expertise} onValueChange={v => setForm({...form, hiring_expertise: v})}>
                    <SelectTrigger className="mt-1" data-testid="issuer-hiring-expertise">
                      <SelectValue placeholder="Select area of expertise" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERTISE_OPTIONS.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button onClick={handleRegister} disabled={regLoading} className="w-full h-11 bg-[#003366] hover:bg-[#002244]" data-testid="issuer-register-btn">
                {regLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering...</> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Register Company</>}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Thank You Popup */}
        <Dialog open={showThankYou} onOpenChange={setShowThankYou}>
          <DialogContent className="max-w-sm text-center">
            <button onClick={() => setShowThankYou(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" data-testid="close-thankyou">
              <X className="w-5 h-5" />
            </button>
            <div className="py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <DialogTitle className="text-xl font-bold text-black mb-2">Thank you for your submission!</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Someone from the IPO Labs team will be in touch with you shortly.
              </DialogDescription>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default IssuerPage;
