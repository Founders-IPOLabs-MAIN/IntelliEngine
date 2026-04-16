import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft, Construction, FileText, TrendingUp, Sparkles } from "lucide-react";

const MODULE_CONFIG = {
  "/drhp1": {
    title: "DRHP Builder",
    subtitle: "SEBI-Compliant Draft Red Herring Prospectus",
    description: "Our AI-powered DRHP Builder with full Word import/export, chapter-based editing, and SEBI compliance checks is currently in development.",
    icon: FileText,
    color: "#003366",
    features: [
      "Import massive SEBI Word documents with 100% formatting retention",
      "9-chapter structured editor mimicking Microsoft Word",
      "Auto-sync from Corporate Repository to DRHP chapters",
      "Export to Word & PDF with legal-grade formatting"
    ]
  },
  "/funding1": {
    title: "IPO Funding",
    subtitle: "Pre-IPO, Post-IPO & Bridge Funding Rounds",
    description: "Our funding platform connecting companies with institutional investors, angel networks, and venture funds is being built.",
    icon: TrendingUp,
    color: "#16a34a",
    features: [
      "Pre-IPO funding round management",
      "Post-IPO secondary market access",
      "Bridge funding facilitation",
      "Curated investor-company matching"
    ]
  },
  "/valuation1": {
    title: "Business Valuation",
    subtitle: "AI-Powered DCF, NAV & Comparable Analysis",
    description: "Our automated valuation module with multi-method analysis, AI risk assessment, and regulatory compliance is being refined.",
    icon: Sparkles,
    color: "#d97706",
    features: [
      "DCF, NAV, Comparable & DDM methods",
      "GPT-5.2 powered regulatory & risk analysis",
      "Sensitivity analysis & confidence scoring",
      "Document upload with AI data extraction"
    ]
  }
};

const ComingSoon = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const config = MODULE_CONFIG[location.pathname] || MODULE_CONFIG["/drhp1"];
  const Icon = config.icon;

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="coming-soon-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64 flex items-center justify-center p-8">
        <div className="max-w-xl w-full">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-black mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <Card className="border border-border overflow-hidden">
            {/* Header Banner */}
            <div
              className="px-8 py-10 text-white relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)` }}
            >
              <div className="absolute top-4 right-4 opacity-10">
                <Icon className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Construction className="w-5 h-5 text-white/80" />
                  <span className="text-xs font-medium uppercase tracking-widest text-white/70">Under Development</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">{config.title}</h1>
                <p className="text-sm text-white/70">{config.subtitle}</p>
              </div>
            </div>

            <CardContent className="p-8">
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {config.description}
              </p>

              <div className="space-y-3 mb-8">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">What's Coming</p>
                {config.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-[10px] font-bold"
                      style={{ backgroundColor: config.color }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="text-white"
                  style={{ backgroundColor: config.color }}
                  data-testid="coming-soon-back-btn"
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/assessment")}
                  data-testid="coming-soon-assessment-btn"
                >
                  Try IPO Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ComingSoon;
