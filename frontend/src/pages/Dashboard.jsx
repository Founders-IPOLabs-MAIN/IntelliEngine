import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import {
  FileText,
  TrendingUp,
  Users,
  CheckCircle2,
  Scale,
  ArrowRight
} from "lucide-react";

const VIDEO_URL =
  "https://customer-assets.emergentagent.com/job_d9168386-61cf-418c-af5b-b3de2eb2d725/artifacts/wf0d3afk_Illustration_of_flowing_202604242039.mp4";

const MODULES = [
  {
    id: "assessment",
    title: "Free IPO Assessment",
    desc: "AI-powered readiness check with comprehensive gap analysis and recommendations",
    icon: CheckCircle2,
    accent: "#34D399",
    iconGrad: "from-emerald-500 to-green-600",
    path: "/assessment",
    cta: "Open Module",
    testid: "module-assessment",
  },
  {
    id: "drhp",
    title: "DRHP Builder",
    desc: "End-to-end document generation with Centralised Corporate Repository",
    icon: FileText,
    accent: "#38BDF8",
    iconGrad: "from-sky-500 to-blue-600",
    path: "/drhp1",
    adminPath: "/drhp",
    cta: "Open Module",
    testid: "module-drhp",
  },
  {
    id: "funding",
    title: "IPO Funding",
    desc: "Human + AI powered capital orchestration platform for your IPO journey",
    icon: TrendingUp,
    accent: "#A78BFA",
    iconGrad: "from-violet-500 to-purple-600",
    path: "/funding1",
    adminPath: "/funding",
    cta: "Open Module",
    testid: "module-funding",
  },
  {
    id: "matchmaker",
    title: "The Match-Making Platform",
    desc: "Connect with verified CAs, CS, CFOs, Lawyers, and industry experts across India",
    icon: Users,
    accent: "#FB923C",
    iconGrad: "from-orange-500 to-amber-600",
    path: "/matchmaker",
    cta: "Open Module",
    testid: "module-matchmaker",
  },
  {
    id: "valuation",
    title: "Business Valuation",
    desc: "AI-powered DCF, NAV & Comparable analysis for accurate business valuation",
    icon: Scale,
    accent: "#FBBF24",
    iconGrad: "from-amber-500 to-yellow-600",
    path: "/valuation",
    cta: "Open Module",
    testid: "module-valuation",
  },
];

const Dashboard = ({ user, apiClient }) => {
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

  const handleModuleClick = (mod) => {
    if (mod.adminPath && user?.is_admin) {
      navigate(mod.adminPath);
    } else {
      navigate(mod.path);
    }
  };

  return (
    <div className="flex min-h-screen bg-black" data-testid="dashboard-page">
      <Sidebar user={user} apiClient={apiClient} />

      <main className="flex-1 ml-64 relative overflow-hidden">
        {/* Full-page background video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          data-testid="dashboard-bg-video"
        />
        {/* Dark overlays for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#001a33]/85 via-[#001a33]/60 to-[#001a33]/45 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Sticky Header */}
          <header
            className="sticky top-0 z-20 backdrop-blur-md bg-black/30 border-b border-white/10 px-8 lg:px-12 py-4 flex items-center justify-between"
            data-testid="dashboard-header"
          >
            <div>
              <h1
                className="text-xl lg:text-2xl font-bold tracking-tight text-white"
                style={{ letterSpacing: "-0.02em" }}
              >
                Dashboard
              </h1>
              <p className="text-xs text-white/60 mt-0.5">
                Welcome back, {user?.name || "User"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                {user?.picture ? (
                  <img src={user.picture} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-semibold">{user?.name?.charAt(0) || "U"}</span>
                )}
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section className="px-8 lg:px-12 pt-10 lg:pt-14 pb-6 max-w-5xl" data-testid="dashboard-hero">
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]"
              data-testid="dashboard-hero-h1"
            >
              Build your IPO<br className="hidden sm:block" /> Journey with us
            </h2>
            <p className="mt-4 text-white/70 text-base lg:text-lg leading-relaxed max-w-2xl">
              Everything you need to go public &mdash; from readiness assessment to DRHP drafting,
              expert matching, funding orchestration, and business valuation.
            </p>
          </section>

          {/* Module Cards — compact, glass-morphism style */}
          <section className="px-8 lg:px-12 pb-8 flex-1" data-testid="dashboard-modules">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Card
                    key={mod.id}
                    onClick={() => handleModuleClick(mod)}
                    className="bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:bg-white/18 cursor-pointer group shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = mod.accent;
                      e.currentTarget.style.boxShadow = `0 20px 40px -10px ${mod.accent}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "";
                      e.currentTarget.style.boxShadow = "";
                    }}
                    data-testid={mod.testid}
                  >
                    <CardContent className="p-5 flex flex-col h-full">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.iconGrad} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-base font-bold text-white leading-snug mb-2 drop-shadow">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-white/70 leading-relaxed mb-4 flex-1 drop-shadow">
                        {mod.desc}
                      </p>
                      <div
                        className="inline-flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2.5 transition-all"
                        style={{ color: mod.accent }}
                      >
                        {mod.cta} <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Legal Links */}
          <footer className="px-8 lg:px-12 pb-6">
            <div className="flex items-center justify-center gap-6 text-xs text-white/40">
              <Link
                to="/legal-disclaimer"
                className="hover:text-white/70 transition-colors flex items-center gap-1.5"
                data-testid="dashboard-legal-disclaimer"
              >
                <Scale className="w-3.5 h-3.5" />
                Legal Disclaimer
              </Link>
              <span className="w-px h-3 bg-white/20" />
              <Link
                to="/terms-of-use"
                className="hover:text-white/70 transition-colors flex items-center gap-1.5"
                data-testid="dashboard-terms-of-use"
              >
                <FileText className="w-3.5 h-3.5" />
                Terms of Use
              </Link>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
