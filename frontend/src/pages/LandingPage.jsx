import { useNavigate } from "react-router-dom";
import { Building2, FileText, CheckCircle2, TrendingUp, Users, ArrowRight } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  const cards = [
    {
      id: "drhp",
      icon: FileText,
      headline: "Ready to build your DRHP.",
      subtext: "Start your document draft with AI-assisted SEBI compliance.",
      path: "/login?type=founder&module=drhp_builder",
      gradient: "from-blue-500 to-cyan-400"
    },
    {
      id: "readiness",
      icon: CheckCircle2,
      headline: "Test your IPO Readiness.",
      subtext: "Get a comprehensive readiness score and gap analysis.",
      path: "/login?type=founder&module=ipo_readiness",
      gradient: "from-emerald-500 to-teal-400"
    },
    {
      id: "funding",
      icon: TrendingUp,
      headline: "Looking for Pre/Post-IPO Funding.",
      subtext: "Access our network of institutional and private investors.",
      path: "/login?type=founder&module=funding_network",
      gradient: "from-violet-500 to-purple-400"
    },
    {
      id: "expert",
      icon: Users,
      headline: "Register to our MatchMaking Community.",
      subtext: "Join our pool of verified experts to consult on live IPOs.",
      path: "/login?type=expert",
      gradient: "from-orange-500 to-amber-400"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231DA1F2' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#1DA1F2] rounded-full blur-[120px] opacity-20" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-[150px] opacity-15" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-14 h-14 bg-[#1DA1F2] rounded-2xl flex items-center justify-center shadow-lg shadow-[#1DA1F2]/30">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight block">IntelliEngine</span>
            <span className="text-sm text-slate-400">by IPO Labs</span>
          </div>
        </div>

        {/* Glassmorphism Container */}
        <div className="w-full max-w-4xl backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10 shadow-2xl">
          {/* Headlines */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Select your path to the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1DA1F2] to-cyan-400">
                Public Market
              </span>
            </h1>
            <p className="text-lg text-slate-400">
              Choose the module that fits your current IPO stage.
            </p>
          </div>

          {/* 2x2 Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => navigate(card.path)}
                className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 
                         hover:bg-white/10 hover:border-[#1DA1F2]/50 hover:shadow-xl hover:shadow-[#1DA1F2]/10
                         transition-all duration-300 ease-out text-left
                         hover:-translate-y-1"
                data-testid={`landing-card-${card.id}`}
              >
                {/* Gradient accent on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 
                                  group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Text */}
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#1DA1F2] transition-colors">
                    {card.headline}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">
                    {card.subtext}
                  </p>

                  {/* Arrow indicator */}
                  <div className="flex items-center text-[#1DA1F2] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Get Started <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Already have account link */}
          <div className="text-center mt-8">
            <p className="text-slate-500 text-sm">
              Already have an account?{" "}
              <button 
                onClick={() => navigate("/login")}
                className="text-[#1DA1F2] hover:text-[#1a8cd8] font-medium transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} IPO Labs. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
