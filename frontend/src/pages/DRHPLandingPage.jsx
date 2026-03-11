import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Sparkles
} from "lucide-react";

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

const DRHPLandingPage = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ company_name: "", sector: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await apiClient.get("/projects");
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
      const response = await apiClient.post("/projects", newProject);
      setProjects([...projects, response.data]);
      setCreateDialogOpen(false);
      setNewProject({ company_name: "", sector: "" });
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
                onClick={() => navigate("/dashboard")} 
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              <div className="w-px h-6 bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1DA1F2] rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-black">DRHP Builder</h1>
                  <p className="text-xs text-muted-foreground">Centralised Corporate Repository</p>
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
                  className="border border-gray-200 bg-white hover:shadow-lg hover:border-[#1DA1F2] transition-all duration-200 cursor-pointer group"
                  onClick={() => navigate(`/project/${project.project_id}/command-center`)}
                  data-testid={`project-card-${project.project_id}`}
                >
                  <CardHeader className="pb-3">
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
        </div>

        {/* Create Project Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New DRHP Project</DialogTitle>
              <DialogDescription>
                Start a new Draft Red Herring Prospectus project for your company
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  placeholder="Enter company name"
                  value={newProject.company_name}
                  onChange={(e) => setNewProject({ ...newProject, company_name: e.target.value })}
                  data-testid="company-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
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
      </main>
    </div>
  );
};

export default DRHPLandingPage;
