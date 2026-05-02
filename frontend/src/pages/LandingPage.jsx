import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  TrendingUp, 
  Users, 
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Scale,
  PlayCircle,
  Film
} from "lucide-react";
import ContactLeadDialog from "@/components/ContactLeadDialog";
import WaveDotsBackground from "@/components/WaveDotsBackground";
import CookieConsent from "@/components/CookieConsent";

const LandingPage = () => {
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(true);
  const [shimmerIndex, setShimmerIndex] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactType, setContactType] = useState("support");

  // Shimmer effect every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShimmerIndex(prev => (prev + 1) % 5);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const modules = [
    {
      id: "drhp",
      title: "DRHP Builder",
      description: "SEBI Compliant, Secure & On-Cloud",
      icon: FileText,
      path: "/login?module=drhp",
      iconBg: "bg-blue-100",
      iconColor: "text-[#003366]"
    },
    {
      id: "readiness",
      title: "FREE IPO Readiness Test",
      description: "Test your IPO Readiness & Identify Gaps",
      icon: CheckCircle2,
      path: "/login?module=assessment",
      iconBg: "bg-cyan-100",
      iconColor: "text-[#00D1FF]",
      hasProgress: true
    },
    {
      id: "funding",
      title: "IPO Funding",
      description: "Raise Pre, Post or Bridge Fund Rounds",
      icon: TrendingUp,
      path: "/login?module=funding1",
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      id: "matchmaking",
      title: "The Match-Making Platform",
      description: "Join our Expert Network & Grow Your Business",
      icon: Users,
      path: "/login?module=matchmaker",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      id: "valuation",
      title: "Business Valuation",
      description: "AI-Powered DCF, NAV & Comparable Analysis",
      icon: Scale,
      path: "/login?module=valuation",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col relative overflow-hidden">
      {/* Subtle Background Texture */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full" 
             style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,51,102,0.05) 1px, transparent 0)', backgroundSize: '40px 40px'}} />
      </div>

      {/* Animated wave-dot data-stream — half the viewport width, 3/4 height, offset to the right */}
      <div
        className="pointer-events-none absolute top-0 right-0 hidden lg:block"
        style={{ width: "55%", height: "75%", zIndex: 0 }}
        aria-hidden="true"
        data-testid="landing-wave-bg"
      >
        <WaveDotsBackground />
      </div>

      {/* Top Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 lg:px-16 py-5">
        <div className="flex items-center -mt-3">
          <img src="/setu-logo.png" alt="SETU Labs" className="h-[170px] w-auto object-contain" data-testid="landing-logo" />
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/advisors")} className="text-sm font-medium text-gray-600 hover:text-[#003366] transition-colors" data-testid="nav-advisors">Advisors</button>
          <button onClick={() => navigate("/resources")} className="text-sm font-medium text-gray-600 hover:text-[#003366] transition-colors" data-testid="nav-resources">Resources</button>
          <button onClick={() => navigate("/pricing")} className="text-sm font-medium text-gray-600 hover:text-[#003366] transition-colors" data-testid="nav-pricing">Pricing</button>
          <button onClick={() => navigate("/disclaimer")} className="text-sm font-medium text-gray-600 hover:text-[#003366] transition-colors" data-testid="nav-disclaimer">Disclaimer</button>
          <button onClick={() => navigate("/about")} className="text-sm font-medium text-gray-600 hover:text-[#003366] transition-colors" data-testid="nav-about">About Us</button>
          <button onClick={() => navigate("/careers")} className="text-sm font-medium text-gray-600 hover:text-[#003366] transition-colors" data-testid="nav-careers">Careers</button>
          <Button 
            onClick={() => navigate("/login")}
            className="bg-[#003366] hover:bg-[#002244] text-white px-6 py-2 rounded-full font-medium text-sm shadow-lg"
            data-testid="landing-sign-in-btn"
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center px-8 lg:px-16 py-8">
        <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
          
          {/* Left Side - Power Hero */}
          <div className="space-y-5">
            {/* Headline - Moved up, no welcome text */}
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[#003366] leading-tight" style={{fontFamily: "'General Sans', sans-serif"}}>
              Building a Democratic IPO Ecosystem
            </h1>
            
            {/* Sub-headline */}
            <p className="text-gray-600 text-base lg:text-lg leading-relaxed">
              Empowering ambitious companies across Tier 2, 3 &amp; 4 cities in India, to build complex DRHP's, get access to top Subject Matter Experts, raise Growth or IPO Capital and meet &ldquo;Talent to Hire&rdquo; or &ldquo;win Projects&rdquo; across India.
            </p>
            
            {/* Utility Description - Category Bullets */}
            <div className="border-l-4 border-[#00D1FF] pl-4 py-3 bg-white/50 rounded-r-lg space-y-2">
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong className="text-[#003366]">DRHP:</strong> Build entire DRHP's in a safe and collaborative Platform. Work with teams across India, track progress real-time, and control every step.
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong className="text-[#003366]">FUNDING:</strong> Raise Pre-IPO, Post-IPO or Bridge Funding Rounds, working closely with our expert Funding Team, who will provide personalised care &amp; attention.
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong className="text-[#003366]">HIRE &amp; CONSULT:</strong> Experienced Experts like CA, CS, Auditors, Directors, CFO's, Merchant Bankers across India. Work with Subject-Matter-Experts who are experts in YOUR industry.
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong className="text-[#003366]">MATCHMAKING:</strong> Experts can join our platform to win New Clients, New Projects, and offer short term consulting across India.
              </p>
            </div>
            
            {/* Primary CTA */}
            <div className="flex items-center gap-4 pt-2">
              <Button 
                onClick={() => navigate("/login")}
                className="bg-[#00D1FF] hover:bg-[#00b8e6] text-[#003366] font-semibold px-8 py-6 rounded-full text-base shadow-lg shadow-cyan-200/50 transition-all hover:shadow-xl hover:shadow-cyan-300/50"
                data-testid="landing-get-started-btn"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => { setContactType("support"); setContactOpen(true); }}
                className="border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white px-6 py-6 rounded-full text-base"
                data-testid="landing-contact-support-btn"
              >
                Contact Support
              </Button>
              <Button 
                onClick={() => { setContactType("sales"); setContactOpen(true); }}
                className="bg-[#FF6B1A] hover:bg-[#e55a0a] text-white px-6 py-6 rounded-full text-base font-semibold shadow-lg shadow-orange-200/50 transition-all hover:shadow-xl hover:shadow-orange-300/50"
                data-testid="landing-contact-sales-btn"
              >
                Contact Sales
              </Button>
            </div>
          </div>

          {/* Right Side — Corporate Video + Compact Modules */}
          <div className="flex flex-col-reverse gap-5 h-full" data-testid="landing-right-column">
            {/* Corporate Video Placeholder — now BELOW the modules */}
            <div
              className="relative flex-1 min-h-[252px] rounded-[28px] overflow-hidden bg-gradient-to-br from-[#001a33] via-[#003366] to-[#002244] shadow-2xl shadow-[#003366]/20 group cursor-pointer"
              data-testid="landing-corporate-video-placeholder"
              title="Corporate video — upload coming soon"
            >
              {/* Soft decorative grid overlay */}
              <div className="absolute inset-0 opacity-[0.12]"
                   style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
              {/* Corner accent gradient blobs */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#00D1FF]/15 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#D8BFD8]/15 rounded-full blur-3xl" />

              {/* Top-left meta badge */}
              <div className="absolute top-5 left-5 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-[#00D1FF]"></span>
                <span className="text-[10px] tracking-[0.22em] uppercase text-white/70 font-semibold">Corporate Film</span>
              </div>
              {/* Top-right tag */}
              <div className="absolute top-5 right-5">
                <span className="text-[10px] tracking-[0.2em] uppercase text-white/50 font-medium bg-white/5 border border-white/10 rounded-full px-3 py-1">
                  Coming Soon
                </span>
              </div>

              {/* Centered play + title */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                <div className="relative">
                  {/* Pulse rings */}
                  <span className="absolute inset-0 rounded-full border border-white/20 animate-ping" />
                  <span className="absolute inset-0 rounded-full border border-white/10" />
                  <div className="relative w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
                    <PlayCircle className="w-10 h-10 text-white" strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="mt-6 text-white text-xl lg:text-2xl font-semibold tracking-tight">
                  The IPO Labs Story
                </h3>
                <p className="mt-2 text-white/55 text-sm max-w-xs leading-relaxed">
                  A 90-second film on how we're democratising India's IPO ecosystem &mdash; releasing shortly.
                </p>
              </div>

              {/* Bottom brand strip */}
              <div className="absolute bottom-0 left-0 right-0 px-5 py-3 flex items-center justify-between bg-gradient-to-t from-black/40 to-transparent">
                <div className="flex items-center gap-2 text-white/70 text-[11px]">
                  <Film className="w-3.5 h-3.5" />
                  <span className="tracking-wide uppercase font-semibold">IPO Labs</span>
                </div>
                <div className="text-white/40 text-[10px] tracking-wider">1920 &times; 1080 &middot; 16:9</div>
              </div>
            </div>

            {/* Module Buttons — enlarged further, now sit ABOVE the video */}
            <div className="grid grid-cols-5 gap-3" data-testid="landing-compact-modules">
              {modules.map((module, index) => (
                <button
                  key={module.id}
                  onClick={() => navigate(module.path)}
                  className={`module-cycle-border group relative p-5 rounded-2xl bg-white border-2
                              hover:shadow-xl hover:-translate-y-0.5
                              transition-transform duration-200 text-center overflow-hidden
                              ${shimmerIndex === index ? 'shimmer-active' : ''}`}
                  style={{ animationDelay: `${index * 0.4}s` }}
                  data-testid={`landing-module-${module.id}`}
                  title={`${module.title} — ${module.description}`}
                >
                  <div className={`w-14 h-14 ${module.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-3 relative`}>
                    {module.hasProgress ? (
                      <div className="relative w-12 h-12">
                        <svg className="w-12 h-12 transform -rotate-90">
                          <circle cx="24" cy="24" r="19" stroke="#e5e7eb" strokeWidth="3" fill="none" />
                          <circle cx="24" cy="24" r="19" stroke="#00D1FF" strokeWidth="3" fill="none"
                                  strokeDasharray="119.38" strokeDashoffset="30" strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#00D1FF]">75</span>
                      </div>
                    ) : (
                      <module.icon className={`w-7 h-7 ${module.iconColor}`} />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#003366] leading-tight group-hover:text-[#00D1FF] transition-colors line-clamp-2">
                    {module.title.replace("The ", "")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Ribbon */}
      <div className="relative z-10 border-t border-gray-200 bg-white/80 backdrop-blur-sm py-4">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="flex items-center justify-center gap-8 text-gray-400 text-xs">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Safe & Secure
            </span>
            <span className="w-px h-4 bg-gray-300" />
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              On-Cloud
            </span>
            <span className="w-px h-4 bg-gray-300" />
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Build or Consult Anywhere, Anytime
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-[#003366] text-white">
        <div className="max-w-7xl mx-auto px-8 lg:px-16 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-[#003366] font-bold text-sm">IP</span>
                </div>
                <span className="text-lg font-bold tracking-tight">IPO Labs</span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                India's first AI-powered IPO Operating System. End-to-end DRHP journey with complete privacy, expert marketplace, and funding solutions.
              </p>
            </div>

            {/* Platform Column */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white/90">Platform</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><button onClick={() => navigate("/login?module=drhp")} className="hover:text-white transition-colors">DRHP Builder</button></li>
                <li><button onClick={() => navigate("/login?module=assessment")} className="hover:text-white transition-colors">IPO Readiness Test</button></li>
                <li><button onClick={() => navigate("/login?module=matchmaker")} className="hover:text-white transition-colors">Expert Marketplace</button></li>
                <li><button onClick={() => navigate("/login?module=funding")} className="hover:text-white transition-colors">IPO Funding</button></li>
                <li><button onClick={() => navigate("/login?module=valuation")} className="hover:text-white transition-colors">Business Valuation</button></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white/90">Company</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><button onClick={() => navigate("/about")} className="hover:text-white transition-colors">About Us</button></li>
                <li><button onClick={() => navigate("/pricing")} className="hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => navigate("/resources")} className="hover:text-white transition-colors">Resources</button></li>
                <li><button onClick={() => navigate("/disclaimer")} className="hover:text-white transition-colors">Disclaimer</button></li>
                <li><a href="https://ipo-labs.com/contact" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white/90">Get in Touch</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li>Mumbai, Maharashtra, India</li>
                <li><a href="mailto:founders.ipolabs@gmail.com" className="hover:text-white transition-colors">founders.ipolabs@gmail.com</a></li>
              </ul>
              <div className="flex gap-3 mt-5">
                <a href="https://www.linkedin.com/company/ipo-labs" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://twitter.com/ipolabs" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/50">&copy; {new Date().getFullYear()} IPO Labs Private Limited. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-white/50">
              <button onClick={() => navigate("/disclaimer")} className="hover:text-white transition-colors">Privacy Policy</button>
              <button onClick={() => navigate("/disclaimer")} className="hover:text-white transition-colors">Terms of Service</button>
              <button onClick={() => navigate("/disclaimer")} className="hover:text-white transition-colors">SEBI Compliance</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Notification Bar - Sniply Touch */}
      {showNotification && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm animate-slide-up">
          <div className="bg-[#003366] text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-[#00D1FF] rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-[#003366]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-1">New Update</p>
              <p className="text-xs text-gray-300 leading-relaxed">
                SEBI's 2026 DRHP Guidelines now integrated into our Builder.
              </p>
              <button 
                onClick={() => navigate("/login?module=drhp")}
                className="text-[#00D1FF] text-xs font-semibold mt-2 hover:underline inline-flex items-center gap-1"
              >
                Check Now <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="text-gray-400 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }

        /* Cycling dark-blue border for module buttons (logo navy family) */
        @keyframes module-border-cycle {
          0%   { border-color: #003366; box-shadow: 0 0 0 0 rgba(0, 51, 102, 0.00); }
          20%  { border-color: #0052A3; box-shadow: 0 0 0 3px rgba(0, 82, 163, 0.18); }
          40%  { border-color: #00D1FF; box-shadow: 0 0 0 3px rgba(0, 209, 255, 0.18); }
          60%  { border-color: #1E40AF; box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.18); }
          80%  { border-color: #002244; box-shadow: 0 0 0 2px rgba(0, 34, 68, 0.15); }
          100% { border-color: #003366; box-shadow: 0 0 0 0 rgba(0, 51, 102, 0.00); }
        }
        .module-cycle-border {
          border-color: #003366;
          animation: module-border-cycle 2.4s ease-in-out infinite;
        }
        .module-cycle-border:hover {
          animation-play-state: paused;
          border-color: #00D1FF !important;
          box-shadow: 0 10px 24px -6px rgba(0, 209, 255, 0.35) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .module-cycle-border { animation: none; border-color: #003366; }
        }
      `}</style>

      <ContactLeadDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        leadType={contactType}
      />

      <CookieConsent />
    </div>
  );
};

export default LandingPage;
