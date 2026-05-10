import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import Sidebar from "@/components/Sidebar";
import {
  Loader2, Edit3, Save, Mail, MailOpen, Send, Star, ShieldCheck,
  CreditCard, LifeBuoy, ArrowLeft, MapPin, Briefcase, Clock, ChevronRight,
  CheckCircle2, X, User as UserIcon, MessageSquare, Building2, TrendingUp,
  Crown, Award, Search, Sparkles
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AREA_LABELS = {
  ca_auditor: "Chartered Accountant (CA) / Statutory Auditor",
  peer_review_auditor: "Peer Review Auditor",
  tax_advisor: "Tax Advisors",
  cfo: "CFO (Chief Financial Officer)",
  company_secretary: "Company Secretary (CS)",
  legal_advisor: "Legal Advisors (Indian Counsel)",
  independent_director: "Independent Directors",
  valuation_expert: "Registered Valuation Expert (RV)",
  merchant_banker: "Merchant Banker / BRLM",
  underwriter: "Underwriters",
  rta: "Registrar & Transfer Agent (RTA)",
  credit_rating: "Credit Rating Agency (CRA)",
  banker_to_issue: "Bankers to the Issue",
  advertising_agency: "Advertising Agency",
  market_maker: "Market Maker (SME IPOs only)",
};

const ExpertDashboard = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const justActivatedPremium = new URLSearchParams(location.search).get("premium") === "just-activated";
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Profile-confirmation gate — shown every time the expert opens this page.
  // Until they click "This is correct — Continue", the rest of the dashboard
  // is hidden. They can also click "Make changes" or "Upgrade to Premium".
  // Auto-skip the gate when the user just finished premium activation.
  const [profileGated, setProfileGated] = useState(!justActivatedPremium);

  // Profile edit
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Messages
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({ to_expert_id: "", subject: "", body: "" });
  const [sendingMsg, setSendingMsg] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);

  // Payments
  const [payments, setPayments] = useState([]);

  // Premium / advanced data
  const [premiumData, setPremiumData] = useState(null);
  const [premiumFiles, setPremiumFiles] = useState([]);

  // Support
  const [supportForm, setSupportForm] = useState({ subject: "", message: "" });
  const [tickets, setTickets] = useState([]);
  const [submittingSupport, setSubmittingSupport] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [profRes, inboxRes, sentRes, payRes, tktRes, premRes] = await Promise.all([
        apiClient.get("/matchmaker/expert/my-profile"),
        apiClient.get("/matchmaker/expert/messages/inbox").catch(() => ({ data: { messages: [], unread_count: 0 } })),
        apiClient.get("/matchmaker/expert/messages/sent").catch(() => ({ data: { messages: [] } })),
        apiClient.get("/matchmaker/expert/payments").catch(() => ({ data: { payments: [] } })),
        apiClient.get("/matchmaker/expert/support/tickets").catch(() => ({ data: { tickets: [] } })),
        apiClient.get("/matchmaker/expert/premium/my-data").catch(() => ({ data: {} })),
      ]);
      const p = profRes.data.profile;
      if (!p) { navigate("/matchmaker/experts/register"); return; }
      setProfile(p);
      setEditForm({ full_name: p.full_name, mobile: p.mobile, city: p.city, state: p.state, address: p.address || "", pincode: p.pincode || "" });
      setInbox(inboxRes.data.messages);
      setUnreadCount(inboxRes.data.unread_count);
      setSent(sentRes.data.messages);
      setPayments(payRes.data.payments);
      setTickets(tktRes.data.tickets);
      setPremiumData(premRes.data?.premium_data || null);
      setPremiumFiles(premRes.data?.files || []);
    } catch { toast.error("Failed to load dashboard"); }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await apiClient.put("/matchmaker/expert/my-profile", editForm);
      setProfile(res.data.profile);
      setEditing(false);
      toast.success("Profile updated");
    } catch (e) { toast.error(e.response?.data?.detail || "Update failed"); }
    setSaving(false);
  };

  const handleSendMessage = async () => {
    if (!composeForm.to_expert_id || !composeForm.subject || !composeForm.body) { toast.error("Fill all fields"); return; }
    setSendingMsg(true);
    try {
      await apiClient.post("/matchmaker/expert/messages/send", composeForm);
      toast.success("Message sent");
      setShowCompose(false);
      setComposeForm({ to_expert_id: "", subject: "", body: "" });
      loadAll();
    } catch (e) { toast.error(e.response?.data?.detail || "Send failed"); }
    setSendingMsg(false);
  };

  const markAsRead = async (msg) => {
    if (!msg.is_read) {
      await apiClient.patch(`/matchmaker/expert/messages/${msg.message_id}/read`).catch(() => {});
    }
    setSelectedMsg(msg);
  };

  const handleSupport = async () => {
    if (!supportForm.subject || !supportForm.message) { toast.error("Fill all fields"); return; }
    setSubmittingSupport(true);
    try {
      await apiClient.post("/matchmaker/expert/support", supportForm);
      toast.success("Support ticket submitted");
      setSupportForm({ subject: "", message: "" });
      loadAll();
    } catch (e) { toast.error("Submission failed"); }
    setSubmittingSupport(false);
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" /></main>
      </div>
    );
  }

  // ── Profile confirmation gate ─────────────────────────────────────
  // Shown every time the expert opens their dashboard. They MUST review their
  // saved profile (the form they filled at registration) and either confirm,
  // edit, or click "Upgrade" before the rest of the dashboard becomes visible.
  if (profileGated && profile) {
    const goEdit = () => {
      // Take the user back to the same form they originally filled, in edit
      // mode — they can change name, picture, mobile, areas of expertise, etc.
      navigate("/matchmaker/experts/register?edit=1");
    };
    const upgrade = () => {
      setProfileGated(false);
      navigate("/matchmaker/experts/premium");
    };
    return (
      <div className="flex min-h-screen bg-white" data-testid="expert-profile-gate">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 px-6 py-8 max-w-5xl mx-auto w-full">
          <div className="mb-5">
            <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500 font-semibold mb-1.5">Step 1 of 1 · Welcome back</div>
            <h1 className="text-[24px] font-semibold text-gray-900 tracking-tight">
              Hi {profile?.full_name?.split(" ")[0]}, please confirm your profile
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">
              This is the form you submitted during registration. Review it and choose to continue,
              make changes, or upgrade to Premium for priority listing &amp; verified status.
            </p>
          </div>

          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-[#1DA1F2]/30 flex items-center justify-center overflow-hidden">
                    {profile?.profile_picture_id ? (
                      <img src={`${API_URL}/api/matchmaker/expert/profile-picture/${profile.expert_id}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base font-bold text-[#1DA1F2]">{profile?.full_name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-gray-900 flex items-center gap-1.5">
                      {profile?.full_name}
                      {profile?.is_premium && <Badge className="bg-amber-100 text-amber-700 text-[10px]"><Star className="w-3 h-3 mr-0.5" /> Premium</Badge>}
                      {profile?.is_verified && <Badge className="bg-green-100 text-green-700 text-[10px]"><ShieldCheck className="w-3 h-3 mr-0.5" /> Verified</Badge>}
                    </div>
                    <div className="text-[12px] text-gray-500">{profile?.email}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-[13px]" data-testid="gate-profile-fields">
                <Field label="Full Name"   value={profile?.full_name} />
                <Field label="Email"       value={profile?.email} />
                <Field label="Mobile"      value={profile?.mobile} />
                <Field label="City"        value={profile?.city} />
                <Field label="State"       value={profile?.state} />
                <Field label="Pincode"     value={profile?.pincode || "—"} />
                <Field label="Address"     value={profile?.address || "—"} colSpan />
                <Field
                  label="IPO Experience"
                  value={profile?.ipo_experience ? `${profile.years_of_experience} years` : "No"}
                />
              </div>

              {(profile?.expertise_areas || []).length > 0 && (
                <div className="mt-5">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-gray-500 font-semibold mb-2">Areas of Expertise</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile?.expertise_areas || []).map((a) => (
                      <Badge key={a} variant="outline" className="text-[11px] bg-blue-50 text-[#1DA1F2] border-blue-200">{AREA_LABELS[a] || a}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action row */}
          <div className="mt-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <Button
              variant="outline"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 gap-1.5"
              onClick={goEdit}
              data-testid="gate-edit-btn"
            >
              <Edit3 className="w-3.5 h-3.5" /> Make changes
            </Button>

            <div className="flex flex-col sm:flex-row gap-3">
              {!profile?.is_premium && (
                <HoverCard openDelay={120}>
                  <HoverCardTrigger asChild>
                    <Button
                      onClick={upgrade}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-1.5 shadow-md"
                      data-testid="gate-upgrade-btn"
                    >
                      <Crown className="w-3.5 h-3.5" /> Upgrade to Premium
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent side="top" align="end" className="w-80 p-0 border-amber-200 shadow-2xl" data-testid="upgrade-benefits-popover">
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-100">
                      <div className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-amber-600" />
                        <span className="text-sm font-bold text-amber-900">Premium benefits</span>
                      </div>
                      <p className="text-[11.5px] text-amber-800/80 mt-1">Unlock everything corporates need to find &amp; trust you.</p>
                    </div>
                    <ul className="p-4 space-y-2.5 bg-white rounded-b-md">
                      {[
                        { icon: TrendingUp, label: "Priority listing in search results" },
                        { icon: Award,      label: "Top-ranked profile on category pages" },
                        { icon: Sparkles,   label: "Featured as a Top Recommended profile" },
                        { icon: ShieldCheck,label: "Verified-expert badge on every interaction" },
                        { icon: Search,     label: "Higher visibility in IPO-lead matchmaking" },
                        { icon: Mail,       label: "Direct messaging from corporates (no gatekeeping)" },
                      ].map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                          <b.icon className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" strokeWidth={2.2} />
                          <span>{b.label}</span>
                        </li>
                      ))}
                    </ul>
                  </HoverCardContent>
                </HoverCard>
              )}

              <Button
                onClick={() => setProfileGated(false)}
                className="bg-[#1DA1F2] hover:bg-[#0C7ABF] text-white gap-1.5 shadow-md"
                data-testid="gate-continue-btn"
              >
                <CheckCircle2 className="w-4 h-4" /> Looks good — continue
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="expert-dashboard">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-[#1DA1F2] flex items-center justify-center overflow-hidden">
                {profile?.profile_picture_id ? (
                  <img src={`${API_URL}/api/matchmaker/expert/profile-picture/${profile.expert_id}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-[#1DA1F2]">{profile?.full_name?.charAt(0)}</span>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-black flex items-center gap-2">
                  {profile?.full_name}
                  {profile?.is_premium && <Badge className="bg-amber-100 text-amber-700 text-[10px]"><Star className="w-3 h-3 mr-0.5" /> Premium</Badge>}
                  {profile?.is_verified && <Badge className="bg-green-100 text-green-700 text-[10px]"><ShieldCheck className="w-3 h-3 mr-0.5" /> Verified</Badge>}
                </h1>
                <p className="text-xs text-gray-500">{profile?.city} &middot; {profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/matchmaker/ipo-leads")} data-testid="browse-leads-btn">
                <Building2 className="w-3.5 h-3.5 mr-1" /> Browse IPO Leads
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/matchmaker/experts")} data-testid="browse-experts-btn">
                Browse Experts <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 bg-white border">
              <TabsTrigger value="profile" className="gap-1.5"><UserIcon className="w-4 h-4" /> My Profile</TabsTrigger>
              <TabsTrigger value="messages" className="gap-1.5">
                <MessageSquare className="w-4 h-4" /> Messages
                {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{unreadCount}</span>}
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-1.5"><CreditCard className="w-4 h-4" /> Payments</TabsTrigger>
              <TabsTrigger value="support" className="gap-1.5"><LifeBuoy className="w-4 h-4" /> Support</TabsTrigger>
            </TabsList>

            {/* ── PROFILE TAB ── */}
            <TabsContent value="profile">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-base font-bold">Profile Details</h2>
                    {!editing ? (
                      <Button variant="outline" size="sm" onClick={() => setEditing(true)} data-testid="edit-profile-btn"><Edit3 className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5 mr-1" /> Cancel</Button>
                        <Button size="sm" onClick={handleSaveProfile} disabled={saving} className="bg-[#1DA1F2] hover:bg-[#1a8cd8]" data-testid="save-profile-btn">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3.5 h-3.5 mr-1" /> Save</>}
                        </Button>
                      </div>
                    )}
                  </div>

                  {editing ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label className="text-xs">Full Name</Label><Input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} /></div>
                      <div><Label className="text-xs">Mobile</Label><Input value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} /></div>
                      <div><Label className="text-xs">City</Label><Input value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} /></div>
                      <div><Label className="text-xs">State</Label><Input value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value})} /></div>
                      <div><Label className="text-xs">Address</Label><Input value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} /></div>
                      <div><Label className="text-xs">Pincode</Label><Input value={editForm.pincode} onChange={e => setEditForm({...editForm, pincode: e.target.value})} /></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><span className="text-gray-400 text-xs block">Full Name</span><span className="font-medium">{profile?.full_name}</span></div>
                        <div><span className="text-gray-400 text-xs block">Email</span><span className="font-medium">{profile?.email}</span></div>
                        <div><span className="text-gray-400 text-xs block">Mobile</span><span className="font-medium">{profile?.mobile}</span></div>
                        <div><span className="text-gray-400 text-xs block">City</span><span className="font-medium">{profile?.city}</span></div>
                        <div><span className="text-gray-400 text-xs block">State</span><span className="font-medium">{profile?.state}</span></div>
                        <div><span className="text-gray-400 text-xs block">Pincode</span><span className="font-medium">{profile?.pincode || "—"}</span></div>
                        <div><span className="text-gray-400 text-xs block">IPO Experience</span><span className="font-medium">{profile?.ipo_experience ? `${profile.years_of_experience} years` : "No"}</span></div>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs block mb-2">Areas of Expertise</span>
                        <div className="flex flex-wrap gap-2">
                          {(profile?.expertise_areas || []).map(a => (
                            <Badge key={a} variant="outline" className="text-xs bg-blue-50 text-[#1DA1F2] border-blue-200">{AREA_LABELS[a] || a}</Badge>
                          ))}
                        </div>
                      </div>
                      {/* Premium Advanced Data Section */}
                      {profile?.is_premium && premiumData && (
                        <div className="border border-amber-200 bg-amber-50/40 rounded-lg p-4" data-testid="premium-data-section">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Crown className="w-4 h-4 text-amber-600" />
                              <span className="text-sm font-bold text-gray-900">Premium Profile Data</span>
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]"><ShieldCheck className="w-3 h-3 mr-0.5" /> Verified</Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] border-amber-200 text-amber-700 hover:bg-amber-100"
                              onClick={() => navigate("/matchmaker/experts/premium")}
                              data-testid="manage-premium-btn"
                            >
                              <Edit3 className="w-3 h-3 mr-1" /> Manage
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                            <div>
                              <span className="text-gray-400 text-[11px] block">Firm Name</span>
                              <span className="font-medium text-gray-900">{premiumData.firm_name || "—"}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-[11px] block">Primary Area</span>
                              <span className="font-medium text-gray-900">{AREA_LABELS[premiumData.primary_area] || premiumData.primary_area}</span>
                            </div>
                          </div>
                          {premiumData.primary_identifiers && Object.keys(premiumData.primary_identifiers).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-amber-200">
                              <span className="text-gray-400 text-[11px] block mb-1.5 uppercase tracking-wide font-semibold">Primary Identifiers</span>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(premiumData.primary_identifiers).filter(([_, v]) => v).map(([k, v]) => (
                                  <div key={k} className="text-[11.5px]">
                                    <span className="text-gray-500">{k.replace(/_/g, " ")}:</span>{" "}
                                    <span className="font-medium text-gray-800 break-all">{v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {premiumFiles.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-amber-200">
                              <span className="text-gray-400 text-[11px] block mb-1.5 uppercase tracking-wide font-semibold">Uploaded Documents ({premiumFiles.length})</span>
                              <div className="flex flex-wrap gap-1.5">
                                {premiumFiles.map(f => (
                                  <Badge key={f.file_id} variant="outline" className="bg-white text-[10.5px] border-amber-200 text-gray-700">
                                    {f.filename}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {!profile?.is_premium && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm text-amber-800">Upgrade to Premium</p>
                            <p className="text-xs text-amber-600">Get priority listing, verified badge, and more.</p>
                          </div>
                          <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={() => navigate("/matchmaker/experts/premium")}>
                            <Star className="w-3.5 h-3.5 mr-1" /> Upgrade
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── MESSAGES TAB ── */}
            <TabsContent value="messages">
              <div className="flex gap-4">
                {/* Message List */}
                <Card className="flex-1">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h2 className="text-sm font-bold">Inbox ({inbox.length})</h2>
                      <Button size="sm" onClick={() => setShowCompose(true)} className="bg-[#1DA1F2] hover:bg-[#1a8cd8]" data-testid="compose-btn">
                        <Send className="w-3.5 h-3.5 mr-1" /> Compose
                      </Button>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      {inbox.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No messages yet</div>
                      ) : inbox.map(msg => (
                        <div
                          key={msg.message_id}
                          onClick={() => markAsRead(msg)}
                          className={`px-4 py-3 border-b cursor-pointer hover:bg-blue-50 transition-colors ${!msg.is_read ? "bg-blue-50/50" : ""} ${selectedMsg?.message_id === msg.message_id ? "bg-blue-100" : ""}`}
                          data-testid={`msg-${msg.message_id}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${!msg.is_read ? "font-bold" : "font-medium"} text-black`}>{msg.from_name}</span>
                            <span className="text-[10px] text-gray-400">{timeAgo(msg.created_at)}</span>
                          </div>
                          <p className={`text-xs ${!msg.is_read ? "font-semibold text-gray-800" : "text-gray-600"} truncate`}>{msg.subject}</p>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">{msg.body}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Message Detail */}
                {selectedMsg && (
                  <Card className="w-[400px]">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-[10px]">{selectedMsg.is_read ? "Read" : "Unread"}</Badge>
                        <button onClick={() => setSelectedMsg(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                      </div>
                      <h3 className="font-bold text-sm mb-1">{selectedMsg.subject}</h3>
                      <p className="text-xs text-gray-500 mb-4">From: {selectedMsg.from_name} ({selectedMsg.from_email}) &middot; {timeAgo(selectedMsg.created_at)}</p>
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border-t pt-3">{selectedMsg.body}</div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ── PAYMENTS TAB ── */}
            <TabsContent value="payments">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-base font-bold mb-4">Payment History</h2>
                  {payments.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No payments yet</p>
                      <p className="text-xs text-gray-400 mt-1">Upgrade to Premium to see payment details here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payments.map(p => (
                        <div key={p.payment_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                          <div>
                            <p className="text-sm font-medium">{p.type}</p>
                            <p className="text-xs text-gray-500">{new Date(p.date).toLocaleDateString("en-IN")} &middot; {p.provider}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold">&#8377;{p.amount.toLocaleString()}</p>
                            <Badge className="bg-green-100 text-green-700 text-[10px]">{p.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── SUPPORT TAB ── */}
            <TabsContent value="support">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-base font-bold mb-4 flex items-center gap-2"><LifeBuoy className="w-5 h-5 text-[#1DA1F2]" /> Contact Support</h2>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Subject</Label>
                        <Input value={supportForm.subject} onChange={e => setSupportForm({...supportForm, subject: e.target.value})} placeholder="What do you need help with?" data-testid="support-subject" />
                      </div>
                      <div>
                        <Label className="text-xs">Message</Label>
                        <Textarea value={supportForm.message} onChange={e => setSupportForm({...supportForm, message: e.target.value})} placeholder="Describe your issue in detail..." rows={5} data-testid="support-message" />
                      </div>
                      <Button onClick={handleSupport} disabled={submittingSupport} className="w-full bg-[#1DA1F2] hover:bg-[#1a8cd8]" data-testid="submit-support-btn">
                        {submittingSupport ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Ticket"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-base font-bold mb-4">Your Tickets</h2>
                    {tickets.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No support tickets yet</p>
                    ) : (
                      <div className="space-y-2 max-h-[350px] overflow-y-auto">
                        {tickets.map(t => (
                          <div key={t.ticket_id} className="p-3 bg-gray-50 rounded-lg border text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-black">{t.subject}</span>
                              <Badge className={`text-[10px] ${t.status === "open" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{t.status}</Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 truncate">{t.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{timeAgo(t.created_at)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Compose Dialog */}
        <Dialog open={showCompose} onOpenChange={setShowCompose}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Recipient Expert ID</Label>
                <Input value={composeForm.to_expert_id} onChange={e => setComposeForm({...composeForm, to_expert_id: e.target.value})} placeholder="e.g. exp_abc123" data-testid="compose-to" />
              </div>
              <div>
                <Label className="text-xs">Subject</Label>
                <Input value={composeForm.subject} onChange={e => setComposeForm({...composeForm, subject: e.target.value})} data-testid="compose-subject" />
              </div>
              <div>
                <Label className="text-xs">Message</Label>
                <Textarea value={composeForm.body} onChange={e => setComposeForm({...composeForm, body: e.target.value})} rows={5} data-testid="compose-body" />
              </div>
              <Button onClick={handleSendMessage} disabled={sendingMsg} className="w-full bg-[#1DA1F2] hover:bg-[#1a8cd8]" data-testid="send-msg-btn">
                {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" /> Send Message</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

const Field = ({ label, value, colSpan }) => (
  <div className={colSpan ? "col-span-2 md:col-span-3" : ""}>
    <div className="text-[10.5px] uppercase tracking-[0.1em] text-gray-400 font-semibold mb-0.5">{label}</div>
    <div className="text-[13px] text-gray-900 font-medium break-words">{value || "—"}</div>
  </div>
);

export default ExpertDashboard;
