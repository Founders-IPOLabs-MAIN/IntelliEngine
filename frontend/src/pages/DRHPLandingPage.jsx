import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  FileText,
  Plus,
  ArrowRight,
  ArrowLeft,
  Clock,
  Loader2,
  Building2,
  FolderOpen,
  Briefcase,
  Calculator,
  Trash2,
  RotateCcw,
  History,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SECTORS = [
  "Technology",
  "Healthcare",
  "Financial Services",
  "Manufacturing",
  "Consumer Goods",
  "Energy",
  "Real Estate",
  "Telecommunications",
  "Other"
];

const BOARD_TYPES = ["SME", "Main Board"];
const EXCHANGES = ["NSE", "BSE"];
const ISSUE_TYPES = [
  "Book Building Issue",
  "Fixed Price Issue",
  "Offer for Sale (OFS)",
  "Fresh Issue",
];

const USER_TYPE_META = {
  merchant_banker: { label: "Merchant Banker", icon: Briefcase, accent: "#1DA1F2", tag: "bg-blue-50 text-blue-700 border-blue-200" },
  company:         { label: "Company",         icon: Building2, accent: "#059669", tag: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ca_firm:         { label: "CA Firm",         icon: Calculator, accent: "#D97706", tag: "bg-amber-50 text-amber-700 border-amber-200" },
};

const DRHPLandingPage = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const { userLoginType } = useParams();
  const typeMeta = USER_TYPE_META[userLoginType] || USER_TYPE_META.company;
  const HeaderIcon = typeMeta.icon;

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    company_name: "",
    sector: "",
    board_type: "",
    exchange: "",
    issue_type: "",
  });
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // project pending confirmation
  const [deletedProjects, setDeletedProjects] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [busyArchive, setBusyArchive] = useState(null);

  useEffect(() => {
    fetchProjects();
    fetchDeletedProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoginType]);

  const fetchDeletedProjects = async () => {
    try {
      const r = await apiClient.get("/projects/deleted/list");
      setDeletedProjects(r.data?.archives || []);
    } catch {
      // silent — endpoint may not be reachable yet on first deploy
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      const r = await apiClient.delete(`/projects/${target.project_id}`);
      toast.success(
        `"${target.company_name}" deleted. You can restore it for the next ${r.data?.retention_days ?? 60} days from "Recently deleted".`
      );
      await Promise.all([fetchProjects(), fetchDeletedProjects()]);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not delete project");
    }
  };

  const handleRestore = async (archive) => {
    setBusyArchive(archive.archive_id);
    try {
      await apiClient.post(`/projects/deleted/${archive.archive_id}/restore`);
      toast.success(`"${archive.company_name}" restored.`);
      await Promise.all([fetchProjects(), fetchDeletedProjects()]);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not restore project");
    } finally {
      setBusyArchive(null);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const url = userLoginType ? `/projects?user_login_type=${userLoginType}` : "/projects";
      const response = await apiClient.get(url);
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.company_name || !newProject.sector) return;

    setCreating(true);
    try {
      const payload = {
        company_name: newProject.company_name,
        sector: newProject.sector,
        user_login_type: userLoginType || null,
        board_type: newProject.board_type || null,
        exchange: newProject.exchange || null,
        issue_type: newProject.issue_type || null,
      };
      const response = await apiClient.post("/projects", payload);
      setProjects([...projects, response.data]);
      setCreateDialogOpen(false);
      setNewProject({ company_name: "", sector: "", board_type: "", exchange: "", issue_type: "" });
      toast.success("Project created successfully!");
      navigate(`/project/${response.data.project_id}/command-center`);
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case "Assessment": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Drafting": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Filed": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="drhp-landing-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate("/drhp")} 
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
                data-testid="drhp-back-to-selector-btn"
              >
                <ArrowLeft className="w-4 h-4" />
                Change Profile
              </button>
              <div className="w-px h-6 bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1DA1F2] rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-black">DRHP Builder</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <HeaderIcon className="w-3.5 h-3.5" style={{ color: typeMeta.accent }} />
                    <p className="text-xs text-muted-foreground">
                      {typeMeta.label} workspace • Centralised Corporate Repository
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-2"
              data-testid="create-project-btn"
            >
              <Plus className="w-4 h-4" />
              New DRHP Project
            </Button>
          </div>
        </header>

        <div className="p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#1DA1F2] to-blue-600 rounded-2xl flex items-center justify-center">
                    <FolderOpen className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Ongoing DRHP Projects</h2>
                    <p className="text-sm text-gray-600">
                      Select a project to continue working on your Draft Red Herring Prospectus
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Badge variant="outline" className="bg-white text-[#1DA1F2] border-[#1DA1F2]">
                      {projects.length} {projects.length === 1 ? "Project" : "Projects"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-[#1DA1F2]" />
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No DRHP Projects Yet</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Create your first DRHP project to start building your Draft Red Herring Prospectus
                </p>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-2"
                  size="lg"
                  data-testid="empty-create-btn"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project) => (
                <Card
                  key={project.project_id}
                  className="border border-gray-200 bg-white hover:shadow-lg hover:border-[#1DA1F2] transition-all duration-200 cursor-pointer group relative"
                  onClick={() => navigate(`/project/${project.project_id}/command-center`)}
                  data-testid={`project-card-${project.project_id}`}
                >
                  {/* Delete button — top-right of card */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                    className="absolute top-3 right-3 z-10 w-8 h-8 inline-flex items-center justify-center rounded-md text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors opacity-60 group-hover:opacity-100"
                    title="Delete project"
                    data-testid={`project-delete-btn-${project.project_id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <CardHeader className="pb-3 pr-12">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-[#1DA1F2] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold text-gray-900">
                            {project.company_name}
                          </CardTitle>
                          <CardDescription className="text-xs">{project.sector}</CardDescription>
                          {/* Classification badges directly under project name */}
                          {(project.board_type || project.exchange || project.issue_type) && (
                            <div className="flex flex-wrap gap-1 mt-1.5" data-testid={`project-badges-${project.project_id}`}>
                              {project.board_type && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5 bg-indigo-50 text-indigo-700 border-indigo-200 font-medium">
                                  {project.board_type}
                                </Badge>
                              )}
                              {project.exchange && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5 bg-cyan-50 text-cyan-700 border-cyan-200 font-medium">
                                  {project.exchange}
                                </Badge>
                              )}
                              {project.issue_type && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5 bg-rose-50 text-rose-700 border-rose-200 font-medium">
                                  {project.issue_type}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getStageColor(project.current_stage)}`}>
                          {project.current_stage}
                        </span>
                        <span className="text-sm font-semibold text-[#1DA1F2]">{project.progress_percentage}%</span>
                      </div>
                      <Progress value={project.progress_percentage} className="h-2" />
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[#1DA1F2] font-medium group-hover:gap-2 transition-all">
                          Open Project <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ─── Recently Deleted (recoverable up to 60 days) ─── */}
          {deletedProjects.length > 0 && (
            <div className="mt-10" data-testid="deleted-projects-section">
              <button
                onClick={() => setShowDeleted((s) => !s)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 mb-3"
                data-testid="toggle-deleted-projects"
              >
                <History className="w-4 h-4" />
                Recently deleted ({deletedProjects.length}) — recoverable for 60 days
                <ArrowRight className={`w-3 h-3 transition-transform ${showDeleted ? "rotate-90" : ""}`} />
              </button>
              {showDeleted && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-white border-b border-gray-200">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600 uppercase text-[10px] tracking-wide">Company</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600 uppercase text-[10px] tracking-wide">Deleted</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600 uppercase text-[10px] tracking-wide">Auto-purge after</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600 uppercase text-[10px] tracking-wide">Rows archived</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {deletedProjects.map((a) => (
                        <tr key={a.archive_id} className="border-b border-gray-100 last:border-0 hover:bg-white" data-testid={`deleted-row-${a.archive_id}`}>
                          <td className="px-3 py-2 font-semibold text-gray-900">{a.company_name}</td>
                          <td className="px-3 py-2 text-gray-600">{new Date(a.deleted_at).toLocaleString()}</td>
                          <td className="px-3 py-2 text-amber-700">{new Date(a.purge_after).toLocaleDateString()}</td>
                          <td className="px-3 py-2 text-gray-700 tabular-nums">{a.total_rows_archived}</td>
                          <td className="px-3 py-2 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleRestore(a)}
                              disabled={busyArchive === a.archive_id}
                              data-testid={`restore-archive-btn-${a.archive_id}`}
                            >
                              {busyArchive === a.archive_id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3.5 h-3.5" />
                              )}
                              Restore
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Project Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[540px]">
            <DialogHeader>
              <DialogTitle>Create New DRHP Project</DialogTitle>
              <DialogDescription>
                Start a new Draft Red Herring Prospectus project for your company
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name <span className="text-red-500">*</span></Label>
                <Input
                  id="company_name"
                  placeholder="Enter company name"
                  value={newProject.company_name}
                  onChange={(e) => setNewProject({ ...newProject, company_name: e.target.value })}
                  data-testid="company-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">Sector <span className="text-red-500">*</span></Label>
                <Select
                  value={newProject.sector}
                  onValueChange={(value) => setNewProject({ ...newProject, sector: value })}
                >
                  <SelectTrigger data-testid="sector-select">
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="board_type">Board Type</Label>
                  <Select
                    value={newProject.board_type}
                    onValueChange={(value) => setNewProject({ ...newProject, board_type: value })}
                  >
                    <SelectTrigger id="board_type" data-testid="board-type-select">
                      <SelectValue placeholder="SME or Main Board" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOARD_TYPES.map((b) => (
                        <SelectItem key={b} value={b} data-testid={`board-opt-${b.toLowerCase().replace(/\s+/g,"-")}`}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exchange">Exchange</Label>
                  <Select
                    value={newProject.exchange}
                    onValueChange={(value) => setNewProject({ ...newProject, exchange: value })}
                  >
                    <SelectTrigger id="exchange" data-testid="exchange-select">
                      <SelectValue placeholder="NSE or BSE" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXCHANGES.map((e) => (
                        <SelectItem key={e} value={e} data-testid={`exchange-opt-${e.toLowerCase()}`}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue_type">Issue Type</Label>
                <Select
                  value={newProject.issue_type}
                  onValueChange={(value) => setNewProject({ ...newProject, issue_type: value })}
                >
                  <SelectTrigger id="issue_type" data-testid="issue-type-select">
                    <SelectValue placeholder="Select issue structure" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map((i) => (
                      <SelectItem key={i} value={i} data-testid={`issue-opt-${i.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Book Building (price range bidding) · Fixed Price (predetermined) · OFS (existing shares by promoters) · Fresh Issue (new shares for capital raising).
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={!newProject.company_name || !newProject.sector || creating}
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8]"
                data-testid="confirm-create-btn"
              >
                {creating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                ) : (
                  "Create Project"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <AlertDialogContent data-testid="project-delete-confirm-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this project?</AlertDialogTitle>
              <AlertDialogDescription>
                <b>{deleteTarget?.company_name}</b> will be removed from your active projects.
                A complete copy (project metadata, dashboard, all checklists, document repository, audit trail)
                is preserved in the <b>Recently deleted</b> archive for <b>60 days</b>, after which it is permanently purged.
                You can restore the project anytime within that window.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="project-delete-confirm-no">No</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                data-testid="project-delete-confirm-yes"
                onClick={handleConfirmDelete}
              >
                Yes, delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default DRHPLandingPage;
