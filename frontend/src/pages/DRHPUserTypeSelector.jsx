import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import { ArrowRight, Briefcase, Building2, Calculator, Sparkles, Shield, HelpCircle } from "lucide-react";

const CARDS = [
  {
    id: "merchant_banker",
    title: "Merchant Banker",
    desc: "Add multiple projects under your firm. Manage DRHP filings across your portfolio of IPO mandates.",
    icon: Briefcase,
    accent: "#00D1FF",
    iconGrad: "from-[#003366] to-[#0052A3]",
    cta: "Continue",
    testid: "drhp-user-type-merchant_banker",
  },
  {
    id: "company",
    title: "Company",
    desc: "Add and manage your own corporate DRHP. Build your prospectus with SEBI-compliant templates.",
    icon: Building2,
    accent: "#34D399",
    iconGrad: "from-emerald-500 to-teal-600",
    cta: "Continue",
    testid: "drhp-user-type-company",
  },
  {
    id: "ca_firm",
    title: "CA Firm",
    desc: "Add multiple projects under your firm. Review and certify financial statements for DRHP filings.",
    icon: Calculator,
    accent: "#FB923C",
    iconGrad: "from-amber-500 to-orange-600",
    cta: "Continue",
    testid: "drhp-user-type-ca_firm",
  },
];

const DRHPUserTypeSelector = ({ user, apiClient }) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-black" data-testid="drhp-user-type-selector">
      <Sidebar user={user} apiClient={apiClient} />

      <main className="flex-1 ml-64 relative overflow-hidden">
        {/* Black background with subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-[#111] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Sticky Header */}
          <header
            className="sticky top-0 z-20 backdrop-blur-md bg-black/35 border-b border-white/10 px-8 lg:px-16 py-4 flex items-center justify-between"
            data-testid="drhp-header"
          >
            <h1
              className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              DRHP Builder
            </h1>
          </header>

          {/* Hero */}
          <section className="px-8 lg:px-16 pt-12 lg:pt-16 pb-8 max-w-5xl" data-testid="drhp-hero">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
              Build Audit-Ready DRHPs with{" "}
              <span className="text-[#00D1FF]">SEBI-Grade Precision.</span>
            </h2>
            <p className="mt-5 text-white/75 text-base lg:text-lg leading-relaxed max-w-2xl">
              Choose your profile and create a safe & secured workspace.
            </p>
          </section>

          {/* Content Grid: Cards + Sidebar */}
          <section className="px-8 lg:px-16 pb-12 flex-1" data-testid="drhp-cards">
            <div className="grid grid-cols-3 gap-5">
              {/* Left — 3 Profile Cards */}
              <div className="col-span-2 flex gap-4">
                {CARDS.map((c) => {
                  const Icon = c.icon;
                  return (
                    <Card
                      key={c.id}
                      onClick={() => navigate(`/drhp/${c.id}`)}
                      className="bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:bg-white/18 cursor-pointer group shadow-2xl transition-all duration-300 hover:-translate-y-1 w-full"
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.boxShadow = `0 20px 40px -10px ${c.accent}40`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = ""; }}
                      data-testid={c.testid}
                    >
                      <CardContent className="p-5 flex flex-col h-full">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.iconGrad} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-base font-bold text-white leading-snug mb-1.5 drop-shadow">
                          {c.title}
                        </h3>
                        <p className="text-xs text-white/70 leading-relaxed mb-4 flex-1 drop-shadow">
                          {c.desc}
                        </p>
                        <div
                          className="inline-flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2.5 transition-all"
                          style={{ color: c.accent }}
                        >
                          {c.cta} <ArrowRight className="w-3.5 h-3.5" />
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
                      {["Choose Profile", "Create Workspace", "Upload Documents", "Build DRHP"].map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-cyan-400">{i + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-white text-xs">{step}</h4>
                            <p className="text-[10px] text-white/50">
                              {i === 0 && "Merchant Banker, Company, or CA Firm"}
                              {i === 1 && "Secure, role-based project environment"}
                              {i === 2 && "Upload corporate documents & financials"}
                              {i === 3 && "SEBI-compliant DRHP generation"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Start */}
                <Card className="bg-gradient-to-br from-cyan-600/80 to-blue-700/80 backdrop-blur-xl border border-cyan-400/30">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span className="text-xs font-medium text-white">Quick Start</span>
                    </div>
                    <h3 className="font-semibold text-sm text-white mb-2">New to DRHP?</h3>
                    <p className="text-[10px] text-cyan-100 mb-3">
                      Select &quot;Company&quot; profile to start building your DRHP with guided templates.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => navigate("/drhp/company")}
                      className="w-full bg-white text-cyan-700 hover:bg-cyan-50 gap-1.5 h-8 text-xs"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Start as Company
                    </Button>
                  </CardContent>
                </Card>

                {/* Disclaimer Note */}
                <div className="bg-amber-500/10 backdrop-blur-sm rounded-lg p-3 border border-amber-400/20">
                  <div className="flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-200/80">
                      All documents are encrypted and stored securely. SEBI compliance verified at every step.
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

export default DRHPUserTypeSelector;
