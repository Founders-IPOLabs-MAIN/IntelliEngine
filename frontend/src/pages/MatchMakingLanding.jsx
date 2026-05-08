import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import {
  Building2, ArrowRight, Briefcase, Users, Shield, Brain,
  Sparkles, CheckCircle2, Search
} from "lucide-react";

const CARDS = [
  {
    id: "ipo-company",
    title: "I am a Corporate",
    desc: "Register your company and get matched with verified experts for your IPO journey.",
    icon: Building2,
    accent: "#00D1FF",
    iconGrad: "from-[#003366] to-[#0052A3]",
    path: "/matchmaker/issuer",
    cta: "Get Started",
    testid: "btn-ipo-bound-company",
  },
  {
    id: "experts",
    title: "Subject Matter Experts",
    desc: "Browse our network of CAs, CSs, CFOs, Legal Advisors, Merchant Bankers and more.",
    icon: Briefcase,
    accent: "#FB923C",
    iconGrad: "from-orange-500 to-amber-600",
    path: "/matchmaker/experts/register",
    cta: "Explore Experts",
    testid: "btn-subject-matter-experts",
  },
];

const MatchMakingLanding = ({ user, apiClient }) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-white" data-testid="matchmaking-landing">
      <Sidebar user={user} apiClient={apiClient} />

      <main className="flex-1 ml-64 relative overflow-hidden">
        {/* Black background with subtle gradient */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Sticky Header */}
          <header
            className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-gray-200 px-8 lg:px-12 py-4 flex items-center justify-between"
            data-testid="matchmaker-top-header"
          >
            <div className="flex items-center gap-3">
              <h1
                className="text-2xl lg:text-3xl font-extrabold tracking-tight text-gray-900"
                style={{ letterSpacing: "-0.02em" }}
                data-testid="matchmaker-header-title"
              >
                The Match-Making Platform
              </h1>
              <div className="inline-flex items-center gap-1.5 bg-gray-100 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs text-gray-700">
                <Brain className="w-3 h-3 text-yellow-300" />
                <span className="font-medium">Human + AI Powered</span>
              </div>
            </div>
            <div className="flex items-center gap-5 text-xs text-gray-600">
              <div className="text-center"><p className="text-lg font-bold text-gray-900">50+</p><p>Experts</p></div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="text-center"><p className="text-lg font-bold text-gray-900">15</p><p>Categories</p></div>
            </div>
          </header>

          {/* Features Bar */}
          <div className="backdrop-blur-sm bg-gray-50 border-b border-gray-200">
            <div className="px-8 lg:px-12 py-2.5 flex items-center justify-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-emerald-400" /> Verified Experts</span>
              <span className="w-px h-3 bg-gray-100" />
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> SEBI-Aligned Roles</span>
              <span className="w-px h-3 bg-gray-100" />
              <span className="flex items-center gap-1.5"><Search className="w-3.5 h-3.5 text-emerald-400" /> Smart Matching</span>
              <span className="w-px h-3 bg-gray-100" />
              <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-emerald-400" /> End-to-End Advisory</span>
            </div>
          </div>

          {/* Hero */}
          <section className="px-8 lg:px-12 pt-10 pb-6 max-w-5xl" data-testid="matchmaker-hero">
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.08]"
              data-testid="matchmaker-hero-h1"
            >
              Connect with IPO Companies &amp;{" "}
              <span className="text-[#00D1FF]">Subject-Matter Experts.</span>
            </h2>
            <p className="mt-4 text-gray-600 text-base lg:text-lg leading-relaxed max-w-2xl">
              Setu, by IPO Labs, connects Corporates with India's most trusted IPO Advisors, Directors, Compliance Experts and Legal counsel &mdash; all under one roof.
            </p>
          </section>

          {/* Content Grid: Cards + Sidebar */}
          <section className="px-8 lg:px-12 pb-8 flex-1">
            <div className="grid grid-cols-3 gap-5">
              {/* Left — Action Cards */}
              <div className="col-span-2 grid grid-cols-2 gap-4">
                {CARDS.map((c) => {
                  const Icon = c.icon;
                  return (
                    <Card
                      key={c.id}
                      onClick={() => navigate(c.path)}
                      className="bg-white border border-gray-200 backdrop-blur-xl border-2 border-gray-200 hover:bg-blue-50 cursor-pointer group shadow-2xl transition-all duration-300 hover:-translate-y-1"
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.boxShadow = `0 20px 40px -10px ${c.accent}40`; }}
                      data-testid={c.testid}
                    >
                      <CardContent className="p-5 flex flex-col h-full">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.iconGrad} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-gray-900" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1.5">{c.title}</h3>
                        <p className="text-xs text-gray-600 leading-relaxed mb-4 flex-1">{c.desc}</p>
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2.5 transition-all" style={{ color: c.accent }}>
                          {c.cta} <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Right — How It Works + Quick Start + Disclaimer */}
              <div className="space-y-4">
                <Card className="bg-white border border-gray-200 backdrop-blur-xl border border-gray-200">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">How It Works</h3>
                    <div className="space-y-3">
                      {["Choose Your Role", "Create Profile", "Get Matched", "Start Working"].map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-emerald-400">{i + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 text-xs">{step}</h4>
                            <p className="text-[10px] text-gray-400">
                              {i === 0 && "Corporate seeking experts or Expert offering services"}
                              {i === 1 && "Share your requirements or expertise details"}
                              {i === 2 && "AI + human-curated matching with verified professionals"}
                              {i === 3 && "Connect directly and begin your IPO engagement"}
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
                      <span className="text-xs font-medium text-gray-900">Quick Start</span>
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 mb-2">Want to register as an Expert?</h3>
                    <p className="text-[10px] text-emerald-100 mb-3">
                      Join our network of verified IPO professionals. Free registration with optional premium verification.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => navigate("/matchmaker/experts/register")}
                      className="w-full bg-white text-emerald-700 hover:bg-emerald-50 gap-1.5 h-8 text-xs"
                      data-testid="quick-start-register"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      Register as Expert
                    </Button>
                  </CardContent>
                </Card>

                {/* Disclaimer Note */}
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-800">
                      IPO Labs facilitates connections between corporates and experts. We are not a SEBI registered intermediary. All engagements are directly between parties.
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

export default MatchMakingLanding;
