import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  TrendingUp, Building2, Users, HelpCircle, ArrowRight, Loader2,
  Sparkles, Brain, Shield, AlertTriangle, CheckCircle2, Landmark
} from "lucide-react";

const VIDEO_URL =
  "https://customer-assets.emergentagent.com/job_d9168386-61cf-418c-af5b-b3de2eb2d725/artifacts/69090hzs_Founders_montage_and_202604272238.mp4";

const MODULES = [
  {
    id: "pre_ipo",
    title: "Pre-IPO Funding",
    desc: "Capital for growth and IPO readiness. Explore equity, debt, and mezzanine options.",
    icon: TrendingUp,
    accent: "#00D1FF",
    iconGrad: "from-[#003366] to-[#0052A3]",
    path: "/funding/pre-ipo",
    cta: "Explore",
    testid: "funding-pillar-pre_ipo",
  },
  {
    id: "post_ipo",
    title: "Post-IPO Funding",
    desc: "Capital for expansion and secondary market moves. QIP, rights issue, and more.",
    icon: Building2,
    accent: "#34D399",
    iconGrad: "from-emerald-500 to-teal-600",
    path: "/funding/post-ipo",
    cta: "Explore",
    testid: "funding-pillar-post_ipo",
  },
  {
    id: "partners",
    title: "Our Funding Partners",
    desc: "Directory of vetted institutional and private lenders across India.",
    icon: Users,
    accent: "#A78BFA",
    iconGrad: "from-violet-500 to-purple-600",
    path: "/funding/partners",
    cta: "Browse",
    testid: "funding-pillar-partners",
  },
  {
    id: "quiz",
    title: "Funding Eligibility Quiz",
    desc: "AI-powered assessment of your funding readiness with instant eligibility score.",
    icon: HelpCircle,
    accent: "#FB923C",
    iconGrad: "from-orange-500 to-amber-600",
    path: "/funding/quiz",
    cta: "Take Quiz",
    testid: "funding-pillar-quiz",
  },
];

