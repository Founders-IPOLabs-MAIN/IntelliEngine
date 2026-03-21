import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import { DRHP_CHAPTERS } from "@/config/drhpChapters";
import {
  AlertTriangle,
  Target,
  Users,
  FileText,
  Shield,
  ChevronRight,
  Loader2,
  ArrowRight,
  BookOpen,
  Building2,
  Scale,
  Briefcase,
  FileCheck,
  Landmark,
  ScrollText,
  Info,
  CheckCircle2,
  Eye,
  Download
} from "lucide-react";

// Section icons mapping for chapters
const CHAPTER_ICONS = {
  "section-1": BookOpen,
  "section-2": AlertTriangle,
  "section-3": Info,
  "section-4": Building2,
  "section-5": Target,
  "section-6": Scale,
  "section-7": Briefcase,
  "section-8": ScrollText,
  "section-9": FileCheck
};

// Section colors
const CHAPTER_COLORS = {
  "section-1": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  "section-2": { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  "section-3": { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  "section-4": { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  "section-5": { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  "section-6": { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
  "section-7": { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200" },
  "section-8": { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
  "section-9": { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200" }
};

const CommandCenter = ({ user, apiClient }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [chapterProgress, setChapterProgress] = useState({});
  const [showDRHPChapters, setShowDRHPChapters] = useState(true); // Default to expanded

  const fetchData = useCallback(async () => {
    try {
      const [projectRes, progressRes] = await Promise.all([
        apiClient.get(`/projects/${projectId}/command-center`),
        apiClient.get(`/projects/${projectId}/drhp-progress`).catch(() => ({ data: {} }))
      ]);
      setData(projectRes.data);
      setChapterProgress(progressRes.data || {});
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

  const getChapterStatus = (chapterId) => {
    const progress = chapterProgress[chapterId];
    if (!progress) return { status: "Not Started", percent: 0 };
    if (progress.percent === 100) return { status: "Complete", percent: 100 };
    if (progress.percent > 50) return { status: "In Progress", percent: progress.percent };
    return { status: "Draft", percent: progress.percent };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Complete": return "bg-green-100 text-green-700 border-green-200";
      case "In Progress": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Draft": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const handleChapterClick = (chapter) => {
    if (chapter.hasSubModules) {
      navigate(`/project/${projectId}/drhp-section/${chapter.id}`);
    } else {
      navigate(`/project/${projectId}/drhp-content/${chapter.id}`);
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

  // Calculate overall progress
  const totalChapters = DRHP_CHAPTERS.length;
  const completedChapters = Object.values(chapterProgress).filter(p => p?.percent === 100).length;

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

          {/* Two Main Sections: DRHP Chapters & DRHP Output */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* DRHP Chapters Module */}
            <button
              onClick={() => setShowDRHPChapters(!showDRHPChapters)}
              className="flex items-center justify-between p-5 rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-lg hover:border-indigo-300 transition-all group"
              data-testid="drhp-chapters-module"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900">DRHP Chapters</h3>
                  <p className="text-sm text-gray-600">9 Sections • {completedChapters}/{totalChapters} Complete</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                  {Math.round((completedChapters / totalChapters) * 100)}% Done
                </Badge>
                <ChevronRight className={`w-5 h-5 text-indigo-500 transition-transform ${showDRHPChapters ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {/* DRHP Output Module */}
            <button
              onClick={() => navigate(`/project/${projectId}/drhp-output`)}
              className="flex items-center justify-between p-5 rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-lg hover:border-emerald-300 transition-all group"
              data-testid="drhp-output-module"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Download className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900">DRHP Output</h3>
                  <p className="text-sm text-gray-600">Word-like Editor & Export</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                  SME & Mainboard
                </Badge>
                <ChevronRight className="w-5 h-5 text-emerald-500" />
              </div>
            </button>
          </div>

          {/* DRHP Chapters Expanded Section */}
          {showDRHPChapters && (
            <Card className="border border-indigo-200 bg-white mb-6" data-testid="drhp-chapters-expanded">
              <CardHeader className="pb-3 border-b border-indigo-100 bg-indigo-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                      DRHP Chapters
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Click any chapter to view sub-modules or edit content</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">{completedChapters}/{totalChapters} Chapters Complete</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  {DRHP_CHAPTERS.map((chapter) => {
                    const Icon = CHAPTER_ICONS[chapter.id] || FileText;
                    const colors = CHAPTER_COLORS[chapter.id] || { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
                    const { status, percent } = getChapterStatus(chapter.id);
                    
                    return (
                      <button
                        key={chapter.id}
                        onClick={() => handleChapterClick(chapter)}
                        className={`p-4 rounded-xl border-2 ${colors.border} ${colors.bg} hover:shadow-md transition-all text-left group relative overflow-hidden`}
                        data-testid={`chapter-${chapter.id}`}
                      >
                        {/* Progress bar at top */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
                          <div 
                            className={`h-full transition-all ${status === "Complete" ? 'bg-green-500' : status === "In Progress" ? 'bg-blue-500' : 'bg-amber-500'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        
                        <div className="flex items-start justify-between mb-3 mt-1">
                          <div className={`w-10 h-10 ${colors.bg} border ${colors.border} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform`}>
                            <Icon className={`w-5 h-5 ${colors.text}`} />
                          </div>
                          <Badge className={`text-[10px] px-1.5 py-0.5 ${getStatusColor(status)}`}>
                            {status}
                          </Badge>
                        </div>
                        
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-500 mb-1">Section {chapter.number}</p>
                          <p className="text-sm font-semibold text-gray-900">{chapter.title}</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {chapter.hasSubModules ? `${chapter.subModules.length} Sub-modules` : 'Direct Content'}
                          </span>
                          <ArrowRight className={`w-4 h-4 ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default CommandCenter;
