import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import { Building2, ArrowRight, Briefcase } from "lucide-react";

const VIDEO_URL = "https://customer-assets.emergentagent.com/job_d2704038-7cb9-4ab6-9a1b-26c0d6c42d22/artifacts/l035ewvz_Men_and_women_202604232309.mp4";

const MatchMakingLanding = ({ user, apiClient }) => {
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

  return (
    <div className="flex min-h-screen bg-black" data-testid="matchmaking-landing">
      <Sidebar user={user} apiClient={apiClient} />

      <main className="flex-1 ml-64 relative overflow-hidden">
        {/* Full-page background video (loops, muted, autoplay) */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          data-testid="matchmaking-bg-video"
        />
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/70 pointer-events-none" />

        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Header (transparent, on top of video) */}
          <header className="sticky top-0 z-20 backdrop-blur-sm bg-black/20 border-b border-white/10 px-8 py-4">
            <h1 className="text-2xl font-bold tracking-tight text-white">The Match-Making Platform</h1>
            <p className="text-sm text-white/70 mt-1">
              Connect IPO-bound companies with verified subject matter experts
            </p>
          </header>

          {/* Superimposed action cards */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
              {/* IPO Bound Company */}
              <Card
                className="bg-white/12 backdrop-blur-xl border-2 border-white/25 hover:border-[#00D1FF] hover:bg-white/20 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-[#00D1FF]/20 hover:-translate-y-1 group shadow-2xl"
                onClick={() => navigate("/matchmaker/issuer")}
                data-testid="btn-ipo-bound-company"
              >
                <CardContent className="p-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#003366] to-[#0052A3] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-[#003366]/50">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">IPO Bound Company</h2>
                  <p className="text-sm text-white/85 mb-6 leading-relaxed drop-shadow">
                    Register your company, discover verified experts, and get matched with the right professionals for your IPO journey.
                  </p>
                  <div className="flex items-center gap-2 text-[#00D1FF] font-semibold text-sm group-hover:gap-3 transition-all">
                    Get Started <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>

              {/* Subject Matter Experts */}
              <Card
                className="bg-white/12 backdrop-blur-xl border-2 border-white/25 hover:border-orange-400 hover:bg-white/20 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-1 group shadow-2xl"
                onClick={() => navigate("/matchmaker/experts")}
                data-testid="btn-subject-matter-experts"
              >
                <CardContent className="p-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/50">
                    <Briefcase className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">Subject Matter Experts</h2>
                  <p className="text-sm text-white/85 mb-6 leading-relaxed drop-shadow">
                    Browse our network of CAs, CSs, CFOs, Legal Advisors, Merchant Bankers, and other IPO professionals.
                  </p>
                  <div className="flex items-center gap-2 text-orange-300 font-semibold text-sm group-hover:gap-3 transition-all">
                    Explore Experts <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MatchMakingLanding;
