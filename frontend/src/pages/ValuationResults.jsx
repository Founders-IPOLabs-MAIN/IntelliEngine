import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft, Loader2, CheckCircle2, AlertTriangle, TrendingUp,
  BarChart3, Scale, FileText, Shield, Landmark, Calculator,
  XCircle, Info, RefreshCw, Building2, Target, DollarSign
} from "lucide-react";

const RISK_COLORS = { Low: "text-green-600 bg-green-50 border-green-200", Medium: "text-amber-600 bg-amber-50 border-amber-200", High: "text-red-600 bg-red-50 border-red-200", Critical: "text-red-800 bg-red-100 border-red-300" };

const ValuationResults = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const { valuationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);

  useEffect(() => { fetchProject(); }, [valuationId]);

  const fetchProject = async () => {
    try {
      const res = await apiClient.get(`/valuation/projects/${valuationId}`);
      setProject(res.data);
    } catch (err) {
      toast.error("Failed to load valuation"); navigate("/valuation");
    } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#003366]" />
        </main>
      </div>
    );
  }

  if (!project?.results) return null;

  const { results, company_profile: company, financial_data: finData } = project;
  const { methods, ratios, weighted_valuation: weighted, per_share_value, confidence_score, ai_analysis } = results;
  const unit = company?.currency === "lakhs" ? "L" : "Cr";
  const risk = ai_analysis?.risk || {};
  const qc = ai_analysis?.quality_control || {};

  const getScoreColor = (s) => s >= 75 ? "#16a34a" : s >= 50 ? "#d97706" : "#dc2626";

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="valuation-results-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-border px-8 py-4">
          <button onClick={() => navigate("/valuation")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-black mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to Valuations
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Scale className="w-5 h-5 text-[#003366]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">Valuation Report: {company?.company_name}</h1>
                <p className="text-sm text-muted-foreground">{company?.industry} &bull; {
                  { ma: "M&A", esop: "ESOP Pricing", ipo: "IPO", family_settlement: "Family Settlement", tax_assessment: "Tax Assessment" }[company?.purpose] || company?.purpose
                }</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/valuation/${valuationId}/wizard`)}>
              <RefreshCw className="w-4 h-4 mr-2" /> Edit & Recalculate
            </Button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">

          {/* ===== HERO: Weighted Valuation + Confidence ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-2 border-[#003366] bg-gradient-to-br from-[#003366] to-[#001a33] text-white" data-testid="hero-valuation-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-blue-200 text-sm font-medium mb-1">Weighted Business Valuation</p>
                    <p className="text-4xl font-bold tracking-tight">
                      ₹{weighted?.weighted_average?.toFixed(2)} {unit}
                    </p>
                    <p className="text-blue-300 text-sm mt-1">
                      Range: ₹{weighted?.value_range_low?.toFixed(2)} – ₹{weighted?.value_range_high?.toFixed(2)} {unit}
                    </p>
                    {per_share_value > 0 && (
                      <p className="text-blue-200 text-sm mt-2">
                        Per Share Value: <span className="text-white font-bold">₹{per_share_value.toFixed(2)}</span>
                        <span className="text-blue-300 ml-1">({results.shares_outstanding?.toLocaleString()} shares)</span>
                      </p>
                    )}
                  </div>
                  <Scale className="w-12 h-12 text-blue-300/40" />
                </div>
                {/* Method breakdown bar */}
                <div className="mt-5 space-y-2">
                  {weighted?.method_values?.map((mv, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-blue-200 w-16 uppercase">{mv.method === "comparable" ? "CCM" : mv.method}</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full">
                        <div className="h-full bg-[#00D1FF] rounded-full" style={{ width: `${weighted.weighted_average > 0 ? Math.min((mv.value / weighted.weighted_average) * 50, 100) : 0}%` }} />
                      </div>
                      <span className="text-xs text-white font-medium w-24 text-right">₹{mv.value.toFixed(2)} {unit}</span>
                      <span className="text-[10px] text-blue-300 w-10 text-right">{(mv.weight * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Confidence Score */}
            <Card className="border border-border" data-testid="confidence-card">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                <p className="text-sm text-muted-foreground mb-3 font-medium">Confidence Score</p>
                <div className="relative w-28 h-28 mb-3">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                    <circle cx="56" cy="56" r="48" fill="none" stroke={getScoreColor(confidence_score)} strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${(confidence_score / 100) * 301.6} 301.6`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{confidence_score}</span>
                    <span className="text-[10px] text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <Badge className={confidence_score >= 75 ? "bg-green-100 text-green-700" : confidence_score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>
                  {confidence_score >= 75 ? "High Confidence" : confidence_score >= 50 ? "Moderate" : "Low Confidence"}
                </Badge>
                {qc?.executive_summary && (
                  <p className="text-xs text-muted-foreground text-center mt-3 leading-relaxed">{qc.executive_summary}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ===== FINANCIAL RATIOS ===== */}
          {ratios && Object.keys(ratios).length > 0 && (
            <Card className="border border-border" data-testid="ratios-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#003366]" /> Key Financial Ratios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
                  {[
                    { key: "revenue_cagr", label: "Revenue CAGR", suffix: "%" },
                    { key: "pat_cagr", label: "PAT CAGR", suffix: "%" },
                    { key: "ebitda_margin", label: "EBITDA Margin", suffix: "%" },
                    { key: "pat_margin", label: "PAT Margin", suffix: "%" },
                    { key: "roe", label: "ROE", suffix: "%" },
                    { key: "roce", label: "ROCE", suffix: "%" },
                    { key: "debt_equity", label: "Debt/Equity", suffix: "x" },
                    { key: "current_ratio", label: "Current Ratio", suffix: "x" },
                  ].map(r => ratios[r.key] !== undefined && (
                    <div key={r.key} className="text-center p-2.5 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-[#003366]">{ratios[r.key]}{r.suffix}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{r.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ===== DCF DETAILED RESULTS ===== */}
          {methods?.dcf && !methods.dcf.error && (
            <Card className="border-2 border-blue-200" data-testid="dcf-results-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700"><TrendingUp className="w-5 h-5" /> DCF Valuation</CardTitle>
                <CardDescription>{methods.dcf.standard}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">₹{methods.dcf.enterprise_value?.toFixed(2)}</p>
                    <p className="text-xs text-blue-600">Enterprise Value ({unit})</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">₹{methods.dcf.equity_value?.toFixed(2)}</p>
                    <p className="text-xs text-blue-600">Equity Value ({unit})</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-700">₹{methods.dcf.pv_terminal_value?.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">PV Terminal Value ({unit})</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-700">₹{methods.dcf.pv_fcff_sum?.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">PV of FCFF ({unit})</p>
                  </div>
                </div>

                {/* FCFF Projections Table */}
                {methods.dcf.projections?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Projected Free Cash Flow to Firm (FCFF)</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-blue-50">
                          <th className="px-3 py-2 text-left font-semibold">Year</th>
                          <th className="px-3 py-2 text-right font-semibold">FCFF (₹ {unit})</th>
                          <th className="px-3 py-2 text-right font-semibold">Discount Factor</th>
                          <th className="px-3 py-2 text-right font-semibold">PV of FCFF (₹ {unit})</th>
                        </tr></thead>
                        <tbody>
                          {methods.dcf.projections.map((p, i) => (
                            <tr key={i} className="border-t border-border">
                              <td className="px-3 py-1.5 font-medium">Year {p.year}</td>
                              <td className="px-3 py-1.5 text-right">{p.fcff.toFixed(2)}</td>
                              <td className="px-3 py-1.5 text-right">{p.discount_factor.toFixed(4)}</td>
                              <td className="px-3 py-1.5 text-right font-medium">{p.pv_fcff.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sensitivity Analysis */}
                {methods.dcf.sensitivity?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Sensitivity Analysis — Equity Value (₹ {unit})</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-blue-50">
                          <th className="px-3 py-2 text-left font-semibold">WACC</th>
                          {Object.keys(methods.dcf.sensitivity[0]).filter(k => k !== "wacc").map(k => (
                            <th key={k} className="px-3 py-2 text-right font-semibold">TG {k.replace("tg_", "")}%</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {methods.dcf.sensitivity.map((row, i) => (
                            <tr key={i} className={`border-t border-border ${row.wacc === methods.dcf.assumptions?.wacc ? "bg-blue-50 font-semibold" : ""}`}>
                              <td className="px-3 py-1.5">{row.wacc}%</td>
                              {Object.entries(row).filter(([k]) => k !== "wacc").map(([k, v]) => (
                                <td key={k} className="px-3 py-1.5 text-right">{typeof v === "number" ? v.toFixed(2) : v}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Assumptions */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-800 mb-1">Key Assumptions</p>
                  <div className="flex flex-wrap gap-4 text-xs text-blue-700">
                    <span>WACC: {methods.dcf.assumptions?.wacc}%</span>
                    <span>Growth: {methods.dcf.assumptions?.growth_rate}%</span>
                    <span>Terminal Growth: {methods.dcf.assumptions?.terminal_growth}%</span>
                    <span>Projection: {methods.dcf.assumptions?.projection_years} years</span>
                    <span>Basis: {methods.dcf.assumptions?.cost_of_equity_basis}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ===== NAV RESULTS ===== */}
          {methods?.nav && !methods.nav.error && (
            <Card className="border-2 border-emerald-200" data-testid="nav-results-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-700"><Building2 className="w-5 h-5" /> NAV Valuation</CardTitle>
                <CardDescription>{methods.nav.standard}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-700">₹{methods.nav.going_concern_nav?.toFixed(2)}</p>
                    <p className="text-xs text-emerald-600">Going Concern NAV ({unit})</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-700">₹{methods.nav.liquidation_nav?.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Liquidation NAV ({unit})</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-700">₹{methods.nav.illiquidity_adjusted_nav?.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">After Illiquidity Disc. ({unit})</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-700">₹{methods.nav.per_share_going_concern?.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Per Share NAV</p>
                  </div>
                </div>
                {/* Adjustments */}
                {methods.nav.adjustments?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Fair Value Adjustments</p>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-border"><td className="py-1.5 font-medium">Book Net Worth</td><td className="py-1.5 text-right font-medium">₹{methods.nav.book_net_worth?.toFixed(2)} {unit}</td></tr>
                        {methods.nav.adjustments.map((a, i) => (
                          <tr key={i} className="border-b border-border">
                            <td className="py-1.5 pl-4">{a.item}</td>
                            <td className={`py-1.5 text-right ${a.amount < 0 ? "text-red-600" : "text-green-600"}`}>{a.amount > 0 ? "+" : ""}₹{a.amount.toFixed(2)} {unit}</td>
                          </tr>
                        ))}
                        <tr className="bg-emerald-50 font-semibold"><td className="py-1.5">Adjusted Net Worth</td><td className="py-1.5 text-right">₹{methods.nav.adjusted_net_worth?.toFixed(2)} {unit}</td></tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== COMPARABLE RESULTS ===== */}
          {methods?.comparable && !methods.comparable.error && (
            <Card className="border-2 border-purple-200" data-testid="comparable-results-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700"><BarChart3 className="w-5 h-5" /> Comparable Company Multiples</CardTitle>
                <CardDescription>{methods.comparable.standard}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Peers Table */}
                {methods.comparable.peers?.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-purple-50">
                        <th className="px-3 py-2 text-left font-semibold">Company</th>
                        <th className="px-3 py-2 text-right font-semibold">P/E</th>
                        <th className="px-3 py-2 text-right font-semibold">EV/EBITDA</th>
                        <th className="px-3 py-2 text-right font-semibold">P/B</th>
                        <th className="px-3 py-2 text-right font-semibold">EV/Sales</th>
                      </tr></thead>
                      <tbody>
                        {methods.comparable.peers.map((p, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-3 py-1.5 font-medium">{p.name}</td>
                            <td className="px-3 py-1.5 text-right">{p.pe || "—"}</td>
                            <td className="px-3 py-1.5 text-right">{p.ev_ebitda || "—"}</td>
                            <td className="px-3 py-1.5 text-right">{p.pb || "—"}</td>
                            <td className="px-3 py-1.5 text-right">{p.ev_sales || "—"}</td>
                          </tr>
                        ))}
                        <tr className="bg-purple-50 font-semibold border-t-2 border-purple-200">
                          <td className="px-3 py-1.5">Median</td>
                          <td className="px-3 py-1.5 text-right">{methods.comparable.multiples_summary?.pe?.median || "—"}</td>
                          <td className="px-3 py-1.5 text-right">{methods.comparable.multiples_summary?.ev_ebitda?.median || "—"}</td>
                          <td className="px-3 py-1.5 text-right">{methods.comparable.multiples_summary?.pb?.median || "—"}</td>
                          <td className="px-3 py-1.5 text-right">{methods.comparable.multiples_summary?.ev_sales?.median || "—"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Applied Valuations */}
                {methods.comparable.applied_valuations && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(methods.comparable.applied_valuations).map(([k, v]) => (
                      <div key={k} className="bg-purple-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-purple-700">₹{v.value.toFixed(2)} {unit}</p>
                        <p className="text-[10px] text-purple-600">{v.label}</p>
                        <p className="text-[10px] text-muted-foreground">{v.multiple}x × ₹{v.metric.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== DDM RESULTS ===== */}
          {methods?.ddm && methods.ddm.valuation > 0 && (
            <Card className="border-2 border-amber-200" data-testid="ddm-results-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700"><DollarSign className="w-5 h-5" /> Dividend Discount Model</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-amber-700">₹{methods.ddm.valuation?.toFixed(2)} {unit}</p>
                    <p className="text-xs text-amber-600">Total Value</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-700">₹{methods.ddm.value_per_share?.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Value Per Share</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-gray-700">{methods.ddm.formula}</p>
                    <p className="text-xs text-muted-foreground">Gordon Growth Formula</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {methods?.ddm?.warning && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4" /> {methods.ddm.warning}
            </div>
          )}

          {/* ===== RISK ASSESSMENT ===== */}
          {risk && risk.overall_rating && (
            <Card className="border border-border" data-testid="risk-assessment-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-[#003366]" /> Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  {["industry_risk", "financial_risk", "management_risk", "legal_risk", "market_risk"].map(rKey => {
                    const r = risk[rKey];
                    if (!r) return null;
                    const label = rKey.replace("_risk", "").replace("_", " ");
                    return (
                      <div key={rKey} className={`rounded-lg border p-3 ${RISK_COLORS[r.level] || "bg-gray-50"}`}>
                        <p className="text-xs font-semibold capitalize mb-1">{label}</p>
                        <Badge className={`text-[10px] ${RISK_COLORS[r.level]?.split(" ").slice(0, 1).join(" ")}`}>{r.level}</Badge>
                        {r.factors?.length > 0 && (
                          <ul className="mt-2 space-y-0.5">
                            {r.factors.slice(0, 2).map((f, i) => <li key={i} className="text-[10px] leading-tight">{f}</li>)}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Overall Risk:</span>
                    <Badge className={`ml-2 ${RISK_COLORS[risk.overall_rating]}`}>{risk.overall_rating}</Badge>
                  </div>
                  {risk.recommended_discount && (
                    <div className="text-xs text-muted-foreground">
                      Recommended Discount: <span className="font-semibold text-black">{risk.recommended_discount}%</span>
                    </div>
                  )}
                </div>
                {risk.mitigation?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Mitigation Strategies</p>
                    <ul className="space-y-1">
                      {risk.mitigation.map((m, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" /> {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== REGULATORY COMPLIANCE ===== */}
          {ai_analysis?.regulatory && (
            <Card className="border border-border" data-testid="regulatory-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Landmark className="w-5 h-5 text-[#003366]" /> Regulatory Compliance</CardTitle>
                <CardDescription>Applicable Indian laws and compliance requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line text-xs leading-relaxed">
                    {ai_analysis.regulatory}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ===== TAX IMPLICATIONS ===== */}
          {ai_analysis?.tax && (
            <Card className="border border-border" data-testid="tax-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calculator className="w-5 h-5 text-[#003366]" /> Tax Implications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line text-xs leading-relaxed">
                    {ai_analysis.tax}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ===== QUALITY CONTROL ===== */}
          {qc && (
            <Card className="border border-border" data-testid="qc-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-[#003366]" /> Quality Control</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {qc.variance_check && (
                    <div className={`rounded-lg p-3 text-center ${qc.variance_check === "PASS" ? "bg-green-50" : "bg-red-50"}`}>
                      {qc.variance_check === "PASS" ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /> : <XCircle className="w-5 h-5 text-red-500 mx-auto" />}
                      <p className="text-xs font-medium mt-1">Variance Check</p>
                      <p className="text-[10px] text-muted-foreground">{qc.variance_check}</p>
                    </div>
                  )}
                  {qc.consistency_check && (
                    <div className={`rounded-lg p-3 text-center ${qc.consistency_check === "PASS" ? "bg-green-50" : "bg-red-50"}`}>
                      {qc.consistency_check === "PASS" ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /> : <XCircle className="w-5 h-5 text-red-500 mx-auto" />}
                      <p className="text-xs font-medium mt-1">Consistency Check</p>
                      <p className="text-[10px] text-muted-foreground">{qc.consistency_check}</p>
                    </div>
                  )}
                  {qc.data_quality && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <Info className="w-5 h-5 text-blue-500 mx-auto" />
                      <p className="text-xs font-medium mt-1">Data Quality</p>
                      <p className="text-[10px] text-muted-foreground">{qc.data_quality}</p>
                    </div>
                  )}
                </div>
                {qc.flags?.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {qc.flags.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded px-3 py-1.5">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {f}
                      </div>
                    ))}
                  </div>
                )}
                {qc.recommendations?.length > 0 && (
                  <div className="space-y-1">
                    {qc.recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" /> {r}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Disclaimer:</strong> This valuation is AI-assisted and generated through IPO Labs. It does not replace professional judgment. Final certification by CA / Registered Valuer / SEBI-registered Category I Merchant Banker is mandatory for regulatory filings per Companies Act 2013 and SEBI regulations.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ValuationResults;
