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
  Scale
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(true);
  const [shimmerIndex, setShimmerIndex] = useState(0);

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
      path: "/login?module=funding",
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      id: "matchmaking",
      title: "MatchMaking Platform",
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

      {/* Top Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 lg:px-16 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#003366] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">IP</span>
          </div>
          <span className="text-xl font-bold text-[#003366] tracking-tight">IPO Labs</span>
        </div>
        <Button 
          onClick={() => navigate("/login")}
          className="bg-[#003366] hover:bg-[#002244] text-white px-6 py-2 rounded-full font-medium text-sm shadow-lg"
          data-testid="landing-sign-in-btn"
        >
          Sign In
        </Button>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center px-8 lg:px-16 py-8">
        <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Side - Power Hero */}
          <div className="space-y-5">
            {/* Headline - Moved up, no welcome text */}
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[#003366] leading-tight" style={{fontFamily: "'General Sans', sans-serif"}}>
              Building a Democratic IPO Ecosystem
            </h1>
            
            {/* Sub-headline */}
            <p className="text-gray-600 text-base lg:text-lg leading-relaxed">
              Empowering ambitious companies across India, including Tier 2, 3 & 4 cities, to easily build SEBI approved, NSE/BSE worthy DRHP's, get real-time access to top IPO Subject Matter Experts, raise Growth or IPO Capital and meet "Talent to Hire" across India and the globe.
            </p>
            
            {/* Utility Description - 5 Bullet Points */}
            <div className="border-l-4 border-[#00D1FF] pl-4 py-3 bg-white/50 rounded-r-lg space-y-2">
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong className="text-[#003366]">BUILD:</strong> End-to-End DRHP's in a Safe, Version Controlled Platform.
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong className="text-[#003366]">COLLABORATE:</strong> with multiple teams across India, track progress real-time, and manage every step with minute detail.
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong className="text-[#003366]">RAISE:</strong> Funds for Pre-IPO, Post-IPO or Bridge Rounds, with personalised support of our expert Funding Team.
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong className="text-[#003366]">HIRE:</strong> Experienced & SEBI Registered Experts like CA, CS, Auditors, Ind. Directors, CFO, Merchant Bankers...
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong className="text-[#003366]">MATCHMAKING:</strong> Experts can join our platform of Subject Matter Experts to connect to "New Clients", win New Projects, offer consulting and grow your IPO Consulting Business.
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
                onClick={() => window.open("mailto:support@ipolabs.com", "_blank")}
                className="border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white px-6 py-6 rounded-full text-base"
              >
                Contact Support
              </Button>
            </div>
          </div>

          {/* Right Side - Bento-Style Action Center */}
          <div className="grid grid-cols-2 gap-4">
            {modules.map((module, index) => (
              <button
                key={module.id}
                onClick={() => navigate(module.path)}
                className={`group relative p-5 rounded-[32px] bg-white border border-gray-200 
                           hover:scale-[1.03] hover:shadow-xl hover:border-[#00D1FF] 
                           transition-all duration-300 text-left overflow-hidden
                           ${index === 4 ? 'col-span-2' : ''}
                           ${shimmerIndex === index ? 'shimmer-active' : ''}`}
                data-testid={`landing-module-${module.id}`}
              >
                {/* Shimmer Effect Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent 
                                 transform -skew-x-12 transition-transform duration-1000
                                 ${shimmerIndex === index ? 'translate-x-full' : '-translate-x-full'}`} 
                     style={{transitionDelay: shimmerIndex === index ? '0ms' : '1000ms'}} />
                
                {/* Icon */}
                <div className={`w-12 h-12 ${module.iconBg} rounded-2xl flex items-center justify-center mb-3 relative`}>
                  {module.hasProgress ? (
                    // Radial Progress Ring for Readiness Test
                    <div className="relative w-10 h-10">
                      <svg className="w-10 h-10 transform -rotate-90">
                        <circle cx="20" cy="20" r="16" stroke="#e5e7eb" strokeWidth="3" fill="none" />
                        <circle cx="20" cy="20" r="16" stroke="#00D1FF" strokeWidth="3" fill="none"
                                strokeDasharray="100.53" strokeDashoffset="25" strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#00D1FF]">75</span>
                    </div>
                  ) : (
                    <module.icon className={`w-6 h-6 ${module.iconColor}`} />
                  )}
                </div>
                
                {/* Content */}
                <h3 className="font-semibold text-[#003366] text-sm mb-1 group-hover:text-[#00D1FF] transition-colors">
                  {module.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {module.description}
                </p>
                
                {/* Hover Arrow */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-[#00D1FF]" />
                </div>
              </button>
            ))}
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
      <div className="relative z-10 bg-white border-t border-gray-200 py-4 text-center">
        <p className="text-gray-400 text-xs">
          &copy; {new Date().getFullYear()} IPO Labs. All rights reserved.
        </p>
      </div>

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
      `}</style>
    </div>
  );
};

export default LandingPage;
