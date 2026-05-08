import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  FileText,
  TrendingUp,
  Users,
  CheckCircle2,
  Scale,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  X as XIcon,
  Sparkles,
  PlayCircle,
  Compass,
  Rocket,
} from "lucide-react";

// ─── Module configuration ────────────────────────────────────────────────
const MODULES = [
  {
    id: "assessment",
    title: "Free IPO Assessment",
    short: "Readiness check",
    desc: "AI-powered readiness check with comprehensive gap analysis and SEBI alignment recommendations.",
    longIntro:
      "Run a 360° readiness scan across financials, governance, compliance and disclosures. SETU's AI benchmarks your company against the latest SEBI mainboard & SME thresholds, surfaces every gap, and hands you a prioritised remediation playbook — so you walk into your first banker meeting already shortlist-grade.",
    icon: CheckCircle2,
    accent: "#10B981",
    accentSoft: "bg-emerald-50",
    accentText: "text-emerald-700",
    accentBorder: "border-emerald-200",
    snap: "/module-snaps/assessment.png",
    path: "/assessment",
    testid: "module-assessment",
  },
  {
    id: "drhp",
    title: "DRHP Builder",
    short: "Document generation",
    desc: "End-to-end document generation with a Centralised Corporate Repository and SEBI-aligned chapter modules.",
    longIntro:
      "Draft, redline and export a SEBI-grade DRHP without the 80-tab Word chaos. Auto-prefill chapters from a single Corporate Repository, collaborate with merchant bankers in real time on Syncfusion's native editor, and export filing-ready DOCX/PDFs whenever the syndicate calls for one.",
    icon: FileText,
    accent: "#0EA5E9",
    accentSoft: "bg-sky-50",
    accentText: "text-sky-700",
    accentBorder: "border-sky-200",
    snap: "/module-snaps/drhp.png",
    path: "/drhp1",
    adminPath: "/drhp",
    testid: "module-drhp",
  },
  {
    id: "funding",
    title: "IPO Funding",
    short: "Capital orchestration",
    desc: "Human + AI powered capital orchestration platform tailored for every stage of your IPO journey.",
    longIntro:
      "From bridge rounds to anchor allocation, orchestrate every conversation with PE funds, family offices and HNIs in one dashboard. SETU's matching engine pairs your stage, sector and ticket-size with verified investors — and tracks every term sheet, SHA and SPA till it's signed.",
    icon: TrendingUp,
    accent: "#7C3AED",
    accentSoft: "bg-violet-50",
    accentText: "text-violet-700",
    accentBorder: "border-violet-200",
    snap: "/module-snaps/funding.png",
    path: "/funding1",
    adminPath: "/funding",
    testid: "module-funding",
  },
  {
    id: "matchmaker",
    title: "The Match-Making Platform",
    short: "Expert network",
    desc: "Connect with verified CAs, CS, CFOs, lawyers and IPO industry experts across India.",
    longIntro:
      "Browse a curated network of merchant bankers, peer reviewers, registrars, lawyers and tax counsel — each verified against past IPO mandates. Filter by sector, board (SME / Mainboard) and budget, request introductions in one click, and shortlist your IPO bench before your kickoff call.",
    icon: Users,
    accent: "#F97316",
    accentSoft: "bg-orange-50",
    accentText: "text-orange-700",
    accentBorder: "border-orange-200",
    snap: "/module-snaps/matchmaker.png",
    path: "/matchmaker",
    testid: "module-matchmaker",
  },
  {
    id: "valuation",
    title: "Business Valuation",
    short: "Valuation engine",
    desc: "AI-powered DCF, NAV & comparable analysis for accurate, board-ready business valuations.",
    longIntro:
      "Run rigorous DCF, NAV and Comparable Company analyses on the same dataset, with reversed FY columns matching your CFO's working file. Tweak peer sets, WACC and terminal growth on the fly, and export boardroom-ready PDF valuation reports SEBI-compliant down to the assumptions footnote.",
    icon: Scale,
    accent: "#D97706",
    accentSoft: "bg-amber-50",
    accentText: "text-amber-700",
    accentBorder: "border-amber-200",
    snap: "/module-snaps/valuation.png",
    path: "/valuation",
    testid: "module-valuation",
  },
];

// ─── "Things to do" tasks (welcome / onboarding strip) ───────────────────
const TASKS = [
  {
    id: "profile",
    title: "Finish setting up your profile",
    desc: "Add company details so we can tailor your IPO readiness journey.",
    icon: Compass,
    cta: "Add details",
    accent: "#4F46E5",
    path: "/account-details",
  },
  {
    id: "assessment",
    title: "Take your first IPO assessment",
    desc: "5 minutes to a personalised gap analysis report.",
    icon: Sparkles,
    cta: "Start assessment",
    accent: "#10B981",
    path: "/assessment",
  },
  {
    id: "tour",
    title: "Take a quick tour",
    desc: "See how SETU's 5 modules connect end-to-end.",
    icon: PlayCircle,
    cta: "Take the tour",
    accent: "#7C3AED",
    path: null,
  },
];

