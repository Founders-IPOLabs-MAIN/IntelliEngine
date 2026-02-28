import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  const navigate = useNavigate();

  const cards = [
    {
      id: "drhp",
      headline: "Build your DRHP",
      subtext: "AI-assisted SEBI compliance",
      path: "/login?type=founder&module=drhp_builder"
    },
    {
      id: "readiness",
      headline: "IPO Readiness",
      subtext: "Readiness score & gap analysis",
      path: "/login?type=founder&module=ipo_readiness"
    },
    {
      id: "funding",
      headline: "Pre/Post-IPO Funding",
      subtext: "Institutional & private investors",
      path: "/login?type=founder&module=funding_network"
    },
    {
      id: "expert",
      headline: "Expert MatchMaking",
      subtext: "Consult on live IPOs",
      path: "/login?type=expert"
    }
  ];

  return (
    <div className="min-h-screen bg-[#1DA1F2]">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">IPOLabs</span>
        </div>
        <Button 
          onClick={() => navigate("/login")}
          className="bg-black hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium"
        >
          Sign In
        </Button>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-between px-16 py-12 max-w-7xl mx-auto">
        {/* Left Side - Text Content */}
        <div className="flex-1 pr-16">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            IPOLabs - Your End-to-End IPO Platform
          </h1>
          <p className="text-xl text-white/90 mb-2">
            (DRHP to Funding)
          </p>
          <p className="text-lg text-black mt-6">
            Choose the module that fits your current IPO stage.
          </p>
        </div>

        {/* Right Side - Module Cards */}
        <div className="grid grid-cols-2 gap-3 w-[420px]">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => navigate(card.path)}
              className="p-4 rounded-lg bg-white/10 border border-white/20 
                       hover:bg-white/20 hover:border-white/40
                       transition-all duration-200 text-left group"
              data-testid={`landing-card-${card.id}`}
            >
              <h3 className="text-sm font-semibold text-white mb-1 group-hover:translate-x-0.5 transition-transform">
                {card.headline}
              </h3>
              <p className="text-xs text-black">
                {card.subtext}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-white/60 text-sm">
          &copy; {new Date().getFullYear()} IPO Labs. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
