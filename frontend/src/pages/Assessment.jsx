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
    description: "P/E, DCF, Issue Size & FCFE"
  },
  {
    icon: Shield,
    title: "SEBI Eligibility",
    description: "Mainboard & SME validation"
  },
  {
    icon: Brain,
    title: "AI Gap Analysis",
    description: "Personalized recommendations"
  },
  {
    icon: Target,
    title: "Readiness Score",
    description: "IPO readiness assessment"
  }
];

const Assessment = ({ user, apiClient }) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="assessment-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Hero Section - Compact */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white">
          <div className="max-w-6xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs">
                      <CheckCircle2 className="w-3 h-3 text-yellow-300" />
                      <span className="font-medium">Free Assessment</span>
                    </div>
                  </div>
                  <h1 className="text-xl font-bold tracking-tight">
                    IPO Readiness Assessment
                  </h1>
                  <p className="text-sm text-green-100 mt-1">
                    AI-powered analysis to determine IPO readiness for NSE/BSE
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => navigate("/assessment/start")}
                className="bg-white text-green-700 hover:bg-green-50 gap-1.5 h-9 px-4"
                data-testid="start-assessment-btn"
              >
                Start Assessment
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Compact Features Bar */}
        <div className="bg-white border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-green-600" />
                <span className="text-muted-foreground">4 Calculators</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-green-600" />
                <span className="text-muted-foreground">SEBI Compliance</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-green-600" />
                <span className="text-muted-foreground">AI Analysis</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                <span className="text-muted-foreground">Valuation Insights</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-green-600" />
                <span className="text-muted-foreground">~10 min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Compact Layout */}
        <div className="max-w-6xl mx-auto px-6 py-5">
          {/* Two Column Layout */}
          <div className="grid grid-cols-3 gap-5">
            {/* Left Column - What You Get + How It Works */}
            <div className="col-span-2 space-y-5">
              {/* What You'll Get - Horizontal Cards */}
              <div>
                <h2 className="text-sm font-semibold text-black mb-3">What You'll Get</h2>
                <div className="grid grid-cols-4 gap-3">
                  {ASSESSMENT_FEATURES.map((feature, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-border hover:border-green-300 transition-colors">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                        <feature.icon className="w-4 h-4 text-green-600" />
                      </div>
                      <h3 className="font-medium text-black text-xs mb-0.5">{feature.title}</h3>
                      <p className="text-[10px] text-muted-foreground">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* How It Works - Compact Horizontal */}
              <div className="bg-white rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold text-black mb-3">How It Works</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
                    <h4 className="font-medium text-black text-xs mb-0.5">Company Details</h4>
                    <p className="text-[10px] text-muted-foreground">Type & target board</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
                    <h4 className="font-medium text-black text-xs mb-0.5">Financial Data</h4>
                    <p className="text-[10px] text-muted-foreground">P&L, Balance Sheet</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
                    <h4 className="font-medium text-black text-xs mb-0.5">Market Data</h4>
                    <p className="text-[10px] text-muted-foreground">Industry P/E & growth</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">4</div>
                    <h4 className="font-medium text-black text-xs mb-0.5">Get Results</h4>
                    <p className="text-[10px] text-muted-foreground">AI recommendations</p>
                  </div>
                </div>
              </div>

              {/* Calculators - Compact 2x2 Grid */}
              <div>
                <h3 className="text-sm font-semibold text-black mb-3">4 Financial Calculators</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-blue-700 text-xs">P/E Valuation</h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground">TTM profit × Industry P/E for market cap</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <h4 className="font-medium text-purple-700 text-xs">DCF Valuation</h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground">5-year FCF with terminal value</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Landmark className="w-4 h-4 text-orange-600" />
                      <h4 className="font-medium text-orange-700 text-xs">Issue Size</h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Capital raise with dilution planning</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-green-600" />
                      <h4 className="font-medium text-green-700 text-xs">FCFE Calculator</h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Free cash flow to equity analysis</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - SEBI Criteria + CTA */}
            <div className="space-y-4">
              {/* SEBI Criteria - Compact */}
              <div className="bg-white rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-black">SEBI Eligibility</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-black text-xs mb-2 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      Mainboard (NSE/BSE)
                    </h4>
                    <ul className="space-y-1.5 text-[10px] text-muted-foreground">
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        Net Tangible Assets ≥ ₹3 Cr
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        Avg Op. Profit ≥ ₹15 Cr
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        Net Worth ≥ ₹1 Cr
                      </li>
                    </ul>
                  </div>
                  
                  <div className="border-t border-border pt-3">
                    <h4 className="font-medium text-black text-xs mb-2 flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5" />
                      SME Board
                    </h4>
                    <ul className="space-y-1.5 text-[10px] text-muted-foreground">
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        Post-issue capital ₹1-25 Cr
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        Positive Net Worth (3 yrs)
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        Op. profit (2+ years)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CTA Card */}
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span className="text-xs font-medium">Free Assessment</span>
                </div>
                <h3 className="font-semibold text-sm mb-2">Ready to check your IPO eligibility?</h3>
                <p className="text-[10px] text-green-100 mb-3">
                  Get comprehensive analysis with AI-powered recommendations in ~10 minutes.
                </p>
                <Button
                  size="sm"
                  onClick={() => navigate("/assessment/start")}
                  className="w-full bg-white text-green-700 hover:bg-green-50 gap-1.5 h-8 text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Start Free Assessment
                </Button>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <p className="text-[10px] text-amber-800">
                  <strong>Disclaimer:</strong> This is a preliminary analysis based on SEBI guidelines. Not a substitute for professional advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Assessment;
