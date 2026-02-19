import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import Sidebar from "@/components/Sidebar";
import {
  Building2,
  FileText,
  TrendingUp,
  Users,
  BarChart3,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Loader2,
  Scale
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

const Dashboard = ({ user, apiClient }) => {
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
      // Navigate to the new project
      navigate(`/drhp-builder/${response.data.project_id}`);
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setCreating(false);
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case "Assessment": return "bg-yellow-100 text-yellow-800";
      case "Drafting": return "bg-blue-100 text-blue-800";
      case "Filed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const modules = [
    {
      id: "assessment",
      title: "Free IPO Assessment",
      description: "AI-powered readiness check with gap analysis",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      disabled: false,
      path: "/assessment"
    },
    {
      id: "drhp",
      title: "DRHP Builder",
      description: "End-to-end document generation with version control",
      icon: FileText,
      color: "text-[#1DA1F2]",
      bgColor: "bg-blue-50",
      disabled: false
    },
    {
      id: "funding",
      title: "IPO Funding",
      description: "Human + AI powered capital orchestration platform",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      disabled: false,
      path: "/funding"
    },
    {
      id: "matchmaker",
      title: "IPO Match Maker",
      description: "Connect with CAs, CS, CFOs, and experts",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      disabled: false,
      path: "/matchmaker"
    },
    {
      id: "analytics",
      title: "Market & DRHP Analytics",
      description: "Real-time market insights and analysis",
      icon: BarChart3,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      disabled: true
    }
  ];

  return (
    <div className="flex min-h-screen bg-white" data-testid="dashboard-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-black">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Welcome back, {user?.name || "User"}</p>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-2" data-testid="create-project-btn">
                    <Plus className="w-4 h-4" />
                    New IPO Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New IPO Project</DialogTitle>
                    <DialogDescription>
                      Start a new IPO project for your company
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
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.picture} alt={user?.name} />
                <AvatarFallback className="bg-[#1DA1F2] text-white">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Welcome Banner */}
          <Card className="border border-border bg-gradient-to-r from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#1DA1F2] rounded-2xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-black">
                    IntelliEngine Platform
                  </h2>
                  <p className="text-muted-foreground">by IPO Labs - Your complete IPO readiness solution</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modules Grid */}
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-black mb-4">Platform Modules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((module, index) => (
                <Card
                  key={module.id}
                  className={`border border-border card-hover cursor-pointer animate-fade-in stagger-${index + 1} ${module.disabled ? 'opacity-60' : ''}`}
                  onClick={() => {
                    if (module.disabled) return;
                    if (module.path) {
                      navigate(module.path);
                    } else if (module.id === 'drhp' && projects.length > 0) {
                      navigate(`/project/${projects[0].project_id}/command-center`);
                    }
                  }}
                  data-testid={`module-${module.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${module.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <module.icon className={`w-6 h-6 ${module.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-black truncate">{module.title}</h4>
                          {module.disabled && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Soon</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold tracking-tight text-black">Your IPO Projects</h3>
              {projects.length > 0 && (
                <Button variant="ghost" className="text-[#1DA1F2] gap-1" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Add Project
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
              </div>
            ) : projects.length === 0 ? (
              <Card className="border border-dashed border-border">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-black mb-2">No projects yet</h4>
                  <p className="text-muted-foreground mb-4">Create your first IPO project to get started</p>
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-2"
                    data-testid="empty-create-btn"
                  >
                    <Plus className="w-4 h-4" />
                    Create Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <Card
                    key={project.project_id}
                    className="border border-border card-hover cursor-pointer"
                    onClick={() => navigate(`/project/${project.project_id}/command-center`)}
                    data-testid={`project-card-${project.project_id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-black">
                            {project.company_name}
                          </CardTitle>
                          <CardDescription>{project.sector}</CardDescription>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStageColor(project.current_stage)}`}>
                          {project.current_stage}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-black">{project.progress_percentage}%</span>
                          </div>
                          <Progress value={project.progress_percentage} className="h-2" />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-[#1DA1F2] gap-1 h-8 px-2">
                            Open <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Legal Links Section */}
          <Card className="border border-border bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-8">
                <Link
                  to="/legal-disclaimer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#1DA1F2] transition-colors font-medium"
                  data-testid="dashboard-legal-disclaimer"
                >
                  <Scale className="w-4 h-4" />
                  Legal Disclaimer
                </Link>
                <div className="w-px h-4 bg-border" />
                <Link
                  to="/terms-of-use"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#1DA1F2] transition-colors font-medium"
                  data-testid="dashboard-terms-of-use"
                >
                  <FileText className="w-4 h-4" />
                  Terms of Use
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;