const Funding = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const accepted = sessionStorage.getItem("funding_disclaimer_accepted");
    if (accepted === "true") {
      setDisclaimerAccepted(true);
      setShowDisclaimer(false);
    }
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => { v.play().catch(() => {}); };
    v.addEventListener("loadedmetadata", tryPlay);
    v.addEventListener("canplay", tryPlay);
    tryPlay();
    return () => {
      v.removeEventListener("loadedmetadata", tryPlay);
      v.removeEventListener("canplay", tryPlay);
    };
  }, []);

  const handleDisclaimerResponse = async (agreed) => {
    if (agreed) {
      setLoading(true);
      try {
        await apiClient.post("/funding/disclaimer-consent", { agreed: true, timestamp: new Date().toISOString(), user_id: user.user_id });
        sessionStorage.setItem("funding_disclaimer_accepted", "true");
        setDisclaimerAccepted(true);
        setShowDisclaimer(false);
        toast.success("Thank you for accepting. Welcome to IPO Funding!");
      } catch { toast.error("Failed to record consent. Please try again."); }
      finally { setLoading(false); }
    } else {
      navigate("/dashboard");
      toast.info("You need to accept the disclaimer to access IPO Funding module.");
    }
  };

  const handleModuleClick = (mod) => {
    if (!disclaimerAccepted) { setShowDisclaimer(true); return; }
    navigate(mod.path);
  };

  return (
    <div className="flex min-h-screen bg-black" data-testid="funding-page">
      <Sidebar user={user} apiClient={apiClient} />

      <main className="flex-1 ml-64 relative overflow-hidden">
        {/* Video background — dimmed and blurred */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "blur(2px)" }}
          src={VIDEO_URL}
          autoPlay loop muted playsInline preload="auto"
          aria-hidden="true"
          data-testid="funding-bg-video"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/45 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Sticky Header */}
          <header className="sticky top-0 z-20 backdrop-blur-md bg-black/35 border-b border-white/10 px-8 lg:px-12 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white" style={{ letterSpacing: "-0.02em" }}>
                IPO Funding Engine
              </h1>
              <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs text-white/80">
                <Brain className="w-3 h-3 text-yellow-300" />
                <span className="font-medium">Human + AI Powered</span>
              </div>
            </div>
            <div className="flex items-center gap-5 text-xs text-white/70">
              <div className="text-center"><p className="text-lg font-bold text-white">50+</p><p>Partners</p></div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center"><p className="text-lg font-bold text-white">11</p><p>Options</p></div>
            </div>
          </header>

          {/* Features Bar */}
          <div className="backdrop-blur-sm bg-white/5 border-b border-white/10">
            <div className="px-8 lg:px-12 py-2.5 flex items-center justify-center gap-6 text-xs text-white/60">
              <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-emerald-400" /> AI Eligibility Analysis</span>
              <span className="w-px h-3 bg-white/20" />
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-emerald-400" /> Expert Consultations</span>
              <span className="w-px h-3 bg-white/20" />
              <span className="flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5 text-emerald-400" /> Vetted Partners</span>
              <span className="w-px h-3 bg-white/20" />
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> SEBI Compliant</span>
            </div>
          </div>

          {/* Hero */}
          <section className="px-8 lg:px-12 pt-10 pb-6 max-w-5xl">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
              The Intelligent Capital Bridge for Every Stage of{" "}
              <span className="text-[#34D399]">Your IPO.</span>
            </h2>
            <p className="mt-4 text-white/70 text-base lg:text-lg leading-relaxed max-w-2xl">
              Pre-Listing to Post-IPO Growth Fund. Come talk to us!
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
                      onClick={() => handleModuleClick(mod)}
                      className={`bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:bg-white/18 cursor-pointer group shadow-2xl transition-all duration-300 hover:-translate-y-1 ${!disclaimerAccepted ? "opacity-70" : ""}`}
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

              {/* Right — How It Works + Quick Start */}
              <div className="space-y-4">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-bold text-white mb-4">How It Works</h3>
                    <div className="space-y-3">
                      {["Choose Module", "AI Assessment", "Expert Review", "Get Funded"].map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-emerald-400">{i + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-white text-xs">{step}</h4>
                            <p className="text-[10px] text-white/50">
                              {i === 0 && "Pre-IPO or Post-IPO based on your stage"}
                              {i === 1 && "Quick eligibility quiz for instant score"}
                              {i === 2 && "Consultation with funding experts"}
                              {i === 3 && "Connect with vetted partners"}
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
                    <h3 className="font-semibold text-sm text-white mb-2">Not sure where to start?</h3>
                    <p className="text-[10px] text-emerald-100 mb-3">
                      Take our AI-powered eligibility quiz to find the best funding options for you.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleModuleClick(MODULES[3])}
                      className="w-full bg-white text-emerald-700 hover:bg-emerald-50 gap-1.5 h-8 text-xs"
                      data-testid="quick-start-quiz"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Take Eligibility Quiz
                    </Button>
                  </CardContent>
                </Card>

                {/* Disclaimer Note */}
                <div className="bg-amber-500/10 backdrop-blur-sm rounded-lg p-3 border border-amber-400/20">
                  <div className="flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-200/80">
                      We connect you with vetted partners. IPO Labs is not a SEBI registered funding agency.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Disclaimer Modal */}
      <Dialog open={showDisclaimer} onOpenChange={() => {}}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 text-base">
              <AlertTriangle className="w-4 h-4" /> Important Disclaimer
            </DialogTitle>
            <DialogDescription className="text-left text-xs">
              Please read and acknowledge before proceeding
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-amber-900 leading-relaxed">
                <strong>IPO Labs</strong> uses <strong>AI + Human Power</strong> to analyse, record and connect you with the right partners.
              </p>
              <p className="text-xs text-amber-900 leading-relaxed mt-2">
                We are <strong>NOT</strong> a SEBI Registered funding partner, bank, NBFC, or any similar funding agency.
              </p>
              <p className="text-xs text-amber-900 leading-relaxed mt-2">
                By clicking <strong>"I Agree"</strong>, you allow us to share your data with relevant partners.
              </p>
            </div>
            <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
              <Shield className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>Your data is protected under our Privacy Policy and DPDP Act 2023 compliance.</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => handleDisclaimerResponse(false)} disabled={loading} data-testid="disclaimer-disagree-btn">
              I Disagree
            </Button>
            <Button size="sm" onClick={() => handleDisclaimerResponse(true)} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700" data-testid="disclaimer-agree-btn">
              {loading ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Processing...</> : <><CheckCircle2 className="w-3 h-3 mr-1.5" /> I Agree</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Funding;
