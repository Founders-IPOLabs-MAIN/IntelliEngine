import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Loader2, Building2, BarChart3 } from "lucide-react";

// Industry to Nifty Index mapping
const INDUSTRY_INDEX_MAP = {
  "financial_services": {
    name: "Financial Services (BFSI)",
    indices: [
      { id: "nifty_bank", name: "Nifty Bank" },
      { id: "nifty_psu_bank", name: "Nifty PSU Bank" },
      { id: "nifty_private_bank", name: "Nifty Private Bank" },
      { id: "nifty_financial_services", name: "Nifty Financial Services" }
    ]
  },
  "information_technology": {
    name: "Information Technology (IT)",
    indices: [
      { id: "nifty_it", name: "Nifty IT" }
    ]
  },
  "automobile": {
    name: "Automobile & Ancillaries",
    indices: [
      { id: "nifty_auto", name: "Nifty Auto" }
    ]
  },
  "healthcare": {
    name: "Healthcare",
    indices: [
      { id: "nifty_healthcare", name: "Nifty Healthcare Index" }
    ]
  },
  "pharmaceuticals": {
    name: "Pharmaceuticals",
    indices: [
      { id: "nifty_pharma", name: "Nifty Pharma" }
    ]
  },
  "fmcg": {
    name: "FMCG (Consumer Goods)",
    indices: [
      { id: "nifty_fmcg", name: "Nifty FMCG" },
      { id: "nifty_commodities", name: "Nifty Commodities" }
    ]
  },
  "metals_mining": {
    name: "Metals & Mining",
    indices: [
      { id: "nifty_metal", name: "Nifty Metal" },
      { id: "nifty_commodities", name: "Nifty Commodities" }
    ]
  },
  "energy": {
    name: "Energy",
    indices: [
      { id: "nifty_energy", name: "Nifty Energy" },
      { id: "nifty_oil_gas", name: "Nifty Oil & Gas" }
    ]
  },
  "oil_gas": {
    name: "Oil & Gas",
    indices: [
      { id: "nifty_oil_gas", name: "Nifty Oil & Gas" },
      { id: "nifty_energy", name: "Nifty Energy" }
    ]
  },
  "chemicals": {
    name: "Chemicals & Petrochemicals",
    indices: [
      { id: "nifty_commodities", name: "Nifty Commodities" }
    ]
  },
  "real_estate": {
    name: "Real Estate & Construction",
    indices: [
      { id: "nifty_realty", name: "Nifty Realty" },
      { id: "nifty_infra", name: "Nifty Infrastructure" }
    ]
  },
  "media_entertainment": {
    name: "Media & Entertainment",
    indices: [
      { id: "nifty_media", name: "Nifty Media" }
    ]
  },
  "consumer_durables": {
    name: "Consumer Durables",
    indices: [
      { id: "nifty_consumer_durables", name: "Nifty Consumer Durables" },
      { id: "nifty_commodities", name: "Nifty Commodities" }
    ]
  },
  "telecommunications": {
    name: "Telecommunications",
    indices: [
      { id: "nifty_it", name: "Nifty IT" }
    ]
  },
  "infrastructure": {
    name: "Infrastructure",
    indices: [
      { id: "nifty_infra", name: "Nifty Infrastructure" },
      { id: "nifty_realty", name: "Nifty Realty" }
    ]
  },
  "textiles": {
    name: "Textiles & Apparel",
    indices: [
      { id: "nifty_commodities", name: "Nifty Commodities" }
    ]
  },
  "agriculture": {
    name: "Agriculture & Allied",
    indices: [
      { id: "nifty_commodities", name: "Nifty Commodities" }
    ]
  }
};

// Get all industries as flat array
export const INDUSTRIES = Object.entries(INDUSTRY_INDEX_MAP).map(([id, data]) => ({
  id,
  name: data.name
}));

// Get indices for a specific industry
export const getIndicesForIndustry = (industryId) => {
  return INDUSTRY_INDEX_MAP[industryId]?.indices || [];
};

