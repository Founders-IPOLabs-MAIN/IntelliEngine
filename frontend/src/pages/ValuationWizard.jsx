import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft, ArrowRight, Loader2, Building2, FileText, TrendingUp,
  BarChart3, Calculator, CheckCircle2, Sparkles, Upload, Scale,
  Plus, Trash2, Save, Info, FileUp, Wand2, File, X
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Company Profile", icon: Building2 },
  { id: 2, title: "Financial Data", icon: BarChart3 },
  { id: 3, title: "Valuation Config", icon: Calculator },
  { id: 4, title: "Run Valuation", icon: Sparkles },
];

const INDUSTRIES = [
  "Information Technology", "Financial Services", "Healthcare & Pharma",
  "Manufacturing", "FMCG & Consumer", "Real Estate", "Infrastructure",
  "Automobile", "Textiles", "Chemicals", "E-commerce", "Fintech",
  "Edtech", "Agriculture", "Energy & Power", "Telecom", "Media & Entertainment",
  "Logistics", "Hospitality", "Mining & Metals", "Other"
];

const EMPTY_YEAR = {
  year: "", revenue: "", ebitda: "", pat: "", depreciation: "",
  capex: "", working_capital_change: "", total_assets: "", total_liabilities: "",
  net_worth: "", total_debt: "", cash_equivalents: "", current_assets: "",
  current_liabilities: "", dividend_per_share: ""
};

