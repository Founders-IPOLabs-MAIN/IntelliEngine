import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight, Plus, Trash2, Loader2, Clock, Sparkles, Brain,
  Calculator, Layers, BarChart3, Shield, CheckCircle2, RefreshCcw,
  Building2, FileText, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

const BVProjectsLanding = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showAudit, setShowAudit] = useState(false);

  const fetchAll = async () => {
    try {
      const [a, b] = await Promise.all([
        apiClient.get("/bv-projects"),
        apiClient.get("/bv-projects/deleted/list"),
      ]);
      setProjects(a.data?.projects || []);
      setArchives(b.data?.archives || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);  // eslint-disable-line

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await apiClient.post("/bv-projects", {});
      navigate(`/valuation-2/${res.data.project_id}/inputs`);
    } catch (e) {
      toast.error("Could not create project");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await apiClient.delete(`/bv-projects/${confirmDelete.project_id}`);
      toast.success("Project moved to audit log (30-day retention)");
      setConfirmDelete(null);
      fetchAll();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleRestore = async (archive_id) => {
    try {
      await apiClient.post(`/bv-projects/deleted/${archive_id}/restore`);
      toast.success("Project restored");
      fetchAll();
    } catch (e) {
      toast.error("Failed to restore");
    }
  };

  // Visual accent palette borrowed from /assessment for parity
  const ACCENT_VIOLET = "#A78BFA";
  const ACCENT_EMERALD = "#34D399";
  const ACCENT_BLUE = "#00D1FF";
  const ACCENT_AMBER = "#FB923C";
  const ROTATING_ACCENTS = [ACCENT_VIOLET, ACCENT_EMERALD, ACCENT_BLUE, ACCENT_AMBER];

  return (
    <div className="flex min-h-screen bg-black" data-testid="bv-projects-landing">
      <Sidebar user={user} apiClient={apiClient} />

      <main className="flex-1 ml-64 relative overflow-hidden">
        {/* Black background with subtle gradient — exact /assessment treatment */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-[#111] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Sticky Header */}
          <header className="sticky top-0 z-20 backdrop-blur-md bg-black/35 border-b border-white/10 px-8 lg:px-12 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1
                className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white"
                style={{ letterSpacing: "-0.02em" }}
              >
                BV Engine — Business Valuation
              </h1>
              <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs text-white/80">
                <Brain className="w-3 h-3 text-yellow-300" />
                <span className="font-medium">AI Powered</span>
              </div>
            </div>
            <div className="flex items-center gap-5 text-xs text-white/70">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{projects.length}</p>
                <p>Projects</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-lg font-bold text-white">3</p>
                <p>Methods</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-lg font-bold text-white">30d</p>
                <p>Audit</p>
              </div>
            </div>
          </header>

          {/* Features Bar */}
          <div className="backdrop-blur-sm bg-white/5 border-b border-white/10">
            <div className="px-8 lg:px-12 py-2.5 flex items-center justify-center gap-6 text-xs text-white/60">
              <span className="flex items-center gap-1.5"><Calculator className="w-3.5 h-3.5 text-emerald-400" /> DCF Valuation</span>
              <span className="w-px h-3 bg-white/20" />
              <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-emerald-400" /> NAV Method</span>
              <span className="w-px h-3 bg-white/20" />
              <span className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Comparable Co.</span>
              <span className="w-px h-3 bg-white/20" />
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-400" /> 30-Day Audit</span>
            </div>
          </div>

          {/* Hero */}
          <section className="px-8 lg:px-12 pt-10 pb-6 max-w-5xl">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
              Three Valuations.{" "}
              <span style={{ color: ACCENT_VIOLET }}>One Engine.</span>
            </h2>
            <p className="mt-4 text-white/70 text-base lg:text-lg leading-relaxed max-w-2xl">
              Capture your P&amp;L, Balance Sheet and DCF assumptions once — the BV Engine runs DCF, NAV and Comparable Company valuations in parallel, with a sector-aware peer set.
            </p>
          </section>

          {/* Content Grid: Projects + Sidebar */}
          <section className="px-8 lg:px-12 pb-8 flex-1">
            <div className="grid grid-cols-3 gap-5">
              {/* LEFT — Projects column (2/3) */}
              <div className="col-span-2 grid grid-cols-2 gap-4">
                {/* Create New card — always visible, styled like a module tile */}
                <Card
                  onClick={handleCreate}
                  className="bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:bg-white/18 cursor-pointer group shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = ACCENT_VIOLET;
                    e.currentTarget.style.boxShadow = `0 20px 40px -10px ${ACCENT_VIOLET}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "";
                    e.currentTarget.style.boxShadow = "";
                  }}
                  data-testid="bv-create-btn"
                >
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                      {creating ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Plus className="w-6 h-6 text-white" />}
                    </div>
                    <h3 className="text-base font-bold text-white mb-1.5 drop-shadow">Create New BV Project</h3>
                    <p className="text-xs text-white/70 leading-relaxed mb-4 flex-1 drop-shadow">
                      Start a fresh business valuation. We'll create a blank input sheet for your P&amp;L, Balance Sheet and DCF assumptions.
                    </p>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2.5 transition-all" style={{ color: ACCENT_VIOLET }}>
                      Start Now <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </CardContent>
                </Card>

                {/* Existing project cards */}
                {loading ? (
                  <Card className="bg-white/10 backdrop-blur-xl border-2 border-white/20 shadow-2xl">
                    <CardContent className="p-5 flex flex-col items-center justify-center h-full text-white/55 text-sm gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> Loading projects…
                    </CardContent>
                  </Card>
                ) : projects.length === 0 ? (
                  <Card className="bg-white/5 backdrop-blur-xl border border-dashed border-white/20 shadow-2xl">
                    <CardContent className="p-5 flex flex-col items-center justify-center h-full text-center">
                      <BarChart3 className="w-8 h-8 text-white/30 mb-2" />
                      <p className="text-xs text-white/55">
                        No projects yet. Click <strong className="text-white/75">Create New BV Project</strong> to begin.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  projects.map((p, i) => {
                    const accent = ROTATING_ACCENTS[i % ROTATING_ACCENTS.length];
                    return (
                      <Card
                        key={p.project_id}
                        className="bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:bg-white/18 group shadow-2xl transition-all duration-300 hover:-translate-y-1 relative"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = accent;
                          e.currentTarget.style.boxShadow = `0 20px 40px -10px ${accent}40`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "";
                          e.currentTarget.style.boxShadow = "";
                        }}
                        data-testid={`bv-card-${p.project_id}`}
                      >
                        <CardContent className="p-5 flex flex-col h-full">
                          {/* Top row: icon tile + delete button */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDelete(p); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-white/55 hover:text-rose-300 hover:bg-rose-500/15"
                              data-testid={`bv-delete-${p.project_id}`}
                              aria-label="Delete project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {/* Title + meta */}
                          <h3
                            className="text-base font-bold text-white mb-1.5 drop-shadow line-clamp-2"
                            data-testid={`bv-proj-title-${p.project_id}`}
                          >
                            {p.company_name || "Untitled BV Project"}
                          </h3>
                          <div className="text-[10px] text-white/55 leading-relaxed mb-3 flex flex-wrap gap-2">
                            {p.website && <span className="truncate max-w-[140px]">{p.website}</span>}
                            {p.plan_for_ipo === "yes" && (
                              <span className="text-emerald-300/85">IPO {p.ipo_timeline ? `· ${p.ipo_timeline}` : ""}</span>
                            )}
                            <span className="text-white/35">
                              Updated {new Date(p.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                            </span>
                          </div>
                          {/* Action row */}
                          <div className="mt-auto flex items-center justify-between gap-2">
                            <button
                              onClick={() => navigate(`/valuation-2/${p.project_id}/inputs`)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/65 hover:text-white"
                              data-testid={`bv-open-inputs-${p.project_id}`}
                            >
                              Edit Inputs
                            </button>
                            <button
                              onClick={() => navigate(`/valuation-2/${p.project_id}`)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2.5 transition-all"
                              style={{ color: accent }}
                              data-testid={`bv-open-engine-${p.project_id}`}
                            >
                              Open Engine <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* RIGHT — How It Works + Quick Start + Audit Log + Disclaimer */}
              <div className="space-y-4">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-bold text-white mb-4">How It Works</h3>
                    <div className="space-y-3">
                      {[
                        { label: "New Project",    sub: "Create a workspace for your company" },
                        { label: "Fill Inputs",    sub: "P&L, Balance Sheet, DCF assumptions" },
                        { label: "Open Engine",    sub: "DCF · NAV · Comparable Co. in parallel" },
                        { label: "Save / Iterate", sub: "Tune assumptions; re-run anytime" },
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-emerald-400">{i + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-white text-xs">{step.label}</h4>
                            <p className="text-[10px] text-white/50">{step.sub}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Start — gradient violet/indigo to lean into BV Engine accent */}
                <Card className="bg-gradient-to-br from-violet-600/80 to-indigo-700/80 backdrop-blur-xl border border-violet-400/30">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span className="text-xs font-medium text-white">Quick Start</span>
                    </div>
                    <h3 className="font-semibold text-sm text-white mb-2">Run your first valuation in minutes.</h3>
                    <p className="text-[10px] text-violet-100 mb-3">
                      Three valuation methods. Sector-aware peers. SEBI &amp; RBI-aligned outputs.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleCreate}
                      disabled={creating}
                      className="w-full bg-white text-violet-700 hover:bg-violet-50 gap-1.5 h-8 text-xs"
                      data-testid="bv-quickstart-btn"
                    >
                      {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Start New Valuation
                    </Button>
                  </CardContent>
                </Card>

                {/* Audit Log card */}
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-300" />
                        <h3 className="text-xs font-bold text-white">Audit Log</h3>
                      </div>
                      <span className="text-[10px] text-white/45">{archives.length} item{archives.length !== 1 && "s"}</span>
                    </div>
                    <p className="text-[10px] text-white/55 mb-3">
                      Deleted projects stay recoverable for <strong className="text-white/75">30 days</strong>, then are permanently purged.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAudit(true)}
                      className="w-full bg-white/5 border-white/15 text-white/80 hover:bg-white/10 h-8 text-xs"
                      data-testid="bv-audit-btn"
                    >
                      Open Audit Log
                    </Button>
                  </CardContent>
                </Card>

                {/* Disclaimer */}
                <div className="bg-amber-500/10 backdrop-blur-sm rounded-lg p-3 border border-amber-400/20">
                  <div className="flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-200/80">
                      <strong>Disclaimer:</strong> Outputs are indicative. Validate with your CA / merchant banker before any transaction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Delete confirm */}
        <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
          <DialogContent className="bg-[#0d0d0d] border border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Delete project?</DialogTitle>
              <DialogDescription className="text-white/60">
                <strong className="text-white/80">{confirmDelete?.company_name}</strong> moves to the audit log. Recoverable for <strong className="text-white/80">30 days</strong>, then permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDelete(null)} className="bg-transparent border-white/15 text-white/70">Cancel</Button>
              <Button onClick={handleDelete} className="bg-rose-500 hover:bg-rose-400 text-white" data-testid="bv-confirm-delete">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Audit log dialog */}
        <Dialog open={showAudit} onOpenChange={setShowAudit}>
          <DialogContent className="bg-[#0d0d0d] border border-white/10 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Audit Log — Deleted BV Projects (30-day retention)</DialogTitle>
            </DialogHeader>
            {archives.length === 0 ? (
              <p className="text-white/55 text-sm">No deleted projects.</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {archives.map((a) => (
                  <div key={a.archive_id} className="flex items-center justify-between p-3 bg-white/[0.04] border border-white/10 rounded-md">
                    <div>
                      <div className="text-sm text-white/85">{a.company_name || "Untitled"}</div>
                      <div className="text-[10px] text-white/45">
                        Deleted {new Date(a.deleted_at).toLocaleString("en-IN")} · purges {new Date(a.purge_after).toLocaleDateString("en-IN")}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleRestore(a.archive_id)} className="bg-transparent border-white/15 text-white/75 hover:bg-white/5 rounded-full text-xs gap-1">
                      <RefreshCcw className="w-3 h-3" /> Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default BVProjectsLanding;
