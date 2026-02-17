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
  Upload,
  Download
} from "lucide-react";

// Section metadata with icons and descriptions
const SECTION_METADATA = {
  "Cover Page": {
    icon: FileText,
    description: "Basic information about the issuer including company name, logo, contact details, lead managers, and registrar.",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  "Definitions and Abbreviations": {
    icon: BookOpen,
    description: "List of technical terms and abbreviations used throughout the DRHP document for reference.",
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  "Risk Factors": {
    icon: AlertTriangle,
    description: "Comprehensive disclosure of internal, external, business, regulatory, legal, and financial risks.",
    color: "text-red-600",
    bgColor: "bg-red-50"
  },
  "Introduction and Summary": {
    icon: FileSearch,
    description: "Overview of the offer, type of issue (fresh/OFS), summary of business, industry, and key financial metrics.",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50"
  },
  "Capital Structure": {
    icon: Landmark,
    description: "Details of authorized capital, paid-up capital, pre-IPO and post-IPO shareholding patterns.",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50"
  },
  "Objects of the Issue": {
    icon: Target,
    description: "How the company intends to use funds raised - debt repayment, expansion, capital expenditure, working capital.",
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  },
  "Basis for Issue Price": {
    icon: Calculator,
    description: "Qualitative and quantitative factors justifying the issue price, with peer comparison analysis.",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50"
  },
  "Industry Overview": {
    icon: Factory,
    description: "Market size, growth trends, demand drivers, and competitive landscape of the sector.",
    color: "text-teal-600",
    bgColor: "bg-teal-50"
  },
  "Business Overview": {
    icon: Building,
    description: "Company's business model, operations, products/services, strengths, strategies, and key customers.",
    color: "text-violet-600",
    bgColor: "bg-violet-50"
  },
  "Management & Promoter Group": {
    icon: Users,
    description: "Information about directors, Key Managerial Personnel (KMPs), their experience, and promoter details.",
    color: "text-pink-600",
    bgColor: "bg-pink-50"
  },
  "Financial Information": {
    icon: DollarSign,
    description: "Restated audited financials (3-5 years) including Balance Sheet, P&L, Cash Flow, and MD&A.",
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  "Legal and Regulatory Matters": {
    icon: Scale,
    description: "Pending litigation, criminal proceedings, tax disputes, and regulatory actions disclosure.",
    color: "text-amber-600",
    bgColor: "bg-amber-50"
  },
  "Other Information/Disclosures": {
    icon: MoreHorizontal,
    description: "Material contracts, important documents, statutory approvals, and other mandatory disclosures.",
    color: "text-slate-600",
    bgColor: "bg-slate-50"
  }
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

          {/* Sub-Modules Grid */}
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-black mb-2">DRHP Sub-Modules</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Click on any section to upload documents and edit content. Each module includes document upload and download capabilities.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {sections.map((section, index) => {
                const metadata = SECTION_METADATA[section.section_name] || {
                  icon: FileText,
                  description: "Section content and documents",
                  color: "text-gray-600",
                  bgColor: "bg-gray-50"
                };
                const IconComponent = metadata.icon;
                
                return (
                  <Card
                    key={section.section_id}
                    className="border border-border card-hover cursor-pointer group transition-all duration-200 hover:border-[#1DA1F2]/30 hover:shadow-md"
                    onClick={() => navigate(`/drhp-builder/${projectId}/section/${section.section_id}`)}
                    data-testid={`section-card-${index}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 ${metadata.bgColor} rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
                          <IconComponent className={`w-6 h-6 ${metadata.color}`} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Header Row */}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="font-semibold text-black text-base leading-tight">
                              {section.section_name}
                            </h4>
                            {getStatusBadge(section.status)}
                          </div>
                          
                          {/* Description */}
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {metadata.description}
                          </p>
                          
                          {/* Footer Row */}
                          <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" />
                                {section.documents?.length || 0} docs
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Download className="w-3.5 h-3.5" />
                                Download
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[#1DA1F2] opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-medium">Open</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <Card className="border border-border bg-gray-50/50">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <span className="font-medium text-black">Status Legend:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Draft</Badge>
                  <span className="text-muted-foreground">Initial content</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Review</Badge>
                  <span className="text-muted-foreground">Under review</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Final</Badge>
                  <span className="text-muted-foreground">Approved</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DRHPBuilder;
