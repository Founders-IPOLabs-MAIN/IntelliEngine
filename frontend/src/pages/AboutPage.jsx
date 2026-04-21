import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, Shield, Cpu, Users, Eye, Brain, Heart,
  Linkedin, ExternalLink, ChevronRight, Sparkles, Target, Scale,
  Building2, Zap
} from "lucide-react";

const AboutPage = () => {
  const navigate = useNavigate();
  const [hoveredFounder, setHoveredFounder] = useState(null);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll("[data-animate]").forEach(el => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const isVisible = (id) => visibleSections.has(id);

  return (
    <div className="min-h-screen bg-white flex flex-col" data-testid="about-page">
      {/* Nav */}
      <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b px-8 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#003366] rounded-lg flex items-center justify-center"><span className="text-white font-bold text-xs">IP</span></div>
            <span className="font-bold text-[#003366]">IPO Labs</span>
          </div>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="font-semibold text-black">About</span>
        </div>
        <Button onClick={() => navigate("/login")} className="bg-[#003366] hover:bg-[#002244] text-white rounded-full px-6 text-sm">Get Started</Button>
      </nav>

      {/* ── SECTION 1: HERO / VISION ── */}
      <section className="relative bg-gradient-to-br from-[#001a33] via-[#003366] to-[#002244] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/[0.03] rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/[0.04] rounded-full" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-8 lg:px-16 py-24 text-center">
          <Badge className="bg-white/10 text-white/80 border-white/20 mb-8 px-5 py-1.5 text-xs tracking-widest uppercase">Since 2024 &middot; Mumbai, India</Badge>
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-8">
            Democratizing<br />
            <span className="bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">Capital Markets</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed mb-4">
            For too long, India's IPO ecosystem has operated behind closed doors &mdash; accessible only to those with the right connections, the right advisors, and deep pockets. We exist to change that.
          </p>
          <p className="text-white/50 text-base max-w-2xl mx-auto leading-relaxed">
            IPO Labs is building India's first AI-powered IPO Operating System &mdash; a platform where every entrepreneur, whether Mainboard or SME, can access the same tools, intelligence, and regulatory precision that was once reserved for the elite. We're making the primary market transparent, data-driven, and radically accessible.
          </p>
        </div>
      </section>

      {/* ── THE STORY ── */}
      <section id="story" data-animate className="py-20 px-8 lg:px-16 bg-gray-50/50">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible("story") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-xs tracking-[0.2em] uppercase text-[#003366] font-semibold mb-4">The Origin Story</p>
          <h2 className="text-3xl font-bold text-black mb-6">When Compliance Met Code</h2>
          <p className="text-gray-500 text-lg leading-relaxed max-w-3xl mx-auto">
            A Chartered Accountant saw the regulatory friction &mdash; months of manual DRHP preparation, opaque compliance workflows, and founders drowning in SEBI paperwork. A Tech Founder saw the AI breakthrough &mdash; the ability to automate, extract, and intelligently structure the same processes in days, not months. They built IPO Labs at the intersection of <strong className="text-gray-800">Regulatory Rigor</strong> and <strong className="text-gray-800">Technological Speed</strong>.
          </p>
        </div>
      </section>

      {/* ── SECTION 2: FOUNDERS (SPLIT SCREEN) ── */}
      <section id="founders" data-animate className="py-20 px-8 lg:px-16">
        <div className={`max-w-6xl mx-auto transition-all duration-1000 ${isVisible("founders") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.2em] uppercase text-[#003366] font-semibold mb-3">The Duo</p>
            <h2 className="text-3xl font-bold text-black">Meet the Founders</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-0 lg:gap-1 rounded-2xl overflow-hidden border border-gray-100 shadow-lg">
            {/* Jagruti */}
            <div
              className="relative group bg-gradient-to-br from-[#f8f9fa] to-[#eef1f5] p-10 lg:p-12 transition-all duration-500 hover:from-[#003366]/[0.03] hover:to-[#003366]/[0.08]"
              onMouseEnter={() => setHoveredFounder("jagruti")}
              onMouseLeave={() => setHoveredFounder(null)}
            >
              <div className="relative mb-8">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#003366] to-[#001a33] flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-500">
                  <span className="text-white text-4xl font-bold tracking-tight">JS</span>
                </div>
                <a href="https://www.linkedin.com/in/ca-jagruti-sahu-523a948/" target="_blank" rel="noopener noreferrer"
                  className="absolute -bottom-2 -right-2 w-9 h-9 bg-[#0A66C2] rounded-lg flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform" title="LinkedIn Profile">
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#003366] font-bold">Guardian of Trust & Compliance</p>
                <h3 className="text-2xl font-bold text-black">CA Jagruti Sahu</h3>
                <p className="text-sm text-gray-400 font-medium">Co-Founder & Chief Compliance Officer</p>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mt-5">
                A Chartered Accountant forged in the crucible of Indian financial compliance, Jagruti brings a decade of expertise across corporate governance, SEBI regulatory frameworks, and audit-grade precision to every line of DRHP that passes through SETU.
              </p>
              <p className="text-gray-500 text-sm leading-relaxed mt-3">
                She doesn't just understand the rules &mdash; she anticipates how SEBI interprets them. While others automate process, Jagruti automates <em>trust</em>.
              </p>

              <div className={`mt-6 flex flex-wrap gap-2 transition-all duration-500 ${hoveredFounder === "jagruti" ? "opacity-100 translate-y-0" : "opacity-60 translate-y-1"}`}>
                {["SEBI ICDR", "Corporate Governance", "Financial Audits", "DRHP Compliance", "Risk Assessment"].map(t => (
                  <Badge key={t} variant="outline" className="text-[10px] bg-white/80">{t}</Badge>
                ))}
              </div>
            </div>

            {/* Ronak */}
            <div
              className="relative group bg-gradient-to-br from-[#f8f9fa] to-[#eef1f5] p-10 lg:p-12 transition-all duration-500 hover:from-[#003366]/[0.03] hover:to-[#003366]/[0.08] lg:border-l border-t lg:border-t-0 border-gray-100"
              onMouseEnter={() => setHoveredFounder("ronak")}
              onMouseLeave={() => setHoveredFounder(null)}
            >
              <div className="relative mb-8">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-500">
                  <span className="text-white text-4xl font-bold tracking-tight">RR</span>
                </div>
                <a href="https://www.linkedin.com/in/ronakrajan/" target="_blank" rel="noopener noreferrer"
                  className="absolute -bottom-2 -right-2 w-9 h-9 bg-[#0A66C2] rounded-lg flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform" title="LinkedIn Profile">
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] tracking-[0.2em] uppercase text-orange-600 font-bold">Architect of Innovation</p>
                <h3 className="text-2xl font-bold text-black">Ronak Rajan</h3>
                <p className="text-sm text-gray-400 font-medium">Founder & Chief Executive Officer</p>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mt-5">
                A tech-driven entrepreneur and B2B strategist, Ronak builds at the intersection of AI and enterprise SaaS. From vibe-coding prototypes to architecting scalable PaaS infrastructure, he turns complex regulatory workflows into products people actually want to use.
              </p>
              <p className="text-gray-500 text-sm leading-relaxed mt-3">
                He believes the best compliance software should feel like <em>magic, not paperwork</em>. Every pixel and API in SETU carries that conviction.
              </p>

              <div className={`mt-6 flex flex-wrap gap-2 transition-all duration-500 ${hoveredFounder === "ronak" ? "opacity-100 translate-y-0" : "opacity-60 translate-y-1"}`}>
                {["AI / ML", "B2B SaaS", "Platform Architecture", "Vibe Coding", "Go-to-Market"].map(t => (
                  <Badge key={t} variant="outline" className="text-[10px] bg-white/80">{t}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Bridge Statement */}
          <div id="bridge" data-animate className={`mt-12 text-center transition-all duration-1000 delay-300 ${isVisible("bridge") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div className="inline-flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-full px-8 py-4">
              <Shield className="w-5 h-5 text-[#003366]" />
              <span className="text-sm text-gray-500">Regulatory Rigor</span>
              <div className="w-12 h-px bg-gradient-to-r from-[#003366] to-orange-500" />
              <span className="text-sm text-gray-500">Technological Speed</span>
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: MISSION & VALUES (BENTO GRID) ── */}
      <section id="mission" data-animate className="py-20 px-8 lg:px-16 bg-[#fafbfc]">
        <div className={`max-w-6xl mx-auto transition-all duration-1000 ${isVisible("mission") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>

          {/* BENTO GRID */}
          <div className="grid grid-cols-12 gap-4 auto-rows-auto">

            {/* Mission - Large Bento */}
            <div className="col-span-12 lg:col-span-8 bg-gradient-to-br from-[#003366] to-[#001a33] rounded-2xl p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.02] rounded-full translate-y-1/3 -translate-x-1/3" />
              <div className="relative z-10">
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/50 font-bold mb-4">Our Mission</p>
                <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-6">
                  To bridge the IPO readiness gap<br className="hidden lg:block" /> for every Indian SME &mdash; with AI<br className="hidden lg:block" /> precision and regulatory integrity.
                </h2>
                <p className="text-white/50 text-sm max-w-lg leading-relaxed">
                  We're building the infrastructure that makes going public as systematic as running a SaaS business &mdash; measurable, data-driven, and accessible from Day 1.
                </p>
              </div>
            </div>

            {/* Stats Bento */}
            <div className="col-span-12 lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-8 flex flex-col justify-between">
              <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 font-bold mb-6">By the Numbers</p>
              <div className="space-y-6">
                <div>
                  <p className="text-4xl font-bold text-[#003366]">$100B+</p>
                  <p className="text-xs text-gray-400 mt-1">Indian IPO ecosystem we're disrupting</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-orange-500">13</p>
                  <p className="text-xs text-gray-400 mt-1">DRHP chapters automated via AI</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-[#003366]">5</p>
                  <p className="text-xs text-gray-400 mt-1">Platform modules — live & growing</p>
                </div>
              </div>
            </div>

            {/* Value 1: Radical Transparency */}
            <div className="col-span-12 lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-8 group hover:border-[#003366]/30 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-[#003366]/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#003366] group-hover:text-white transition-all duration-300">
                <Eye className="w-6 h-6 text-[#003366] group-hover:text-white transition-colors" />
              </div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#003366] font-bold mb-2">Pillar 01</p>
              <h3 className="text-lg font-bold text-black mb-2">Radical Transparency</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                We decrypt complex DRHPs, SEBI regulations, and compliance filings &mdash; turning opaque legal jargon into actionable intelligence that every founder can understand and act upon.
              </p>
            </div>

            {/* Value 2: AI-First Integrity */}
            <div className="col-span-12 lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-8 group hover:border-orange-500/30 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Brain className="w-6 h-6 text-orange-500 group-hover:text-white transition-colors" />
              </div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-orange-500 font-bold mb-2">Pillar 02</p>
              <h3 className="text-lg font-bold text-black mb-2">AI-First Integrity</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                We use data, not just intuition, to drive capital market decisions. From automated DRHP extraction to AI-powered readiness scoring, every insight is evidence-based and audit-ready.
              </p>
            </div>

            {/* Value 3: Founder-Centricity */}
            <div className="col-span-12 lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-8 group hover:border-green-500/30 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                <Heart className="w-6 h-6 text-green-500 group-hover:text-white transition-colors" />
              </div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-green-600 font-bold mb-2">Pillar 03</p>
              <h3 className="text-lg font-bold text-black mb-2">Founder-Centricity</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Built by founders, for founders. Every feature in SETU exists because a real entrepreneur hit a real wall in their listing journey. We solve their problems, not theoretical ones.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-8 lg:px-16 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Ready to start your IPO journey?</h2>
          <p className="text-gray-500 mb-8">Whether you're a first-generation entrepreneur or a seasoned CFO, SETU gives you the tools to navigate the listing process with confidence.</p>
          <div className="flex items-center justify-center gap-4">
            <Button onClick={() => navigate("/login")} className="bg-[#003366] hover:bg-[#002244] text-white rounded-full px-8 py-3 font-semibold gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate("/careers")} variant="outline" className="rounded-full px-8 py-3 font-semibold gap-2">
              Join the Team <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white/50 py-6 px-8 text-center text-xs">
        <p>&copy; {new Date().getFullYear()} IPO Labs AI Private Limited. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AboutPage;
