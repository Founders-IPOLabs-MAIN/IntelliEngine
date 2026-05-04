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
    <div className="flex min-h-screen bg-[#0a0a0a]" data-testid="dashboard-page">
      <Sidebar user={user} apiClient={apiClient} />

      <main className="flex-1 ml-64 relative overflow-hidden">
        {/* Mesh gradient backdrop — same palette as landing page */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-[12%] w-[640px] h-[640px] rounded-full bg-indigo-500/15 blur-[150px]" />
          <div className="absolute top-1/3 right-[10%] w-[520px] h-[520px] rounded-full bg-cyan-400/12 blur-[150px]" />
          <div className="absolute bottom-1/4 left-1/3 w-[460px] h-[460px] rounded-full bg-fuchsia-500/10 blur-[140px]" />
          <div className="absolute inset-0 opacity-[0.04]"
               style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
        </div>

        {/* Background video kept for the subtle motion accent */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-[0.10] mix-blend-screen"
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
          {/* Glass header */}
          <header
            className="sticky top-0 z-20 backdrop-blur-md bg-black/40 border-b border-white/10 px-8 py-4 flex items-center justify-between"
            data-testid="dashboard-header"
          >
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white" style={{ letterSpacing: "-0.02em" }}>
                Dashboard
              </h1>
              <p className="text-xs text-white/55 mt-0.5">
                Welcome back, {user?.name || "User"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden backdrop-blur-sm">
              {user?.picture ? (
                <img src={user.picture} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white/85 text-sm font-semibold">{user?.name?.charAt(0) || "U"}</span>
              )}
            </div>
          </header>

          {/* Hero — left-aligned, dark, gradient accent */}
          <section className="px-8 pt-10 pb-6" data-testid="dashboard-hero">
            <h2
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]"
              data-testid="dashboard-hero-h1"
            >
              Build your IPO Journey<br /> with{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                SETU, by IPO Labs.
              </span>
            </h2>
            <p className="mt-4 text-white/70 text-lg lg:text-xl leading-relaxed max-w-2xl">
              SETU has everything you need to go public.
            </p>
          </section>

          {/* Module cards — glass-morph dark */}
          <section className="px-8 pb-6 flex-1 flex flex-col" data-testid="dashboard-modules">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 max-w-5xl flex-1">
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Card
                    key={mod.id}
                    onClick={() => handleModuleClick(mod)}
                    className="bg-white/[0.05] backdrop-blur-xl border border-white/10 hover:bg-white/[0.08] cursor-pointer group shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = mod.accent;
                      e.currentTarget.style.boxShadow = `0 18px 40px -10px ${mod.accent}50`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "";
                      e.currentTarget.style.boxShadow = "";
                    }}
                    data-testid={mod.testid}
                  >
                    <CardContent className="p-5 flex flex-col h-full">
                      <div
                        className={`w-11 h-11 rounded-lg bg-gradient-to-br ${mod.iconGrad} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug mb-2 drop-shadow">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-white/65 leading-relaxed mb-4 flex-1">
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

          <footer className="px-8 pb-4 flex justify-end pr-12">
            <span className="text-[11px] text-white/40">
              &copy; 2026 IPO Labs Private Limited
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
