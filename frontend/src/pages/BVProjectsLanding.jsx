import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, BarChart3, Loader2, Clock, ArrowRight, Sparkles, RefreshCcw } from "lucide-react";
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

  return (
    <div className="flex min-h-screen bg-black" data-testid="bv-projects-landing">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-[#111] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ background: "radial-gradient(circle at 25% 20%, rgba(167,139,250,0.4), transparent 40%), radial-gradient(circle at 80% 70%, rgba(34,211,238,0.3), transparent 45%)" }}
        />

        <div className="relative z-10 px-8 lg:px-12 py-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[10px] tracking-[0.18em] uppercase text-white/55 mb-3">
                <Sparkles className="w-3 h-3 text-violet-300" />
                BV Engine
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                Business Valuation Projects
              </h1>
              <p className="text-sm text-white/55 mt-2 max-w-2xl">
                Each project captures your P&L, Balance Sheet and DCF assumptions, then runs DCF · NAV · Comparable Company in parallel.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAudit(true)}
                className="bg-transparent border-white/15 text-white/70 hover:bg-white/5 rounded-full gap-1.5 px-4 h-9 text-xs"
                data-testid="bv-audit-btn"
              >
                <Clock className="w-3.5 h-3.5" /> Audit Log ({archives.length})
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white rounded-full gap-1.5 px-5 h-9 text-xs font-medium"
                data-testid="bv-create-btn"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create New BV Project
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-white/55 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading projects…
            </div>
          ) : projects.length === 0 ? (
            <Card className="bg-white/[0.04] backdrop-blur-xl border border-white/10">
              <CardContent className="p-12 flex flex-col items-center text-center">
                <BarChart3 className="w-10 h-10 text-violet-300/60 mb-3" />
                <h3 className="text-white text-lg font-semibold tracking-tight">No BV projects yet</h3>
                <p className="text-sm text-white/55 mt-1 mb-5">
                  Create your first Business Valuation project — start with a blank input sheet.
                </p>
                <Button
                  onClick={handleCreate}
                  className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white rounded-full px-6 h-10 text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Create New BV Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-2 gap-4" data-testid="bv-projects-list">
              {projects.map((p) => (
                <Card key={p.project_id} className="bg-white/[0.04] backdrop-blur-xl border border-white/10 hover:border-white/25 transition-all group">
                  <CardContent className="p-5 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold tracking-tight" data-testid={`bv-proj-title-${p.project_id}`}>
                          {p.company_name || "Untitled BV Project"}
                        </h3>
                        <div className="flex items-center gap-3 text-[11px] text-white/45 mt-0.5">
                          <span>{p.website || "no website"}</span>
                          {p.plan_for_ipo === "yes" && <span className="text-emerald-300/80">IPO planned · {p.ipo_timeline || "—"}</span>}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-white/40 hover:text-rose-300 hover:bg-rose-500/10"
                        onClick={() => setConfirmDelete(p)}
                        data-testid={`bv-delete-${p.project_id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="text-[10px] text-white/40 mb-4">
                      Updated {new Date(p.updated_at).toLocaleString("en-IN")}
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Button
                        onClick={() => navigate(`/valuation-2/${p.project_id}/inputs`)}
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-white/15 text-white/75 hover:bg-white/5 rounded-full text-xs"
                        data-testid={`bv-open-inputs-${p.project_id}`}
                      >
                        Edit Inputs
                      </Button>
                      <Button
                        onClick={() => navigate(`/valuation-2/${p.project_id}`)}
                        size="sm"
                        className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white rounded-full text-xs gap-1"
                        data-testid={`bv-open-engine-${p.project_id}`}
                      >
                        Open Valuation <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Delete confirm */}
        <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
          <DialogContent className="bg-[#0d0d0d] border border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Delete project?</DialogTitle>
              <DialogDescription className="text-white/60">
                <strong className="text-white/80">{confirmDelete?.company_name}</strong> will move to the audit log. It will stay recoverable for <strong className="text-white/80">30 days</strong>, then be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDelete(null)} className="bg-transparent border-white/15 text-white/70">Cancel</Button>
              <Button onClick={handleDelete} className="bg-rose-500 hover:bg-rose-400 text-white" data-testid="bv-confirm-delete">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Audit log */}
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
