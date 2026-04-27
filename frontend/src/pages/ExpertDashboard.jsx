import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import Sidebar from "@/components/Sidebar";
import {
  Loader2, Edit3, Save, Mail, MailOpen, Send, Star, ShieldCheck,
  CreditCard, LifeBuoy, ArrowLeft, MapPin, Briefcase, Clock, ChevronRight,
  CheckCircle2, X, User as UserIcon, MessageSquare, Building2
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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

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

  // Support
  const [supportForm, setSupportForm] = useState({ subject: "", message: "" });
  const [tickets, setTickets] = useState([]);
  const [submittingSupport, setSubmittingSupport] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [profRes, inboxRes, sentRes, payRes, tktRes] = await Promise.all([
        apiClient.get("/matchmaker/expert/my-profile"),
        apiClient.get("/matchmaker/expert/messages/inbox").catch(() => ({ data: { messages: [], unread_count: 0 } })),
        apiClient.get("/matchmaker/expert/messages/sent").catch(() => ({ data: { messages: [] } })),
        apiClient.get("/matchmaker/expert/payments").catch(() => ({ data: { payments: [] } })),
        apiClient.get("/matchmaker/expert/support/tickets").catch(() => ({ data: { tickets: [] } })),
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
                      {!profile?.is_premium && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm text-amber-800">Upgrade to Premium</p>
                            <p className="text-xs text-amber-600">Get priority listing, verified badge, and more.</p>
                          </div>
                          <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={() => navigate("/matchmaker/experts/verify")}>
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

export default ExpertDashboard;
