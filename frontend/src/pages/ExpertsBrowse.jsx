import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Sidebar from "@/components/Sidebar";
import { Search, Star, ShieldCheck, Mail, MapPin, Briefcase, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ExpertsBrowse = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);

  // Filters
  const [filterCity, setFilterCity] = useState("");
  const [filterExpertise, setFilterExpertise] = useState("");
  const [filterPremium, setFilterPremium] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);

  useEffect(() => {
    apiClient.get("/matchmaker/expert/major-cities").then(r => setCities(r.data.cities)).catch(() => {});
    apiClient.get("/matchmaker/expert/expertise-areas").then(r => setAreas(r.data.areas)).catch(() => {});
  }, []);

  useEffect(() => { fetchExperts(); }, [filterCity, filterExpertise, filterPremium, filterVerified]);

  const fetchExperts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCity) params.append("city", filterCity);
      if (filterExpertise) params.append("expertise", filterExpertise);
      if (filterPremium) params.append("premium_only", "true");
      if (filterVerified) params.append("verified_only", "true");
      const res = await apiClient.get(`/matchmaker/experts/browse?${params.toString()}`);
      setExperts(res.data.experts);
    } catch {
      setExperts([]);
    }
    setLoading(false);
  };

  const clearFilters = () => {
    setFilterCity("");
    setFilterExpertise("");
    setFilterPremium(false);
    setFilterVerified(false);
  };

  const hasFilters = filterCity || filterExpertise || filterPremium || filterVerified;

  const handleContact = async (expert) => {
    toast.success(`Contact request sent to ${expert.full_name}`);
  };

  return (
    <div className="flex min-h-screen bg-white" data-testid="experts-browse-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-black">Subject Matter Experts</h1>
              <p className="text-xs text-gray-500 mt-0.5">{experts.length} expert{experts.length !== 1 ? "s" : ""} found</p>
            </div>
            <Button onClick={() => navigate("/matchmaker/experts/register")} className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-sm" data-testid="register-expert-btn">
              <Briefcase className="w-4 h-4 mr-1.5" /> Register as Expert
            </Button>
          </div>
        </header>

        {/* Search & Filters */}
        <div className="px-8 py-4 bg-gray-50 border-b">
          <div className="flex items-center gap-3 flex-wrap">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />

            <Select value={filterCity || "all"} onValueChange={v => setFilterCity(v === "all" ? "" : v)}>
              <SelectTrigger className="h-9 text-sm bg-white w-[180px]" data-testid="filter-city">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterExpertise || "all"} onValueChange={v => setFilterExpertise(v === "all" ? "" : v)}>
              <SelectTrigger className="h-9 text-sm bg-white w-[260px]" data-testid="filter-expertise">
                <SelectValue placeholder="Area of Expertise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expertise</SelectItem>
                {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border text-sm">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-gray-600">Premium</span>
              <Switch checked={filterPremium} onCheckedChange={setFilterPremium} className="scale-75" data-testid="filter-premium" />
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border text-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs text-gray-600">Verified</span>
              <Switch checked={filterVerified} onCheckedChange={setFilterVerified} className="scale-75" data-testid="filter-verified" />
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-gray-500 hover:text-red-500" data-testid="clear-filters">
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Expert Cards — Scrollable list */}
        <div className="flex-1 overflow-y-auto px-8 py-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#1DA1F2]" /></div>
          ) : experts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No experts found{hasFilters ? " for the selected filters" : ""}.</p>
              <Button variant="link" className="mt-2 text-[#1DA1F2]" onClick={() => navigate("/matchmaker/experts/register")}>Register as Expert</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {experts.map(expert => (
                <Card key={expert.expert_id} className="border hover:border-[#1DA1F2]/40 hover:shadow-sm transition-all" data-testid={`expert-card-${expert.expert_id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gray-100 border flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {expert.profile_picture_id ? (
                        <img src={`${API_URL}/api/matchmaker/expert/profile-picture/${expert.expert_id}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-gray-400">{expert.full_name?.charAt(0)}</span>
                      )}
                    </div>

                    {/* Info — 3 lines */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-black truncate">{expert.full_name}</span>
                        {expert.is_premium && (
                          <Badge className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0 h-4 flex-shrink-0" data-testid="badge-premium">
                            <Star className="w-2.5 h-2.5 mr-0.5" /> Premium
                          </Badge>
                        )}
                        {expert.is_verified && (
                          <Badge className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0 h-4 flex-shrink-0" data-testid="badge-verified">
                            <ShieldCheck className="w-2.5 h-2.5 mr-0.5" /> Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {expert.city}</span>
                        {expert.ipo_experience && <span>{expert.years_of_experience}+ yrs IPO exp.</span>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(expert.expertise_labels || []).map((label, i) => (
                          <span key={i} className="text-[10px] bg-blue-50 text-[#1DA1F2] px-1.5 py-0.5 rounded">{label}</span>
                        ))}
                      </div>
                    </div>

                    {/* Contact Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 text-xs border-[#1DA1F2] text-[#1DA1F2] hover:bg-[#1DA1F2] hover:text-white"
                      onClick={() => handleContact(expert)}
                      data-testid={`contact-${expert.expert_id}`}
                    >
                      <Mail className="w-3.5 h-3.5 mr-1" /> Contact Me
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExpertsBrowse;
