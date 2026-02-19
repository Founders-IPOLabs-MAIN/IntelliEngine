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
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border border-white rounded-full" />
            <div className="absolute top-20 right-20 w-48 h-48 border border-white rounded-full" />
            <div className="absolute bottom-10 left-1/3 w-24 h-24 border border-white rounded-full" />
          </div>
          
          <div className="max-w-6xl mx-auto px-8 py-16 relative z-10">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Brain className="w-5 h-5 text-yellow-300" />
                <span className="font-semibold">Human + AI Powered Funding Engine</span>
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight mb-4">
                IPO Funding Engine
              </h1>
              <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
                Explore diverse capital-raising options through our AI-guided interface with direct human expert consultation for your IPO journey.
              </p>
            </div>
          </div>
        </div>

        {/* Features Bar */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white">
          <div className="max-w-6xl mx-auto px-8 py-4">
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span>AI Eligibility Analysis</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Expert Consultations</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4" />
                <span>Vetted Partners</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>SEBI Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-white border-b border-border">
          <div className="max-w-6xl mx-auto px-8 py-6">
            <div className="flex items-center justify-center gap-12">
              <div className="text-center">
                <p className="text-3xl font-bold text-black">50+</p>
                <p className="text-sm text-muted-foreground">Funding Partners</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-black">11</p>
                <p className="text-sm text-muted-foreground">Funding Options</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - 4 Pillars */}
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Briefcase className="w-4 h-4" />
              Funding Modules
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">
              Choose Your Funding Path
            </h2>
            <p className="text-muted-foreground">
              Select a module to explore funding options tailored to your IPO stage
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FUNDING_PILLARS.map((pillar, index) => (
              <Card
                key={pillar.id}
                className={`border-2 ${pillar.borderColor} cursor-pointer group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${!disclaimerAccepted ? 'opacity-70' : ''}`}
                onClick={() => handlePillarClick(pillar)}
                data-testid={`funding-pillar-${pillar.id}`}
              >
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className={`w-16 h-16 ${pillar.bgColor} rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                      <pillar.icon className={`w-8 h-8 ${pillar.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-black text-xl mb-2 group-hover:text-emerald-600 transition-colors">
                        {pillar.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {pillar.description}
                      </p>
                      <div className="flex items-center mt-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-sm font-medium">Explore Options</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-r from-gray-50 to-emerald-50 border-y border-border">
          <div className="max-w-6xl mx-auto px-8 py-16">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-black">
                How Our Funding Engine Works
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600">1</span>
                </div>
                <h4 className="font-semibold text-black mb-2">Choose Module</h4>
                <p className="text-muted-foreground text-sm">
                  Select Pre-IPO or Post-IPO based on your current stage
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600">2</span>
                </div>
                <h4 className="font-semibold text-black mb-2">AI Assessment</h4>
                <p className="text-muted-foreground text-sm">
                  Take our quick eligibility quiz for instant probability score
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600">3</span>
                </div>
                <h4 className="font-semibold text-black mb-2">Expert Review</h4>
                <p className="text-muted-foreground text-sm">
                  Schedule a consultation with our funding experts
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600">4</span>
                </div>
                <h4 className="font-semibold text-black mb-2">Get Funded</h4>
                <p className="text-muted-foreground text-sm">
                  Connect with vetted partners and secure your funding
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Disclaimer Modal */}
      <Dialog open={showDisclaimer} onOpenChange={() => {}}>
        <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Important Disclaimer
            </DialogTitle>
            <DialogDescription className="text-left">
              Please read and acknowledge before proceeding
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-900 leading-relaxed">
                <strong>IPO Labs</strong> uses <strong>AI + Human Power</strong> to analyse, record and connect you with the right partners.
              </p>
              <p className="text-sm text-amber-900 leading-relaxed mt-3">
                We are <strong>NOT</strong> a SEBI Registered funding partner, bank, NBFC, or any similar funding agency.
              </p>
              <p className="text-sm text-amber-900 leading-relaxed mt-3">
                By clicking <strong>"I Agree"</strong>, you allow us to share your data with relevant partners, who will then reach out to you directly, or our team can help setup the call.
              </p>
            </div>
            
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Your data is protected under our Privacy Policy and DPDP Act 2023 compliance.</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleDisclaimerResponse(false)}
              disabled={loading}
              data-testid="disclaimer-disagree-btn"
            >
              I Disagree
            </Button>
            <Button
              onClick={() => handleDisclaimerResponse(true)}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="disclaimer-agree-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
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
