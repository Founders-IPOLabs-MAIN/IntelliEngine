import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  FileText,
  ChevronRight,
  Loader2,
  Building2,
  Landmark,
  Eye,
  Download
} from "lucide-react";

const CommandCenter = ({ user, apiClient }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const projectRes = await apiClient.get(`/projects/${projectId}/command-center`);
      setData(projectRes.data);
    } catch (error) {
      console.error("Failed to fetch command center data:", error);
      if (error.response?.status === 404) {
        navigate("/drhp");
      }
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [apiClient, projectId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const { project, section_stats } = data;

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
              <button onClick={() => navigate("/drhp")} className="text-gray-500 hover:text-gray-700 text-sm">
                DRHP Projects
              </button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <h1 className="text-lg font-semibold text-gray-900">{project.company_name}</h1>
              <Badge className="bg-[#1DA1F2]/10 text-[#1DA1F2] border-[#1DA1F2]/20">
                Command Center
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="gap-2" onClick={() => toast.info("Review feature coming soon")}>
                <Eye className="w-4 h-4" />
                Review All
              </Button>
              <Button className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-2" onClick={() => toast.info("Export feature coming soon")}>
                <Download className="w-4 h-4" />
                Export DRHP
              </Button>
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
                <p className="text-sm text-gray-500">Upload and manage all corporate data in one place. Data syncs automatically across all DRHP chapters.</p>
              </div>
            </div>
          </div>

          {/* Data Capture Modules - 5 Checklist Buttons */}
          <div className="grid grid-cols-5 gap-4 mb-8">
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

          {/* DRHP Output Modules - Main Board and SME Board */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Main Board DRHP Output */}
            <button
              onClick={() => navigate(`/project/${projectId}/drhp-output?board=mainboard`)}
              className="flex items-center justify-between p-5 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg hover:border-blue-300 transition-all group"
              data-testid="drhp-output-mainboard"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Landmark className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900">Main Board DRHP</h3>
                  <p className="text-sm text-gray-600">Word-like Editor & Export</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  NSE / BSE
                </Badge>
                <ChevronRight className="w-5 h-5 text-blue-500" />
              </div>
            </button>

            {/* SME Board DRHP Output */}
            <button
              onClick={() => navigate(`/project/${projectId}/drhp-output?board=sme`)}
              className="flex items-center justify-between p-5 rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-lg hover:border-emerald-300 transition-all group"
              data-testid="drhp-output-sme"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900">SME Board DRHP</h3>
                  <p className="text-sm text-gray-600">Word-like Editor & Export</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                  SME Platform
                </Badge>
                <ChevronRight className="w-5 h-5 text-emerald-500" />
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommandCenter;
