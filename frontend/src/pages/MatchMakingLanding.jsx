import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import {
  Building2, ArrowRight, Briefcase, Award, FileText, Scale,
} from "lucide-react";

const VIDEO_URL =
  "https://customer-assets.emergentagent.com/job_d2704038-7cb9-4ab6-9a1b-26c0d6c42d22/artifacts/l035ewvz_Men_and_women_202604232309.mp4";

const CARDS = [
  {
    id: "ipo-company",
    title: "IPO Bound Company",
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
    path: "/matchmaker/experts",
    cta: "Explore Experts",
    testid: "btn-subject-matter-experts",
  },
  {
    id: "top-ipo",
    title: "Consult with Top IPO Experts",
    desc: "Book sessions with veteran IPO advisors — Merchant Bankers, ex-SEBI counsel, listing strategists.",
    icon: Award,
    accent: "#A78BFA",
    iconGrad: "from-violet-500 to-purple-600",
    path: "/matchmaker/experts?category=top-ipo",
    cta: "Consult Now",
    testid: "btn-top-ipo-experts",
  },
  {
    id: "ca-cs-director",
    title: "Hire CA, CS, Independent Directors, CFOs",
    desc: "Consult or hire Chartered Accountants, Company Secretaries, Independent Directors & CFOs across India.",
    icon: FileText,
    accent: "#34D399",
    iconGrad: "from-emerald-500 to-teal-600",
    path: "/matchmaker/experts?category=ca-cs",
    cta: "Find Talent",
    testid: "btn-ca-cs-experts",
  },
  {
    id: "legal",
    title: "Consult or Hire Legal Experts",
    desc: "Corporate lawyers, SEBI specialists, IP counsel & litigation experts for every stage of your listing.",
    icon: Scale,
    accent: "#F472B6",
    iconGrad: "from-pink-500 to-rose-600",
    path: "/matchmaker/experts?category=legal",
    cta: "Get Legal Help",
    testid: "btn-legal-experts",
  },
];

const MatchMakingLanding = ({ user, apiClient }) => {
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
    <div className="flex min-h-screen bg-black" data-testid="matchmaking-landing">
      <Sidebar user={user} apiClient={apiClient} />

      <main className="flex-1 ml-64 relative overflow-hidden">
        {/* Full-page background video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={VIDEO_URL}
          autoPlay loop muted playsInline preload="auto"
          aria-hidden="true"
          data-testid="matchmaking-bg-video"
        />
        {/* Dark overlay for text contrast (heavier on the left for hero readability) */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* ── FIVERR-STYLE HERO ── */}
          <section className="px-8 lg:px-16 pt-16 lg:pt-24 pb-8 max-w-5xl" data-testid="matchmaker-hero">
            <p className="text-[11px] tracking-[0.22em] uppercase text-[#00D1FF] font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-px bg-[#00D1FF]" /> The Match-Making Platform
            </p>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]"
              data-testid="matchmaker-hero-h1"
            >
              Looking for Experts or<br className="hidden sm:block" /> Planning your IPO journey?{" "}
              <span className="text-[#00D1FF]">Look no further.</span>
            </h1>
            <p className="mt-5 text-white/75 text-base lg:text-lg leading-relaxed max-w-2xl">
              Connect with India's most trusted IPO advisors, compliance experts and legal counsel &mdash; all under one roof.
            </p>
          </section>

          {/* ── 5 ACTION CARDS — below the hero ── */}
          <section className="px-8 lg:px-16 pb-12" data-testid="matchmaker-cards">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {CARDS.map((c) => {
                const Icon = c.icon;
                return (
                  <Card
                    key={c.id}
                    onClick={() => navigate(c.path)}
                    className="bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:bg-white/18 cursor-pointer group shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    style={{ borderColor: undefined }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.boxShadow = `0 20px 40px -10px ${c.accent}40`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = ""; }}
                    data-testid={c.testid}
                  >
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.iconGrad} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-base font-bold text-white leading-snug mb-2 drop-shadow">
                        {c.title}
                      </h3>
                      <p className="text-xs text-white/75 leading-relaxed mb-4 flex-1 drop-shadow">
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
          </section>
        </div>
      </main>
    </div>
  );
};

export default MatchMakingLanding;
