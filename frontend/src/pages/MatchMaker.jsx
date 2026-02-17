import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle2
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

const MatchMaker = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get("/matchmaker/categories");
      setCategories(response.data.categories);
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
        <div className="bg-gradient-to-br from-[#1DA1F2] to-[#0d8ecf] text-white">
          <div className="max-w-6xl mx-auto px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight mb-4">
                IPO Match Maker
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Connect with India's top IPO experts. Find verified consultants, merchant bankers, CAs, and more for your IPO journey.
              </p>
              
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

        {/* Categories Section */}
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-black mb-2">
              Find the Right Expert for Your IPO
            </h2>
            <p className="text-muted-foreground">
              Browse through our 11 specialized categories of IPO professionals
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

        {/* CTA Section */}
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
                Join India's premier IPO marketplace. Get discovered by companies planning their IPO and grow your practice.
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
            <h3 className="text-2xl font-bold text-black text-center mb-12">
              How It Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1DA1F2]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-[#1DA1F2]" />
                </div>
                <h4 className="font-semibold text-black mb-2">1. Search & Discover</h4>
                <p className="text-muted-foreground text-sm">
                  Browse through verified professionals across 11 categories. Filter by location, experience, and expertise.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1DA1F2]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#1DA1F2]" />
                </div>
                <h4 className="font-semibold text-black mb-2">2. Compare & Connect</h4>
                <p className="text-muted-foreground text-sm">
                  View detailed profiles, check ratings & reviews, and directly connect with experts that match your needs.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1DA1F2]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-[#1DA1F2]" />
                </div>
                <h4 className="font-semibold text-black mb-2">3. Consult & Hire</h4>
                <p className="text-muted-foreground text-sm">
                  Book video consultations, send enquiries, and hire the right experts for your IPO journey.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MatchMaker;
