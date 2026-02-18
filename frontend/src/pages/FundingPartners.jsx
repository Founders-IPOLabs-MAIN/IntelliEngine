import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  Loader2,
  Users,
  Building2,
  Landmark,
  Globe,
  ExternalLink,
  Briefcase,
  Crown,
  Building
} from "lucide-react";

const CATEGORY_INFO = {
  investment_banks: {
    title: "Investment Banks",
    description: "Leading investment banks for IPO underwriting, M&A advisory, and capital markets services",
    icon: Building2,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  hni_networks: {
    title: "HNI & Angel Networks",
    description: "High Net Worth Individual networks and angel investor groups for early-stage funding",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  sovereign_wealth_funds: {
    title: "Sovereign Wealth Funds",
    description: "State-owned investment funds from around the world investing in Indian companies",
    icon: Crown,
    color: "text-amber-600",
    bgColor: "bg-amber-50"
  },
  banks: {
    title: "Banks",
    description: "Public and private sector banks providing MSME financing and corporate banking services",
    icon: Landmark,
    color: "text-green-600",
    bgColor: "bg-green-50"
  }
};

const FundingPartners = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("investment_banks");

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await apiClient.get("/funding/partners");
      setPartners(response.data.partners);
    } catch (error) {
      console.error("Failed to fetch partners:", error);
      toast.error("Failed to load funding partners");
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case "Global": return "bg-blue-100 text-blue-700";
      case "Domestic": return "bg-green-100 text-green-700";
      case "Public Sector": return "bg-orange-100 text-orange-700";
      case "Private Sector": return "bg-purple-100 text-purple-700";
      case "Angel Network": return "bg-pink-100 text-pink-700";
      case "Platform": return "bg-cyan-100 text-cyan-700";
      case "Sovereign Fund": return "bg-amber-100 text-amber-700";
      case "Indian Sovereign": return "bg-emerald-100 text-emerald-700";
      case "Incubator": return "bg-indigo-100 text-indigo-700";
      case "Angel Fund": return "bg-rose-100 text-rose-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="funding-partners-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-border px-8 py-4">
          <button
            onClick={() => navigate("/funding")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-black mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Funding Engine
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">Our Funding Partners</h1>
              <p className="text-muted-foreground">Directory of vetted institutional and private lenders</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full mb-8">
              {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="flex items-center gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  <info.icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{info.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(CATEGORY_INFO).map(([categoryKey, categoryInfo]) => (
              <TabsContent key={categoryKey} value={categoryKey}>
                {/* Category Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 ${categoryInfo.bgColor} rounded-lg flex items-center justify-center`}>
                      <categoryInfo.icon className={`w-5 h-5 ${categoryInfo.color}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-black">{categoryInfo.title}</h2>
                      <p className="text-sm text-muted-foreground">{categoryInfo.description}</p>
                    </div>
                  </div>
                </div>

                {/* Partners Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {partners[categoryKey]?.map((partner, index) => (
                    <Card 
                      key={index}
                      className="border border-border hover:border-emerald-300 hover:shadow-md transition-all duration-200 group"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${categoryInfo.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <Building className={`w-5 h-5 ${categoryInfo.color}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-black text-sm group-hover:text-emerald-600 transition-colors">
                                {partner.name}
                              </h3>
                              <Badge className={`mt-1 text-xs ${getTypeBadgeColor(partner.type)}`}>
                                {partner.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {partner.description}
                        </p>
                        
                        <a 
                          href={`https://${partner.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          <Globe className="w-3 h-3" />
                          {partner.website}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Empty State */}
                {(!partners[categoryKey] || partners[categoryKey].length === 0) && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No partners found in this category.</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Disclaimer */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Disclaimer:</strong> The listing of funding partners is for informational purposes only. IPO Labs does not endorse or guarantee any services provided by these partners. Please conduct your own due diligence before engaging with any funding partner.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FundingPartners;
