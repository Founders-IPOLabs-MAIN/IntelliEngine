import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  Search,
  MapPin,
  Briefcase,
  Star,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Users,
  Building2,
  CheckCircle2,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const BrowseAllProfessionals = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [professionals, setProfessionals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchProfessionals();
  }, [currentPage, selectedCategory, selectedCity]);

  const fetchInitialData = async () => {
    try {
      const [catRes, citiesRes] = await Promise.all([
        apiClient.get("/matchmaker/categories"),
        apiClient.get("/matchmaker/cities")
      ]);
      setCategories(catRes.data.categories);
      setCities(citiesRes.data.cities);
      
      // Fetch statistics separately to not block the page
      try {
        const statsRes = await apiClient.get("/matchmaker/statistics");
        setStats(statsRes.data);
      } catch (statsError) {
        console.error("Failed to fetch statistics:", statsError);
        setStats({ total_professionals: 0, unique_cities: 0 });
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      toast.error("Failed to load data");
    }
  };

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", 12);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedCity) params.append("city", selectedCity);
      if (searchQuery) params.append("search", searchQuery);
      
      const response = await apiClient.get(`/matchmaker/professionals/all?${params.toString()}`);
      setProfessionals(response.data.professionals);
      setTotalPages(response.data.total_pages);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Failed to fetch professionals:", error);
      toast.error("Failed to load professionals");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProfessionals();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedCity("");
    setCurrentPage(1);
  };

  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : id;
  };

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="browse-all-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/matchmaker")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-black"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div>
                <h1 className="text-lg font-bold text-black">Browse All Professionals</h1>
                <p className="text-xs text-muted-foreground">
                  Master database of {total} verified IPO professionals
                </p>
              </div>
            </div>
            {stats && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{stats.total_professionals} Professionals</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{stats.unique_cities} Cities</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Filters Bar */}
        <div className="bg-white border-b border-border px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, firm, or expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={handleSearch}>
              <Filter className="w-4 h-4 mr-1" />
              Apply
            </Button>
            
            {(searchQuery || selectedCategory || selectedCity) && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Professionals Grid */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
            </div>
          ) : professionals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No professionals found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {professionals.map((prof) => (
                  <Card
                    key={prof.professional_id}
                    className="border border-border hover:border-[#1DA1F2] hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/matchmaker/profile/${prof.professional_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-[#1DA1F2]/10 rounded-full flex items-center justify-center flex-shrink-0">
                          {prof.profile_picture ? (
                            <img src={prof.profile_picture} alt={prof.name} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-[#1DA1F2]">
                              {prof.name?.charAt(0)?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <h3 className="font-semibold text-black text-sm truncate">{prof.name}</h3>
                            {prof.is_verified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                          {prof.agency_name && (
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {prof.agency_name}
                            </p>
                          )}
                          <Badge variant="outline" className="text-[10px] mt-1">
                            {getCategoryName(prof.category_id)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {prof.years_experience} yrs exp
                          </span>
                          {prof.locations?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {prof.locations[0]}
                              {prof.locations.length > 1 && ` +${prof.locations.length - 1}`}
                            </span>
                          )}
                        </div>
                        
                        {prof.expertise_tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {prof.expertise_tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {prof.expertise_tags.length > 3 && (
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                +{prof.expertise_tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
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
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default BrowseAllProfessionals;