const ValuationWizard = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const { valuationId } = useParams();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [loadingProject, setLoadingProject] = useState(true);

  // Step 1: Company Profile
  const [profile, setProfile] = useState({
    company_name: "", industry: "", purpose: "", currency: "crores",
    description: "", company_type: "private_limited"
  });

  // Step 2: Financial Data
  const [yearsData, setYearsData] = useState([
    { ...EMPTY_YEAR, year: "FY2024" },
    { ...EMPTY_YEAR, year: "FY2023" },
    { ...EMPTY_YEAR, year: "FY2022" },
  ]);
  const [sharesOutstanding, setSharesOutstanding] = useState("");
  const [faceValue, setFaceValue] = useState("10");
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // Step 3: Valuation Config
  const [methods, setMethods] = useState(["dcf"]);
  const [dcfConfig, setDcfConfig] = useState({ wacc: "12", growth_rate: "15", terminal_growth: "4", projection_years: "5" });
  const [navConfig, setNavConfig] = useState({ illiquidity_discount: "20", land_building_adj: "0", investment_adj: "0", contingent_liabilities: "0" });
  const [comparableConfig, setComparableConfig] = useState({
    peers: [{ name: "", pe: "", ev_ebitda: "", pb: "", ev_sales: "" }]
  });
  const [ddmConfig, setDdmConfig] = useState({ cost_of_equity: "14", dividend_growth: "5" });
  const [weights, setWeights] = useState({ dcf: "50", nav: "25", comparable: "25", ddm: "0" });

  useEffect(() => {
    loadProject();
  }, [valuationId]);

  const loadProject = async () => {
    try {
      const res = await apiClient.get(`/valuation/projects/${valuationId}`);
      const p = res.data;
      if (p.company_profile?.company_name) setProfile(p.company_profile);
      if (p.financial_data?.years_data?.length) {
        setYearsData(p.financial_data.years_data);
        if (p.financial_data.shares_outstanding) setSharesOutstanding(String(p.financial_data.shares_outstanding));
        if (p.financial_data.face_value) setFaceValue(String(p.financial_data.face_value));
      }
      if (p.documents?.length) setUploadedDocs(p.documents);
      if (p.valuation_config?.methods) {
        setMethods(p.valuation_config.methods);
        if (p.valuation_config.dcf_config) setDcfConfig(prev => ({ ...prev, ...Object.fromEntries(Object.entries(p.valuation_config.dcf_config).map(([k, v]) => [k, String(v)])) }));
        if (p.valuation_config.nav_config) setNavConfig(prev => ({ ...prev, ...Object.fromEntries(Object.entries(p.valuation_config.nav_config).map(([k, v]) => [k, String(v)])) }));
        if (p.valuation_config.weights) setWeights(prev => ({ ...prev, ...Object.fromEntries(Object.entries(p.valuation_config.weights).map(([k, v]) => [k, String(v * 100)])) }));
      }
      if (p.current_step) setStep(Math.min(p.current_step, 4));
      if (p.status === "completed") navigate(`/valuation/${valuationId}/results`);
    } catch (err) {
      toast.error("Failed to load project");
      navigate("/valuation");
    } finally {
      setLoadingProject(false);
    }
  };

  const saveProgress = async (nextStep) => {
    setSaving(true);
    try {
      const payload = {
        company_profile: profile,
        financial_data: {
          years_data: yearsData.map(y => {
            const parsed = {};
            for (const [k, v] of Object.entries(y)) {
              parsed[k] = k === "year" ? v : (parseFloat(v) || 0);
            }
            return parsed;
          }),
          shares_outstanding: parseInt(sharesOutstanding) || 1,
          face_value: parseFloat(faceValue) || 10
        },
        valuation_config: {
          methods,
          dcf_config: Object.fromEntries(Object.entries(dcfConfig).map(([k, v]) => [k, parseFloat(v) || 0])),
          nav_config: Object.fromEntries(Object.entries(navConfig).map(([k, v]) => [k, parseFloat(v) || 0])),
          comparable_config: {
            peers: comparableConfig.peers.map(p => ({
              name: p.name,
              pe: parseFloat(p.pe) || 0,
              ev_ebitda: parseFloat(p.ev_ebitda) || 0,
              pb: parseFloat(p.pb) || 0,
              ev_sales: parseFloat(p.ev_sales) || 0
            })).filter(p => p.name)
          },
          ddm_config: Object.fromEntries(Object.entries(ddmConfig).map(([k, v]) => [k, parseFloat(v) || 0])),
          weights: Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, (parseFloat(v) || 0) / 100]))
        },
        current_step: nextStep || step,
        status: "in_progress"
      };
      await apiClient.put(`/valuation/projects/${valuationId}`, payload);
      toast.success("Progress saved");
    } catch (err) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (step === 1 && (!profile.company_name || !profile.purpose || !profile.industry)) {
      toast.error("Please fill company name, purpose, and industry");
      return;
    }
    if (step === 2 && !yearsData.some(y => parseFloat(y.revenue) > 0)) {
      toast.error("Please enter financial data for at least one year");
      return;
    }
    if (step === 3 && methods.length === 0) {
      toast.error("Select at least one valuation method");
      return;
    }
    await saveProgress(step + 1);
    if (step < 4) setStep(step + 1);
  };

  const handleCalculate = async () => {
    setCalculating(true);
    await saveProgress(4);
    try {
      await apiClient.post(`/valuation/projects/${valuationId}/calculate`);
      toast.success("Valuation completed!");
      navigate(`/valuation/${valuationId}/results`);
    } catch (err) {
      console.error(err);
      toast.error("Valuation calculation failed. Please check your data.");
    } finally {
      setCalculating(false);
    }
  };

  const toggleMethod = (m) => {
    setMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const updateYear = (idx, field, value) => {
    setYearsData(prev => prev.map((y, i) => i === idx ? { ...y, [field]: value } : y));
  };

  const addYear = () => {
    const lastYear = yearsData[yearsData.length - 1]?.year || "FY2021";
    const num = parseInt(lastYear.replace("FY", "")) - 1;
    setYearsData(prev => [...prev, { ...EMPTY_YEAR, year: `FY${num}` }]);
  };

  const addPeer = () => {
    setComparableConfig(prev => ({
      ...prev,
      peers: [...prev.peers, { name: "", pe: "", ev_ebitda: "", pb: "", ev_sales: "" }]
    }));
  };

  const updatePeer = (idx, field, value) => {
    setComparableConfig(prev => ({
      ...prev,
      peers: prev.peers.map((p, i) => i === idx ? { ...p, [field]: value } : p)
    }));
  };

  const removePeer = (idx) => {
    setComparableConfig(prev => ({
      ...prev,
      peers: prev.peers.filter((_, i) => i !== idx)
    }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const newDocs = [];
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("doc_type", "financial_statement");
        const res = await apiClient.post(`/valuation/projects/${valuationId}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        newDocs.push(res.data.document);
        toast.success(`Uploaded: ${file.name}`);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setUploadedDocs(prev => [...prev, ...newDocs]);
    setUploading(false);
    e.target.value = "";
  };

  const handleAIExtract = async () => {
    setExtracting(true);
    try {
      const res = await apiClient.post(`/valuation/projects/${valuationId}/extract`);
      const extracted = res.data.extracted_data;
      if (extracted?.years_data?.length) {
        setYearsData(extracted.years_data.map(y => {
          const row = {};
          for (const key of Object.keys(EMPTY_YEAR)) {
            row[key] = y[key] !== undefined && y[key] !== null ? String(y[key]) : "";
          }
          return row;
        }));
        toast.success("Financial data extracted! Please review and adjust values.");
      }
      if (extracted?.shares_outstanding) setSharesOutstanding(String(extracted.shares_outstanding));
      if (extracted?.face_value) setFaceValue(String(extracted.face_value));
    } catch (err) {
      toast.error("AI extraction failed. Please enter data manually.");
    } finally {
      setExtracting(false);
    }
  };

  const unit = profile.currency === "crores" ? "Cr" : "L";
  const progress = (step / 4) * 100;

  if (loadingProject) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#003366]" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="valuation-wizard-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-border px-8 py-4">
          <button onClick={() => navigate("/valuation")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-black mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to Valuations
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-[#003366]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-black">{profile.company_name || "New Valuation"}</h1>
              <p className="text-sm text-muted-foreground">Step {step} of 4: {STEPS[step - 1].title}</p>
            </div>
          </div>
        </header>

        {/* Progress */}
        <div className="bg-white border-b border-border px-8 py-3">
          <div className="max-w-5xl mx-auto">
            <Progress value={progress} className="h-2 mb-3" />
            <div className="flex justify-between">
              {STEPS.map((s) => (
                <button key={s.id} onClick={() => s.id <= step && setStep(s.id)}
                  className={`flex items-center gap-2 text-xs ${s.id === step ? "text-[#003366] font-semibold" : s.id < step ? "text-[#003366]" : "text-gray-400"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    s.id === step ? "bg-[#003366] text-white" : s.id < step ? "bg-blue-100 text-[#003366]" : "bg-gray-100 text-gray-400"
                  }`}>
                    {s.id < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
                  </div>
                  <span className="hidden md:inline">{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-8 py-6">
          {/* STEP 1: Company Profile */}
          {step === 1 && (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-[#003366]" /> Company Profile</CardTitle>
                <CardDescription>Basic information about the company and valuation purpose</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input value={profile.company_name} onChange={e => setProfile(p => ({ ...p, company_name: e.target.value }))} placeholder="Enter company name" data-testid="company-name-input" />
                  </div>
                  <div className="space-y-2">
                    <Label>Industry Sector *</Label>
                    <Select value={profile.industry} onValueChange={v => setProfile(p => ({ ...p, industry: v }))}>
                      <SelectTrigger data-testid="industry-select"><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Valuation Purpose *</Label>
                  <RadioGroup value={profile.purpose} onValueChange={v => setProfile(p => ({ ...p, purpose: v }))} className="grid grid-cols-3 gap-3">
                    {[
                      { value: "ma", label: "M&A", desc: "Merger & Acquisition" },
                      { value: "esop", label: "ESOP", desc: "Employee stock pricing" },
                      { value: "ipo", label: "IPO", desc: "Initial Public Offering" },
                      { value: "family_settlement", label: "Family Settlement", desc: "Dispute resolution" },
                      { value: "tax_assessment", label: "Tax Assessment", desc: "Income Tax Act compliance" },
                    ].map(opt => (
                      <div key={opt.value}
                        className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${profile.purpose === opt.value ? "border-[#003366] bg-blue-50" : "border-border hover:border-blue-200"}`}
                        onClick={() => setProfile(p => ({ ...p, purpose: opt.value }))}
                      >
                        <RadioGroupItem value={opt.value} id={`purpose-${opt.value}`} />
                        <div>
                          <Label htmlFor={`purpose-${opt.value}`} className="cursor-pointer font-medium text-sm">{opt.label}</Label>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Type</Label>
                    <Select value={profile.company_type} onValueChange={v => setProfile(p => ({ ...p, company_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private_limited">Private Limited</SelectItem>
                        <SelectItem value="public_limited">Public Limited</SelectItem>
                        <SelectItem value="llp">LLP</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reporting Currency</Label>
                    <RadioGroup value={profile.currency} onValueChange={v => setProfile(p => ({ ...p, currency: v }))} className="flex gap-4 pt-2">
                      <div className="flex items-center gap-2"><RadioGroupItem value="crores" id="cr" /><Label htmlFor="cr">Crores (₹ Cr)</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="lakhs" id="lk" /><Label htmlFor="lk">Lakhs (₹ L)</Label></div>
                    </RadioGroup>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Company / Business Brief</Label>
                  <Textarea value={profile.description} onChange={e => setProfile(p => ({ ...p, description: e.target.value }))} placeholder="Brief about the company, its business model, and key strengths..." rows={3} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: Financial Data */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Document Upload Card */}
              <Card className="border-2 border-dashed border-[#00D1FF]/40 bg-gradient-to-r from-blue-50/50 to-cyan-50/30">
                <CardContent className="p-5">
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 bg-[#003366]/5 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileUp className="w-6 h-6 text-[#003366]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-black mb-0.5">Upload Financial Statements</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Upload audited P&L, Balance Sheet, or annual reports (PDF, Excel, Word). AI will extract and auto-fill the data table below.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.xlsx,.xls,.docx,.doc,.csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            data-testid="doc-upload-input"
                          />
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border rounded-lg text-xs font-medium text-gray-700 hover:border-[#003366] hover:text-[#003366] transition-colors">
                            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            {uploading ? "Uploading..." : "Choose Files"}
                          </span>
                        </label>
                        {uploadedDocs.length > 0 && (
                          <Button
                            size="sm"
                            onClick={handleAIExtract}
                            disabled={extracting}
                            className="bg-[#003366] hover:bg-[#002244] gap-1.5 text-xs h-7"
                            data-testid="ai-extract-btn"
                          >
                            {extracting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                            {extracting ? "Extracting..." : "Extract with AI"}
                          </Button>
                        )}
                      </div>
                      {/* Uploaded files list */}
                      {uploadedDocs.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {uploadedDocs.map((doc, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-border rounded-md text-xs" data-testid={`uploaded-doc-${i}`}>
                              <File className="w-3 h-3 text-[#003366]" />
                              <span className="text-gray-700 max-w-[150px] truncate">{doc.filename}</span>
                              <span className="text-gray-400">({(doc.size / 1024).toFixed(0)}KB)</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#003366]" /> Financial Statements ({unit})</CardTitle>
                  <CardDescription>Enter audited data for the last 3-5 years. All figures in ₹ {profile.currency === "crores" ? "Crores" : "Lakhs"}.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-3 py-2 font-semibold text-xs text-muted-foreground w-48">Particulars</th>
                          {yearsData.map((y, i) => (
                            <th key={i} className="px-2 py-2 text-center">
                              <Input value={y.year} onChange={e => updateYear(i, "year", e.target.value)} className="text-center text-xs h-8 font-semibold" />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { key: "revenue", label: "Revenue" },
                          { key: "ebitda", label: "EBITDA" },
                          { key: "pat", label: "PAT (Net Profit)" },
                          { key: "depreciation", label: "Depreciation" },
                          { key: "capex", label: "Capital Expenditure" },
                          { key: "working_capital_change", label: "Working Capital Change" },
                          { key: "total_assets", label: "Total Assets" },
                          { key: "total_liabilities", label: "Total Liabilities" },
                          { key: "net_worth", label: "Net Worth" },
                          { key: "total_debt", label: "Total Debt" },
                          { key: "cash_equivalents", label: "Cash & Equivalents" },
                          { key: "current_assets", label: "Current Assets" },
                          { key: "current_liabilities", label: "Current Liabilities" },
                          { key: "dividend_per_share", label: "Dividend/Share (₹)" },
                        ].map((field) => (
                          <tr key={field.key} className="border-t border-border hover:bg-gray-50/50">
                            <td className="px-3 py-1.5 text-xs font-medium text-gray-700">{field.label}</td>
                            {yearsData.map((y, i) => (
                              <td key={i} className="px-2 py-1">
                                <Input type="number" value={y[field.key]} onChange={e => updateYear(i, field.key, e.target.value)}
                                  className="text-right text-xs h-7" placeholder="0" data-testid={`fin-${field.key}-${i}`} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <Button variant="outline" size="sm" onClick={addYear} className="gap-1 text-xs"><Plus className="w-3 h-3" /> Add Year</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardContent className="pt-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Equity Shares Outstanding *</Label>
                      <Input type="number" value={sharesOutstanding} onChange={e => setSharesOutstanding(e.target.value)} placeholder="e.g. 1000000" data-testid="shares-input" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Face Value per Share (₹)</Label>
                      <Input type="number" value={faceValue} onChange={e => setFaceValue(e.target.value)} placeholder="10" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 3: Valuation Config */}
          {step === 3 && (
            <div className="space-y-4">
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Calculator className="w-5 h-5 text-[#003366]" /> Valuation Methods</CardTitle>
                  <CardDescription>Select methods and configure parameters. DCF is recommended as the primary method.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "dcf", label: "DCF (Discounted Cash Flow)", desc: "Recommended for profit-making companies", recommended: true },
                      { id: "nav", label: "NAV (Net Asset Value)", desc: "For asset-heavy or loss-making entities" },
                      { id: "comparable", label: "Comparable Multiples (CCM)", desc: "Listed sector peer comparison" },
                      { id: "ddm", label: "Dividend Discount (DDM)", desc: "For dividend-paying companies" },
                    ].map(m => (
                      <div key={m.id}
                        onClick={() => toggleMethod(m.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all flex items-start gap-3 ${methods.includes(m.id) ? "border-[#003366] bg-blue-50" : "border-border hover:border-blue-200"}`}
                        data-testid={`method-${m.id}`}
                      >
                        <Checkbox checked={methods.includes(m.id)} />
                        <div>
                          <p className="font-medium text-sm">{m.label} {m.recommended && <Badge className="ml-1 text-[10px] bg-green-100 text-green-700">Recommended</Badge>}</p>
                          <p className="text-xs text-muted-foreground">{m.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* DCF Config */}
              {methods.includes("dcf") && (
                <Card className="border-l-4 border-l-blue-500 border border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">DCF Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">WACC (%)</Label>
                        <Input type="number" value={dcfConfig.wacc} onChange={e => setDcfConfig(p => ({ ...p, wacc: e.target.value }))} data-testid="dcf-wacc" />
                        <p className="text-[10px] text-muted-foreground">Cost of Equity (CAPM) + Cost of Debt</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Growth Rate (%)</Label>
                        <Input type="number" value={dcfConfig.growth_rate} onChange={e => setDcfConfig(p => ({ ...p, growth_rate: e.target.value }))} data-testid="dcf-growth" />
                        <p className="text-[10px] text-muted-foreground">5-year FCFF growth</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Terminal Growth (%)</Label>
                        <Input type="number" value={dcfConfig.terminal_growth} onChange={e => setDcfConfig(p => ({ ...p, terminal_growth: e.target.value }))} />
                        <p className="text-[10px] text-muted-foreground">Perpetual growth (3-5%)</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Projection Years</Label>
                        <Input type="number" value={dcfConfig.projection_years} onChange={e => setDcfConfig(p => ({ ...p, projection_years: e.target.value }))} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* NAV Config */}
              {methods.includes("nav") && (
                <Card className="border-l-4 border-l-emerald-500 border border-border">
                  <CardHeader className="pb-3"><CardTitle className="text-sm">NAV Adjustments ({unit})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Land & Building Adj</Label>
                        <Input type="number" value={navConfig.land_building_adj} onChange={e => setNavConfig(p => ({ ...p, land_building_adj: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Investment Adj</Label>
                        <Input type="number" value={navConfig.investment_adj} onChange={e => setNavConfig(p => ({ ...p, investment_adj: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Contingent Liabilities</Label>
                        <Input type="number" value={navConfig.contingent_liabilities} onChange={e => setNavConfig(p => ({ ...p, contingent_liabilities: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Illiquidity Discount (%)</Label>
                        <Input type="number" value={navConfig.illiquidity_discount} onChange={e => setNavConfig(p => ({ ...p, illiquidity_discount: e.target.value }))} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comparable Config */}
              {methods.includes("comparable") && (
                <Card className="border-l-4 border-l-purple-500 border border-border">
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Comparable Companies</CardTitle></CardHeader>
                  <CardContent>
                    <table className="w-full text-xs">
                      <thead><tr className="bg-gray-50">
                        <th className="text-left px-2 py-1.5">Company Name</th>
                        <th className="text-center px-2 py-1.5">P/E</th>
                        <th className="text-center px-2 py-1.5">EV/EBITDA</th>
                        <th className="text-center px-2 py-1.5">P/B</th>
                        <th className="text-center px-2 py-1.5">EV/Sales</th>
                        <th className="w-8"></th>
                      </tr></thead>
                      <tbody>
                        {comparableConfig.peers.map((p, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-1 py-1"><Input value={p.name} onChange={e => updatePeer(i, "name", e.target.value)} className="h-7 text-xs" placeholder="Peer name" /></td>
                            <td className="px-1 py-1"><Input type="number" value={p.pe} onChange={e => updatePeer(i, "pe", e.target.value)} className="h-7 text-xs text-center" /></td>
                            <td className="px-1 py-1"><Input type="number" value={p.ev_ebitda} onChange={e => updatePeer(i, "ev_ebitda", e.target.value)} className="h-7 text-xs text-center" /></td>
                            <td className="px-1 py-1"><Input type="number" value={p.pb} onChange={e => updatePeer(i, "pb", e.target.value)} className="h-7 text-xs text-center" /></td>
                            <td className="px-1 py-1"><Input type="number" value={p.ev_sales} onChange={e => updatePeer(i, "ev_sales", e.target.value)} className="h-7 text-xs text-center" /></td>
                            <td className="px-1 py-1"><button onClick={() => removePeer(i)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <Button variant="outline" size="sm" onClick={addPeer} className="mt-2 gap-1 text-xs"><Plus className="w-3 h-3" /> Add Peer</Button>
                  </CardContent>
                </Card>
              )}

              {/* DDM Config */}
              {methods.includes("ddm") && (
                <Card className="border-l-4 border-l-amber-500 border border-border">
                  <CardHeader className="pb-3"><CardTitle className="text-sm">DDM Configuration</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Cost of Equity (%)</Label>
                        <Input type="number" value={ddmConfig.cost_of_equity} onChange={e => setDdmConfig(p => ({ ...p, cost_of_equity: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Dividend Growth Rate (%)</Label>
                        <Input type="number" value={ddmConfig.dividend_growth} onChange={e => setDdmConfig(p => ({ ...p, dividend_growth: e.target.value }))} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Weights */}
              {methods.length > 1 && (
                <Card className="border border-border">
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Method Weights (%)</CardTitle><CardDescription className="text-xs">Assign relative importance to each method (should sum to 100)</CardDescription></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      {methods.map(m => (
                        <div key={m} className="space-y-1.5">
                          <Label className="text-xs capitalize">{m === "comparable" ? "CCM" : m.toUpperCase()}</Label>
                          <Input type="number" value={weights[m]} onChange={e => setWeights(p => ({ ...p, [m]: e.target.value }))} className="text-center" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* STEP 4: Run Valuation */}
          {step === 4 && (
            <Card className="border-2 border-[#003366]">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-[#003366]" />
                </div>
                <h2 className="text-2xl font-bold text-black mb-2">Ready to Run Valuation</h2>
                <p className="text-sm text-muted-foreground mb-2 text-center max-w-md">
                  AI will analyze your financial data using {methods.length} method{methods.length > 1 ? "s" : ""}: {methods.map(m => m === "comparable" ? "CCM" : m.toUpperCase()).join(", ")}
                </p>
                <p className="text-xs text-muted-foreground mb-6">Includes regulatory compliance, risk assessment, and tax implications</p>
                <Button onClick={handleCalculate} disabled={calculating} className="bg-[#003366] hover:bg-[#002244] gap-2 px-8 py-6 text-base" data-testid="run-valuation-btn">
                  {calculating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Generating Valuation Report...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Generate Valuation Report</>
                  )}
                </Button>
                {calculating && (
                  <div className="mt-6 w-64">
                    <Progress value={66} className="h-1.5 mb-2" />
                    <p className="text-xs text-center text-muted-foreground">Running AI analysis across all agents...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : navigate("/valuation")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> {step === 1 ? "Cancel" : "Previous"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => saveProgress(step)} disabled={saving} className="gap-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </Button>
              {step < 4 && (
                <Button onClick={handleNext} className="bg-[#003366] hover:bg-[#002244]">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ValuationWizard;
