import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  Calculator, ArrowRight, Plus, Loader2, Trash2, Clock, CheckCircle2,
  FileText, Building2, TrendingUp, Scale, AlertTriangle, BarChart3
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PURPOSE_LABELS = {
  ma: "Merger & Acquisition",
  esop: "ESOP Pricing",
  ipo: "IPO Valuation",
  family_settlement: "Family Settlement",
  tax_assessment: "Tax Assessment"
};

const ValuationModule = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await apiClient.get("/valuation/projects");
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    setCreating(true);
    try {
      const res = await apiClient.post("/valuation/projects", { company_profile: {} });
      navigate(`/valuation/${res.data.valuation_id}/wizard`);
    } catch (err) {
      toast.error("Failed to create valuation project");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/valuation/projects/${id}`);
      setProjects(prev => prev.filter(p => p.valuation_id !== id));
      toast.success("Project deleted");
    } catch (err) {
      toast.error("Failed to delete project");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="valuation-module-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64">
        {/* Disclaimer Dialog */}
        <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Important Disclaimer
              </DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                This valuation is generated through <strong>IPO Labs</strong> and is <strong>AI-assisted</strong>. It does not replace professional judgment and is subject to final review by a qualified CA/registered valuer.
              </p>
              <p>
                Final certification by CA / Registered Valuer / SEBI-registered Category I Merchant Banker is <strong>needed and mandatory</strong> for regulatory filings per Companies Act 2013 and SEBI regulations.
              </p>
              <p>
                This document is <strong>not to be used, duplicated, or relied upon</strong> for legal/regulatory filings without professional certification, signature, and stamps.
              </p>
              <p className="text-xs text-gray-400">
                Based on information available as of date. Subject to change.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowDisclaimer(false)} className="bg-[#003366] hover:bg-[#002244]" data-testid="disclaimer-accept-btn">
                I Understand & Accept
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#003366] to-[#001a33] text-white">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Scale className="w-6 h-6 text-[#00D1FF]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Automated Business Valuation</h1>
                  <p className="text-sm text-blue-200 mt-0.5">AI-powered valuation compliant with Indian regulatory frameworks</p>
                </div>
              </div>
              <Button
                onClick={handleCreateNew}
                disabled={creating}
                className="bg-[#00D1FF] hover:bg-[#00b8e6] text-[#003366] font-semibold gap-2"
                data-testid="new-valuation-btn"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                New Valuation
              </Button>
            </div>
          </div>
        </div>

        {/* Features Bar */}
        <div className="bg-white border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center justify-center gap-6 text-xs">
              {[
                { icon: Calculator, text: "DCF / NAV / CCM / DDM" },
                { icon: FileText, text: "SEBI & Companies Act Compliant" },
                { icon: TrendingUp, text: "Sensitivity Analysis" },
                { icon: BarChart3, text: "AI Risk Assessment" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <f.icon className="w-3.5 h-3.5 text-[#003366]" />
                  <span className="text-muted-foreground">{f.text}</span>
                  {i < 3 && <div className="w-px h-3 bg-border ml-4" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-[#003366]" />
            </div>
          ) : projects.length === 0 ? (
            <Card className="border border-dashed border-gray-300 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Scale className="w-8 h-8 text-[#003366]" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-1">No Valuations Yet</h3>
                <p className="text-sm text-muted-foreground mb-6">Start your first automated business valuation</p>
                <Button onClick={handleCreateNew} disabled={creating} className="bg-[#003366] hover:bg-[#002244] gap-2" data-testid="empty-new-valuation-btn">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Valuation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <Card key={p.valuation_id} className="border border-border hover:border-[#00D1FF] transition-all hover:shadow-md cursor-pointer group" data-testid={`valuation-card-${p.valuation_id}`}>
                  <CardContent className="p-5" onClick={() => {
                    if (p.status === "completed") navigate(`/valuation/${p.valuation_id}/results`);
                    else navigate(`/valuation/${p.valuation_id}/wizard`);
                  }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-[#003366]" />
                      </div>
                      <Badge className={
                        p.status === "completed" ? "bg-green-100 text-green-700" :
                        p.status === "in_progress" ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-600"
                      }>
                        {p.status === "completed" ? "Completed" : p.status === "in_progress" ? "In Progress" : "Draft"}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-black text-sm mb-1 group-hover:text-[#003366]">
                      {p.company_profile?.company_name || "Untitled Valuation"}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      {PURPOSE_LABELS[p.company_profile?.purpose] || "General Valuation"}
                      {p.company_profile?.industry ? ` • ${p.company_profile.industry}` : ""}
                    </p>
                    {p.results?.confidence_score && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-1.5 flex-1 bg-gray-100 rounded-full">
                          <div className="h-full bg-[#003366] rounded-full" style={{ width: `${p.results.confidence_score}%` }} />
                        </div>
                        <span className="text-xs font-medium text-[#003366]">{p.results.confidence_score}%</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(p.updated_at).toLocaleDateString("en-IN")}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(p.valuation_id); }}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        data-testid={`delete-valuation-${p.valuation_id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Disclaimer Footer Link */}
          <div className="mt-8 text-center">
            <button onClick={() => setShowDisclaimer(true)} className="text-xs text-gray-400 hover:text-[#003366] underline" data-testid="disclaimer-link">
              View Disclaimer
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ValuationModule;
