import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import { DRHP_CHAPTERS } from "@/config/drhpChapters";
import {
  ChevronRight,
  Loader2,
  ArrowRight,
  ArrowLeft,
  FileText,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  Edit3
} from "lucide-react";

const DRHPSection = ({ user, apiClient }) => {
  const { projectId, sectionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [subModuleProgress, setSubModuleProgress] = useState({});
  
  // Find the chapter based on sectionId
  const chapter = DRHP_CHAPTERS.find(c => c.id === sectionId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, progressRes] = await Promise.all([
          apiClient.get(`/projects/${projectId}`),
          apiClient.get(`/projects/${projectId}/drhp-section-progress/${sectionId}`).catch(() => ({ data: {} }))
        ]);
        setProject(projectRes.data);
        setSubModuleProgress(progressRes.data || {});
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load section data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [apiClient, projectId, sectionId]);

  const getSubModuleStatus = (subModuleId) => {
    const progress = subModuleProgress[subModuleId];
    if (!progress) return { status: "Not Started", percent: 0 };
    if (progress.percent === 100) return { status: "Complete", percent: 100 };
    if (progress.percent > 50) return { status: "In Progress", percent: progress.percent };
    if (progress.percent > 0) return { status: "Draft", percent: progress.percent };
    return { status: "Not Started", percent: 0 };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Complete": return "bg-green-100 text-green-700 border-green-200";
      case "In Progress": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Draft": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Complete": return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "In Progress": return <Edit3 className="w-4 h-4 text-blue-600" />;
      case "Draft": return <Clock className="w-4 h-4 text-amber-600" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleReviewSection = async () => {
    toast.info("Generating review document...");
    // Navigate to review page
    navigate(`/project/${projectId}/drhp-review/${sectionId}`);
  };

  const handleSubmitSection = async () => {
    toast.info("Preparing section for export...");
    try {
      const response = await apiClient.post(`/projects/${projectId}/drhp-export/${sectionId}`, {}, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${chapter?.title || 'section'}_${projectId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Section exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export feature coming soon!");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
        </main>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Section not found</p>
            <Button onClick={() => navigate(`/project/${projectId}/command-center`)} className="mt-4">
              Back to Command Center
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const completedSubModules = chapter.subModules?.filter(sm => 
    subModuleProgress[sm.id]?.percent === 100
  ).length || 0;

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="drhp-section-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(`/project/${projectId}/command-center`)} 
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Command Center
              </button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Section {chapter.number}</p>
                <h1 className="text-lg font-semibold text-gray-900">{chapter.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2" onClick={handleReviewSection}>
                <Eye className="w-4 h-4" />
                Review
              </Button>
              <Button className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-2" onClick={handleSubmitSection}>
                <Download className="w-4 h-4" />
                Submit
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Section Info Card */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{chapter.fullTitle}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {chapter.subModules?.length || 0} sub-modules to complete
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#1DA1F2]">
                    {completedSubModules}/{chapter.subModules?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500">Sub-modules Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sub-modules Grid */}
          <div className="grid grid-cols-2 gap-4">
            {chapter.subModules?.map((subModule, index) => {
              const { status, percent } = getSubModuleStatus(subModule.id);
              
              return (
                <Card
                  key={subModule.id}
                  className="border border-gray-200 bg-white hover:shadow-lg hover:border-[#1DA1F2] transition-all cursor-pointer group"
                  onClick={() => navigate(`/project/${projectId}/drhp-content/${sectionId}/${subModule.id}`)}
                  data-testid={`submodule-${subModule.id}`}
                >
                  <CardContent className="p-5">
                    {/* Progress bar */}
                    <div className="h-1 bg-gray-200 rounded-full mb-4 overflow-hidden">
                      <div 
                        className={`h-full transition-all ${status === "Complete" ? 'bg-green-500' : status === "In Progress" ? 'bg-blue-500' : 'bg-amber-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-semibold text-gray-600">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{subModule.title}</h3>
                        </div>
                      </div>
                      <Badge className={`text-[10px] ${getStatusColor(status)}`}>
                        {status}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                      {subModule.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className="text-xs text-gray-500">{percent}% complete</span>
                      </div>
                      <span className="text-xs font-medium text-[#1DA1F2] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Edit <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Bottom Action Buttons */}
          <div className="mt-6 flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <Button variant="outline" onClick={() => navigate(`/project/${projectId}/command-center`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Command Center
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2" onClick={handleReviewSection}>
                <Eye className="w-4 h-4" />
                Review Section
              </Button>
              <Button className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-2" onClick={handleSubmitSection}>
                <Download className="w-4 h-4" />
                Submit Section
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DRHPSection;
