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
import IndustryIndexSelector from "@/components/IndustryIndexSelector";
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
  X,
  Eye,
  Shield
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
  "Landmark": Landmark,
  "Star": Star,
  "Eye": Eye,
  "Shield": Shield
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
  { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200" },
  { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
  { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200" },
  { bg: "bg-lime-50", text: "text-lime-600", border: "border-lime-200" }
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
    industry: "",
    nifty_index: "",
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
    if (!aiForm.company_name || !aiForm.industry) {
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
        {/* Hero Section - Compact */}
        <div className="bg-gradient-to-br from-[#1DA1F2] to-[#0d8ecf] text-white relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 py-6 relative z-10">
            <div className="flex items-center justify-between gap-8">
              {/* Left - Title & Description */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs">
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                    <span className="font-medium">AI-Powered</span>
                  </div>
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-1">
                  IPO Match Maker
                </h1>
                <p className="text-sm text-blue-100 max-w-md">
                  AI-powered recommendations from India's top IPO professionals
                </p>
              </div>
              
              {/* Right - Search & Buttons */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search experts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 w-48 text-sm bg-white text-black border-0 rounded-lg"
                    data-testid="search-input"
                  />
                </div>
                <Button
                  onClick={() => setShowAIDialog(true)}
                  size="sm"
                  className="bg-white text-[#1DA1F2] hover:bg-gray-100 gap-1.5 px-4 h-9 text-sm rounded-lg"
                  data-testid="get-ai-recommendations-btn"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Match
                </Button>
                <Button
                  onClick={() => navigate("/matchmaker/search")}
                  size="sm"
                  variant="outline"
                  className="border-white/50 text-white hover:bg-white/10 gap-1.5 px-4 h-9 text-sm rounded-lg"
                >
                  <Search className="w-3.5 h-3.5" />
                  Browse All
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Stats & Features Bar */}
        <div className="bg-white border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-muted-foreground">Intelligent Matching</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-muted-foreground">500+ Verified Experts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-muted-foreground">15 Categories</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-muted-foreground">100+ Cities</span>
                </div>
              </div>
              {/* Register Professional - Inline */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Are you an IPO Expert?</span>
                <Button
                  onClick={() => navigate("/matchmaker/register")}
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs rounded-md"
                  data-testid="register-professional-top-btn"
                >
                  Register as Professional
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section - Compact Grid */}
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-black">
                Find the Right Expert for Your IPO
              </h2>
              <p className="text-xs text-muted-foreground">
                Select a category to browse verified professionals or register/edit your profile
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredCategories.map((category, index) => {
              const IconComponent = CATEGORY_ICONS[category.icon] || Briefcase;
              const colors = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
              
              return (
                <div
                  key={category.id}
                  className={`group p-3 rounded-lg border ${colors.border} bg-white hover:shadow-md hover:border-[#1DA1F2] transition-all duration-200`}
                  data-testid={`category-${category.id}`}
                >
                  {/* Category Header - Clickable */}
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-7 h-7 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`w-3.5 h-3.5 ${colors.text}`} />
                      </div>
                      <h3 className="font-medium text-black text-xs leading-tight group-hover:text-[#1DA1F2] transition-colors line-clamp-2">
                        {category.name}
                      </h3>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-200 line-clamp-2 mt-1">
                      {category.description}
                    </p>
                  </div>
                  
                  {/* Register/Edit Profile Buttons */}
                  <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-6 text-[10px] px-2 rounded hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/matchmaker/register?category=${category.id}`);
                      }}
                      data-testid={`register-profile-${category.id}`}
                    >
                      Register Profile
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-6 text-[10px] px-2 rounded hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/matchmaker/edit-profile?category=${category.id}`);
                      }}
                      data-testid={`edit-profile-${category.id}`}
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Recommendation CTA - Compact */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-y border-border">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-black">
                    Let AI Find Your Perfect IPO Team
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Our AI analyzes your requirements to recommend the most suitable professionals.
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 500+ professionals</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Sector expertise matching</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Personalized reasoning</span>
                </div>
                <Button
                  onClick={() => setShowAIDialog(true)}
                  size="sm"
                  className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-1.5 px-4 h-9 text-sm rounded-lg"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Get AI Recommendations
                </Button>
              </div>
              <div className="hidden lg:block w-64">
                <div className="bg-white rounded-xl shadow-sm p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Brain className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-black text-sm">AI Analysis</p>
                      <p className="text-[10px] text-muted-foreground">Matching...</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-blue-600">98</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">IPO Consultant</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-green-600">95</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">CA Expert</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* For Professionals CTA - Compact */}
        <div className="bg-gray-900">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-5 h-5 text-[#1DA1F2]" />
                <div>
                  <h3 className="text-white font-medium text-sm">
                    Are You an IPO Expert?
                  </h3>
                  <p className="text-gray-400 text-xs">
                    Join India's premier AI-powered IPO marketplace. Get discovered by companies planning their IPO.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/matchmaker/register")}
                size="sm"
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white px-4 h-9 text-sm rounded-lg"
                data-testid="register-professional-btn"
              >
                Register as a Professional
              </Button>
            </div>
          </div>
        </div>

        {/* How It Works - Compact */}
        <div className="bg-gray-50 border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <h3 className="text-sm font-semibold text-black mb-4 text-center">
              How Our AI Match Maker Works
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-10 h-10 bg-[#1DA1F2]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Target className="w-5 h-5 text-[#1DA1F2]" />
                </div>
                <h4 className="font-medium text-black text-xs mb-1">1. Share Your Needs</h4>
                <p className="text-muted-foreground text-[10px]">
                  Tell us about your company and IPO requirements
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-[#1DA1F2]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Brain className="w-5 h-5 text-[#1DA1F2]" />
                </div>
                <h4 className="font-medium text-black text-xs mb-1">2. AI Analysis</h4>
                <p className="text-muted-foreground text-[10px]">
                  Our AI analyzes 500+ professionals for best fit
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-[#1DA1F2]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-5 h-5 text-[#1DA1F2]" />
                </div>
                <h4 className="font-medium text-black text-xs mb-1">3. Get Matched</h4>
                <p className="text-muted-foreground text-[10px]">
                  Receive personalized recommendations with scores
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
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  value={aiForm.company_name}
                  onChange={(e) => setAiForm({ ...aiForm, company_name: e.target.value })}
                  placeholder="Your company name"
                  data-testid="ai-company-name"
                />
              </div>

              {/* Industry & Nifty Index Selector */}
              <div className="space-y-2">
                <Label>Industry & Market Benchmark *</Label>
                <IndustryIndexSelector
                  value={{ industry: aiForm.industry, index: aiForm.nifty_index }}
                  onChange={({ industry, index }) => {
                    setAiForm({ ...aiForm, industry, nifty_index: index });
                  }}
                  showBenchmark={true}
                  apiClient={apiClient}
                />
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