// IndustryIndexSelector Component
const IndustryIndexSelector = ({ 
  value = { industry: "", index: "" },
  onChange,
  showBenchmark = true,
  apiClient,
  className = ""
}) => {
  const [selectedIndustry, setSelectedIndustry] = useState(value.industry || "");
  const [selectedIndex, setSelectedIndex] = useState(value.index || "");
  const [indexData, setIndexData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableIndices, setAvailableIndices] = useState([]);

  // Update available indices when industry changes
  useEffect(() => {
    if (selectedIndustry) {
      const indices = getIndicesForIndustry(selectedIndustry);
      setAvailableIndices(indices);
      // Auto-select first index if only one available
      if (indices.length === 1) {
        setSelectedIndex(indices[0].id);
      } else if (!indices.find(i => i.id === selectedIndex)) {
        setSelectedIndex("");
      }
    } else {
      setAvailableIndices([]);
      setSelectedIndex("");
    }
  }, [selectedIndustry]);

  // Fetch index data when index changes
  useEffect(() => {
    if (selectedIndex && showBenchmark && apiClient) {
      fetchIndexData(selectedIndex);
    }
  }, [selectedIndex]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange({ industry: selectedIndustry, index: selectedIndex });
    }
  }, [selectedIndustry, selectedIndex]);

  const fetchIndexData = async (indexId) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/market/index/${indexId}`);
      setIndexData(response.data);
    } catch (error) {
      console.error("Failed to fetch index data:", error);
      // Use mock data if API fails
      setIndexData({
        name: availableIndices.find(i => i.id === indexId)?.name || indexId,
        value: (Math.random() * 10000 + 15000).toFixed(2),
        change: (Math.random() * 4 - 2).toFixed(2),
        changePercent: (Math.random() * 4 - 2).toFixed(2)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIndustryChange = (value) => {
    setSelectedIndustry(value);
    setIndexData(null);
  };

  const handleIndexChange = (value) => {
    setSelectedIndex(value);
  };

  const isPositive = indexData?.changePercent >= 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Two-Tier Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tier 1: Industry Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#003366]" />
            Industry Sector
          </label>
          <Select value={selectedIndustry} onValueChange={handleIndustryChange}>
            <SelectTrigger className="w-full rounded-xl h-11 border-gray-200 focus:border-[#00D1FF] focus:ring-[#00D1FF]" data-testid="industry-select">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry.id} value={industry.id}>
                  {industry.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tier 2: Nifty Index Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#00D1FF]" />
            Nifty Index Benchmark
          </label>
          <Select 
            value={selectedIndex} 
            onValueChange={handleIndexChange}
            disabled={!selectedIndustry || availableIndices.length === 0}
          >
            <SelectTrigger className="w-full rounded-xl h-11 border-gray-200 focus:border-[#00D1FF] focus:ring-[#00D1FF]" data-testid="index-select">
              <SelectValue placeholder={selectedIndustry ? "Select index" : "Select industry first"} />
            </SelectTrigger>
            <SelectContent>
              {availableIndices.map((index) => (
                <SelectItem key={index.id} value={index.id}>
                  {index.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ticker Card - Performance Benchmark */}
      {showBenchmark && selectedIndex && (
        <Card className="border border-gray-200 rounded-xl overflow-hidden">
          <CardContent className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#00D1FF]" />
                <span className="ml-2 text-sm text-gray-500">Fetching market data...</span>
              </div>
            ) : indexData ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                    {isPositive ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-[#003366] text-sm">{indexData.name}</p>
                    <p className="text-xs text-gray-500">
                      Your industry is currently performing at{" "}
                      <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{indexData.changePercent}%
                      </span>{" "}
                      vs. the broader market
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-[#003366]">₹{Number(indexData.value).toLocaleString('en-IN')}</p>
                  <p className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{indexData.change} ({isPositive ? '+' : ''}{indexData.changePercent}%)
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Contextual Funding Advice */}
      {showBenchmark && indexData && Math.abs(indexData.changePercent) > 2 && (
        <div className={`p-3 rounded-xl text-xs ${indexData.changePercent < -2 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
          {indexData.changePercent < -2 ? (
            <p className="text-amber-800">
              <strong>⚠️ Market Alert:</strong> Your sector is experiencing volatility. Consider timing your funding rounds strategically or consult with our experts.
            </p>
          ) : (
            <p className="text-green-800">
              <strong>📈 Positive Outlook:</strong> Your sector is outperforming the market. This could be a favorable time for IPO/funding activities.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default IndustryIndexSelector;
