import { useNavigate } from "react-router-dom";
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
    <div className="min-h-screen bg-[#1DA1F2] flex flex-col">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-12 py-6">
        <span className="text-3xl font-bold text-white tracking-tight">IPOLabs</span>
        <Button 
          onClick={() => navigate("/login")}
          className="bg-black hover:bg-gray-900 text-white px-8 py-2.5 rounded-lg font-medium text-base"
        >
          Sign In
        </Button>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center px-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between w-full gap-16">
          {/* Left Side - Text Content */}
          <div className="flex-1">
            <h1 className="text-6xl font-bold text-white leading-tight mb-6">
              IPOLabs - Your End-to-End IPO Platform
            </h1>
            <p className="text-3xl text-white/90 mb-4">
              (DRHP to Funding)
            </p>
            <p className="text-xl text-black mt-8">
              Choose the module that fits your current IPO stage.
            </p>
          </div>

          {/* Right Side - Module Cards */}
          <div className="grid grid-cols-2 gap-4 w-[520px] flex-shrink-0">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => navigate(card.path)}
                className="p-6 rounded-xl bg-white/10 border border-white/20 
                         hover:bg-white/20 hover:border-white/40 hover:scale-[1.02]
                         transition-all duration-200 text-left"
                data-testid={`landing-card-${card.id}`}
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {card.headline}
                </h3>
                <p className="text-sm text-black">
                  {card.subtext}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center">
        <p className="text-white/60 text-sm">
          &copy; {new Date().getFullYear()} IPO Labs. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
