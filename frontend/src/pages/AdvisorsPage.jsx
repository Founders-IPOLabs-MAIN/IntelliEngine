import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";

const AdvisorsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col" data-testid="advisors-page">
      {/* Nav */}
      <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b px-8 lg:px-16 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8" data-testid="advisors-back-btn">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#003366] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">IP</span>
            </div>
            <span className="font-bold text-base text-[#003366]">IPO Labs</span>
          </div>
          <span className="text-muted-foreground mx-1 text-sm">/</span>
          <span className="font-semibold text-base text-black">Advisors</span>
        </div>
        <Button
          onClick={() => navigate("/login")}
          className="bg-[#003366] hover:bg-[#002244] text-white rounded-full px-5 text-sm h-9"
          data-testid="advisors-get-started-btn"
        >
          Get Started
        </Button>
      </nav>

      {/* Empty state placeholder */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-lg">
          <div className="w-16 h-16 rounded-2xl bg-[#003366]/10 flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-[#003366]" />
          </div>
          <p className="text-xs tracking-[0.22em] uppercase text-[#003366] font-semibold mb-3">Coming Soon</p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-black mb-3">Advisors</h1>
          <p className="text-gray-500 text-base leading-relaxed">
            A curated network of SEBI-registered experts &mdash; CA, CS, Merchant Bankers, Legal Counsel and Independent Directors &mdash; who advise ambitious companies through their IPO journey. Content for this page is being finalised.
          </p>
        </div>
      </main>

      <footer className="bg-gray-900 text-white/50 py-4 px-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} IPO Labs AI Private Limited. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AdvisorsPage;
