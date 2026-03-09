import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  Search,
  MapPin,
  Star,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Filter,
  X,
  Phone,
  Video,
  Mail,
  Building2,
  Clock,
  Users,
  Briefcase,
  ChevronRight,
  Sparkles,
  Brain,
  Globe,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// Indian states/cities mapping for grouping
const CITY_TO_STATE = {
  "Mumbai": "Maharashtra",
  "Pune": "Maharashtra",
  "Nagpur": "Maharashtra",
  "Thane": "Maharashtra",
  "Navi Mumbai": "Maharashtra",
  "Delhi": "Delhi",
  "Gurgaon": "Haryana",
  "Noida": "Uttar Pradesh",
  "Lucknow": "Uttar Pradesh",
  "Bangalore": "Karnataka",
  "Hyderabad": "Telangana",
  "Chennai": "Tamil Nadu",
  "Coimbatore": "Tamil Nadu",
  "Kolkata": "West Bengal",
  "Ahmedabad": "Gujarat",
  "Surat": "Gujarat",
  "Vadodara": "Gujarat",
  "Jaipur": "Rajasthan",
  "Chandigarh": "Chandigarh",
  "Indore": "Madhya Pradesh",
  "Bhopal": "Madhya Pradesh",
  "Kochi": "Kerala",
  "Visakhapatnam": "Andhra Pradesh",
  "Patna": "Bihar"
};

