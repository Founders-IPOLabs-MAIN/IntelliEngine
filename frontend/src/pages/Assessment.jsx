import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/Sidebar";
import {
  CheckCircle2,
  ArrowRight,
  Calculator,
  Target,
  FileText,
  TrendingUp,
  Building2,
  Landmark,
  Brain,
  Shield,
  BarChart3,
  Sparkles
} from "lucide-react";

const ASSESSMENT_FEATURES = [
  {
    icon: Calculator,
    title: "4 Financial Calculators",
    description: "P/E Valuation, DCF, Issue Size & FCFE calculations"
  },
  {
    icon: Shield,
    title: "SEBI Eligibility Check",
    description: "Mainboard & SME board criteria validation"
  },
  {
    icon: Brain,
    title: "AI Gap Analysis",
    description: "Personalized recommendations powered by AI"
  },
  {
    icon: Target,
    title: "Readiness Score",
    description: "Comprehensive IPO readiness assessment"
  }
];

const Assessment = ({ user, apiClient }) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="assessment-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border border-white rounded-full" />
            <div className="absolute top-20 right-20 w-48 h-48 border border-white rounded-full" />
            <div className="absolute bottom-10 left-1/3 w-24 h-24 border border-white rounded-full" />
          </div>
          
          <div className="max-w-6xl mx-auto px-8 py-16 relative z-10">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <CheckCircle2 className="w-5 h-5 text-yellow-300" />
                <span className="font-semibold">Free IPO Readiness Assessment</span>
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight mb-4">
                IPO Readiness Assessment
              </h1>
              <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
                Comprehensive AI-powered analysis to determine if your company is ready for an IPO on NSE or BSE
              </p>
              
              <Button
                size="lg"
                onClick={() => navigate("/assessment/start")}
                className="bg-white text-green-700 hover:bg-green-50 gap-2"
                data-testid="start-assessment-btn"
              >
                Start Free Assessment
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Features Bar */}
        <div className="bg-gradient-to-r from-green-700 to-emerald-800 text-white">
          <div className="max-w-6xl mx-auto px-8 py-4">
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                <span>4 Calculators</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>SEBI Compliance</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span>AI Analysis</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Valuation Insights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-8 py-12">
          {/* What You'll Get */}
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-black mb-2">
              What You'll Get
            </h2>
            <p className="text-muted-foreground">
              Complete IPO readiness analysis in under 10 minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {ASSESSMENT_FEATURES.map((feature, index) => (
              <Card key={index} className="border border-border hover:border-green-300 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-black mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* How It Works */}
          <Card className="border border-border mb-12">
            <CardHeader>
              <CardTitle className="text-center">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                    1
                  </div>
                  <h4 className="font-semibold text-black mb-2">Company Details</h4>
                  <p className="text-sm text-muted-foreground">
                    Enter company type and target board
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                    2
                  </div>
                  <h4 className="font-semibold text-black mb-2">Financial Data</h4>
                  <p className="text-sm text-muted-foreground">
                    P&L, Balance Sheet for last 3 years
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                    3
                  </div>
                  <h4 className="font-semibold text-black mb-2">Market Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Industry P/E and growth projections
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                    4
                  </div>
                  <h4 className="font-semibold text-black mb-2">Get Results</h4>
                  <p className="text-sm text-muted-foreground">
                    AI-powered analysis & recommendations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculators Preview */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-black mb-2">
              4 Financial Calculators
            </h2>
            <p className="text-muted-foreground">
              Industry-standard valuation methods
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <BarChart3 className="w-5 h-5" />
                  P/E Valuation Calculator
                </CardTitle>
                <CardDescription>
                  Market Cap = PAT × Industry P/E Multiple
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Uses Trailing Twelve Months (TTM) profit with industry-specific P/E multiples to estimate market capitalization.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <TrendingUp className="w-5 h-5" />
                  DCF Business Valuation
                </CardTitle>
                <CardDescription>
                  Intrinsic Value using Discounted Cash Flow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  5-year FCF projections with terminal value calculation using Gordon Growth Method for intrinsic business value.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Landmark className="w-5 h-5" />
                  Issue Size Calculator
                </CardTitle>
                <CardDescription>
                  Capital to raise with dilution planning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Calculate total issue size based on valuation and dilution percentage. Supports Fresh Issue and OFS scenarios.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <FileText className="w-5 h-5" />
                  FCFE Calculator
                </CardTitle>
                <CardDescription>
                  Free Cash Flow to Equity analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Measures cash available to shareholders after all expenses and reinvestments. Critical for dividend-seeking investors.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* SEBI Criteria */}
          <Card className="border border-border mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                SEBI Eligibility Criteria Checked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Mainboard (NSE/BSE)
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      Net Tangible Assets ≥ ₹3 Crores (each of last 3 years)
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      Average Operating Profit ≥ ₹15 Crores (3-year avg)
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      Net Worth ≥ ₹1 Crore (each of last 3 years)
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
                    <Landmark className="w-4 h-4" />
                    SME Board (NSE Emerge / BSE SME)
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      Post-issue paid-up capital ₹1-25 Crores
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      Positive Net Worth in all 3 years
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      Operational profit for at least 2 years
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <Button
              size="lg"
              onClick={() => navigate("/assessment/start")}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Start Your Free Assessment
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Takes approximately 10 minutes • No payment required
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border-t border-amber-200">
          <div className="max-w-6xl mx-auto px-8 py-4">
            <p className="text-xs text-amber-800 text-center">
              <strong>Disclaimer:</strong> This IPO Readiness Assessment is a preliminary analysis based on SEBI's general guidelines. It is not a substitute for professional legal, financial, or accounting advice. Consult qualified professionals for comprehensive guidance.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Assessment;
