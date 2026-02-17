import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Sidebar from "@/components/Sidebar";
import {
  FileText,
  BookOpen,
  AlertTriangle,
  FileSearch,
  Landmark,
  Target,
  Calculator,
  Factory,
  Building,
  Users,
  DollarSign,
  Scale,
  MoreHorizontal,
  ArrowRight,
  ChevronRight,
  Loader2,
  Upload
} from "lucide-react";

const SECTION_ICONS = {
  "Cover Page": FileText,
  "Definitions and Abbreviations": BookOpen,
  "Risk Factors": AlertTriangle,
  "Introduction and Summary": FileSearch,
  "Capital Structure": Landmark,
  "Objects of the Issue": Target,
  "Basis for Issue Price": Calculator,
  "Industry Overview": Factory,
  "Business Overview": Building,
  "Management & Promoter Group": Users,
  "Financial Information": DollarSign,
  "Legal and Regulatory Matters": Scale,
  "Other Information/Disclosures": MoreHorizontal
};

const DRHPBuilder = ({ user, apiClient }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, sectionsRes] = await Promise.all([
        apiClient.get(`/projects/${projectId}`),
        apiClient.get(`/projects/${projectId}/sections`)
      ]);
      setProject(projectRes.data);
      setSections(sectionsRes.data);
    } catch (error) {
      console.error("Failed to fetch project data:", error);
      if (error.response?.status === 404) {
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Draft":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Draft</Badge>;
      case "Review":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Review</Badge>;
      case "Final":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Final</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateProgress = () => {
    if (sections.length === 0) return 0;
    const completed = sections.filter(s => s.status === "Final").length;
    return Math.round((completed / sections.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white" data-testid="drhp-builder-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-border px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <button onClick={() => navigate("/dashboard")} className="hover:text-black">Dashboard</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-black font-medium">DRHP Builder</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-black">
                {project?.company_name} - DRHP
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {project?.sector} • {project?.current_stage}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-lg font-semibold text-black">{calculateProgress()}%</p>
              </div>
              <div className="w-32">
                <Progress value={calculateProgress()} className="h-2" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-6">
          {/* Project Info Card */}
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1DA1F2]/10 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#1DA1F2]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black">Draft Red Herring Prospectus</h3>
                    <p className="text-sm text-muted-foreground">
                      {sections.length} sections • {sections.filter(s => s.status === "Final").length} completed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#1DA1F2] hover:bg-[#1a8cd8]">
                    SEBI Compliant
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sections Grid */}
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-black mb-4">DRHP Sections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sections.map((section, index) => {
                const IconComponent = SECTION_ICONS[section.section_name] || FileText;
                return (
                  <Card
                    key={section.section_id}
                    className="border border-border card-hover cursor-pointer"
                    onClick={() => navigate(`/drhp-builder/${projectId}/section/${section.section_id}`)}
                    data-testid={`section-card-${index}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-medium text-black truncate">
                              {section.section_name}
                            </h4>
                            {getStatusBadge(section.status)}
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Upload className="w-3 h-3" />
                              {section.documents?.length || 0} documents
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Updated {new Date(section.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DRHPBuilder;