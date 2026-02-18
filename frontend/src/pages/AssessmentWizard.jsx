import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Building2,
  FileText,
  TrendingUp,
  BarChart3,
  Calculator,
  CheckCircle2,
  Sparkles
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Company Info", icon: Building2 },
  { id: 2, title: "P&L Data", icon: FileText },
  { id: 3, title: "Balance Sheet", icon: BarChart3 },
  { id: 4, title: "Projections", icon: TrendingUp },
  { id: 5, title: "Market Data", icon: Calculator }
];

const AssessmentWizard = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    // Step 1: Company Info
    company_type: "",
    target_board: "",
    reporting_unit: "crores",
    
    // Step 2: P&L Data (3 years)
    year1_pat: "",
    year2_pat: "",
    year3_pat: "",
    year1_ebitda: "",
    year2_ebitda: "",
    year3_ebitda: "",
    year1_revenue: "",
    year2_revenue: "",
    year3_revenue: "",
    
    // Step 3: Balance Sheet
    total_debt: "",
    total_cash: "",
    net_tangible_assets_y1: "",
    net_tangible_assets_y2: "",
    net_tangible_assets_y3: "",
    net_worth_y1: "",
    net_worth_y2: "",
    net_worth_y3: "",
    depreciation: "",
    capital_expenditure: "",
    working_capital_change: "",
    
    // Step 4: Projections
    growth_rate: "",
    wacc: "",
    terminal_growth: "3",
    
    // Step 5: Market Data
    industry_pe: "",
    peer_pe: "",
    issue_type: "fresh",
    dilution_percent: "25"
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.company_type && formData.target_board;
      case 2:
        return formData.year1_pat && formData.year2_pat && formData.year3_pat &&
               formData.year1_ebitda && formData.year2_ebitda && formData.year3_ebitda &&
               formData.year1_revenue && formData.year2_revenue && formData.year3_revenue;
      case 3:
        return formData.total_debt !== "" && formData.total_cash !== "" &&
               formData.net_tangible_assets_y1 && formData.net_tangible_assets_y2 && formData.net_tangible_assets_y3 &&
               formData.net_worth_y1 && formData.net_worth_y2 && formData.net_worth_y3 &&
               formData.depreciation !== "" && formData.capital_expenditure !== "" && formData.working_capital_change !== "";
      case 4:
        return formData.growth_rate && formData.wacc && formData.terminal_growth;
      case 5:
        return formData.industry_pe && formData.peer_pe && formData.dilution_percent;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast.error("Please fill all required fields");
      return;
    }
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/assessment");
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        company_info: {
          company_type: formData.company_type,
          target_board: formData.target_board,
          reporting_unit: formData.reporting_unit
        },
        pl_data: {
          year1_pat: parseFloat(formData.year1_pat) || 0,
          year2_pat: parseFloat(formData.year2_pat) || 0,
          year3_pat: parseFloat(formData.year3_pat) || 0,
          year1_ebitda: parseFloat(formData.year1_ebitda) || 0,
          year2_ebitda: parseFloat(formData.year2_ebitda) || 0,
          year3_ebitda: parseFloat(formData.year3_ebitda) || 0,
          year1_revenue: parseFloat(formData.year1_revenue) || 0,
          year2_revenue: parseFloat(formData.year2_revenue) || 0,
          year3_revenue: parseFloat(formData.year3_revenue) || 0
        },
        balance_sheet: {
          total_debt: parseFloat(formData.total_debt) || 0,
          total_cash: parseFloat(formData.total_cash) || 0,
          net_tangible_assets_y1: parseFloat(formData.net_tangible_assets_y1) || 0,
          net_tangible_assets_y2: parseFloat(formData.net_tangible_assets_y2) || 0,
          net_tangible_assets_y3: parseFloat(formData.net_tangible_assets_y3) || 0,
          net_worth_y1: parseFloat(formData.net_worth_y1) || 0,
          net_worth_y2: parseFloat(formData.net_worth_y2) || 0,
          net_worth_y3: parseFloat(formData.net_worth_y3) || 0,
          depreciation: parseFloat(formData.depreciation) || 0,
          capital_expenditure: parseFloat(formData.capital_expenditure) || 0,
          working_capital_change: parseFloat(formData.working_capital_change) || 0
        },
        projections: {
          growth_rate: parseFloat(formData.growth_rate) || 0,
          wacc: parseFloat(formData.wacc) || 0,
          terminal_growth: parseFloat(formData.terminal_growth) || 3
        },
        market_data: {
          industry_pe: parseFloat(formData.industry_pe) || 0,
          peer_pe: parseFloat(formData.peer_pe) || 0
        },
        issue_type: formData.issue_type,
        dilution_percent: parseFloat(formData.dilution_percent) || 25
      };

      const response = await apiClient.post("/assessment/calculate", payload);
      
      // Navigate to results page with assessment data
      navigate(`/assessment/results/${response.data.assessment_id}`, {
        state: { assessmentData: response.data }
      });
      
      toast.success("Assessment completed!");
    } catch (error) {
      console.error("Assessment failed:", error);
      toast.error("Failed to complete assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = (currentStep / 5) * 100;
  const unit = formData.reporting_unit === "crores" ? "Cr" : "L";

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="assessment-wizard-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-border px-8 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-black mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 1 ? "Back to Assessment" : "Previous Step"}
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">IPO Readiness Assessment</h1>
                <p className="text-muted-foreground">Step {currentStep} of 5: {STEPS[currentStep - 1].title}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Progress */}
        <div className="bg-white border-b border-border px-8 py-4">
          <div className="max-w-4xl mx-auto">
            <Progress value={progress} className="h-2 mb-4" />
            <div className="flex justify-between">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 text-sm ${
                    step.id === currentStep
                      ? "text-green-600 font-medium"
                      : step.id < currentStep
                        ? "text-green-600"
                        : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      step.id === currentStep
                        ? "bg-green-600 text-white"
                        : step.id < currentStep
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step.id < currentStep ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                  </div>
                  <span className="hidden md:inline">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Step 1: Company Info */}
          {currentStep === 1 && (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  Company Information
                </CardTitle>
                <CardDescription>Basic details about your company and IPO target</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Company Type *</Label>
                  <RadioGroup
                    value={formData.company_type}
                    onValueChange={(v) => updateField("company_type", v)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.company_type === "private_limited"
                          ? "border-green-400 bg-green-50"
                          : "border-border hover:border-green-200"
                      }`}
                      onClick={() => updateField("company_type", "private_limited")}
                    >
                      <RadioGroupItem value="private_limited" id="private_limited" />
                      <Label htmlFor="private_limited" className="cursor-pointer font-medium">
                        Private Limited
                      </Label>
                    </div>
                    <div
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.company_type === "public_limited"
                          ? "border-green-400 bg-green-50"
                          : "border-border hover:border-green-200"
                      }`}
                      onClick={() => updateField("company_type", "public_limited")}
                    >
                      <RadioGroupItem value="public_limited" id="public_limited" />
                      <Label htmlFor="public_limited" className="cursor-pointer font-medium">
                        Public Limited
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Target Board *</Label>
                  <RadioGroup
                    value={formData.target_board}
                    onValueChange={(v) => updateField("target_board", v)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.target_board === "mainboard"
                          ? "border-green-400 bg-green-50"
                          : "border-border hover:border-green-200"
                      }`}
                      onClick={() => updateField("target_board", "mainboard")}
                    >
                      <RadioGroupItem value="mainboard" id="mainboard" />
                      <div>
                        <Label htmlFor="mainboard" className="cursor-pointer font-medium">Mainboard</Label>
                        <p className="text-xs text-muted-foreground">NSE / BSE Mainboard</p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.target_board === "sme"
                          ? "border-green-400 bg-green-50"
                          : "border-border hover:border-green-200"
                      }`}
                      onClick={() => updateField("target_board", "sme")}
                    >
                      <RadioGroupItem value="sme" id="sme" />
                      <div>
                        <Label htmlFor="sme" className="cursor-pointer font-medium">SME Board</Label>
                        <p className="text-xs text-muted-foreground">NSE Emerge / BSE SME</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Reporting Unit</Label>
                  <RadioGroup
                    value={formData.reporting_unit}
                    onValueChange={(v) => updateField("reporting_unit", v)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="crores" id="crores" />
                      <Label htmlFor="crores" className="cursor-pointer">Crores (₹ Cr)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="lacs" id="lacs" />
                      <Label htmlFor="lacs" className="cursor-pointer">Lakhs (₹ L)</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: P&L Data */}
          {currentStep === 2 && (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Profit & Loss Data (Last 3 Years)
                </CardTitle>
                <CardDescription>Enter financial data in {formData.reporting_unit === "crores" ? "Crores" : "Lakhs"}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pat" className="w-full">
                  <TabsList className="grid grid-cols-3 w-full mb-6">
                    <TabsTrigger value="pat">Net Profit (PAT)</TabsTrigger>
                    <TabsTrigger value="ebitda">EBITDA</TabsTrigger>
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="pat" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Year 1 (FY-2) PAT *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            value={formData.year1_pat}
                            onChange={(e) => updateField("year1_pat", e.target.value)}
                            className="pl-7"
                            placeholder="0.00"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Year 2 (FY-1) PAT *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            value={formData.year2_pat}
                            onChange={(e) => updateField("year2_pat", e.target.value)}
                            className="pl-7"
                            placeholder="0.00"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Year 3 (Current) PAT *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            value={formData.year3_pat}
                            onChange={(e) => updateField("year3_pat", e.target.value)}
                            className="pl-7"
                            placeholder="0.00"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ebitda" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Year 1 (FY-2) EBITDA *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            value={formData.year1_ebitda}
                            onChange={(e) => updateField("year1_ebitda", e.target.value)}
                            className="pl-7"
                            placeholder="0.00"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Year 2 (FY-1) EBITDA *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            value={formData.year2_ebitda}
                            onChange={(e) => updateField("year2_ebitda", e.target.value)}
                            className="pl-7"
                            placeholder="0.00"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Year 3 (Current) EBITDA *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            value={formData.year3_ebitda}
                            onChange={(e) => updateField("year3_ebitda", e.target.value)}
                            className="pl-7"
                            placeholder="0.00"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="revenue" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Year 1 (FY-2) Revenue *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            value={formData.year1_revenue}
                            onChange={(e) => updateField("year1_revenue", e.target.value)}
                            className="pl-7"
                            placeholder="0.00"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Year 2 (FY-1) Revenue *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            value={formData.year2_revenue}
                            onChange={(e) => updateField("year2_revenue", e.target.value)}
                            className="pl-7"
                            placeholder="0.00"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Year 3 (Current) Revenue *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            value={formData.year3_revenue}
                            onChange={(e) => updateField("year3_revenue", e.target.value)}
                            className="pl-7"
                            placeholder="0.00"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Balance Sheet */}
          {currentStep === 3 && (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Balance Sheet Data
                </CardTitle>
                <CardDescription>Enter data in {formData.reporting_unit === "crores" ? "Crores" : "Lakhs"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Debt *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        value={formData.total_debt}
                        onChange={(e) => updateField("total_debt", e.target.value)}
                        className="pl-7"
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Cash *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        value={formData.total_cash}
                        onChange={(e) => updateField("total_cash", e.target.value)}
                        className="pl-7"
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-4 block">Net Tangible Assets (3 Years) *</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Year 1 (FY-2)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          value={formData.net_tangible_assets_y1}
                          onChange={(e) => updateField("net_tangible_assets_y1", e.target.value)}
                          className="pl-7"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Year 2 (FY-1)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          value={formData.net_tangible_assets_y2}
                          onChange={(e) => updateField("net_tangible_assets_y2", e.target.value)}
                          className="pl-7"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Year 3 (Current)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          value={formData.net_tangible_assets_y3}
                          onChange={(e) => updateField("net_tangible_assets_y3", e.target.value)}
                          className="pl-7"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-4 block">Net Worth (3 Years) *</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Year 1 (FY-2)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          value={formData.net_worth_y1}
                          onChange={(e) => updateField("net_worth_y1", e.target.value)}
                          className="pl-7"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Year 2 (FY-1)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          value={formData.net_worth_y2}
                          onChange={(e) => updateField("net_worth_y2", e.target.value)}
                          className="pl-7"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Year 3 (Current)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          value={formData.net_worth_y3}
                          onChange={(e) => updateField("net_worth_y3", e.target.value)}
                          className="pl-7"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Depreciation (Annual) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        value={formData.depreciation}
                        onChange={(e) => updateField("depreciation", e.target.value)}
                        className="pl-7"
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Capital Expenditure *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        value={formData.capital_expenditure}
                        onChange={(e) => updateField("capital_expenditure", e.target.value)}
                        className="pl-7"
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Change in Working Capital *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        value={formData.working_capital_change}
                        onChange={(e) => updateField("working_capital_change", e.target.value)}
                        className="pl-7"
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Projections */}
          {currentStep === 4 && (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Growth & Projection Data
                </CardTitle>
                <CardDescription>5-year growth projections for DCF calculation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Expected Growth Rate (5-Year) *</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.growth_rate}
                        onChange={(e) => updateField("growth_rate", e.target.value)}
                        placeholder="15"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Annual revenue/profit growth rate</p>
                  </div>
                  <div className="space-y-2">
                    <Label>WACC (Cost of Capital) *</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.wacc}
                        onChange={(e) => updateField("wacc", e.target.value)}
                        placeholder="12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Weighted Average Cost of Capital</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Terminal Growth Rate</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.terminal_growth}
                        onChange={(e) => updateField("terminal_growth", e.target.value)}
                        placeholder="3"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Long-term perpetual growth (default: 3%)</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">About These Projections</h4>
                  <p className="text-sm text-blue-700">
                    These figures are used in the DCF (Discounted Cash Flow) valuation model. 
                    The growth rate should reflect your realistic 5-year growth expectations. 
                    WACC typically ranges from 10-15% for most Indian companies.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Market Data */}
          {currentStep === 5 && (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-green-600" />
                  Market Data & Issue Details
                </CardTitle>
                <CardDescription>Industry benchmarks and IPO structure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Industry Average P/E Ratio *</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.industry_pe}
                        onChange={(e) => updateField("industry_pe", e.target.value)}
                        placeholder="25"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">x</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Sector P/E from NSE/BSE data</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Peer Group P/E Ratio *</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.peer_pe}
                        onChange={(e) => updateField("peer_pe", e.target.value)}
                        placeholder="22"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">x</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Comparable companies' average P/E</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Issue Type *</Label>
                  <RadioGroup
                    value={formData.issue_type}
                    onValueChange={(v) => updateField("issue_type", v)}
                    className="grid grid-cols-3 gap-4"
                  >
                    <div
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.issue_type === "fresh"
                          ? "border-green-400 bg-green-50"
                          : "border-border hover:border-green-200"
                      }`}
                      onClick={() => updateField("issue_type", "fresh")}
                    >
                      <RadioGroupItem value="fresh" id="fresh" />
                      <div>
                        <Label htmlFor="fresh" className="cursor-pointer font-medium">Fresh Issue</Label>
                        <p className="text-xs text-muted-foreground">New shares issued</p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.issue_type === "ofs"
                          ? "border-green-400 bg-green-50"
                          : "border-border hover:border-green-200"
                      }`}
                      onClick={() => updateField("issue_type", "ofs")}
                    >
                      <RadioGroupItem value="ofs" id="ofs" />
                      <div>
                        <Label htmlFor="ofs" className="cursor-pointer font-medium">OFS</Label>
                        <p className="text-xs text-muted-foreground">Offer for Sale</p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.issue_type === "both"
                          ? "border-green-400 bg-green-50"
                          : "border-border hover:border-green-200"
                      }`}
                      onClick={() => updateField("issue_type", "both")}
                    >
                      <RadioGroupItem value="both" id="both" />
                      <div>
                        <Label htmlFor="both" className="cursor-pointer font-medium">Both</Label>
                        <p className="text-xs text-muted-foreground">Fresh + OFS</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Dilution Percentage *</Label>
                  <Select value={formData.dilution_percent} onValueChange={(v) => updateField("dilution_percent", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select dilution %" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="15">15%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                      <SelectItem value="25">25% (SEBI minimum for Mainboard)</SelectItem>
                      <SelectItem value="30">30%</SelectItem>
                      <SelectItem value="35">35%</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    SEBI requires minimum 25% public offering for Mainboard IPOs
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? "Cancel" : "Previous"}
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : currentStep === 5 ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Results
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssessmentWizard;
