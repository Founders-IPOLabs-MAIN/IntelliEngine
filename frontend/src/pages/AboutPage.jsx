import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, Shield, Eye, Brain, Heart,
  Linkedin, ChevronRight, Zap, BarChart3
} from "lucide-react";

const JAGRUTI_IMG = "https://customer-assets.emergentagent.com/job_92507c97-3084-44a2-9664-771f9d4ef69a/artifacts/zgsfhjk4_CYNO9942.jpg";
const RONAK_IMG = "https://customer-assets.emergentagent.com/job_92507c97-3084-44a2-9664-771f9d4ef69a/artifacts/hjfcg8iy_CYNO9765.jpg";

const AboutPage = () => {
  const navigate = useNavigate();
  const [hoveredFounder, setHoveredFounder] = useState(null);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setVisibleSections(prev => new Set([...prev, entry.target.id]));
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
      <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b px-8 lg:px-16 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#003366] rounded-md flex items-center justify-center"><span className="text-white font-bold text-[10px]">IP</span></div>
            <span className="font-bold text-sm text-[#003366]">IPO Labs</span>
          </div>
          <span className="text-muted-foreground mx-1 text-xs">/</span>
          <span className="font-semibold text-sm text-black">About Us</span>
        </div>
        <Button onClick={() => navigate("/login")} className="bg-[#003366] hover:bg-[#002244] text-white rounded-full px-5 text-xs h-8">Get Started</Button>
      </nav>

      {/* ── COMPACT HERO ── */}
      <section className="bg-gradient-to-r from-[#001a33] via-[#003366] to-[#002244] text-white py-10 px-8 lg:px-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-20 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight mb-3">
            Democratizing <span className="bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">Capital Markets</span>
          </h1>
          <p className="text-white/55 text-sm max-w-2xl mx-auto leading-relaxed">
            For too long, India's IPO ecosystem operated behind closed doors. IPO Labs is building India's first AI-powered IPO Operating System &mdash; making the primary market transparent, data-driven, and radically accessible for every entrepreneur.
          </p>
        </div>
      </section>

      {/* ── ORIGIN STORY (compact) ── */}
      <section id="story" data-animate className="py-10 px-8 lg:px-16 bg-gray-50/50">
        <div className={`max-w-3xl mx-auto text-center transition-all duration-700 ${isVisible("story") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#003366] font-semibold mb-2">The Origin Story</p>
          <h2 className="text-xl font-bold text-black mb-3">When Compliance Met Code</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            A Chartered Accountant saw the regulatory friction &mdash; months of manual DRHP preparation, opaque compliance workflows, founders drowning in SEBI paperwork. A Tech Founder saw the AI breakthrough &mdash; the ability to automate and intelligently structure those processes in days. They built IPO Labs at the intersection of <strong className="text-gray-700">Regulatory Rigor</strong> and <strong className="text-gray-700">Technological Speed</strong>.
          </p>
        </div>
      </section>

      {/* ── FOUNDERS (SPLIT SCREEN WITH PHOTOS) ── */}
      <section id="founders" data-animate className="py-12 px-8 lg:px-16">
        <div className={`max-w-5xl mx-auto transition-all duration-700 ${isVisible("founders") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="text-center mb-8">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#003366] font-semibold mb-1">The Duo</p>
            <h2 className="text-xl font-bold text-black">Meet the Founders</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Jagruti */}
            <div
              className="relative group bg-gradient-to-br from-[#f8f9fa] to-[#eef1f5] rounded-2xl p-6 border border-gray-100 transition-all duration-500 hover:border-[#003366]/20 hover:shadow-md"
              onMouseEnter={() => setHoveredFounder("jagruti")}
              onMouseLeave={() => setHoveredFounder(null)}
            >
              <div className="flex items-start gap-5">
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-500 bg-gray-200">
                    <img src={JAGRUTI_IMG} alt="CA Jagruti Sahu" className="w-full h-full object-cover object-top" />
                  </div>
                  <a href="https://www.linkedin.com/in/ca-jagruti-sahu-523a948/" target="_blank" rel="noopener noreferrer"
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0A66C2] rounded-md flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform" title="LinkedIn">
                    <Linkedin className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#003366] font-bold mb-0.5">Guardian of Trust & Compliance</p>
                  <h3 className="text-base font-bold text-black">CA Jagruti Sahu</h3>
                  <p className="text-[11px] text-gray-400 font-medium mb-2">Co-Founder & Director</p>
                  <p className="text-gray-600 text-[11px] leading-relaxed">
                    A Chartered Accountant forged in Indian financial compliance, Jagruti brings deep expertise across corporate governance, SEBI regulatory frameworks, and audit-grade precision. She doesn't just understand the rules &mdash; she anticipates how SEBI interprets them.
                  </p>
                </div>
              </div>
              <div className={`mt-3 flex flex-wrap gap-1.5 transition-all duration-500 ${hoveredFounder === "jagruti" ? "opacity-100" : "opacity-40"}`}>
                {["SEBI ICDR", "Corporate Governance", "Financial Audits", "DRHP Compliance", "Risk Assessment"].map(t => (
                  <Badge key={t} variant="outline" className="text-[8px] bg-white/80 py-0">{t}</Badge>
                ))}
              </div>
            </div>

            {/* Ronak */}
            <div
              className="relative group bg-gradient-to-br from-[#f8f9fa] to-[#eef1f5] rounded-2xl p-6 border border-gray-100 transition-all duration-500 hover:border-orange-500/20 hover:shadow-md"
              onMouseEnter={() => setHoveredFounder("ronak")}
              onMouseLeave={() => setHoveredFounder(null)}
            >
              <div className="flex items-start gap-5">
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-500 bg-gray-200">
                    <img src={RONAK_IMG} alt="Ronak Rajan" className="w-full h-full object-cover object-top" />
                  </div>
                  <a href="https://www.linkedin.com/in/ronakrajan/" target="_blank" rel="noopener noreferrer"
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0A66C2] rounded-md flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform" title="LinkedIn">
                    <Linkedin className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-orange-600 font-bold mb-0.5">Architect of Innovation</p>
                  <h3 className="text-base font-bold text-black">Ronak Rajan</h3>
                  <p className="text-[11px] text-gray-400 font-medium mb-2">Co-Founder & Director</p>
                  <p className="text-gray-600 text-[11px] leading-relaxed">
                    A tech-driven entrepreneur and B2B strategist, Ronak builds at the intersection of AI and enterprise SaaS. He turns complex regulatory workflows into products people want to use. He believes compliance software should feel like <em>magic, not paperwork</em>.
                  </p>
                </div>
              </div>
              <div className={`mt-3 flex flex-wrap gap-1.5 transition-all duration-500 ${hoveredFounder === "ronak" ? "opacity-100" : "opacity-40"}`}>
                {["AI / ML", "B2B SaaS", "Platform Architecture", "Vibe Coding", "Go-to-Market"].map(t => (
                  <Badge key={t} variant="outline" className="text-[8px] bg-white/80 py-0">{t}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Bridge */}
          <div id="bridge" data-animate className={`mt-6 text-center transition-all duration-700 delay-200 ${isVisible("bridge") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="inline-flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-full px-6 py-2.5">
              <Shield className="w-4 h-4 text-[#003366]" />
              <span className="text-xs text-gray-500">Regulatory Rigor</span>
              <div className="w-10 h-px bg-gradient-to-r from-[#003366] to-orange-500" />
              <span className="text-xs text-gray-500">Technological Speed</span>
              <Zap className="w-4 h-4 text-orange-500" />
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION + VALUES (4 VERTICAL STACKED CARDS) ── */}
      <section id="mission" data-animate className="py-12 px-8 lg:px-16 bg-[#fafbfc]">
        <div className={`max-w-5xl mx-auto transition-all duration-700 ${isVisible("mission") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>

          {/* Mission Statement */}
          <div className="bg-gradient-to-r from-[#003366] to-[#001a33] rounded-2xl p-8 text-white mb-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <p className="text-[9px] tracking-[0.2em] uppercase text-white/40 font-bold mb-2">Our Mission</p>
              <h2 className="text-xl lg:text-2xl font-bold leading-snug mb-2">
                To bridge the IPO readiness gap for every Indian SME &mdash; with AI precision and regulatory integrity.
              </h2>
              <p className="text-white/45 text-xs max-w-lg">
                Building infrastructure that makes going public as systematic as running a SaaS business &mdash; measurable, data-driven, and accessible from Day 1.
              </p>
            </div>
          </div>

          {/* 4 Vertical Stacked Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* By the Numbers */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col">
              <p className="text-[9px] tracking-[0.2em] uppercase text-gray-400 font-bold mb-4">By the Numbers</p>
              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-2xl font-bold text-[#003366]">$100B+</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Indian IPO ecosystem</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-500">13</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">DRHP chapters automated</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#003366]">5</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Platform modules live</p>
                </div>
              </div>
            </div>

            {/* Pillar 01 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:border-[#003366]/30 hover:shadow-md transition-all duration-300 flex flex-col">
              <div className="w-9 h-9 bg-[#003366]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#003366] transition-all">
                <Eye className="w-4 h-4 text-[#003366] group-hover:text-white transition-colors" />
              </div>
              <p className="text-[9px] tracking-[0.15em] uppercase text-[#003366] font-bold mb-1">Pillar 01</p>
              <h3 className="text-sm font-bold text-black mb-2">Radical Transparency</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed flex-1">
                Decrypting complex DRHPs, SEBI regulations, and compliance filings &mdash; turning opaque legal jargon into actionable intelligence every founder can understand.
              </p>
            </div>

            {/* Pillar 02 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:border-orange-500/30 hover:shadow-md transition-all duration-300 flex flex-col">
              <div className="w-9 h-9 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-500 transition-all">
                <Brain className="w-4 h-4 text-orange-500 group-hover:text-white transition-colors" />
              </div>
              <p className="text-[9px] tracking-[0.15em] uppercase text-orange-500 font-bold mb-1">Pillar 02</p>
              <h3 className="text-sm font-bold text-black mb-2">AI-First Integrity</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed flex-1">
                Using data, not intuition, to drive capital market decisions. From automated DRHP extraction to AI-powered readiness scoring, every insight is evidence-based.
              </p>
            </div>

            {/* Pillar 03 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:border-green-500/30 hover:shadow-md transition-all duration-300 flex flex-col">
              <div className="w-9 h-9 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500 transition-all">
                <Heart className="w-4 h-4 text-green-500 group-hover:text-white transition-colors" />
              </div>
              <p className="text-[9px] tracking-[0.15em] uppercase text-green-600 font-bold mb-1">Pillar 03</p>
              <h3 className="text-sm font-bold text-black mb-2">Founder-Centricity</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed flex-1">
                Built by founders, for founders. Every feature in SETU exists because a real entrepreneur hit a real wall in their listing journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-10 px-8 lg:px-16 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold text-black mb-2">Ready to start your IPO journey?</h2>
          <p className="text-gray-500 text-xs mb-5">Whether you're a first-generation entrepreneur or a seasoned CFO, SETU gives you the tools to navigate the listing process with confidence.</p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => navigate("/login")} className="bg-[#003366] hover:bg-[#002244] text-white rounded-full px-6 h-9 text-xs font-semibold gap-2">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            <Button onClick={() => navigate("/careers")} variant="outline" className="rounded-full px-6 h-9 text-xs font-semibold gap-2">
              Join the Team <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white/50 py-4 px-8 text-center text-xs">
        <p>&copy; {new Date().getFullYear()} IPO Labs AI Private Limited. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AboutPage;