const Dashboard = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [introModule, setIntroModule] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const firstName = (user?.name || "there").split(" ")[0];
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const targetPathFor = (mod) =>
    mod.adminPath && user?.is_admin ? mod.adminPath : mod.path;

  const handleModuleClick = (mod) => {
    const seenKey = `setu_intro_seen_${mod.id}`;
    if (typeof window !== "undefined" && localStorage.getItem(seenKey) === "1") {
      navigate(targetPathFor(mod));
    } else {
      setIntroModule(mod);
    }
  };

  const handleIntroNext = () => {
    if (!introModule) return;
    if (typeof window !== "undefined") {
      localStorage.setItem(`setu_intro_seen_${introModule.id}`, "1");
    }
    const path = targetPathFor(introModule);
    setIntroModule(null);
    navigate(path);
  };

  const handleTour = () => {
    if (typeof window !== "undefined") {
      ["assessment", "drhp", "funding", "matchmaker", "valuation"].forEach((id) =>
        localStorage.removeItem(`setu_intro_seen_${id}`)
      );
    }
    setIntroModule(MODULES[0]);
  };

  return (
    <div className="flex min-h-screen bg-white" data-testid="dashboard-page">
      <Sidebar user={user} apiClient={apiClient} />

      <main className="flex-1 ml-64 relative">
        <div className="px-8 py-6 max-w-[1280px] mx-auto">
          {/* ── Welcome strip (merged with former header) ─────────── */}
          <section data-testid="welcome-strip" className="mb-6 flex items-start justify-between gap-6">
            <div>
              <h2 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">
                {greeting}, {firstName} <span className="inline-block">👋</span>
              </h2>
              <p className="mt-1 text-[14px] text-gray-500">
                Here's what's happening across your IPO workspace today.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 pt-1">
              <button
                onClick={handleTour}
                className="hidden md:inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#4F46E5] hover:text-[#3730a3] transition"
                data-testid="header-take-tour"
              >
                <PlayCircle className="w-3.5 h-3.5" /> Take the tour
              </button>
              <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center overflow-hidden">
                {user?.picture ? (
                  <img src={user.picture} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[12px] font-semibold">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                )}
              </div>
            </div>
          </section>

          {/* ── Alert banner ──────────────────────────────────────── */}
          {!bannerDismissed && (
            <div
              className="mb-6 rounded-lg border border-[#F0D784] bg-[#FFF8DD] px-4 py-3 flex items-start gap-3"
              data-testid="dashboard-alert-banner"
            >
              <div className="w-7 h-7 rounded-full bg-[#F0B428] flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-white" strokeWidth={2.4} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[#7A5A11] leading-tight">
                  Finish setting up your IPO Readiness profile
                </p>
                <p className="text-[11.5px] text-[#8A6C2C] mt-0.5 leading-snug">
                  Add a few company details and you'll unlock tailored DRHP drafts, peer benchmarks and matchmaking shortlists.
                </p>
                <button
                  onClick={() => navigate("/account-details")}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#7A5A11] hover:underline"
                  data-testid="alert-add-details"
                >
                  Add missing details <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-[#9C7A2C] hover:text-[#7A5A11]"
                aria-label="Dismiss"
                data-testid="alert-dismiss"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── Things to do ──────────────────────────────────────── */}
          <section className="mb-7" data-testid="things-to-do">
            <div className="flex items-end justify-between mb-3">
              <div>
                <h3 className="text-[13px] font-bold text-gray-900">Things to do</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">A quick pre-flight before you dive into the modules.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {TASKS.map((t) => {
                const Icon = t.icon;
                return (
                  <div
                    key={t.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all flex flex-col"
                    data-testid={`task-${t.id}`}
                  >
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center mb-2.5"
                      style={{ backgroundColor: `${t.accent}14`, color: t.accent }}
                    >
                      <Icon className="w-4 h-4" strokeWidth={2.2} />
                    </div>
                    <div className="text-[13px] font-bold text-gray-900 leading-tight">{t.title}</div>
                    <p className="text-[11.5px] text-gray-500 mt-1 leading-relaxed flex-1">{t.desc}</p>
                    <button
                      onClick={() => (t.id === "tour" ? handleTour() : t.path && navigate(t.path))}
                      className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold transition self-start"
                      style={{ color: t.accent }}
                      data-testid={`task-${t.id}-cta`}
                    >
                      {t.cta} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Modules grid ──────────────────────────────────────── */}
          <section data-testid="dashboard-modules">
            <div className="flex items-end justify-between mb-3">
              <div>
                <h3 className="text-[13px] font-bold text-gray-900">Your IPO toolkit</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Five modules. One end-to-end workspace.</p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">5 modules</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => handleModuleClick(mod)}
                    className="group text-left bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col relative overflow-hidden"
                    data-testid={mod.testid}
                  >
                    {/* Soft top wash matching accent */}
                    <div
                      className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl"
                      style={{ backgroundColor: mod.accent }}
                    />

                    <div className="flex items-start justify-between mb-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${mod.accent}1A`, color: mod.accent }}
                      >
                        <Icon className="w-4 h-4" strokeWidth={2.2} />
                      </div>
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${mod.accentSoft} ${mod.accentText}`}
                      >
                        {mod.short}
                      </span>
                    </div>

                    <h4 className="text-[13.5px] font-bold text-gray-900 mb-1 leading-snug">
                      {mod.title}
                    </h4>
                    <p className="text-[11.5px] text-gray-500 leading-relaxed mb-3 flex-1">
                      {mod.desc}
                    </p>

                    <div
                      className="inline-flex items-center gap-1 text-[11px] font-semibold group-hover:gap-2 transition-all"
                      style={{ color: mod.accent }}
                    >
                      Explore module <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}

              {/* "Need more" footer card matching Maze enterprise CTA tone */}
              <div className="bg-gradient-to-br from-[#1A2235] to-[#0F172A] rounded-xl p-4 text-white flex flex-col" data-testid="module-enterprise">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-2.5">
                  <Rocket className="w-4 h-4 text-white" strokeWidth={2.2} />
                </div>
                <h4 className="text-[13.5px] font-bold mb-1 leading-snug">Going public soon?</h4>
                <p className="text-[11.5px] text-white/70 leading-relaxed mb-3 flex-1">
                  Talk to our IPO desk for white-glove onboarding, custom workflows and dedicated relationship support.
                </p>
                <button
                  onClick={() => navigate("/contact")}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FFD580] hover:gap-2 transition-all self-start"
                  data-testid="module-enterprise-cta"
                >
                  Talk to IPO desk <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ── Module Intro Dialog ─────────────────────────────────── */}
      <ModuleIntroDialog
        module={introModule}
        onClose={() => setIntroModule(null)}
        onNext={handleIntroNext}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Module Intro Dialog — Pitch.com-inspired modal with feature snapshot,
// short headline, intro paragraph, and a primary "Open module" CTA.
// ─────────────────────────────────────────────────────────────────────────

const ModuleIntroDialog = ({ module: mod, onClose, onNext }) => {
  if (!mod) return null;
  const Icon = mod.icon;

  return (
    <Dialog open={!!mod} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden bg-white border border-gray-200 rounded-2xl"
        data-testid={`intro-dialog-${mod.id}`}
      >
        {/* Snap of the 1st page */}
        <div
          className="relative w-full h-64 overflow-hidden border-b border-gray-200"
          style={{
            background: `linear-gradient(135deg, ${mod.accent}1A 0%, ${mod.accent}05 100%)`,
          }}
        >
          <img
            src={mod.snap}
            alt={`${mod.title} preview`}
            className="absolute inset-0 w-full h-full object-cover object-top"
            onError={(e) => {
              // Fallback: hide broken img, gradient bg remains
              e.currentTarget.style.display = "none";
            }}
            data-testid={`intro-snap-${mod.id}`}
          />
          {/* Soft top-left badge */}
          <div className="absolute top-4 left-4 inline-flex items-center gap-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-white">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ backgroundColor: `${mod.accent}1A`, color: mod.accent }}
            >
              <Icon className="w-3 h-3" strokeWidth={2.4} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: mod.accent }}>
              {mod.short}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-7">
          <h3 className="text-2xl font-bold text-[#1A2235] tracking-tight" style={{ letterSpacing: "-0.015em" }}>
            {mod.title}
          </h3>
          <p className="mt-3 text-sm text-[#4B5563] leading-relaxed">
            {mod.longIntro}
          </p>

          <div className="mt-7 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="text-sm font-semibold text-[#6B7280] hover:text-[#1A2235] transition"
              data-testid={`intro-skip-${mod.id}`}
            >
              Skip for now
            </button>
            <Button
              onClick={onNext}
              className="text-white font-semibold rounded-lg px-6 py-5 shadow-md hover:shadow-lg transition-all"
              style={{ backgroundColor: mod.accent }}
              data-testid={`intro-next-${mod.id}`}
            >
              Open module <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Dashboard;
