import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FileText, TrendingUp, Users, CheckCircle2, Scale,
  ArrowRight, PlayCircle, Sparkles, ShieldCheck,
  Zap, Globe, MessageCircle, X,
} from "lucide-react";
import ContactLeadDialog from "@/components/ContactLeadDialog";
import CookieConsent from "@/components/CookieConsent";

const NAV_LINKS = [
  { label: "Advisors",   path: "/advisors" },
  { label: "Resources",  path: "/resources" },
  { label: "Pricing",    path: "/pricing" },
  { label: "Disclaimer", path: "/disclaimer" },
  { label: "About Us",   path: "/about" },
  { label: "Careers",    path: "/careers" },
];

const ALL_MODULES = [
  {
    id: "drhp",
    title: "DRHP Builder",
    tagline: "SEBI-compliant. Collaborative.",
    icon: FileText,
    path: "/login?module=drhp",
    accent: "from-indigo-500/30 to-purple-500/10",
    iconBg: "from-indigo-500 to-purple-500",
  },
  {
    id: "readiness",
    title: "IPO Readiness Test",
    tagline: "Free AI-powered diagnostic.",
    icon: CheckCircle2,
    path: "/login?module=assessment",
    accent: "from-cyan-500/30 to-blue-500/10",
    iconBg: "from-cyan-500 to-blue-500",
  },
  {
    id: "matchmaker",
    title: "Expert Match-Making",
    tagline: "CAs, CS, CFOs, Bankers.",
    icon: Users,
    path: "/login?module=matchmaker",
    accent: "from-fuchsia-500/30 to-pink-500/10",
    iconBg: "from-fuchsia-500 to-pink-500",
  },
  {
    id: "valuation",
    title: "Business Valuation",
    tagline: "DCF, NAV & Comparables.",
    icon: Scale,
    path: "/login?module=valuation",
    accent: "from-amber-500/30 to-orange-500/10",
    iconBg: "from-amber-500 to-orange-500",
  },
  {
    id: "funding",
    title: "IPO Funding",
    tagline: "Pre-IPO, Post-IPO & Bridge.",
    icon: TrendingUp,
    path: "/login?module=funding",
    accent: "from-emerald-500/30 to-teal-500/10",
    iconBg: "from-emerald-500 to-teal-500",
  },
];

