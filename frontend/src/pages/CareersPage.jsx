import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowLeft, Briefcase, MapPin, Clock, Users, CheckCircle2, Loader2,
  Upload, Copy, Share2, ChevronDown, ChevronUp, Plus, Trash2,
  Building2, Sparkles, Heart, Target, Lightbulb, ArrowRight, X
} from "lucide-react";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VALUES = [
  { icon: Sparkles, title: "Innovate Boldly", desc: "We build AI-powered tools that are reshaping how India goes public." },
  { icon: Target, title: "Ship & Iterate", desc: "Move fast, learn faster. Every feature we ship reaches real users immediately." },
  { icon: Heart, title: "People First", desc: "We invest in our team's growth, well-being, and career trajectory." },
  { icon: Lightbulb, title: "Think Like an Owner", desc: "Every team member has a voice. Your ideas shape the product and the company." },
];

const CareersPage = () => {
  const navigate = useNavigate();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [applyingTo, setApplyingTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const fileRef = useRef(null);

  // Apply form
  const [form, setForm] = useState({
    name: "", email: "", phone: "", date_of_joining: "",
    sales_experience: "", accounting_experience: "", current_address: ""
  });
  const [cvFile, setCvFile] = useState(null);

  // Add position form
  const [newPos, setNewPos] = useState({
    title: "", department: "", location: "", type: "Full-time",
    experience: "", description: "", requirements: "", responsibilities: "",
    tags: "", freshers_welcome: false
  });

  useEffect(() => {
    fetchPositions();
    checkAdmin();
  }, []);

  const fetchPositions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/careers/positions`);
      setPositions(res.data.positions);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const checkAdmin = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
      setIsAdmin(res.data.is_admin);
    } catch { setIsAdmin(false); }
  };

  const handleApply = async () => {
    if (!form.name || !form.email || !form.date_of_joining) {
      toast.error("Please fill name, email, and date of joining");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (cvFile) fd.append("cv", cvFile);
      const res = await axios.post(`${API_URL}/api/careers/apply/${applyingTo.position_id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Application submitted successfully!");
      setApplyingTo(null);
      setForm({ name: "", email: "", phone: "", date_of_joining: "", sales_experience: "", accounting_experience: "", current_address: "" });
      setCvFile(null);
      fetchPositions();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to submit application");
    }
    setSubmitting(false);
  };

  const handleAddPosition = async () => {
    if (!newPos.title || !newPos.department || !newPos.location) {
      toast.error("Title, department, and location are required");
      return;
    }
    setAddLoading(true);
    try {
      await axios.post(`${API_URL}/api/careers/positions`, {
        ...newPos,
        requirements: newPos.requirements.split("\n").filter(Boolean),
        responsibilities: newPos.responsibilities.split("\n").filter(Boolean),
        tags: newPos.tags.split(",").map(t => t.trim()).filter(Boolean)
      }, { withCredentials: true });
      toast.success("Position added!");
      setShowAddPosition(false);
      setNewPos({ title: "", department: "", location: "", type: "Full-time", experience: "", description: "", requirements: "", responsibilities: "", tags: "", freshers_welcome: false });
      fetchPositions();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to add position");
    }
    setAddLoading(false);
  };

  const handleDeletePosition = async (posId) => {
    try {
      await axios.delete(`${API_URL}/api/careers/positions/${posId}`, { withCredentials: true });
      toast.success("Position removed");
      fetchPositions();
    } catch (e) { toast.error("Failed to remove"); }
  };

  const copyPositionText = (pos) => {
    const text = `🚀 We're Hiring: ${pos.title}\n\n` +
      `📍 ${pos.location}\n⏰ ${pos.type} | ${pos.experience}\n🏢 ${pos.department}\n\n` +
      `${pos.description}\n\n` +
      `Requirements:\n${(pos.requirements || []).map(r => `• ${r}`).join("\n")}\n\n` +
      `Responsibilities:\n${(pos.responsibilities || []).map(r => `• ${r}`).join("\n")}\n\n` +
      (pos.freshers_welcome ? `✅ Freshers Welcome to Apply!\n\n` : "") +
      `Apply now: ${window.location.origin}/careers\n\n` +
      `#Hiring #IPOLabs #${pos.tags?.join(" #") || "Jobs"}`;
    navigator.clipboard.writeText(text);
    toast.success("Job posting copied to clipboard — paste on LinkedIn, Naukri, Indeed, etc.");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col" data-testid="careers-page">
      {/* Nav */}
      <nav className="sticky top-0 z-20 bg-white border-b px-8 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center justify-center gap-2 -mt-3">
            <img src="/setu-logo.png" alt="SETU Labs" className="h-[150px] w-auto object-contain p-3" />
          </div>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="font-semibold text-black">Careers</span>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAddPosition(true)} className="bg-[#003366] hover:bg-[#002244] gap-2" data-testid="add-position-btn">
            <Plus className="w-4 h-4" /> Add Position
          </Button>
        )}
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#003366] via-[#002244] to-[#001a33] text-white py-20 px-8 lg:px-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)" }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="bg-white/10 text-white/90 border-white/20 mb-6 px-4 py-1.5 text-sm">Join the team building India's IPO Operating System</Badge>
          <h1 className="text-3xl lg:text-5xl font-bold mb-4 tracking-tight">Build the Future of<br />Indian Capital Markets</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">We're a small, high-impact team transforming how companies go public in India. If you're driven by ambition and want to make a real dent in the $100B+ IPO ecosystem, we want to talk.</p>
          <Button onClick={() => document.getElementById("positions")?.scrollIntoView({ behavior: "smooth" })}
            className="bg-white text-[#003366] hover:bg-gray-100 rounded-full px-8 py-3 font-semibold text-sm gap-2">
            View Open Positions <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-8 lg:px-16 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-black mb-2">Our Values</h2>
          <p className="text-center text-muted-foreground text-sm mb-10">What drives us every day at IPO Labs</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <Card key={i} className="border-0 shadow-sm text-center p-6">
                <v.icon className="w-8 h-8 text-[#003366] mx-auto mb-3" />
                <h3 className="font-bold text-sm text-black mb-1">{v.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="py-16 px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-black">Open Positions</h2>
              <p className="text-sm text-muted-foreground mt-1">{positions.length} role{positions.length !== 1 ? "s" : ""} available</p>
            </div>
            {isAdmin && (
              <Button onClick={() => setShowAddPosition(true)} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" /> Add Position
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#003366]" /></div>
          ) : positions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No open positions right now</p>
              <p className="text-sm">Check back soon — we're always growing!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {positions.map(pos => {
                const expanded = expandedId === pos.position_id;
                return (
                  <Card key={pos.position_id} className="border border-border overflow-hidden transition-shadow hover:shadow-md" data-testid={`position-${pos.position_id}`}>
                    <CardContent className="p-0">
                      {/* Header */}
                      <div className="p-6 cursor-pointer" onClick={() => setExpandedId(expanded ? null : pos.position_id)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-black">{pos.title}</h3>
                              {pos.freshers_welcome && <Badge className="bg-green-100 text-green-700 text-[10px]">Freshers Welcome</Badge>}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {pos.department}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {pos.location}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {pos.type}</span>
                              <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {pos.experience}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Copy for LinkedIn/Job boards"
                              onClick={e => { e.stopPropagation(); copyPositionText(pos); }}>
                              <Copy className="w-4 h-4" />
                            </Button>
                            {isAdmin && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" title="Close position"
                                onClick={e => { e.stopPropagation(); handleDeletePosition(pos.position_id); }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                            {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expanded && (
                        <div className="px-6 pb-6 border-t border-gray-100 pt-5 space-y-5">
                          {pos.freshers_welcome && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <p className="text-green-800 font-bold text-sm">Freshers are welcome to apply! We value enthusiasm, willingness to learn, and a strong foundation in Commerce/Accounts over years of experience.</p>
                            </div>
                          )}

                          <div>
                            <h4 className="font-semibold text-sm text-black mb-2">About the Role</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">{pos.description}</p>
                          </div>

                          {pos.requirements?.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm text-black mb-2">Requirements</h4>
                              <ul className="space-y-1.5">
                                {pos.requirements.map((r, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="w-4 h-4 text-[#003366] mt-0.5 flex-shrink-0" />{r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {pos.responsibilities?.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm text-black mb-2">Responsibilities</h4>
                              <ul className="space-y-1.5">
                                {pos.responsibilities.map((r, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                    <ArrowRight className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />{r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {pos.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {pos.tags.map((t, i) => <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>)}
                            </div>
                          )}

                          <div className="flex items-center gap-3 pt-3 border-t">
                            <Button onClick={() => setApplyingTo(pos)} className="bg-[#003366] hover:bg-[#002244] gap-2 rounded-full px-8" data-testid={`apply-btn-${pos.position_id}`}>
                              Apply Now <ArrowRight className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" className="gap-2 rounded-full" onClick={() => copyPositionText(pos)}>
                              <Copy className="w-4 h-4" /> Copy for Job Boards
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#003366] text-white py-12 px-8 text-center">
        <h2 className="text-2xl font-bold mb-3">Don't see your role?</h2>
        <p className="text-white/70 mb-6 max-w-lg mx-auto">We're always looking for exceptional talent. Send your resume to us and we'll keep you in mind for future openings.</p>
        <a href="mailto:founders.ipolabs@gmail.com?subject=Speculative Application — IPO Labs" className="inline-block">
          <Button className="bg-white text-[#003366] hover:bg-gray-100 rounded-full px-8 font-semibold">Send Resume</Button>
        </a>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white/50 py-6 px-8 text-center text-xs">
        <p>&copy; {new Date().getFullYear()} IPO Labs AI Private Limited. All rights reserved.</p>
      </footer>

      {/* Apply Dialog */}
      <Dialog open={!!applyingTo} onOpenChange={() => setApplyingTo(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-[#003366]" /> Apply — {applyingTo?.title}</DialogTitle>
            <DialogDescription>{applyingTo?.department} &middot; {applyingTo?.location}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name *</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your full name" data-testid="apply-name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email *</Label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@email.com" data-testid="apply-email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91 98765 43210" data-testid="apply-phone" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Earliest Date of Joining *</Label>
                <Input type="date" value={form.date_of_joining} onChange={e => setForm({...form, date_of_joining: e.target.value})} data-testid="apply-doj" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Total Years of Sales Experience</Label>
                <Input type="number" min="0" value={form.sales_experience} onChange={e => setForm({...form, sales_experience: e.target.value})} placeholder="0" data-testid="apply-sales-exp" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Total Years of Accounting Experience</Label>
                <Input type="number" min="0" value={form.accounting_experience} onChange={e => setForm({...form, accounting_experience: e.target.value})} placeholder="0" data-testid="apply-acc-exp" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Current Residing Address</Label>
              <Textarea value={form.current_address} onChange={e => setForm({...form, current_address: e.target.value})} placeholder="Your full current address" rows={2} data-testid="apply-address" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Upload CV / Resume *</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-[#003366] transition-colors"
                onClick={() => fileRef.current?.click()}>
                {cvFile ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-green-700"><CheckCircle2 className="w-4 h-4" /> {cvFile.name}</div>
                ) : (
                  <div className="text-muted-foreground"><Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" /><p className="text-xs">Click to upload PDF, DOC, or DOCX</p></div>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setCvFile(e.target.files?.[0] || null)} data-testid="apply-cv-input" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyingTo(null)}>Cancel</Button>
            <Button onClick={handleApply} disabled={submitting} className="bg-[#003366] hover:bg-[#002244] gap-2" data-testid="submit-application-btn">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><CheckCircle2 className="w-4 h-4" /> Submit Application</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Position Dialog */}
      <Dialog open={showAddPosition} onOpenChange={setShowAddPosition}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-[#003366]" /> Add New Position</DialogTitle>
            <DialogDescription>Create a new job listing</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Job Title *</Label><Input value={newPos.title} onChange={e => setNewPos({...newPos, title: e.target.value})} placeholder="e.g., Product Manager" data-testid="new-pos-title" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Department *</Label><Input value={newPos.department} onChange={e => setNewPos({...newPos, department: e.target.value})} placeholder="e.g., Product" data-testid="new-pos-dept" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Location *</Label><Input value={newPos.location} onChange={e => setNewPos({...newPos, location: e.target.value})} placeholder="Mumbai, WFO" data-testid="new-pos-location" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Experience</Label><Input value={newPos.experience} onChange={e => setNewPos({...newPos, experience: e.target.value})} placeholder="0-2 Years" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Type</Label>
                <Select value={newPos.type} onValueChange={v => setNewPos({...newPos, type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Full-time">Full-time</SelectItem><SelectItem value="Part-time">Part-time</SelectItem><SelectItem value="Internship">Internship</SelectItem><SelectItem value="Contract">Contract</SelectItem></SelectContent></Select>
              </div>
              <div className="flex items-end pb-1 gap-3">
                <Label className="text-xs">Freshers Welcome?</Label>
                <Switch checked={newPos.freshers_welcome} onCheckedChange={v => setNewPos({...newPos, freshers_welcome: v})} />
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Description</Label><Textarea value={newPos.description} onChange={e => setNewPos({...newPos, description: e.target.value})} rows={3} placeholder="About the role..." /></div>
            <div className="space-y-1.5"><Label className="text-xs">Requirements (one per line)</Label><Textarea value={newPos.requirements} onChange={e => setNewPos({...newPos, requirements: e.target.value})} rows={3} placeholder="Bachelor's degree in...\n2+ years experience in..." /></div>
            <div className="space-y-1.5"><Label className="text-xs">Responsibilities (one per line)</Label><Textarea value={newPos.responsibilities} onChange={e => setNewPos({...newPos, responsibilities: e.target.value})} rows={3} placeholder="Lead product strategy...\nCollaborate with engineering..." /></div>
            <div className="space-y-1.5"><Label className="text-xs">Tags (comma-separated)</Label><Input value={newPos.tags} onChange={e => setNewPos({...newPos, tags: e.target.value})} placeholder="Product, Strategy, SaaS" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPosition(false)}>Cancel</Button>
            <Button onClick={handleAddPosition} disabled={addLoading} className="bg-[#003366] hover:bg-[#002244] gap-2" data-testid="save-position-btn">
              {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Position
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CareersPage;
