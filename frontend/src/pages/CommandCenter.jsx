import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  AlertTriangle,
  Target,
  Users,
  FileText,
  Shield,
  ChevronRight,
  Loader2,
  ArrowRight
} from "lucide-react";

// Section icons mapping
const SECTION_ICONS = {
  "Cover Page": FileText,
  "Definitions and Abbreviations": FileText,
  "Risk Factors": AlertTriangle,
  "Introduction and Summary": FileText,
  "Capital Structure": Target,
  "Objects of the Issue": Target,
  "Basis for Issue Price": Target,
  "Industry Overview": FileText,
  "Business Overview": FileText,
  "Management & Promoter Group": Users,
  "Financial Information": FileText,
  "Legal and Regulatory Matters": Shield,
  "Other Information/Disclosures": FileText
};

const CommandCenter = ({ user, apiClient }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await apiClient.get(`/projects/${projectId}/command-center`);
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch command center data:", error);
      if (error.response?.status === 404) {
        navigate("/dashboard");
      }
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [apiClient, projectId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Final": return "bg-green-100 text-green-700 border-green-200";
      case "Review": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Draft": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
            <p className="text-gray-500 text-sm">Loading Command Center...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const { project, sections, section_stats } = data;

  // Checklist modules configuration
  const checklistModules = [
    {
      id: "company-data",
      title: "Company Data",
      subtitle: "Corporate & Business Info",
      path: `/project/${projectId}/company-data`,
      pending: data.checklists?.company_data?.pending || 0
    },
    {
      id: "promoter-checklist",
      title: "Promoter Checklist",
      subtitle: "Promoter Details & KYC",
      path: `/project/${projectId}/promoter-checklist`,
      pending: data.checklists?.promoter?.pending || 0
    },
    {
      id: "kmp-checklist",
      title: "KMP Checklist",
      subtitle: "Key Managerial Personnel",
      path: `/project/${projectId}/kmp-checklist`,
      pending: data.checklists?.kmp?.pending || 0
    },
    {
      id: "pre-ipo-tracker",
      title: "Pre-IPO Tracker",
      subtitle: "IPO Readiness Checklist",
      path: `/project/${projectId}/pre-ipo-tracker`,
      pending: data.checklists?.pre_ipo?.pending || 0
    },
    {
      id: "non-drhp-tracker",
      title: "Non-DRHP Tracker",
      subtitle: "Non-DRHP Compliance Items",
      path: `/project/${projectId}/non-drhp-tracker`,
      pending: data.checklists?.non_drhp?.pending || 0
    }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="command-center-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/dashboard")} className="text-gray-500 hover:text-gray-700 text-sm">
                Dashboard
              </button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <h1 className="text-lg font-semibold text-gray-900">{project.company_name}</h1>
              <Badge className="bg-[#1DA1F2]/10 text-[#1DA1F2] border-[#1DA1F2]/20">
                Command Center
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{section_stats.final}/{section_stats.total} Sections Complete</span>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Centralised Corporate Repository Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1DA1F2] to-blue-600 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Centralised Corporate Repository</h2>
                <p className="text-sm text-gray-500">Upload and manage all corporate data in one place. Data syncs automatically across all DRHP modules.</p>
              </div>
            </div>
          </div>

          {/* Data Capture Modules - 5 Checklist Buttons */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {checklistModules.map((module) => (
              <button
                key={module.id}
                onClick={() => navigate(module.path)}
                className="flex flex-col justify-between p-4 rounded-lg border border-blue-100 bg-blue-50/50 hover:border-[#1DA1F2] hover:bg-blue-50 transition-all h-[120px]"
                data-testid={`${module.id}-btn`}
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">{module.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{module.subtitle}</p>
                </div>
                <div className="flex justify-start">
                  <Badge className={`text-xs ${module.pending > 0 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                    {module.pending > 0 ? `${module.pending} Pending` : 'Complete'}
                  </Badge>
                </div>
              </button>
            ))}
          </div>

          {/* Module Progress - DRHP Sections Grid */}
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1DA1F2]" />
                  Module Progress
                </CardTitle>
                <Button
                  onClick={() => navigate(`/drhp-builder/${projectId}`)}
                  className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white text-sm h-9"
                >
                  Open DRHP Builder
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Click any section to edit</p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-3">
                {sections.map((section) => {
                  const Icon = SECTION_ICONS[section.section_name] || FileText;
                  const progress = section.status === "Final" ? 100 : section.status === "Review" ? 70 : 30;
                  return (
                    <button
                      key={section.section_id}
                      onClick={() => navigate(`/drhp-builder/${projectId}/section/${section.section_id}`)}
                      className="p-3 rounded-lg border border-gray-200 bg-gray-50 hover:border-[#1DA1F2] hover:bg-white transition-all text-left group"
                      data-testid={`section-card-${section.section_id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Icon className="w-4 h-4 text-gray-400 group-hover:text-[#1DA1F2]" />
                        <Badge className={`text-[10px] px-1.5 py-0.5 ${getStatusColor(section.status)}`}>
                          {section.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mb-2 line-clamp-1">{section.section_name}</p>
                      <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                        <div 
                          className={`h-full transition-all ${section.status === "Final" ? 'bg-green-500' : section.status === "Review" ? 'bg-blue-500' : 'bg-amber-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CommandCenter;