const TRUST_STATS = [
  { value: "5",  label: "Integrated modules" },
  { value: "200+", label: "Verified experts" },
  { value: "₹0", label: "To start the readiness test" },
  { value: "24/7", label: "Cloud-secure platform" },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactType, setContactType] = useState("support");
  const [scrolled, setScrolled] = useState(false);

  // Flash-message rotator (above Core Platform)
  const FLASH_MESSAGES = [
    "Build end-to-end DRHP, that is SEBI and LODR approved",
    "Get help with — Pre, Post and Bridge IPO Funding",
    'Check your "IPO Readiness" — For FREE!!',
    "Consult with IPO Experts — in our Match-Making Module",
    "Hire CA's, CFO's, Independent Directors to help fulfil your IPO Dreams!!",
    "TALK to EXPERTS — Start your DRHP",
    "Run Business Valuations — for FREE!!",
  ];
  const [flashIdx, setFlashIdx] = useState(() => Math.floor(Math.random() * FLASH_MESSAGES.length));
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => {
      setFlashIdx((prev) => {
        if (FLASH_MESSAGES.length < 2) return prev;
        let next = prev;
        while (next === prev) {
          next = Math.floor(Math.random() * FLASH_MESSAGES.length);
        }
        return next;
      });
      setFlashKey((k) => k + 1);
    }, 3400);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden font-sans" data-testid="landing-page">
      {/* ── Global mesh-gradient background blobs ── */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* HEADER — glassmorphism sticky nav, logo left, links centered */}
      {/* ════════════════════════════════════════════════════════════ */}
      <header
        className={`sticky top-0 z-40 -mt-[36px] mb-5 transition-all duration-300 ${
          scrolled
            ? "bg-black/60 backdrop-blur-2xl border-b border-white/10"
            : "bg-transparent"
        }`}
        data-testid="landing-header"
      >
        <div className="max-w-7xl mx-auto h-28 px-4 lg:px-6 grid grid-cols-[auto_1fr_auto] items-center gap-6">
          {/* Logo — pushed right by 20px (ml-5) */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center ml-5"
            data-testid="landing-logo-btn"
            aria-label="SETU home"
          >
            <img src="/setu-logo.svg" alt="SETU Labs" className="h-[238px] w-auto object-contain brightness-0 invert" data-testid="landing-logo" />
          </button>

          {/* Centered nav links */}
          <nav className="hidden lg:flex items-center justify-center gap-1" data-testid="landing-nav">
            {NAV_LINKS.map((l) => (
              <button
                key={l.path}
                onClick={() => navigate(l.path)}
                className="px-4 py-2 text-[15px] font-medium text-white/70 hover:text-white rounded-full hover:bg-white/5 transition-all"
                data-testid={`nav-${l.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                {l.label}
              </button>
            ))}
          </nav>

          {/* Right CTA */}
          <Button
            onClick={() => navigate("/login")}
            className="bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-full px-5 h-9 text-sm font-medium backdrop-blur-xl transition-all"
            data-testid="landing-sign-in-btn"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* HERO                                                        */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6" data-testid="landing-hero">
        <div className="max-w-5xl mx-auto pt-14 pb-20 lg:pt-[5.5rem] lg:pb-28 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md text-[11px] tracking-[0.2em] uppercase text-white/60 mb-5">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            India's first AI-powered IPO Operating System
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight max-w-4xl">
            <span className="bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
              Building a{" "}
            </span>
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Democratic IPO
            </span>
            <br />
            <span className="bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
              Ecosystem
            </span>
          </h1>

          <p className="mt-5 text-lg lg:text-xl text-white/60 max-w-2xl leading-relaxed">
            Empowering ambitious companies across Tier 2, 3 &amp; 4 cities in India to draft complex DRHPs,
            access top subject-matter experts, raise growth or IPO capital, and win projects across the country.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-center gap-3">
            <Button
              onClick={() => navigate("/login")}
              className="bg-white text-black hover:bg-white/90 rounded-full px-7 h-12 text-sm font-semibold shadow-[0_0_40px_rgba(255,255,255,0.25)]"
              data-testid="landing-get-started-btn"
            >
              Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => { setContactType("sales"); setContactOpen(true); }}
              variant="outline"
              className="bg-white/[0.03] border-white/15 hover:bg-white/10 text-white rounded-full px-7 h-12 text-sm backdrop-blur-md"
              data-testid="landing-contact-sales-btn"
            >
              Contact Sales
            </Button>
          </div>

          {/* Trust strip */}
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-6 w-full max-w-3xl">
            {TRUST_STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">{s.value}</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mt-1.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* FLASH MESSAGE STRIP — random rotating callouts                */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section
        className="relative z-10 bg-[#0a0a0a] border-t border-white/5 overflow-hidden"
        data-testid="landing-flash-strip"
      >
        {/* localized mesh accents — won't bleed outside */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[260px] rounded-full bg-indigo-500/15 blur-[120px]" />
          <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[260px] h-[260px] rounded-full bg-cyan-400/10 blur-[110px]" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[260px] h-[260px] rounded-full bg-fuchsia-500/10 blur-[110px]" />
          <div className="absolute inset-0 opacity-[0.04]"
               style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* scoped keyframes */}
        <style>{`
          @keyframes setu-flash {
            0%    { transform: translate(-50%, -50%) scale(0.18); opacity: 0; filter: blur(8px); letter-spacing: 0.02em; }
            12%   { transform: translate(-50%, -50%) scale(0.55); opacity: 0.6; filter: blur(2px); letter-spacing: 0.04em; }
            28%   { transform: translate(-50%, -50%) scale(1);    opacity: 1;   filter: blur(0);   letter-spacing: 0.06em; }
            82%   { transform: translate(-50%, -50%) scale(1.02); opacity: 1;   filter: blur(0);   letter-spacing: 0.06em; }
            100%  { transform: translate(-50%, -50%) scale(1.45); opacity: 0;   filter: blur(4px); letter-spacing: 0.08em; }
          }
          .setu-flash-text {
            animation: setu-flash 3.4s cubic-bezier(.22,.61,.36,1) forwards;
          }
        `}</style>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="relative h-[184px] lg:h-[224px] flex items-center justify-center">
            {/* Soft decorative top + bottom hairlines */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* The flashing message — re-mounted via key */}
            <div
              key={flashKey}
              className="absolute top-1/2 left-1/2 setu-flash-text text-center px-4 select-none whitespace-nowrap max-w-[95vw]"
              data-testid="flash-message"
            >
              <span className="block text-[clamp(0.85rem,2.2vw,1.7rem)] font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(129,140,248,0.35)]">
                {FLASH_MESSAGES[flashIdx]}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* CORE MODULES — 3-column grid                                 */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 bg-[#0c0c0d] border-y border-white/5 px-6" data-testid="landing-modules">
        <div className="max-w-7xl mx-auto py-20 lg:py-24">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <p className="text-[11px] tracking-[0.22em] uppercase text-indigo-400 font-semibold mb-3">Core platform</p>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Five Core Modules.{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                One IPO Journey.
              </span>
            </h2>
            <p className="text-white/55 mt-4 text-base leading-relaxed">
              Built for India, Trained on SEBI ICDR and Designed for Collaboration across Promoters, Advisors and Merchant bankers.
            </p>
          </div>

          {/* 5-column uniform grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {ALL_MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => navigate(m.path)}
                  className="group relative text-left rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all duration-500 overflow-hidden p-5 hover:-translate-y-1 flex flex-col h-full min-h-[220px]"
                  data-testid={`landing-module-${m.id}`}
                >
                  {/* Glow on hover */}
                  <div className={`absolute -top-24 -right-24 w-56 h-56 rounded-full bg-gradient-to-br ${m.accent} blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative flex flex-col h-full">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.iconBg} flex items-center justify-center shadow-lg mb-4`}>
                      <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                    </div>

                    <h3 className="text-base font-semibold text-white leading-snug mb-1.5">{m.title}</h3>
                    <p className="text-[12px] text-indigo-300/80 leading-snug mb-4">{m.tagline}</p>

                    <div className="mt-auto flex items-center gap-1 text-[12px] font-medium text-white/80 group-hover:text-indigo-300 transition-colors">
                      Explore
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* VIDEO INTRODUCTION                                           */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 bg-[#0a0a0a] px-6" data-testid="landing-video">
        <div className="max-w-4xl mx-auto py-14 lg:py-16 flex flex-col items-center text-center">
          <p className="text-[11px] tracking-[0.22em] uppercase text-indigo-400 font-semibold mb-3">Watch the story</p>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight max-w-2xl">
            See how SETU{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              democratises India's IPO journey
            </span>
          </h2>
          <p className="text-white/55 mt-3 text-sm leading-relaxed max-w-lg">
            A 90-second corporate film on why we built India's first AI-powered IPO Operating System — and what it means for entrepreneurs in Tier 2, 3 &amp; 4 cities.
          </p>

          <div className="mt-6 w-full max-w-3xl">
            <CorporateFilmPlayer />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* OUR TECHNOLOGY STACK — infinite marquee                      */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 bg-[#0c0c0d] border-t border-white/5 px-6 py-16 lg:py-20" data-testid="landing-tech-stack">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] tracking-[0.22em] uppercase text-indigo-400 font-semibold mb-3">Our Technology Stack</p>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
              Built on the{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                world&apos;s most trusted infrastructure.
              </span>
            </h2>
          </div>

          {/* marquee CSS (scoped) */}
          <style>{`
            @keyframes setu-marquee {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .setu-marquee-track {
              animation: setu-marquee 36s linear infinite;
              will-change: transform;
            }
            .setu-marquee-track:hover { animation-play-state: paused; }
            .setu-marquee-mask {
              -webkit-mask-image: linear-gradient(to right, transparent 0, #000 6%, #000 94%, transparent 100%);
                      mask-image: linear-gradient(to right, transparent 0, #000 6%, #000 94%, transparent 100%);
            }
          `}</style>

          <div className="relative overflow-hidden setu-marquee-mask">
            <div className="setu-marquee-track flex items-center gap-5 lg:gap-6 w-max">
              {[...Array(2)].map((_, dupIdx) => (
                <div key={dupIdx} className="flex items-center gap-5 lg:gap-6 shrink-0" aria-hidden={dupIdx === 1}>
                  {[
                    {
                      name: "Emergent.sh",
                      kind: "wordmark",
                      mark: <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-fuchsia-400 to-purple-500 bg-clip-text text-transparent">{"{ E }"}</span>,
                    },
                    {
                      name: "MongoDB",
                      kind: "img",
                      src: "https://cdn.simpleicons.org/mongodb",
                    },
                    {
                      name: "Microsoft",
                      kind: "img",
                      src: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg",
                      imgClass: "h-5 lg:h-6",
                      hideName: true,
                    },
                    {
                      name: "Razorpay",
                      kind: "img",
                      src: "https://cdn.simpleicons.org/razorpay",
                    },
                    {
                      name: "Google Authenticator",
                      kind: "img",
                      src: "https://cdn.simpleicons.org/googleauthenticator",
                    },
                    {
                      name: "Google Gemini",
                      kind: "img",
                      src: "https://cdn.simpleicons.org/googlegemini",
                    },
                    {
                      name: "Claude.ai",
                      kind: "img",
                      src: "https://cdn.simpleicons.org/claude",
                    },
                    {
                      name: "Flow.ai",
                      kind: "wordmark",
                      mark: (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-[11px] font-black">F</span>
                        </span>
                      ),
                    },
                    {
                      name: "JavaScript",
                      kind: "img",
                      src: "https://cdn.simpleicons.org/javascript",
                    },
                  ].map((logo) => (
                    <div
                      key={`${dupIdx}-${logo.name}`}
                      className="flex items-center gap-3 px-5 lg:px-6 py-3 lg:py-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-colors shrink-0 backdrop-blur-sm"
                      title={logo.name}
                    >
                      {logo.kind === "img" ? (
                        <img
                          src={logo.src}
                          alt={`${logo.name} logo`}
                          className={logo.imgClass || "h-6 lg:h-7 w-auto"}
                          loading="lazy"
                        />
                      ) : (
                        logo.mark
                      )}
                      {!logo.hideName && (
                        <span className="text-sm lg:text-base font-semibold tracking-tight text-white whitespace-nowrap">
                          {logo.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* WHY SETU — value props row                                   */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 bg-[#0c0c0d] border-t border-white/5 px-6" data-testid="landing-why">
        <div className="max-w-7xl mx-auto py-20 lg:py-24">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <p className="text-[11px] tracking-[0.22em] uppercase text-indigo-400 font-semibold mb-3">Why teams choose SETU</p>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Built for{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                India's capital markets.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: "SEBI-aware AI",
                body: "Every chapter, every disclosure, every risk factor — drafted in step with the latest ICDR regulations and SEBI circulars." },
              { icon: Zap, title: "10× faster drafting",
                body: "Centralised corporate repository auto-syncs into your DRHP chapters. Stop copy-pasting numbers between Excel and Word." },
              { icon: Users, title: "Verified expert network",
                body: "Pre-vetted CAs, CS, CFOs, Auditors and Merchant Bankers — searchable by industry, expertise and city." },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-7"
              >
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                  <p.icon className="w-5 h-5 text-indigo-300" strokeWidth={1.8} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{p.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* CLOSING CTA                                                  */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 bg-[#0a0a0a] px-6" data-testid="landing-cta">
        <div className="max-w-4xl mx-auto py-20 lg:py-24 flex flex-col items-center text-center">
          <h2 className="text-4xl lg:text-6xl font-bold tracking-tight max-w-3xl">
            <span className="bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">Ready to build your</span>{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">IPO journey?</span>
          </h2>
          <p className="text-white/55 mt-4 text-lg max-w-xl leading-relaxed">
            Start with a free IPO readiness test. No credit card required.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate("/login?module=assessment")}
              className="bg-white text-black hover:bg-white/90 rounded-full px-7 h-12 text-sm font-semibold shadow-[0_0_40px_rgba(255,255,255,0.25)]"
              data-testid="landing-cta-readiness"
            >
              Start free readiness test <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => { setContactType("support"); setContactOpen(true); }}
              variant="outline"
              className="bg-white/[0.03] border-white/15 hover:bg-white/10 text-white rounded-full px-7 h-12 text-sm backdrop-blur-md"
              data-testid="landing-cta-support"
            >
              Talk to support
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* FOOTER                                                       */}
      {/* ════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 bg-[#070707] border-t border-white/5 text-white/70 px-6">
        <div className="max-w-7xl mx-auto py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 -mt-[100px] mb-[-74px]">
                <img src="/setu-logo.svg" alt="SETU" className="h-[226px] w-auto brightness-0 invert" />
              </div>
              <p className="text-xs leading-relaxed text-white/45">
                India's first AI-powered IPO Operating System. End-to-end DRHP journey with privacy, expert marketplace, and funding solutions.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80 mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => navigate("/login?module=drhp")} className="hover:text-white transition-colors">DRHP Builder</button></li>
                <li><button onClick={() => navigate("/login?module=assessment")} className="hover:text-white transition-colors">IPO Readiness Test</button></li>
                <li><button onClick={() => navigate("/login?module=matchmaker")} className="hover:text-white transition-colors">Expert Marketplace</button></li>
                <li><button onClick={() => navigate("/login?module=funding")} className="hover:text-white transition-colors">IPO Funding</button></li>
                <li><button onClick={() => navigate("/login?module=valuation")} className="hover:text-white transition-colors">Business Valuation</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80 mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => navigate("/about")} className="hover:text-white transition-colors">About Us</button></li>
                <li><button onClick={() => navigate("/pricing")} className="hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => navigate("/resources")} className="hover:text-white transition-colors">Resources</button></li>
                <li><button onClick={() => navigate("/disclaimer")} className="hover:text-white transition-colors">Disclaimer</button></li>
                <li><button onClick={() => navigate("/careers")} className="hover:text-white transition-colors">Careers</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80 mb-4">Get in touch</h4>
              <ul className="space-y-2.5 text-sm">
                <li>Mumbai, Maharashtra, India</li>
                <li><a href="mailto:founders.ipolabs@gmail.com" className="hover:text-white transition-colors">founders.ipolabs@gmail.com</a></li>
              </ul>
              <div className="flex gap-2.5 mt-5">
                <a href="https://www.linkedin.com/company/ipo-labs" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/></svg>
                </a>
                <a href="https://twitter.com/ipolabs" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 mt-8 pt-5 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-white/40">© {new Date().getFullYear()} IPO Labs Private Limited. All rights reserved.</p>
            <div className="flex gap-6 text-[11px] text-white/40">
              <button onClick={() => navigate("/disclaimer")} className="hover:text-white transition-colors">Privacy Policy</button>
              <button onClick={() => navigate("/disclaimer")} className="hover:text-white transition-colors">Terms of Service</button>
              <button onClick={() => navigate("/disclaimer")} className="hover:text-white transition-colors">SEBI Compliance</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Floating notification ── */}
      {showNotification && (
        <div className="fixed bottom-6 left-6 z-40 max-w-sm animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white/[0.04] border border-white/10 backdrop-blur-2xl text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-1">New Update</p>
              <p className="text-xs text-white/55 leading-relaxed">SEBI's 2026 DRHP Guidelines now integrated into our Builder.</p>
              <button
                onClick={() => navigate("/login?module=drhp")}
                className="text-indigo-300 text-xs font-semibold mt-2 hover:text-indigo-200 inline-flex items-center gap-1"
              >
                Check Now <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="text-white/40 hover:text-white"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <ContactLeadDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        leadType={contactType}
      />

      <CookieConsent />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Corporate Film Player
// • Auto-plays once per browser session (sessionStorage flag)
// • On finish: rewinds to 0, pauses, shows replay overlay until user clicks
// ─────────────────────────────────────────────────────────────────────────
const CorporateFilmPlayer = () => {
  const videoRef = useRef(null);
  const [ended, setEnded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true); // start muted to allow autoplay

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load(); // force-init the source
    // Auto-play once per session — wait until the video is ready
    const seen = sessionStorage.getItem("setu_corp_film_played");
    if (seen) return;

    const tryPlay = () => {
      v.muted = true;
      const p = v.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          setPlaying(true);
          sessionStorage.setItem("setu_corp_film_played", "1");
        }).catch(() => { /* autoplay blocked, user will click */ });
      }
    };

    if (v.readyState >= 2) tryPlay();
    else {
      v.addEventListener("canplay", tryPlay, { once: true });
      v.addEventListener("loadeddata", tryPlay, { once: true });
    }

    return () => {
      v.removeEventListener("canplay", tryPlay);
      v.removeEventListener("loadeddata", tryPlay);
    };
  }, []);

  const handlePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    setEnded(false);
    v.currentTime = 0;
    v.muted = false;
    setMuted(false);
    v.play().then(() => setPlaying(true)).catch(() => {});
  };

  const handleEnded = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setPlaying(false);
    setEnded(true);
  };

  const handleVideoClick = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.muted = false;
      setMuted(false);
      v.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div
      className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black shadow-[0_0_60px_rgba(99,102,241,0.18)] group"
      data-testid="landing-corporate-video"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        preload="auto"
        playsInline
        muted={muted}
        onEnded={handleEnded}
        onPlay={() => { setPlaying(true); setEnded(false); }}
        onPause={() => setPlaying(false)}
        onClick={handleVideoClick}
        controls={playing}
        data-testid="corporate-film-video"
      >
        <source src="/setu-corporate-film.webm" type="video/webm" />
        <source src="/setu-corporate-film.mp4" type="video/mp4" />
      </video>

      {/* Replay / Initial overlay (visible when paused at start or finished) */}
      {(!playing && (ended || (videoRef.current?.currentTime ?? 0) === 0)) && (
        <button
          type="button"
          onClick={handlePlay}
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black/60 via-black/30 to-black/60 backdrop-blur-[1px] cursor-pointer transition-all"
          data-testid="corporate-film-replay-btn"
          aria-label={ended ? "Replay corporate film" : "Play corporate film"}
        >
          <div className="relative">
            <span className="absolute inset-0 rounded-full border border-white/30 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
              <PlayCircle className="w-10 h-10 text-white" strokeWidth={1.3} />
            </div>
          </div>
          <h3 className="mt-5 text-base lg:text-lg font-semibold text-white">
            {ended ? "Watch Again" : "The IPO Labs Story"}
          </h3>
          <p className="mt-1 text-white/70 text-xs">Click to play</p>
        </button>
      )}
    </div>
  );
};

export default LandingPage;
