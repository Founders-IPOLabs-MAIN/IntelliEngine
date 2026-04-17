import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import { Building2, Users, ArrowRight, Briefcase, Globe } from "lucide-react";

const MatchMakingLanding = ({ user, apiClient }) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-white" data-testid="matchmaking-landing">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64 flex flex-col">
        <header className="sticky top-0 z-10 bg-white border-b border-border px-8 py-4">
          <h1 className="text-2xl font-bold tracking-tight text-black">The Match-Making Platform</h1>
          <p className="text-sm text-muted-foreground mt-1">Connect IPO-bound companies with verified subject matter experts</p>
        </header>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="grid grid-cols-2 gap-8 max-w-4xl w-full">
            {/* IPO Bound Company */}
            <Card
              className="border-2 border-transparent hover:border-[#003366] cursor-pointer transition-all duration-300 hover:shadow-xl group"
              onClick={() => navigate("/matchmaker/issuer")}
              data-testid="btn-ipo-bound-company"
            >
              <CardContent className="p-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[#003366] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-black mb-2">IPO Bound Company</h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Register your company, discover verified experts, and get matched with the right professionals for your IPO journey.
                </p>
                <div className="flex items-center gap-2 text-[#003366] font-semibold text-sm group-hover:gap-3 transition-all">
                  Get Started <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            {/* Subject Matter Experts */}
            <Card
              className="border-2 border-transparent hover:border-orange-500 cursor-pointer transition-all duration-300 hover:shadow-xl group"
              onClick={() => navigate("/matchmaker/experts")}
              data-testid="btn-subject-matter-experts"
            >
              <CardContent className="p-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-black mb-2">Subject Matter Experts</h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Browse our network of CAs, CSs, CFOs, Legal Advisors, Merchant Bankers, and other IPO professionals.
                </p>
                <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm group-hover:gap-3 transition-all">
                  Explore Experts <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MatchMakingLanding;
