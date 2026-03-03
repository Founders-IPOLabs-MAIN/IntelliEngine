import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  Briefcase,
  Building2,
  TrendingUp,
  Calculator,
  FileCheck,
  Scale,
  Search,
  Users,
  PieChart,
  FileSpreadsheet,
  Landmark,
  MapPin,
  Star,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Sparkles,
  Brain,
  Zap,
  Target,
  Clock,
  X
} from "lucide-react";

// Icon mapping for categories
const CATEGORY_ICONS = {
  "Briefcase": Briefcase,
  "Building2": Building2,
  "TrendingUp": TrendingUp,
  "Calculator": Calculator,
  "FileCheck": FileCheck,
  "Scale": Scale,
  "Search": Search,
  "Users": Users,
  "PieChart": PieChart,
  "FileSpreadsheet": FileSpreadsheet,
  "Landmark": Landmark
};

// Category colors
const CATEGORY_COLORS = [
  { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
  { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
  { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200" },
  { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200" },
  { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" }
];

const SECTORS = [
  "Technology", "Healthcare", "Financial Services", "Manufacturing",
  "Consumer Goods", "Energy", "Real Estate", "Telecommunications",
  "Pharmaceuticals", "Logistics", "Education", "Media & Entertainment"
];

const SPECIFIC_NEEDS = [
  "IPO Readiness Assessment", "DRHP Drafting", "Financial Audit",
  "Legal Due Diligence", "Valuation Services", "SEBI Compliance",
  "Investor Relations", "Book Building", "Regulatory Filings"
];

const MatchMaker = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // AI Recommendation states
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [aiForm, setAiForm] = useState({
    company_name: "",
    sector: "",
    current_stage: "Assessment",
    target_exchange: "SME",
    estimated_issue_size: "",
    specific_needs: [],
    preferred_cities: [],
    budget_range: "",
    timeline: "",
    additional_context: ""
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const [catRes, citiesRes] = await Promise.all([
        apiClient.get("/matchmaker/categories"),
        apiClient.get("/matchmaker/cities")
      ]);
      setCategories(catRes.data.categories);
      setCities(citiesRes.data.cities);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryClick = (categoryId) => {
    navigate(`/matchmaker/search?category=${categoryId}`);
  };

  const handleNeedToggle = (need) => {
    setAiForm(prev => ({
      ...prev,
      specific_needs: prev.specific_needs.includes(need)
        ? prev.specific_needs.filter(n => n !== need)
        : [...prev.specific_needs, need]
    }));
  };

  const handleCityToggle = (city) => {
    setAiForm(prev => ({
      ...prev,
      preferred_cities: prev.preferred_cities.includes(city)
        ? prev.preferred_cities.filter(c => c !== city)
        : [...prev.preferred_cities, city]
    }));
  };

  const handleAIRecommend = async () => {
    if (!aiForm.company_name || !aiForm.sector) {
      toast.error("Please fill company name and sector");
      return;
    }
    
    setAiLoading(true);
    try {
      const response = await apiClient.post("/matchmaker/ai-recommend", aiForm);
      setAiResults(response.data);
      toast.success("AI recommendations generated!");
    } catch (error) {
      console.error("AI recommendation failed:", error);
      toast.error("Failed to generate recommendations. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const renderStars = (rating) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="matchmaker-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#1DA1F2] to-[#0d8ecf] text-white relative overflow-hidden">
          {/* AI Pattern Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border border-white rounded-full" />
            <div className="absolute top-20 right-20 w-48 h-48 border border-white rounded-full" />
            <div className="absolute bottom-10 left-1/3 w-24 h-24 border border-white rounded-full" />
          </div>
          
          <div className="max-w-6xl mx-auto px-8 py-16 relative z-10">
            <div className="text-center">
              {/* AI Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="font-semibold">AI-Powered Match Making Engine</span>
                <Brain className="w-5 h-5 text-yellow-300" />
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight mb-4">
                IPO Match Maker
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Our intelligent AI analyzes your IPO requirements and recommends the most suitable experts from India's top IPO professionals.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <Button
                  onClick={() => setShowAIDialog(true)}
                  className="bg-white text-[#1DA1F2] hover:bg-gray-100 gap-2 px-8 py-6 text-lg rounded-xl shadow-lg"
                  data-testid="get-ai-recommendations-btn"
                >
                  <Sparkles className="w-5 h-5" />
                  Get AI Recommendations
                </Button>
                <Button
                  onClick={() => navigate("/matchmaker/search")}
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 gap-2 px-8 py-6 text-lg rounded-xl"
                >
                  <Search className="w-5 h-5" />
                  Browse All Experts
                </Button>
              </div>
              
              {/* Search Bar */}
              <div className="max-w-xl mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for IPO consultants, CAs, Legal advisors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg bg-white text-black border-0 shadow-lg rounded-xl"
                  data-testid="search-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Features Bar */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="max-w-6xl mx-auto px-8 py-4">
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span>Intelligent Matching</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Expertise Analysis</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Instant Recommendations</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Professionals</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-white border-b border-border">
          <div className="max-w-6xl mx-auto px-8 py-6">
            <div className="flex items-center justify-center gap-12">
              <div className="text-center">
                <p className="text-3xl font-bold text-black">500+</p>
                <p className="text-sm text-muted-foreground">Verified Experts</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-black">11</p>
                <p className="text-sm text-muted-foreground">Expert Categories</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-black">100+</p>
                <p className="text-sm text-muted-foreground">Cities Covered</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-black">200+</p>
                <p className="text-sm text-muted-foreground">IPOs Managed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Register as Professional - Compact Top Banner */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
          <div className="max-w-6xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#1DA1F2]" />
                <div>
                  <span className="text-white font-medium text-sm">Are You an IPO Expert?</span>
                  <span className="text-gray-400 text-sm ml-2">Join India's premier AI-powered IPO marketplace. Get discovered by companies planning their IPO and grow your practice.</span>
                </div>
              </div>
              <Button
                onClick={() => navigate("/matchmaker/register")}
                size="sm"
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white px-4 py-2 text-sm rounded-lg whitespace-nowrap"
                data-testid="register-professional-top-btn"
              >
                Register as a Professional
              </Button>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered Selection
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">
              Find the Right Expert for Your IPO
            </h2>
            <p className="text-muted-foreground">
              Our AI carefully analyzes each professional's expertise to match your specific IPO needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category, index) => {
              const IconComponent = CATEGORY_ICONS[category.icon] || Briefcase;
              const colors = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
              
              return (
                <Card
                  key={category.id}
                  className={`border ${colors.border} cursor-pointer group transition-all duration-200 hover:shadow-lg hover:-translate-y-1`}
                  onClick={() => handleCategoryClick(category.id)}
                  data-testid={`category-${category.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                        <IconComponent className={`w-7 h-7 ${colors.text}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-black text-lg mb-1 group-hover:text-[#1DA1F2] transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-4 text-[#1DA1F2] opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-medium">Find Experts</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* AI Recommendation CTA Section */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-y border-border">
          <div className="max-w-6xl mx-auto px-8 py-16">
            <div className="flex items-center gap-12">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                  <Brain className="w-4 h-4" />
                  AI-Powered
                </div>
                <h3 className="text-3xl font-bold text-black mb-4">
                  Let AI Find Your Perfect IPO Team
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Our intelligent matching engine analyzes your company profile, IPO requirements, and preferences to recommend the most suitable professionals with proven track records.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-muted-foreground">Analyzes 500+ professionals in seconds</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-muted-foreground">Matches based on sector expertise & IPO track record</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-muted-foreground">Provides personalized recommendations with reasoning</span>
                  </li>
                </ul>
                <Button
                  onClick={() => setShowAIDialog(true)}
                  className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-2 px-8 py-6 text-lg rounded-xl"
                >
                  <Sparkles className="w-5 h-5" />
                  Get AI Recommendations
                </Button>
              </div>
              <div className="hidden lg:block w-96">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Brain className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-black">AI Analysis</p>
                      <p className="text-xs text-muted-foreground">Matching in progress...</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">98</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">IPO Consultant Match</p>
                        <p className="text-xs text-muted-foreground">Perfect for Tech sector</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600">95</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">CA with IPO Expertise</p>
                        <p className="text-xs text-muted-foreground">12+ IPOs managed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600">92</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Legal Advisor</p>
                        <p className="text-xs text-muted-foreground">SEBI compliance expert</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* For Professionals CTA */}
        <div className="bg-white border-t border-border">
          <div className="max-w-6xl mx-auto px-8 py-16">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <CheckCircle2 className="w-6 h-6 text-[#1DA1F2]" />
                <span className="text-[#1DA1F2] font-medium">For Professionals</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Are You an IPO Expert?
              </h3>
              <p className="text-gray-300 mb-6 max-w-xl mx-auto">
                Join India's premier AI-powered IPO marketplace. Get discovered by companies planning their IPO and grow your practice.
              </p>
              <Button
                onClick={() => navigate("/matchmaker/register")}
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white px-8 py-6 text-lg rounded-xl"
                data-testid="register-professional-btn"
              >
                Register as a Professional
              </Button>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-50 border-t border-border">
          <div className="max-w-6xl mx-auto px-8 py-16">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Zap className="w-4 h-4" />
                Powered by AI
              </div>
              <h3 className="text-2xl font-bold text-black">
                How Our AI Match Maker Works
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1DA1F2]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-[#1DA1F2]" />
                </div>
                <h4 className="font-semibold text-black mb-2">1. Share Your Needs</h4>
                <p className="text-muted-foreground text-sm">
                  Tell us about your company, sector, IPO stage, and specific requirements.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1DA1F2]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-[#1DA1F2]" />
                </div>
                <h4 className="font-semibold text-black mb-2">2. AI Analysis</h4>
                <p className="text-muted-foreground text-sm">
                  Our AI analyzes 500+ professionals, matching expertise, track record, and fit.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1DA1F2]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-[#1DA1F2]" />
                </div>
                <h4 className="font-semibold text-black mb-2">3. Get Matched</h4>
                <p className="text-muted-foreground text-sm">
                  Receive personalized recommendations with match scores and detailed reasoning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* AI Recommendation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#1DA1F2]" />
              AI-Powered Match Making
            </DialogTitle>
            <DialogDescription>
              Tell us about your IPO requirements and our AI will recommend the best professionals for you
            </DialogDescription>
          </DialogHeader>
          
          {!aiResults ? (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input
                    value={aiForm.company_name}
                    onChange={(e) => setAiForm({ ...aiForm, company_name: e.target.value })}
                    placeholder="Your company name"
                    data-testid="ai-company-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sector *</Label>
                  <Select value={aiForm.sector} onValueChange={(v) => setAiForm({ ...aiForm, sector: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((sector) => (
                        <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Stage</Label>
                  <Select value={aiForm.current_stage} onValueChange={(v) => setAiForm({ ...aiForm, current_stage: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pre-IPO">Pre-IPO Planning</SelectItem>
                      <SelectItem value="Assessment">IPO Assessment</SelectItem>
                      <SelectItem value="Drafting">DRHP Drafting</SelectItem>
                      <SelectItem value="Filing">Ready for Filing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Exchange</Label>
                  <Select value={aiForm.target_exchange} onValueChange={(v) => setAiForm({ ...aiForm, target_exchange: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SME">SME Exchange</SelectItem>
                      <SelectItem value="Mainboard">Mainboard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estimated Issue Size</Label>
                  <Input
                    value={aiForm.estimated_issue_size}
                    onChange={(e) => setAiForm({ ...aiForm, estimated_issue_size: e.target.value })}
                    placeholder="e.g., ₹100-200 Crores"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timeline</Label>
                  <Input
                    value={aiForm.timeline}
                    onChange={(e) => setAiForm({ ...aiForm, timeline: e.target.value })}
                    placeholder="e.g., 6-12 months"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Specific Services Needed</Label>
                <div className="flex flex-wrap gap-2">
                  {SPECIFIC_NEEDS.map((need) => (
                    <Badge
                      key={need}
                      variant={aiForm.specific_needs.includes(need) ? "default" : "outline"}
                      className={`cursor-pointer ${aiForm.specific_needs.includes(need) ? "bg-[#1DA1F2]" : ""}`}
                      onClick={() => handleNeedToggle(need)}
                    >
                      {need}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preferred Cities (Optional)</Label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {cities.slice(0, 12).map((city) => (
                    <Badge
                      key={city}
                      variant={aiForm.preferred_cities.includes(city) ? "default" : "outline"}
                      className={`cursor-pointer ${aiForm.preferred_cities.includes(city) ? "bg-[#1DA1F2]" : ""}`}
                      onClick={() => handleCityToggle(city)}
                    >
                      {city}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Additional Context (Optional)</Label>
                <Textarea
                  value={aiForm.additional_context}
                  onChange={(e) => setAiForm({ ...aiForm, additional_context: e.target.value })}
                  placeholder="Any specific requirements, challenges, or preferences..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAIDialog(false)}>Cancel</Button>
                <Button
                  onClick={handleAIRecommend}
                  disabled={aiLoading || !aiForm.company_name || !aiForm.sector}
                  className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-2"
                  data-testid="submit-ai-recommend"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Get Recommendations
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* AI Results */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-black mb-1">AI Analysis Summary</p>
                    <p className="text-sm text-muted-foreground">{aiResults.match_summary}</p>
                  </div>
                </div>
              </div>

              {aiResults.recommendations?.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-semibold text-black flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#1DA1F2]" />
                    Top Recommended Professionals
                  </h4>
                  {aiResults.recommendations.map((rec, index) => (
                    <Card key={rec.professional_id} className="border border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <Avatar className="w-14 h-14 rounded-xl">
                              <AvatarImage src={rec.professional?.profile_picture} />
                              <AvatarFallback className="bg-[#1DA1F2] text-white rounded-xl">
                                {rec.professional?.name?.charAt(0) || "P"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                              {rec.match_score}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-semibold text-black">{rec.professional?.name}</h5>
                              {rec.professional?.is_verified && (
                                <Badge className="bg-blue-500 text-white text-xs">VERIFIED</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {rec.professional?.agency_name} • {rec.professional?.years_experience} years exp.
                            </p>
                            <p className="text-sm text-black mb-2">{rec.match_reason}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {rec.key_strengths?.map((strength, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{strength}</Badge>
                              ))}
                            </div>
                            <p className="text-xs text-[#1DA1F2] font-medium">
                              Recommended for: {rec.recommended_for}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowAIDialog(false);
                              navigate(`/matchmaker/profile/${rec.professional_id}`);
                            }}
                          >
                            View Profile
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No matching professionals found. Try adjusting your requirements.</p>
                </div>
              )}

              {aiResults.additional_advice && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>AI Advice:</strong> {aiResults.additional_advice}
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => { setAiResults(null); }}>
                  Try Again
                </Button>
                <Button onClick={() => setShowAIDialog(false)} className="bg-[#1DA1F2] hover:bg-[#1a8cd8]">
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MatchMaker;
