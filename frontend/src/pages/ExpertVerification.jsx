import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft, Loader2, ShieldCheck, Star, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const ExpertVerification = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verificationFields, setVerificationFields] = useState({});
  const [formData, setFormData] = useState({});

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/matchmaker/expert/my-profile");
      const p = res.data.profile;
      if (!p) { toast.error("Register as expert first"); navigate("/matchmaker/experts/register"); return; }
      if (!p.is_premium) { toast.error("Premium membership required for verification"); navigate("/matchmaker/experts"); return; }
      setProfile(p);
      setFormData(p.verification_data || {});

      const fieldsMap = {};
      for (const areaId of p.expertise_areas || []) {
        try {
          const r = await apiClient.get(`/matchmaker/expert/verification-fields/${areaId}`);
          fieldsMap[areaId] = r.data;
        } catch {}
      }
      setVerificationFields(fieldsMap);
    } catch (e) {
      toast.error("Failed to load profile");
    }
    setLoading(false);
  };

  const updateField = (areaId, key, value) => {
    setFormData(prev => ({
      ...prev,
      [areaId]: { ...(prev[areaId] || {}), [key]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiClient.post("/matchmaker/expert/save-verification", { verification_data: formData });
      toast.success(`Verification saved! ${res.data.verified_count}/${res.data.total_areas} profiles verified.`);
      if (res.data.is_verified) {
        toast.success("You are now a Verified Expert!");
      }
      loadProfile();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to save");
    }
    setSaving(false);
  };

  const areaLabels = {
    ca_auditor: "Chartered Accountant (CA) / Statutory Auditor",
    peer_review_auditor: "Peer Review Auditor",
    tax_advisor: "Tax Advisors",
    cfo: "CFO (Chief Financial Officer)",
    company_secretary: "Company Secretary (CS)",
    legal_advisor: "Legal Advisors (Indian Counsel)",
    independent_director: "Independent Directors",
    valuation_expert: "Registered Valuation Expert (RV)",
    merchant_banker: "Merchant Banker / BRLM",
    underwriter: "Underwriters",
    rta: "Registrar & Transfer Agent (RTA)",
    credit_rating: "Credit Rating Agency (CRA)",
    banker_to_issue: "Bankers to the Issue",
    advertising_agency: "Advertising Agency",
    market_maker: "Market Maker (SME IPOs only)",
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" /></main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="expert-verification-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-10 bg-white border-b px-8 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/matchmaker/experts")} data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold text-black flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1DA1F2]" /> Advanced Verification
          </h1>
          {profile?.is_verified && <Badge className="bg-green-100 text-green-700">Verified</Badge>}
        </header>

        <div className="max-w-3xl mx-auto p-8 space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-lg border ${profile?.is_verified ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
            <div className="flex items-start gap-3">
              {profile?.is_verified ? <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />}
              <div>
                <p className="font-medium text-sm">{profile?.is_verified ? "Profile Verified" : "Verification Pending"}</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {profile?.is_verified
                    ? `${profile.verified_areas?.length || 0} of ${profile.expertise_areas?.length || 0} expertise areas verified. Both Premium and Verified badges are active on your profile.`
                    : "Fill in all primary identifiers for at least 1 expertise area to get verified. All primary fields must be completed."}
                </p>
              </div>
            </div>
          </div>

          {/* Verification Forms per Expertise Area */}
          {(profile?.expertise_areas || []).map(areaId => {
            const spec = verificationFields[areaId];
            if (!spec) return null;
            const isAreaVerified = (profile?.verified_areas || []).includes(areaId);

            return (
              <Card key={areaId} className={`border ${isAreaVerified ? "border-green-300 bg-green-50/30" : ""}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-base text-black flex items-center gap-2">
                        {areaLabels[areaId] || areaId}
                        {isAreaVerified && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Regulator: {spec.regulator}</p>
                    </div>
                    {isAreaVerified && <Badge className="bg-green-100 text-green-700 text-[10px]">Verified</Badge>}
                  </div>

                  {/* Primary Identifiers */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-[#1DA1F2] uppercase tracking-wide mb-2">Primary Identifiers (Required)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {spec.primary.map(f => (
                        <div key={f.key}>
                          <Label className="text-xs">{f.label}</Label>
                          <Input
                            value={formData[areaId]?.[f.key] || ""}
                            onChange={e => updateField(areaId, f.key, e.target.value)}
                            placeholder={f.hint}
                            className="text-sm h-9"
                            data-testid={`verify-${areaId}-${f.key}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Secondary Identifiers */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Secondary / Firm Identifiers (Optional)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {spec.secondary.map(f => (
                        <div key={f.key}>
                          <Label className="text-xs text-gray-500">{f.label}</Label>
                          <Input
                            value={formData[areaId]?.[f.key] || ""}
                            onChange={e => updateField(areaId, f.key, e.target.value)}
                            placeholder={f.hint}
                            className="text-sm h-9"
                            data-testid={`verify-${areaId}-${f.key}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-base" data-testid="save-verification-btn">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><ShieldCheck className="w-5 h-5 mr-2" /> Submit Verification</>}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ExpertVerification;
