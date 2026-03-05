import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  TrendingUp,
  Building2,
  Users,
  HelpCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  Brain,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Landmark,
  Briefcase
} from "lucide-react";

const FUNDING_PILLARS = [
  {
    id: "pre_ipo",
    title: "Pre-IPO Funding",
    description: "Capital for growth and IPO readiness",
    icon: TrendingUp,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    path: "/funding/pre-ipo"
  },
  {
    id: "post_ipo",
    title: "Post-IPO Funding",
    description: "Capital for expansion and secondary market moves",
    icon: Building2,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    path: "/funding/post-ipo"
  },
  {
    id: "partners",
    title: "Our Funding Partners",
    description: "Directory of vetted institutional and private lenders",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    path: "/funding/partners"
  },
  {
    id: "quiz",
    title: "Funding Eligibility Quiz",
    description: "AI-powered assessment of your funding readiness",
    icon: HelpCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    path: "/funding/quiz"
  }
];

const Funding = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user has already accepted disclaimer in this session
    const accepted = sessionStorage.getItem("funding_disclaimer_accepted");
    if (accepted === "true") {
      setDisclaimerAccepted(true);
      setShowDisclaimer(false);
    }
  }, []);

  const handleDisclaimerResponse = async (agreed) => {
    if (agreed) {
      setLoading(true);
      try {
        await apiClient.post("/funding/disclaimer-consent", {
          agreed: true,
          timestamp: new Date().toISOString(),
          user_id: user.user_id
        });
        sessionStorage.setItem("funding_disclaimer_accepted", "true");
        setDisclaimerAccepted(true);
        setShowDisclaimer(false);
        toast.success("Thank you for accepting. Welcome to IPO Funding!");
      } catch (error) {
        console.error("Failed to record consent:", error);
        toast.error("Failed to record consent. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      navigate("/dashboard");
      toast.info("You need to accept the disclaimer to access IPO Funding module.");
    }
  };

  const handlePillarClick = (pillar) => {
    if (!disclaimerAccepted) {
      setShowDisclaimer(true);
      return;
    }
    navigate(pillar.path);
  };

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="funding-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Hero Section - Compact */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <div className="max-w-6xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs">
                    <Brain className="w-3 h-3 text-yellow-300" />
                    <span className="font-medium">Human + AI Powered</span>
                  </div>
                </div>
                <h1 className="text-xl font-bold tracking-tight">
                  IPO Funding Engine
                </h1>
                <p className="text-sm text-emerald-100 mt-1">
                  Explore capital-raising options with AI guidance and expert consultation
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-center">
                  <p className="text-lg font-bold">50+</p>
                  <p className="text-emerald-200">Partners</p>
                </div>
                <div className="w-px h-8 bg-white/30" />
                <div className="text-center">
                  <p className="text-lg font-bold">11</p>
                  <p className="text-emerald-200">Options</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Features Bar */}
        <div className="bg-white border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-muted-foreground">AI Eligibility Analysis</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-muted-foreground">Expert Consultations</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-muted-foreground">Vetted Partners</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-muted-foreground">SEBI Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="grid grid-cols-3 gap-5">
            {/* Left - Funding Pillars */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-black">Choose Your Funding Path</h2>
                  <p className="text-xs text-muted-foreground">Select a module based on your IPO stage</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {FUNDING_PILLARS.map((pillar) => (
                  <div
                    key={pillar.id}
                    className={`p-4 rounded-lg border-2 ${pillar.borderColor} bg-white cursor-pointer group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${!disclaimerAccepted ? 'opacity-70' : ''}`}
                    onClick={() => handlePillarClick(pillar)}
                    data-testid={`funding-pillar-${pillar.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${pillar.bgColor} rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                        <pillar.icon className={`w-5 h-5 ${pillar.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-black text-sm mb-0.5 group-hover:text-emerald-600 transition-colors">
                          {pillar.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {pillar.description}
                        </p>
                        <div className="flex items-center mt-2 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                          <span className="font-medium">Explore</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - How It Works */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold text-black mb-3">How It Works</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-emerald-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-black text-xs">Choose Module</h4>
                      <p className="text-[10px] text-muted-foreground">Pre-IPO or Post-IPO based on your stage</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-emerald-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-black text-xs">AI Assessment</h4>
                      <p className="text-[10px] text-muted-foreground">Quick eligibility quiz for instant score</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-emerald-600">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-black text-xs">Expert Review</h4>
                      <p className="text-[10px] text-muted-foreground">Consultation with funding experts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-emerald-600">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-black text-xs">Get Funded</h4>
                      <p className="text-[10px] text-muted-foreground">Connect with vetted partners</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span className="text-xs font-medium">Quick Start</span>
                </div>
                <h3 className="font-semibold text-sm mb-2">Not sure where to start?</h3>
                <p className="text-[10px] text-emerald-100 mb-3">
                  Take our AI-powered eligibility quiz to find the best funding options for you.
                </p>
                <Button
                  size="sm"
                  onClick={() => handlePillarClick(FUNDING_PILLARS[3])}
                  className="w-full bg-white text-emerald-700 hover:bg-emerald-50 gap-1.5 h-8 text-xs"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Take Eligibility Quiz
                </Button>
              </div>

              {/* Disclaimer Note */}
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <div className="flex items-start gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800">
                    We connect you with vetted partners. IPO Labs is not a SEBI registered funding agency.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Disclaimer Modal */}
      <Dialog open={showDisclaimer} onOpenChange={() => {}}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 text-base">
              <AlertTriangle className="w-4 h-4" />
              Important Disclaimer
            </DialogTitle>
            <DialogDescription className="text-left text-xs">
              Please read and acknowledge before proceeding
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-amber-900 leading-relaxed">
                <strong>IPO Labs</strong> uses <strong>AI + Human Power</strong> to analyse, record and connect you with the right partners.
              </p>
              <p className="text-xs text-amber-900 leading-relaxed mt-2">
                We are <strong>NOT</strong> a SEBI Registered funding partner, bank, NBFC, or any similar funding agency.
              </p>
              <p className="text-xs text-amber-900 leading-relaxed mt-2">
                By clicking <strong>"I Agree"</strong>, you allow us to share your data with relevant partners.
              </p>
            </div>
            
            <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
              <Shield className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>Your data is protected under our Privacy Policy and DPDP Act 2023 compliance.</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDisclaimerResponse(false)}
              disabled={loading}
              data-testid="disclaimer-disagree-btn"
            >
              I Disagree
            </Button>
            <Button
              size="sm"
              onClick={() => handleDisclaimerResponse(true)}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="disclaimer-agree-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1.5" />
                  I Agree
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Funding;
