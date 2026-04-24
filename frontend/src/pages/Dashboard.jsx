import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
    <div className="flex min-h-screen bg-white" data-testid="dashboard-page">
      <Sidebar user={user} apiClient={apiClient} />

      <main className="flex-1 ml-64 relative overflow-hidden">
        {/* Full-page background video — no overlays, clean white feel */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          src={VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          data-testid="dashboard-bg-video"
        />

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Clean white header */}
          <header
            className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-8 py-4 flex items-center justify-between"
            data-testid="dashboard-header"
          >
            <div>
              <h1 className="text-xl font-bold tracking-tight text-black" style={{ letterSpacing: "-0.02em" }}>
                Dashboard
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Welcome back, {user?.name || "User"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
              {user?.picture ? (
                <img src={user.picture} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-700 text-sm font-semibold">{user?.name?.charAt(0) || "U"}</span>
              )}
            </div>
          </header>

          {/* Hero Section — black text, left-aligned */}
          <section className="px-8 pt-10 pb-6" data-testid="dashboard-hero">
            <h2
              className="text-4xl sm:text-5xl font-bold tracking-tight text-black leading-[1.1]"
              data-testid="dashboard-hero-h1"
            >
              Build your IPO<br /> Journey with us
            </h2>
            <p className="mt-3 text-gray-500 text-sm leading-relaxed max-w-lg">
              Everything you need to go public &mdash; from readiness assessment to DRHP drafting,
              expert matching, funding orchestration, and business valuation.
            </p>
          </section>

          {/* Module Cards — grow to fill available space */}
          <section className="px-8 pb-6 flex-1 flex flex-col" data-testid="dashboard-modules">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 max-w-5xl flex-1">
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Card
                    key={mod.id}
                    onClick={() => handleModuleClick(mod)}
                    className="bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-gray-300 cursor-pointer group shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = mod.accent;
                      e.currentTarget.style.boxShadow = `0 8px 24px -6px ${mod.accent}30`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "";
                      e.currentTarget.style.boxShadow = "";
                    }}
                    data-testid={mod.testid}
                  >
                    <CardContent className="p-5 flex flex-col h-full">
                      <div
                        className={`w-11 h-11 rounded-lg bg-gradient-to-br ${mod.iconGrad} flex items-center justify-center mb-4 shadow group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-sm font-bold text-black leading-snug mb-2">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">
                        {mod.desc}
                      </p>
                      <div
                        className="inline-flex items-center gap-1 text-[11px] font-semibold group-hover:gap-2 transition-all"
                        style={{ color: mod.accent }}
                      >
                        {mod.cta} <ArrowRight className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Copyright — far right */}
          <footer className="px-8 pb-4 flex justify-end pr-12">
            <span className="text-[11px] text-gray-400">
              &copy; 2026 IPO Labs Private Limited
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
