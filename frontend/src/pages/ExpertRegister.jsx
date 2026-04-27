import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft, Loader2, Upload, X, CreditCard, CheckCircle2, Star } from "lucide-react";
import { toast } from "sonner";

const ExpertRegister = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [picFile, setPicFile] = useState(null);
  const [picPreview, setPicPreview] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: user?.name || "",
    mobile: "",
    email: user?.email || "",
    city: "",
    state: "",
    address: "",
    pincode: "",
    ipo_experience: false,
    years_of_experience: 0,
    expertise_areas: [],
  });

  useEffect(() => {
    apiClient.get("/matchmaker/expert/expertise-areas").then(r => setAreas(r.data.areas)).catch(() => {});
    apiClient.get("/matchmaker/expert/major-cities").then(r => setCities(r.data.cities)).catch(() => {});
  }, []);

  const handlePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    if (!["image/jpeg", "image/png"].includes(file.type)) { toast.error("Only JPG/PNG allowed"); return; }
    setPicFile(file);
    setPicPreview(URL.createObjectURL(file));
  };

  const toggleExpertise = (id) => {
    setForm(prev => {
      const current = prev.expertise_areas;
      if (current.includes(id)) return { ...prev, expertise_areas: current.filter(a => a !== id) };
      if (current.length >= 3) { toast.error("Maximum 3 areas allowed"); return prev; }
      return { ...prev, expertise_areas: [...current, id] };
    });
  };

  const handleSubmit = async (isPremium = false) => {
    if (!form.full_name || !form.mobile || !form.email || !form.city || !form.state) {
      toast.error("Please fill all required fields"); return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("full_name", form.full_name);
      fd.append("mobile", form.mobile);
      fd.append("email", form.email);
      fd.append("city", form.city);
      fd.append("state", form.state);
      fd.append("address", form.address);
      fd.append("pincode", form.pincode);
      fd.append("ipo_experience", form.ipo_experience ? "yes" : "no");
      fd.append("years_of_experience", form.years_of_experience);
      fd.append("expertise_areas", JSON.stringify(form.expertise_areas));
      if (picFile) fd.append("profile_picture", picFile);

      await apiClient.post("/matchmaker/expert/register", fd, { headers: { "Content-Type": "multipart/form-data" } });

      if (isPremium) {
        setShowPayment(true);
      } else {
        toast.success("Registration successful!");
        navigate("/matchmaker/experts");
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Registration failed");
    }
    setLoading(false);
  };

  const handlePayment = async () => {
    setPayLoading(true);
    try {
      await apiClient.post("/matchmaker/expert/premium-upgrade");
      toast.success("Premium activated! Proceeding to verification...");
      setShowPayment(false);
      navigate("/matchmaker/experts/verify");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Payment failed");
    }
    setPayLoading(false);
  };

  const areaLabel = (id) => areas.find(a => a.id === id)?.label || id;

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="expert-register-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b px-8 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold text-black">Expert Registration</h1>
        </header>

        <div className="max-w-2xl mx-auto p-8">
          <Card className="border shadow-sm">
            <CardContent className="p-6 space-y-5">
              <p className="text-sm text-gray-500">All fields marked * are required</p>

              {/* Profile Picture */}
              <div>
                <Label className="text-sm font-medium">Profile Picture</Label>
                <p className="text-xs text-gray-400 mb-2">JPG or PNG, max 2MB</p>
                <div className="flex items-center gap-4">
                  {picPreview ? (
                    <div className="relative">
                      <img src={picPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-[#1DA1F2]" />
                      <button onClick={() => { setPicFile(null); setPicPreview(null); }} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#1DA1F2] transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handlePicChange} data-testid="pic-upload" />
                    </label>
                  )}
                  <span className="text-xs text-gray-400">{picFile ? picFile.name : "No file chosen"}</span>
                </div>
              </div>

              {/* Name & Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} data-testid="input-fullname" />
                </div>
                <div>
                  <Label>Mobile *</Label>
                  <Input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} placeholder="+91 XXXXX XXXXX" data-testid="input-mobile" />
                </div>
              </div>
              <div>
                <Label>Email *</Label>
                <Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" data-testid="input-email" />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City *</Label>
                  <Select value={form.city} onValueChange={v => setForm({...form, city: v})}>
                    <SelectTrigger data-testid="select-city"><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent>
                      {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>State *</Label>
                  <Input value={form.state} onChange={e => setForm({...form, state: e.target.value})} data-testid="input-state" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Address</Label>
                  <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} data-testid="input-address" />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} data-testid="input-pincode" />
                </div>
              </div>

              {/* IPO Experience */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="font-medium text-sm text-black">Experience with IPO *</p>
                  <p className="text-xs text-gray-500">Do you have prior IPO experience?</p>
                </div>
                <Switch checked={form.ipo_experience} onCheckedChange={v => setForm({...form, ipo_experience: v, years_of_experience: v ? form.years_of_experience : 0})} data-testid="toggle-ipo-exp" />
              </div>

              {form.ipo_experience && (
                <div>
                  <Label>Years of Experience</Label>
                  <Select value={String(form.years_of_experience)} onValueChange={v => setForm({...form, years_of_experience: parseInt(v)})}>
                    <SelectTrigger data-testid="select-years"><SelectValue placeholder="Select years" /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,9,10,15,20,25,30].map(y => <SelectItem key={y} value={String(y)}>{y} {y === 1 ? "year" : "years"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Area of Expertise */}
              <div>
                <Label className="text-sm font-medium">Area of Expertise (Choose up to 3)</Label>
                <p className="text-xs text-gray-400 mb-3">Selected: {form.expertise_areas.length}/3</p>
                <div className="flex flex-wrap gap-2">
                  {areas.map(a => {
                    const selected = form.expertise_areas.includes(a.id);
                    return (
                      <Badge
                        key={a.id}
                        variant={selected ? "default" : "outline"}
                        className={`cursor-pointer text-xs py-1.5 px-3 transition-all ${selected ? "bg-[#1DA1F2] text-white hover:bg-[#1a8cd8]" : "hover:bg-blue-50 hover:border-[#1DA1F2]"}`}
                        onClick={() => toggleExpertise(a.id)}
                        data-testid={`expertise-${a.id}`}
                      >
                        {a.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={() => handleSubmit(false)} disabled={loading} className="flex-1 h-11 bg-[#003366] hover:bg-[#002244]" data-testid="submit-free-btn">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Submit (Free)</>}
                </Button>
                <Button onClick={() => handleSubmit(true)} disabled={loading} className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white" data-testid="submit-premium-btn">
                  <Star className="w-4 h-4 mr-2" /> Premium Option
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Popup (Mocked Razorpay) */}
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" /> Premium Membership — Payment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="font-semibold text-amber-800">Premium Expert Plan</p>
                <p className="text-2xl font-bold text-black mt-1">&#8377;4,999 <span className="text-sm text-gray-500 font-normal">/year</span></p>
                <ul className="mt-3 space-y-1 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Priority listing in search results</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Premium badge on your profile</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Access to Advanced Verification</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Direct contact requests from corporates</li>
                </ul>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border text-center text-xs text-gray-500">
                Powered by <span className="font-semibold">Razorpay</span> (MOCKED)
              </div>
              <Button onClick={handlePayment} disabled={payLoading} className="w-full h-11 bg-[#1DA1F2] hover:bg-[#1a8cd8]" data-testid="pay-btn">
                {payLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : "Pay & Proceed to Verification"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ExpertRegister;