const MatchMakerSearch = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedCity, setSelectedCity] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState([]);
  const [ipoExperience, setIpoExperience] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  
  // City selection dialog
  const [showCityDialog, setShowCityDialog] = useState(true);
  
  // View mode: "city" (single city) or "all" (all states grouped)
  const [viewMode, setViewMode] = useState("city");
  
  // Expanded states for collapsible state sections
  const [expandedStates, setExpandedStates] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCity || viewMode === "all") {
      fetchProfessionals();
    }
  }, [selectedCategory, selectedCity, minExperience, selectedExpertise, ipoExperience, verifiedOnly, sortBy, currentPage, viewMode]);

  const fetchInitialData = async () => {
    try {
      const [categoriesRes, citiesRes, tagsRes] = await Promise.all([
        apiClient.get("/matchmaker/categories"),
        apiClient.get("/matchmaker/cities"),
        apiClient.get("/matchmaker/expertise-tags")
      ]);
      setCategories(categoriesRes.data.categories);
      setCities(citiesRes.data.cities);
      setExpertiseTags(tagsRes.data.tags);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    }
  };

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category_id", selectedCategory);
      if (selectedCity && viewMode === "city") params.append("city", selectedCity);
      if (minExperience) params.append("min_experience", minExperience);
      if (selectedExpertise.length > 0) params.append("expertise", selectedExpertise.join(","));
      if (ipoExperience) params.append("ipo_experience", ipoExperience);
      if (verifiedOnly) params.append("verified_only", "true");
      params.append("sort_by", sortBy);
      params.append("page", currentPage.toString());
      params.append("limit", viewMode === "all" ? "100" : "20"); // Fetch more for all-states view
      
      const response = await apiClient.get(`/matchmaker/professionals?${params.toString()}`);
      setProfessionals(response.data.professionals);
      setTotalResults(response.data.total);
      setTotalPages(response.data.pages);
      
      // Auto-expand all states when showing all professionals
      if (viewMode === "all") {
        const states = getGroupedByState(response.data.professionals);
        const expanded = {};
        Object.keys(states).forEach(state => {
          expanded[state] = true;
        });
        setExpandedStates(expanded);
      }
    } catch (error) {
      console.error("Failed to fetch professionals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setViewMode("city");
    setShowCityDialog(false);
  };

  const handleSkipForNow = () => {
    setSelectedCity("");
    setViewMode("all");
    setShowCityDialog(false);
  };

  const handleExpertiseToggle = (tag) => {
    setSelectedExpertise(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setMinExperience("");
    setSelectedExpertise([]);
    setIpoExperience("");
    setVerifiedOnly(false);
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || "All Professionals";
  };

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  // Group professionals by state (alphabetically)
  const getGroupedByState = (profs) => {
    const grouped = {};
    
    profs.forEach(prof => {
      // Get state from first location
      const city = prof.locations?.[0];
      const state = CITY_TO_STATE[city] || city || "Other";
      
      if (!grouped[state]) {
        grouped[state] = [];
      }
      grouped[state].push(prof);
    });
    
    // Sort states alphabetically and sort professionals within each state by name
    const sortedStates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
    const result = {};
    sortedStates.forEach(state => {
      result[state] = grouped[state].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    });
    
    return result;
  };

  const toggleStateExpand = (state) => {
    setExpandedStates(prev => ({
      ...prev,
      [state]: !prev[state]
    }));
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  const renderProfessionalCard = (prof) => (
    <Card
      key={prof.professional_id}
      className="border border-border hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/matchmaker/profile/${prof.professional_id}`)}
      data-testid={`professional-${prof.professional_id}`}
    >
      <CardContent className="p-6">
        <div className="flex gap-6">
          {/* Avatar */}
          <Avatar className="w-24 h-24 rounded-xl">
            <AvatarImage src={prof.profile_picture} alt={prof.name} />
            <AvatarFallback className="bg-[#1DA1F2] text-white text-2xl rounded-xl">
              {prof.name?.charAt(0) || "P"}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-black">{prof.name}</h3>
                  {prof.is_verified && (
                    <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">
                      VERIFIED
                    </Badge>
                  )}
                </div>
                {prof.agency_name && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {prof.agency_name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {renderStars(prof.average_rating)}
                <span className="text-sm text-muted-foreground ml-1">
                  ({prof.ratings_count})
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {prof.professional_summary || "Experienced professional ready to assist with your IPO needs."}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {prof.expertise_tags?.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {prof.years_experience} years exp.
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {prof.locations?.slice(0, 2).join(", ")}
              </span>
              {prof.ipo_track_record?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {prof.ipo_track_record.length} IPOs managed
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 min-w-[140px]">
            <Button
              className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-2"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/matchmaker/profile/${prof.professional_id}`);
              }}
            >
              View Profile
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={(e) => {
                e.stopPropagation();
                toast.info("Consultation booking coming soon!");
              }}
            >
              <Video className="w-4 h-4" />
              Book Call
            </Button>
            <Button
              variant="ghost"
              className="gap-2 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                toast.info("Enquiry feature coming soon!");
              }}
            >
              <Mail className="w-4 h-4" />
              Send Enquiry
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Group cities by state for the city selection dialog
  const getCitiesByState = () => {
    const grouped = {};
    filteredCities.forEach(city => {
      const state = CITY_TO_STATE[city] || "Other";
      if (!grouped[state]) {
        grouped[state] = [];
      }
      grouped[state].push(city);
    });
    // Sort states alphabetically
    const sortedStates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
    const result = {};
    sortedStates.forEach(state => {
      result[state] = grouped[state].sort((a, b) => a.localeCompare(b));
    });
    return result;
  };

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="matchmaker-search-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      {/* City Selection Dialog */}
      <Dialog open={showCityDialog && !selectedCity && viewMode !== "all"} onOpenChange={setShowCityDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#1DA1F2]" />
              Select Your City
            </DialogTitle>
            <DialogDescription>
              Choose a city to find {getCategoryName(selectedCategory)} near you, or skip to see all professionals organized by state
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Search city..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="h-11"
              data-testid="city-search-input"
            />
            <div className="max-h-[400px] overflow-y-auto space-y-4">
              {Object.entries(getCitiesByState()).map(([state, stateCities]) => (
                <div key={state}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 sticky top-0 bg-white py-1">
                    {state}
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {stateCities.map((city) => (
                      <Button
                        key={city}
                        variant="outline"
                        className="justify-start h-9 text-sm"
                        onClick={() => handleCitySelect(city)}
                        data-testid={`city-${city}`}
                      >
                        <MapPin className="w-3 h-3 mr-2 text-muted-foreground" />
                        {city}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button 
              variant="outline" 
              onClick={handleSkipForNow}
              className="gap-2"
              data-testid="skip-for-now-btn"
            >
              <Globe className="w-4 h-4" />
              Skip for now - Show All (State-wise)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <main className="flex-1 ml-64">
        {/* AI Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">AI-Powered Match Making Engine</span>
            </div>
            <span className="text-white/60">|</span>
            <span className="text-white/80">Intelligent matching based on expertise, track record & sector fit</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 gap-1"
              onClick={() => navigate("/matchmaker")}
            >
              <Brain className="w-4 h-4" />
              Get AI Recommendations
            </Button>
          </div>
        </div>
        
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <button onClick={() => navigate("/matchmaker")} className="hover:text-black flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Match Maker
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-black font-medium">{getCategoryName(selectedCategory)}</span>
            {viewMode === "all" && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-[#1DA1F2] font-medium flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  All States
                </span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-black">
                {getCategoryName(selectedCategory)}
                {viewMode === "city" && selectedCity && (
                  <span className="text-muted-foreground font-normal"> in {selectedCity}</span>
                )}
                {viewMode === "all" && (
                  <span className="text-muted-foreground font-normal"> - All India (State-wise)</span>
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {totalResults} professionals found
                {viewMode === "all" && " • Organized alphabetically by state"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === "city" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setViewMode("city");
                    if (!selectedCity) setShowCityDialog(true);
                  }}
                  className={`gap-1.5 h-8 ${viewMode === "city" ? "bg-white shadow-sm" : ""}`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  City View
                </Button>
                <Button
                  variant={viewMode === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setViewMode("all");
                    setSelectedCity("");
                  }}
                  className={`gap-1.5 h-8 ${viewMode === "all" ? "bg-white shadow-sm" : ""}`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  All States
                </Button>
              </div>
              
              {viewMode === "city" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCityDialog(true)}
                  className="gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {selectedCity || "Select City"}
                </Button>
              )}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40" data-testid="sort-select">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="experience">Most Experienced</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar Filters */}
          <aside className="w-72 bg-white border-r border-border p-6 min-h-[calc(100vh-120px)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-black flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h3>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[#1DA1F2] h-8">
                Clear All
              </Button>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-black mb-3 block">Category</Label>
              <Select value={selectedCategory || "all"} onValueChange={(v) => setSelectedCategory(v === "all" ? "" : v)}>
                <SelectTrigger data-testid="category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-6" />

            {/* Experience Filter */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-black mb-3 block">Years of Experience</Label>
              <div className="space-y-2">
                {[
                  { value: "any", label: "Any" },
                  { value: "1", label: "1-5 years" },
                  { value: "5", label: "5-10 years" },
                  { value: "10", label: "10+ years" }
                ].map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`exp-${option.value}`}
                      checked={minExperience === (option.value === "any" ? "" : option.value)}
                      onCheckedChange={() => setMinExperience(option.value === "any" ? "" : option.value)}
                    />
                    <label htmlFor={`exp-${option.value}`} className="text-sm text-muted-foreground cursor-pointer">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* IPO Experience Filter */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-black mb-3 block">IPO Experience</Label>
              <div className="space-y-2">
                {[
                  { value: "any", label: "Any" },
                  { value: "5+", label: "Managed 5+ IPOs" },
                  { value: "sme", label: "SME IPO Specialist" },
                  { value: "mainboard", label: "Mainboard IPO Specialist" }
                ].map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`ipo-${option.value}`}
                      checked={ipoExperience === (option.value === "any" ? "" : option.value)}
                      onCheckedChange={() => setIpoExperience(option.value === "any" ? "" : option.value)}
                    />
                    <label htmlFor={`ipo-${option.value}`} className="text-sm text-muted-foreground cursor-pointer">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Expertise Filter */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-black mb-3 block">Expertise</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {expertiseTags.slice(0, 8).map((tag) => (
                  <div key={tag} className="flex items-center gap-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={selectedExpertise.includes(tag)}
                      onCheckedChange={() => handleExpertiseToggle(tag)}
                    />
                    <label htmlFor={`tag-${tag}`} className="text-sm text-muted-foreground cursor-pointer">
                      {tag}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Verified Only */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="verified"
                checked={verifiedOnly}
                onCheckedChange={setVerifiedOnly}
              />
              <label htmlFor="verified" className="text-sm font-medium text-black cursor-pointer flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                Verified Only
              </label>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
              </div>
            ) : professionals.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-black mb-2">No professionals found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your filters or search in a different city</p>
                <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {professionals.map((prof) => (
                  <Card
                    key={prof.professional_id}
                    className="border border-border hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/matchmaker/profile/${prof.professional_id}`)}
                    data-testid={`professional-${prof.professional_id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        {/* Avatar */}
                        <Avatar className="w-24 h-24 rounded-xl">
                          <AvatarImage src={prof.profile_picture} alt={prof.name} />
                          <AvatarFallback className="bg-[#1DA1F2] text-white text-2xl rounded-xl">
                            {prof.name?.charAt(0) || "P"}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-black">{prof.name}</h3>
                                {prof.is_verified && (
                                  <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">
                                    VERIFIED
                                  </Badge>
                                )}
                              </div>
                              {prof.agency_name && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {prof.agency_name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {renderStars(prof.average_rating)}
                              <span className="text-sm text-muted-foreground ml-1">
                                ({prof.ratings_count})
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {prof.professional_summary || "Experienced professional ready to assist with your IPO needs."}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {prof.expertise_tags?.slice(0, 4).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {prof.years_experience} years exp.
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {prof.locations?.slice(0, 2).join(", ")}
                            </span>
                            {prof.ipo_track_record?.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                {prof.ipo_track_record.length} IPOs managed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 min-w-[140px]">
                          <Button
                            className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/matchmaker/profile/${prof.professional_id}`);
                            }}
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info("Consultation booking coming soon!");
                            }}
                          >
                            <Video className="w-4 h-4" />
                            Book Call
                          </Button>
                          <Button
                            variant="ghost"
                            className="gap-2 text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info("Enquiry feature coming soon!");
                            }}
                          >
                            <Mail className="w-4 h-4" />
                            Send Enquiry
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MatchMakerSearch;
