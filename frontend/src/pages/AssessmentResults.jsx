import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Calculator,
  FileText,
  Users,
  Landmark,
  Target,
  Trophy,
  Brain,
  Download,
  Share2,
  RefreshCw
} from "lucide-react";

const AssessmentResults = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const location = useLocation();
  
  const [loading, setLoading] = useState(!location.state?.assessmentData);
  const [data, setData] = useState(location.state?.assessmentData || null);

  useEffect(() => {
    if (!location.state?.assessmentData && assessmentId) {
      fetchAssessment();
    }
  }, [assessmentId]);

  const fetchAssessment = async () => {
    try {
      const response = await apiClient.get(`/assessment/${assessmentId}`);
      // Transform API response to match expected structure
      // API returns: { results: { pe_valuation, dcf_valuation, ... } }
      // Component expects: { calculators: { pe_valuation, dcf_valuation, ... } }
      const apiData = response.data;
      const transformedData = {
        ...apiData,
        calculators: apiData.results?.pe_valuation ? apiData.results : apiData.calculators,
        eligibility: apiData.results?.eligibility || apiData.eligibility,
        readiness: apiData.results?.readiness || apiData.readiness,
        valuation_summary: apiData.results?.valuation_summary || apiData.valuation_summary || {
          average_valuation: 0,
          suggested_price_band: { low: 0, high: 0 }
        }
      };
      setData(transformedData);
    } catch (error) {
      console.error("Failed to fetch assessment:", error);
      toast.error("Assessment not found");
      navigate("/assessment");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ready": return <Trophy className="w-12 h-12 text-green-500" />;
      case "planning_required": return <Target className="w-12 h-12 text-amber-500" />;
      case "not_eligible": return <AlertTriangle className="w-12 h-12 text-red-500" />;
      default: return <CheckCircle2 className="w-12 h-12 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ready": return "bg-green-50 border-green-200 text-green-800";
      case "planning_required": return "bg-amber-50 border-amber-200 text-amber-800";
      case "not_eligible": return "bg-red-50 border-red-200 text-red-800";
      default: return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return "#22c55e";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading assessment results...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { calculators, eligibility, readiness, valuation_summary, ai_analysis, company_info } = data;

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="assessment-results-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-border px-8 py-4">
          <button
            onClick={() => navigate("/assessment")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-black mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assessment
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">IPO Readiness Report</h1>
                <p className="text-muted-foreground">
                  {company_info?.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • 
                  Target: {company_info?.target_board?.toUpperCase()} Board
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/assessment/start")}>
                <RefreshCw className="w-4 h-4 mr-2" />
                New Assessment
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-8 py-8">
          {/* Readiness Score Card */}
          <Card className={`border-2 ${getStatusColor(readiness.status)} mb-8`}>
            <CardContent className="p-8">
              <div className="flex items-center gap-8">
                {/* Score Circle */}
                <div className="text-center">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" strokeWidth="14" />
                      <circle
                        cx="80" cy="80" r="70" fill="none"
                        stroke={getScoreColor(readiness.score)}
                        strokeWidth="14" strokeLinecap="round"
                        strokeDasharray={`${(readiness.score / 100) * 440} 440`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold">{readiness.score}</span>
                      <span className="text-sm text-muted-foreground">out of 100</span>
                    </div>
                  </div>
                </div>

                {/* Status Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    {getStatusIcon(readiness.status)}
                    <div>
                      <h2 className="text-2xl font-bold">{readiness.status_label}</h2>
                      <p className="text-muted-foreground">{readiness.status_message}</p>
                    </div>
                  </div>
                  
                  {/* Issues Summary */}
                  {readiness.issues && readiness.issues.length > 0 && (
                    <div className="space-y-2">
                      {readiness.issues.slice(0, 3).map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          {issue.severity === "critical" ? (
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          )}
                          <span className="text-sm">{issue.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valuation Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Calculated Business Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-black">
                  ₹{valuation_summary.average_valuation.toFixed(2)} Cr
                </p>
                <p className="text-xs text-muted-foreground mt-1">Average of P/E and DCF valuations</p>
              </CardContent>
            </Card>
            
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Suggested Issue Price Band</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-black">
                  ₹{valuation_summary.suggested_price_band.low.toFixed(2)} - {valuation_summary.suggested_price_band.high.toFixed(2)} Cr
                </p>
                <p className="text-xs text-muted-foreground mt-1">10-15% discount to calculated value</p>
              </CardContent>
            </Card>
            
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Estimated Issue Size</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-black">
                  ₹{calculators.issue_size.total_issue_size.toFixed(2)} Cr
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {calculators.issue_size.dilution_percent}% dilution ({calculators.issue_size.issue_type})
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Calculators Grid */}
          <h3 className="text-lg font-bold text-black mb-4">Valuation Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* P/E Valuation */}
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <BarChart3 className="w-5 h-5" />
                  P/E Valuation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {calculators.pe_valuation.warning ? (
                  <div className="text-amber-600 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{calculators.pe_valuation.warning}</span>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-blue-700 mb-2">
                      ₹{calculators.pe_valuation.valuation.toFixed(2)} Cr
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">{calculators.pe_valuation.formula}</p>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">PAT:</span>
                        <span className="font-medium ml-1">₹{calculators.pe_valuation.pat_used.toFixed(2)} Cr</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">P/E Multiple:</span>
                        <span className="font-medium ml-1">{calculators.pe_valuation.pe_used.toFixed(1)}x</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* DCF Valuation */}
            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <TrendingUp className="w-5 h-5" />
                  DCF Valuation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {calculators.dcf_valuation.warning ? (
                  <div className="text-amber-600 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{calculators.dcf_valuation.warning}</span>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-purple-700 mb-2">
                      ₹{calculators.dcf_valuation.valuation.toFixed(2)} Cr
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">{calculators.dcf_valuation.formula}</p>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">PV of FCF:</span>
                        <span className="font-medium ml-1">₹{calculators.dcf_valuation.pv_fcf_sum.toFixed(2)} Cr</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Terminal Value:</span>
                        <span className="font-medium ml-1">₹{calculators.dcf_valuation.pv_terminal_value.toFixed(2)} Cr</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* FCFE */}
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <FileText className="w-5 h-5" />
                  Free Cash Flow to Equity (FCFE)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold mb-2 ${calculators.fcfe.fcfe >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  ₹{calculators.fcfe.fcfe.toFixed(2)} Cr
                </p>
                <p className="text-sm text-muted-foreground mb-4">{calculators.fcfe.formula}</p>
                <div className="text-sm">
                  <span className="text-muted-foreground">FCFE Yield:</span>
                  <span className={`font-medium ml-1 ${calculators.fcfe.fcfe_yield >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {calculators.fcfe.fcfe_yield.toFixed(1)}%
                  </span>
                </div>
                {calculators.fcfe.fcfe < 0 && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Negative FCFE may concern dividend-seeking investors
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Issue Size */}
            <Card className="border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Landmark className="w-5 h-5" />
                  Issue Size Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-700 mb-2">
                  ₹{calculators.issue_size.total_issue_size.toFixed(2)} Cr
                </p>
                <p className="text-sm text-muted-foreground mb-4">{calculators.issue_size.formula}</p>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium ml-1 capitalize">{calculators.issue_size.issue_type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dilution:</span>
                    <span className="font-medium ml-1">{calculators.issue_size.dilution_percent}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SEBI Eligibility Check */}
          <Card className="border border-border mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                SEBI Eligibility Check: {eligibility.board}
              </CardTitle>
              <CardDescription>
                {eligibility.passed_count} of {eligibility.total_checks} criteria met
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eligibility.checks.map((check, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      {check.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-black">{check.criterion}</p>
                        <p className="text-sm text-muted-foreground">
                          Required: {check.required} | Actual: {check.actual}
                        </p>
                      </div>
                    </div>
                    {check.passed ? (
                      <Badge className="bg-green-100 text-green-700">Passed</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700">Gap: ₹{check.gap.toFixed(2)} Cr</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card className="border border-border mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-green-600" />
                AI-Powered Gap Analysis
              </CardTitle>
              <CardDescription>Personalized recommendations based on your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                  {ai_analysis}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Buttons */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-black mb-2">Ready to Take the Next Step?</h3>
                <p className="text-muted-foreground mb-6">
                  Connect with our experts or explore our platform modules
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Button
                    onClick={() => navigate("/matchmaker")}
                    className="bg-green-600 hover:bg-green-700 gap-2"
                    data-testid="cta-matchmaker"
                  >
                    <Users className="w-4 h-4" />
                    Talk to Expert (Match Maker)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/drhp-builder")}
                    className="gap-2"
                    data-testid="cta-drhp"
                  >
                    <FileText className="w-4 h-4" />
                    Start DRHP Builder
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/funding")}
                    className="gap-2"
                    data-testid="cta-funding"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Explore Funding Options
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Disclaimer:</strong> {data.disclaimer}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssessmentResults;
