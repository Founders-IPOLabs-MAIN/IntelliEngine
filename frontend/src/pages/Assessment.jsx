import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import {
  ArrowRight,
  Calculator,
  Target,
  TrendingUp,
  Brain,
  Shield,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Landmark,
  Building2,
  FileText
} from "lucide-react";

const MODULES = [
  {
    id: "pre_ipo",
    title: "Pre-IPO Assessment",
    desc: "Evaluate your company's readiness for IPO. SEBI eligibility, governance, and financial health checks.",
    icon: TrendingUp,
    accent: "#00D1FF",
    iconGrad: "from-[#003366] to-[#0052A3]",
    path: "/assessment/start?type=pre_ipo",
    cta: "Start Assessment",
    testid: "assessment-card-pre_ipo",
  },
  {
    id: "ipo",
    title: "IPO Valuation",
    desc: "AI-powered business valuation using P/E, DCF, Issue Size & FCFE calculators for accurate market cap.",
    icon: Calculator,
    accent: "#34D399",
    iconGrad: "from-emerald-500 to-teal-600",
    path: "/assessment/start?type=ipo",
    cta: "Start Valuation",
    testid: "assessment-card-ipo",
  },
  {
    id: "post_ipo",
    title: "BSE SME / NSE EMERGE SME IPO Self Assessment",
    desc: "Self-check your eligibility against BSE SME and NSE EMERGE listing criteria. Yes/No checklist, instant analysis & downloadable PDF report.",
    icon: Building2,
    accent: "#A78BFA",
    iconGrad: "from-violet-500 to-purple-600",
    path: "/assessment/sme-self",
    cta: "Start Self Assessment",
    testid: "assessment-card-sme-self",
  },
  {
    id: "custom",
    title: "Custom Assessment",
    desc: "Tailored analysis combining governance, financial, and market readiness for your specific needs.",
    icon: Brain,
    accent: "#FB923C",
    iconGrad: "from-orange-500 to-amber-600",
    path: "/assessment/start?type=custom",
    cta: "Customize",
    testid: "assessment-card-custom",
  },
];

const Assessment = ({ user, apiClient }) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-black" data-testid="assessment-page">
      <Sidebar user={user} apiClient={apiClient} />

      <main className="flex-1 ml-64 relative overflow-hidden">
        {/* Black background with subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-[#111] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Sticky Header */}
          <header className="sticky top-0 z-20 backdrop-blur-md bg-black/35 border-b border-white/10 px-8 lg:px-12 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white" style={{ letterSpacing: "-0.02em" }}>
                IPO Readiness Assessment
              </h1>
              <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs text-white/80">
                <Brain className="w-3 h-3 text-yellow-300" />
                <span className="font-medium">AI Powered</span>
              </div>
            </div>
            <div className="flex items-center gap-5 text-xs text-white/70">
              <div className="text-center"><p className="text-lg font-bold text-white">4</p><p>Calculators</p></div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center"><p className="text-lg font-bold text-white">~10</p><p>Minutes</p></div>
            </div>
          </header>

          {/* Features Bar */}
          <div className="backdrop-blur-sm bg-white/5 border-b border-white/10">
            <div className="px-8 lg:px-12 py-2.5 flex items-center justify-center gap-6 text-xs text-white/60">
              <span className="flex items-center gap-1.5"><Calculator className="w-3.5 h-3.5 text-emerald-400" /> 4 Financial Calculators</span>
              <span className="w-px h-3 bg-white/20" />
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> SEBI Compliance</span>
              <span className="w-px h-3 bg-white/20" />
              <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-emerald-400" /> AI Gap Analysis</span>
              <span className="w-px h-3 bg-white/20" />
              <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-emerald-400" /> Readiness Score</span>
            </div>
          </div>

          {/* Hero */}
          <section className="px-8 lg:px-12 pt-10 pb-6 max-w-5xl">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
              Know Your IPO Readiness Before{" "}
              <span className="text-[#34D399]">You File.</span>
            </h2>
            <p className="mt-4 text-white/70 text-base lg:text-lg leading-relaxed max-w-2xl">
              AI-powered analysis to determine IPO readiness for NSE/BSE. SEBI eligibility, governance scoring, and valuation — all in one place.
            </p>
          </section>

          {/* Content Grid: Modules + Sidebar */}
          <section className="px-8 lg:px-12 pb-8 flex-1">
            <div className="grid grid-cols-3 gap-5">
              {/* Left — 4 Module Cards */}
              <div className="col-span-2 grid grid-cols-2 gap-4">
                {MODULES.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <Card
                      key={mod.id}
                      onClick={() => navigate(mod.path)}
                      className="bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:bg-white/18 cursor-pointer group shadow-2xl transition-all duration-300 hover:-translate-y-1"
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = mod.accent; e.currentTarget.style.boxShadow = `0 20px 40px -10px ${mod.accent}40`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = ""; }}
                      data-testid={mod.testid}
                    >
                      <CardContent className="p-5 flex flex-col h-full">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.iconGrad} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-base font-bold text-white mb-1.5 drop-shadow">{mod.title}</h3>
                        <p className="text-xs text-white/70 leading-relaxed mb-4 flex-1 drop-shadow">{mod.desc}</p>
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2.5 transition-all" style={{ color: mod.accent }}>
                          {mod.cta} <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Right — How It Works + Quick Start + Disclaimer */}
              <div className="space-y-4">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-bold text-white mb-4">How It Works</h3>
                    <div className="space-y-3">
                      {["Company Details", "Financial Data", "Market Analysis", "Get Results"].map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-emerald-400">{i + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-white text-xs">{step}</h4>
                            <p className="text-[10px] text-white/50">
                              {i === 0 && "Company type & target board selection"}
                              {i === 1 && "P&L, Balance Sheet & cash flow inputs"}
                              {i === 2 && "Industry P/E ratios & growth metrics"}
                              {i === 3 && "AI-powered recommendations & score"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Start */}
                <Card className="bg-gradient-to-br from-emerald-600/80 to-teal-700/80 backdrop-blur-xl border border-emerald-400/30">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span className="text-xs font-medium text-white">Quick Start</span>
                    </div>
                    <h3 className="font-semibold text-sm text-white mb-2">Ready to check your eligibility?</h3>
                    <p className="text-[10px] text-emerald-100 mb-3">
                      Get comprehensive SEBI eligibility analysis with AI-powered recommendations in ~10 minutes.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => navigate("/assessment/start")}
                      className="w-full bg-white text-emerald-700 hover:bg-emerald-50 gap-1.5 h-8 text-xs"
                      data-testid="quick-start-assessment"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Start Free Assessment
                    </Button>
                  </CardContent>
                </Card>

                {/* Disclaimer Note */}
                <div className="bg-amber-500/10 backdrop-blur-sm rounded-lg p-3 border border-amber-400/20">
                  <div className="flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-200/80">
                      <strong>Disclaimer:</strong> This is a preliminary analysis based on SEBI guidelines. Not a substitute for professional financial or legal advice.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Assessment;
