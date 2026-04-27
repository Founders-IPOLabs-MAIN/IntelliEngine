import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import { ArrowRight, Briefcase, Building2, Calculator } from "lucide-react";

const VIDEO_URL =
  "https://customer-assets.emergentagent.com/job_d9168386-61cf-418c-af5b-b3de2eb2d725/artifacts/w65ukkrn_Lady_entering_boardroom_202604272213.mp4";

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
  const videoRef = useRef(null);

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

  return (
    <div className="flex min-h-screen bg-black" data-testid="drhp-user-type-selector">
      <Sidebar user={user} apiClient={apiClient} />

      <main className="flex-1 ml-64 relative overflow-hidden">
        {/* Full-page background video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={VIDEO_URL}
          autoPlay loop muted playsInline preload="auto"
          aria-hidden="true"
          data-testid="drhp-bg-video"
        />
        {/* Dark overlay — slightly dimmed */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/45 pointer-events-none" />
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

          {/* 3 Profile Cards — matchmaker style */}
          <section className="px-8 lg:px-16 pb-12 flex-1 flex items-start" data-testid="drhp-cards">
            <div className="flex justify-center gap-6 w-full">
              {CARDS.map((c) => {
                const Icon = c.icon;
                return (
                  <Card
                    key={c.id}
                    onClick={() => navigate(`/drhp/${c.id}`)}
                    className="bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:bg-white/18 cursor-pointer group shadow-2xl transition-all duration-300 hover:-translate-y-1 w-full max-w-sm"
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.boxShadow = `0 20px 40px -10px ${c.accent}40`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = ""; }}
                    data-testid={c.testid}
                  >
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${c.iconGrad} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white leading-snug mb-2 drop-shadow">
                        {c.title}
                      </h3>
                      <p className="text-sm text-white/70 leading-relaxed mb-6 flex-1 drop-shadow">
                        {c.desc}
                      </p>
                      <div
                        className="inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all"
                        style={{ color: c.accent }}
                      >
                        {c.cta} <ArrowRight className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DRHPUserTypeSelector;
