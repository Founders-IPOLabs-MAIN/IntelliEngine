import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft, Loader2, Building2, Clock, Briefcase, Mail, Lock, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const IPOLeads = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullAccess, setFullAccess] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Message dialog
  const [showMessage, setShowMessage] = useState(false);
  const [msgTarget, setMsgTarget] = useState(null);
  const [msgBody, setMsgBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/matchmaker/ipo-leads");
      setLeads(res.data.leads);
      setFullAccess(res.data.full_access);
    } catch (e) {
      if (e.response?.status === 403) {
        setAccessDenied(true);
      } else {
        toast.error("Failed to load leads");
      }
    }
    setLoading(false);
  };

  const handleMessage = (lead) => {
    setMsgTarget(lead);
    setMsgBody("");
    setShowMessage(true);
  };

  const sendMessage = async () => {
    if (!msgBody.trim()) { toast.error("Please write a message"); return; }
    setSending(true);
    try {
      // Store as a contact request / lead message
      await apiClient.post("/matchmaker/expert/messages/send", {
        to_expert_id: msgTarget.issuer_id,
        subject: `Inquiry from Expert — Re: ${msgTarget.company_name}`,
        body: msgBody.trim(),
      }).catch(() => {});
      toast.success(`Message sent to ${msgTarget.company_name}`);
      setShowMessage(false);
    } catch {
      toast.error("Failed to send");
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" /></main>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-black mb-2">Access Restricted</h2>
            <p className="text-sm text-gray-500 mb-4">IPO Leads & Requirements is available only to IPO Labs Admins and Premium Experts.</p>
            <Button onClick={() => navigate("/matchmaker/experts/dashboard")} variant="outline">Back to Dashboard</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white" data-testid="ipo-leads-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64 flex flex-col">
        <header className="sticky top-0 z-10 bg-white border-b px-8 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-black">IPO Leads & Requirements</h1>
            <p className="text-xs text-gray-500">{leads.length} corporate lead{leads.length !== 1 ? "s" : ""}</p>
          </div>
          {!fullAccess && (
            <Badge className="bg-amber-100 text-amber-700 text-[10px] ml-2">Limited View — Expert Access</Badge>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-4">
          {leads.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No corporate leads yet</div>
          ) : (
            <div className="space-y-2">
              {leads.map(lead => (
                <Card key={lead.issuer_id} className="border hover:border-[#1DA1F2]/40 hover:shadow-sm transition-all" data-testid={`lead-${lead.issuer_id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-11 h-11 rounded-lg bg-[#003366] flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-black">{lead.company_name}</span>
                        <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600">
                          <Clock className="w-2.5 h-2.5 mr-0.5" /> {lead.time_to_ipo}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-xs">
                        <span className="text-gray-700">
                          <Briefcase className="w-3 h-3 inline mr-0.5" />
                          {lead.hiring ? <span className="text-black font-medium">Needs: {lead.hiring_expertise || "General"}</span> : "Not hiring"}
                        </span>
                        <span className="text-gray-700">Contact: {lead.contact_persona}</span>
                      </div>

                      {/* Grayed out data for non-admins */}
                      <div className="flex items-center gap-4 mt-1 text-[11px]">
                        <span className={fullAccess ? "text-gray-600" : "text-gray-300 select-none"}>CIN: {lead.cin}</span>
                        <span className={fullAccess ? "text-gray-600" : "text-gray-300 select-none"}>GSTIN: {lead.gstin}</span>
                        <span className={fullAccess ? "text-gray-600" : "text-gray-300 select-none"}>Mobile: {lead.mobile}</span>
                        <span className={fullAccess ? "text-gray-600" : "text-gray-300 select-none"}>Email: {lead.email}</span>
                      </div>
                    </div>

                    {/* Message Button */}
                    {lead.allow_expert_contact && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0 text-xs border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white"
                        onClick={() => handleMessage(lead)}
                        data-testid={`message-${lead.issuer_id}`}
                      >
                        <Mail className="w-3.5 h-3.5 mr-1" /> Message Me
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Message Dialog */}
        <Dialog open={showMessage} onOpenChange={setShowMessage}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#1DA1F2]" /> Message {msgTarget?.company_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Send a short introductory message to this corporation. They will receive it in their inbox.</p>
              <div>
                <Label className="text-xs">Your Message</Label>
                <Textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} placeholder="Introduce yourself and your expertise..." rows={5} data-testid="lead-message-body" />
              </div>
              <Button onClick={sendMessage} disabled={sending} className="w-full bg-[#003366] hover:bg-[#002244]" data-testid="send-lead-msg">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" /> Send Message</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default IPOLeads;
