import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  Gauge,
  Clock,
  AlertTriangle,
  Calendar,
  Target,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  Edit3,
  History,
  Shield,
  Video,
  Phone,
  Search,
  ChevronRight,
  Loader2,
  RefreshCw,
  Sparkles,
  Bell,
  GitBranch,
  Eye,
  Upload,
  MessageSquare,
  Check,
  AlertCircle,
  ArrowRight,
  Zap,
  Building2,
  UserCheck,
  ClipboardList
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
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  
  // Modal states
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [meetingForm, setMeetingForm] = useState({ topic: "", date: "", time: "" });
  const [scheduling, setScheduling] = useState(false);
  
  // AI tooltip state
  const [aiTooltip, setAiTooltip] = useState({ loading: false, content: null, section: null });
  
  // Search state
  const [memberSearch, setMemberSearch] = useState("");

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
      setRefreshing(false);
    }
  }, [apiClient, projectId, navigate]);

  useEffect(() => {
    fetchData();
    // Mock real-time: Poll every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleScheduleMeeting = async () => {
    if (!meetingForm.topic || !meetingForm.date || !meetingForm.time) {
      toast.error("Please fill all fields");
      return;
    }
    
    setScheduling(true);
    try {
      const response = await apiClient.post(`/projects/${projectId}/schedule-meeting`, {
        ...meetingForm,
        attendees: selectedMember ? [selectedMember.name] : []
      });
      toast.success("Meeting scheduled!", {
        description: `Join link: ${response.data.meet_link}`
      });
      setScheduleModalOpen(false);
      setMeetingForm({ topic: "", date: "", time: "" });
      setSelectedMember(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to schedule meeting");
    } finally {
      setScheduling(false);
    }
  };

  const handleDelayHover = async (section) => {
    if (aiTooltip.section === section.section_name && aiTooltip.content) return;
    
    setAiTooltip({ loading: true, content: null, section: section.section_name });
    try {
      const response = await apiClient.post(`/projects/${projectId}/ai-delay-explanation`, {
        section_name: section.section_name,
        delay_days: section.days_delayed,
        status: section.status
      });
      setAiTooltip({ loading: false, content: response.data.explanation, section: section.section_name });
    } catch (error) {
      setAiTooltip({ loading: false, content: "Unable to generate explanation", section: section.section_name });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Final": return "bg-[#00FF41]/20 border-[#00FF41] text-[#00FF41]";
      case "Review": return "bg-[#1DA1F2]/20 border-[#1DA1F2] text-[#1DA1F2]";
      case "Draft": return "bg-[#FFBF00]/20 border-[#FFBF00] text-[#FFBF00]";
      default: return "bg-gray-100 border-gray-300 text-gray-600";
    }
  };

  const getHeatmapColor = (status) => {
    switch (status) {
      case "Final": return "bg-[#00FF41]";
      case "Review": return "bg-[#1DA1F2]";
      case "Draft": return "bg-[#FFBF00]";
      default: return "bg-gray-300";
    }
  };

  const getStatusIndicator = (status) => {
    switch (status) {
      case "online": return "bg-[#00FF41]";
      case "away": return "bg-[#FFBF00]";
      case "offline": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  const filteredMembers = data?.team_members?.filter(m => 
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.role.toLowerCase().includes(memberSearch.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#1DA1F2]" />
            <p className="text-gray-400 text-sm">Loading Command Center...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const { project, kpi_ribbon, sections, section_stats, compliance, version_history, audit_trail, team_members } = data;

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-[#0a0a0a]" data-testid="command-center-page">
        <Sidebar user={user} apiClient={apiClient} />
        
        <main className="flex-1 ml-64 pb-20">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white text-sm">
                  Dashboard
                </button>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <h1 className="text-xl font-semibold text-white">{project.company_name}</h1>
                <Badge className="bg-[#1DA1F2]/20 text-[#1DA1F2] border-[#1DA1F2]/30">
                  Command Center
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Syncing...' : 'Refresh'}
              </Button>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Data Capture Modules - 4 Checklist Buttons */}
            <div className="grid grid-cols-4 gap-4">
              <button
                onClick={() => navigate(`/project/${projectId}/company-data`)}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-800 bg-[#111] hover:border-[#1DA1F2]/50 hover:bg-[#1DA1F2]/5 transition-all"
                data-testid="company-data-btn"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">Company Data</p>
                    <p className="text-xs text-gray-500">Corporate & Business Info</p>
                  </div>
                </div>
                <Badge className={`${data.checklists?.company_data?.pending > 0 ? 'bg-[#FFBF00]/20 text-[#FFBF00] border-[#FFBF00]/30' : 'bg-[#00FF41]/20 text-[#00FF41] border-[#00FF41]/30'}`}>
                  {data.checklists?.company_data?.pending > 0 ? `${data.checklists.company_data.pending} Pending` : 'Complete'}
                </Badge>
              </button>

              <button
                onClick={() => navigate(`/project/${projectId}/promoter-checklist`)}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-800 bg-[#111] hover:border-[#1DA1F2]/50 hover:bg-[#1DA1F2]/5 transition-all"
                data-testid="promoter-checklist-btn"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">Promoter Checklist</p>
                    <p className="text-xs text-gray-500">Promoter Details & KYC</p>
                  </div>
                </div>
                <Badge className={`${data.checklists?.promoter?.pending > 0 ? 'bg-[#FFBF00]/20 text-[#FFBF00] border-[#FFBF00]/30' : 'bg-[#00FF41]/20 text-[#00FF41] border-[#00FF41]/30'}`}>
                  {data.checklists?.promoter?.pending > 0 ? `${data.checklists.promoter.pending} Pending` : 'Complete'}
                </Badge>
              </button>

              <button
                onClick={() => navigate(`/project/${projectId}/kmp-checklist`)}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-800 bg-[#111] hover:border-[#1DA1F2]/50 hover:bg-[#1DA1F2]/5 transition-all"
                data-testid="kmp-checklist-btn"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">KMP Checklist</p>
                    <p className="text-xs text-gray-500">Key Managerial Personnel</p>
                  </div>
                </div>
                <Badge className={`${data.checklists?.kmp?.pending > 0 ? 'bg-[#FFBF00]/20 text-[#FFBF00] border-[#FFBF00]/30' : 'bg-[#00FF41]/20 text-[#00FF41] border-[#00FF41]/30'}`}>
                  {data.checklists?.kmp?.pending > 0 ? `${data.checklists.kmp.pending} Pending` : 'Complete'}
                </Badge>
              </button>

              <button
                onClick={() => navigate(`/project/${projectId}/pre-ipo-tracker`)}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-800 bg-[#111] hover:border-[#1DA1F2]/50 hover:bg-[#1DA1F2]/5 transition-all"
                data-testid="pre-ipo-tracker-btn"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">Pre-IPO Tracker</p>
                    <p className="text-xs text-gray-500">IPO Readiness Checklist</p>
                  </div>
                </div>
                <Badge className={`${data.checklists?.pre_ipo?.pending > 0 ? 'bg-[#FFBF00]/20 text-[#FFBF00] border-[#FFBF00]/30' : 'bg-[#00FF41]/20 text-[#00FF41] border-[#00FF41]/30'}`}>
                  {data.checklists?.pre_ipo?.pending > 0 ? `${data.checklists.pre_ipo.pending} Pending` : 'Complete'}
                </Badge>
              </button>
            </div>

            {/* KPI Ribbon */}
            <div className="grid grid-cols-6 gap-4">
              {/* IPO Readiness Score - Radial Gauge */}
              <Card className="col-span-1 bg-[#111] border-gray-800 overflow-hidden">
                <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        stroke="#333"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        stroke={kpi_ribbon.readiness_score >= 90 ? "#00FF41" : kpi_ribbon.readiness_score >= 50 ? "#1DA1F2" : "#FFBF00"}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(kpi_ribbon.readiness_score / 100) * 301.6} 301.6`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">{kpi_ribbon.readiness_score}%</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Ready</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">IPO Readiness</p>
                </CardContent>
              </Card>

              {/* Days to Filing */}
              <Card className="bg-[#111] border-gray-800">
                <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                  <Clock className="w-8 h-8 text-[#1DA1F2] mb-2" />
                  <span className="text-3xl font-bold text-white">{kpi_ribbon.days_to_filing}</span>
                  <p className="text-xs text-gray-400 mt-1">Days to Filing</p>
                  <p className="text-[10px] text-gray-600">Target: Dec 31, 2026</p>
                </CardContent>
              </Card>

              {/* Active Intermediaries */}
              <Card className="bg-[#111] border-gray-800">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 mb-3">Active Intermediaries</p>
                  <div className="flex -space-x-2">
                    {kpi_ribbon.active_intermediaries.slice(0, 4).map((member, idx) => (
                      <Tooltip key={member.id}>
                        <TooltipTrigger>
                          <Avatar className="w-10 h-10 border-2 border-[#111]">
                            <AvatarFallback className="bg-[#1DA1F2] text-white text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-gray-400">{member.role}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {kpi_ribbon.active_intermediaries.length > 4 && (
                      <Avatar className="w-10 h-10 border-2 border-[#111]">
                        <AvatarFallback className="bg-gray-700 text-white text-xs">
                          +{kpi_ribbon.active_intermediaries.length - 4}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <p className="text-lg font-semibold text-white mt-2">{kpi_ribbon.active_intermediaries.length} Online</p>
                </CardContent>
              </Card>

              {/* Critical Delays */}
              <Card className="bg-[#111] border-gray-800">
                <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                  <div className="relative">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                    {kpi_ribbon.critical_delays > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs animate-pulse">
                        {kpi_ribbon.critical_delays}
                      </span>
                    )}
                  </div>
                  <span className="text-2xl font-bold text-white mt-2">{kpi_ribbon.critical_delays}</span>
                  <p className="text-xs text-gray-400">Critical Delays</p>
                </CardContent>
              </Card>

              {/* Upcoming Meetings */}
              <Card className="bg-[#111] border-gray-800">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 mb-2">Upcoming Meetings</p>
                  {kpi_ribbon.upcoming_meetings.slice(0, 2).map((meeting, idx) => (
                    <div key={meeting.id} className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-[#1DA1F2]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{meeting.topic}</p>
                        <p className="text-[10px] text-gray-500">{meeting.date} • {meeting.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Upcoming Deadlines */}
              <Card className="bg-[#111] border-gray-800">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 mb-2">Upcoming Deadlines</p>
                  {kpi_ribbon.upcoming_deadlines.slice(0, 2).map((deadline, idx) => (
                    <div key={deadline.id} className="flex items-center gap-2 mb-2">
                      <Target className={`w-4 h-4 ${deadline.priority === 'high' ? 'text-red-500' : 'text-[#FFBF00]'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{deadline.task}</p>
                        <p className="text-[10px] text-gray-500">{deadline.due_date}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column - Sections & Compliance */}
              <div className="col-span-8 space-y-6">
                {/* Chapter Status Cards - Bento Grid */}
                <Card className="bg-[#111] border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#1DA1F2]" />
                      Module Progress
                    </CardTitle>
                    <CardDescription className="text-gray-500">Click any card to edit the section</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {sections.map((section) => {
                        const Icon = SECTION_ICONS[section.section_name] || FileText;
                        const progress = section.status === "Final" ? 100 : section.status === "Review" ? 70 : 30;
                        return (
                          <button
                            key={section.section_id}
                            onClick={() => navigate(`/drhp-builder/${projectId}/section/${section.section_id}`)}
                            className="p-3 rounded-lg border border-gray-800 bg-[#0a0a0a] hover:border-[#1DA1F2]/50 hover:bg-[#1DA1F2]/5 transition-all text-left group"
                            data-testid={`section-card-${section.section_id}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <Icon className="w-5 h-5 text-gray-500 group-hover:text-[#1DA1F2]" />
                              <Badge className={`text-[10px] px-1.5 py-0.5 ${getStatusColor(section.status)}`}>
                                {section.status}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-white mb-2 line-clamp-1">{section.section_name}</p>
                            <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                              <div 
                                className={`h-full transition-all ${section.status === "Final" ? 'bg-[#00FF41]' : section.status === "Review" ? 'bg-[#1DA1F2]' : 'bg-[#FFBF00]'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Readiness Heatmap */}
                <Card className="bg-[#111] border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-[#1DA1F2]" />
                      Readiness Heatmap
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-[#FFBF00]" />
                        <span className="text-xs text-gray-400">Drafting ({section_stats.draft})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-[#1DA1F2]" />
                        <span className="text-xs text-gray-400">Review ({section_stats.review})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-[#00FF41]" />
                        <span className="text-xs text-gray-400">Signed-off ({section_stats.final})</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sections.map((section) => (
                        <Tooltip key={section.section_id}>
                          <TooltipTrigger>
                            <div className={`w-8 h-3 rounded ${getHeatmapColor(section.status)}`} />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{section.section_name}</p>
                            <p className="text-xs text-gray-400">{section.status}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Status Hub */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-[#111] border-gray-800">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-400 mb-2">Overall Progress</p>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-2xl font-bold text-white">{compliance.overall_progress}%</span>
                        <span className="text-xs text-gray-500 mb-1">complete</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#1DA1F2] to-[#00FF41] transition-all"
                          style={{ width: `${compliance.overall_progress}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#111] border-gray-800">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-400 mb-2">Gap Analysis</p>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#FFBF00]/20 flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-[#FFBF00]" />
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-white">{compliance.gap_count}</span>
                          <p className="text-xs text-gray-500">Missing SEBI disclosures</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#111] border-gray-800">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-400 mb-2">Delayed Modules</p>
                      {compliance.delayed_modules.length > 0 ? (
                        <div className="space-y-2">
                          {compliance.delayed_modules.slice(0, 2).map((delay, idx) => (
                            <Tooltip key={idx}>
                              <TooltipTrigger asChild>
                                <div 
                                  className="flex items-center gap-2 cursor-help"
                                  onMouseEnter={() => handleDelayHover(delay)}
                                >
                                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                  <span className="text-xs text-white truncate">{delay.section_name}</span>
                                  <span className="text-[10px] text-red-400">+{delay.days_delayed}d</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="flex items-start gap-2">
                                  <Sparkles className="w-4 h-4 text-[#1DA1F2] flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-xs mb-1">AI Analysis</p>
                                    {aiTooltip.section === delay.section_name ? (
                                      aiTooltip.loading ? (
                                        <p className="text-xs text-gray-400">Analyzing...</p>
                                      ) : (
                                        <p className="text-xs text-gray-300">{aiTooltip.content}</p>
                                      )
                                    ) : (
                                      <p className="text-xs text-gray-400">Hover to analyze</p>
                                    )}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#00FF41]" />
                          <span className="text-sm text-white">No delays</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Member Directory */}
                <Card className="bg-[#111] border-gray-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#1DA1F2]" />
                        Team Directory
                      </CardTitle>
                      <div className="relative w-48">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <Input
                          placeholder="Search members..."
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          className="pl-9 h-8 bg-[#0a0a0a] border-gray-800 text-white text-sm"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {filteredMembers.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 bg-[#0a0a0a]">
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gray-800 text-white text-sm">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${getStatusIndicator(member.status)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.role}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setScheduleModalOpen(true);
                            }}
                            className="text-[#1DA1F2] hover:bg-[#1DA1F2]/10"
                          >
                            <Video className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Version History & Audit Trail */}
              <div className="col-span-4 space-y-6">
                {/* Version History Panel */}
                <Card className="bg-[#111] border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <GitBranch className="w-5 h-5 text-[#1DA1F2]" />
                      Version History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {version_history.map((version, idx) => (
                        <div key={version.log_id || idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center flex-shrink-0">
                            <History className="w-4 h-4 text-[#1DA1F2]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white line-clamp-1">{version.details}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {version.user_name} • {new Date(version.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#1DA1F2] text-xs">
                            Compare
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Audit Trail - The Pulse */}
                <Card className="bg-[#111] border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#1DA1F2]" />
                      Audit Trail
                      <Badge className="text-[10px] bg-gray-800 text-gray-400">Tamper-proof</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-800" />
                        <div className="space-y-4">
                          {audit_trail.map((entry, idx) => {
                            const ActionIcon = entry.action_type === 'view' ? Eye :
                              entry.action_type === 'edit' ? Edit3 :
                              entry.action_type === 'upload' ? Upload :
                              entry.action_type === 'comment' ? MessageSquare :
                              entry.action_type === 'approve' ? Check : FileText;
                            return (
                              <div key={entry.log_id || idx} className="flex items-start gap-3 pl-1">
                                <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center z-10">
                                  <ActionIcon className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                  <p className="text-xs text-white">{entry.details}</p>
                                  <p className="text-[10px] text-gray-600 mt-0.5">
                                    {entry.user_name} • {new Date(entry.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Generate DRHP Button */}
                <Button
                  className={`w-full h-14 text-lg font-semibold ${
                    kpi_ribbon.readiness_score >= 90 
                      ? 'bg-gradient-to-r from-[#00FF41] to-[#1DA1F2] hover:opacity-90 animate-pulse' 
                      : 'bg-gray-800 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={kpi_ribbon.readiness_score < 90}
                  data-testid="generate-drhp-btn"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Generate DRHP Draft
                </Button>
                {kpi_ribbon.readiness_score < 90 && (
                  <p className="text-xs text-gray-500 text-center">Requires 90%+ readiness score</p>
                )}
              </div>
            </div>
          </div>

          {/* Fixed Bottom Button */}
          <div className="fixed bottom-0 left-64 right-0 bg-[#0a0a0a]/95 backdrop-blur-sm border-t border-gray-800 p-4 z-20">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge className="bg-[#1DA1F2]/20 text-[#1DA1F2] border-[#1DA1F2]/30">
                  {section_stats.final}/{section_stats.total} Sections Complete
                </Badge>
                <span className="text-sm text-gray-500">
                  Last synced: {new Date().toLocaleTimeString()}
                </span>
              </div>
              <Button
                onClick={() => navigate(`/drhp-builder/${projectId}`)}
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white px-6"
                data-testid="open-drhp-builder-btn"
              >
                Open DRHP Builder
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </main>

        {/* Schedule Meeting Modal */}
        <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
          <DialogContent className="bg-[#111] border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-[#1DA1F2]" />
                Schedule Call
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedMember ? `Schedule a call with ${selectedMember.name}` : 'Schedule a team call'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Topic / Subject</Label>
                <Input
                  placeholder="e.g., DRHP Review Discussion"
                  value={meetingForm.topic}
                  onChange={(e) => setMeetingForm({ ...meetingForm, topic: e.target.value })}
                  className="bg-[#0a0a0a] border-gray-800 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Date</Label>
                  <Input
                    type="date"
                    value={meetingForm.date}
                    onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                    className="bg-[#0a0a0a] border-gray-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Time</Label>
                  <Input
                    type="time"
                    value={meetingForm.time}
                    onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                    className="bg-[#0a0a0a] border-gray-800 text-white"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setScheduleModalOpen(false)} className="border-gray-700 text-gray-300">
                Cancel
              </Button>
              <Button 
                onClick={handleScheduleMeeting} 
                disabled={scheduling}
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8]"
              >
                {scheduling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Video className="w-4 h-4 mr-2" />}
                {scheduling ? 'Scheduling...' : 'Schedule & Get Meet Link'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default CommandCenter;
