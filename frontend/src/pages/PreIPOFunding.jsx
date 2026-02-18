import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Brain,
  Users,
  TrendingUp,
  Building2,
  Layers,
  Calendar,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  ArrowRightLeft
} from "lucide-react";

const ICON_MAP = {
  "Sparkles": Sparkles,
  "TrendingUp": TrendingUp,
  "Building2": Building2,
  "ArrowRightLeft": ArrowRightLeft,
  "Layers": Layers,
  "Users": Users
};

const PreIPOFunding = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  
  // AI Fitment Dialog
  const [showFitmentDialog, setShowFitmentDialog] = useState(false);
  const [fitmentLoading, setFitmentLoading] = useState(false);
  const [fitmentResult, setFitmentResult] = useState(null);
  const [fitmentForm, setFitmentForm] = useState({
    annual_revenue: "",
    current_debt: "",
    funding_goal: ""
  });
  
  // Consultation Dialog
  const [showConsultDialog, setShowConsultDialog] = useState(false);
  const [consultLoading, setConsultLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [consultForm, setConsultForm] = useState({
    preferred_date: "",
    preferred_time: "",
    company_name: "",
    contact_name: user?.name || "",
    contact_email: user?.email || "",
    contact_phone: "",
    notes: ""
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const response = await apiClient.get("/funding/pre-ipo-options");
      setOptions(response.data.options);
    } catch (error) {
      console.error("Failed to fetch options:", error);
      toast.error("Failed to load funding options");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date) => {
    try {
      const response = await apiClient.get(`/funding/available-slots?date=${date}`);
      setAvailableSlots(response.data.available_slots);
    } catch (error) {
      console.error("Failed to fetch slots:", error);
    }
  };

  const handleDateChange = (date) => {
    setConsultForm({ ...consultForm, preferred_date: date, preferred_time: "" });
    if (date) {
      fetchAvailableSlots(date);
    }
  };

  const handleAIFitment = async () => {
    if (!fitmentForm.annual_revenue || !fitmentForm.current_debt || !fitmentForm.funding_goal) {
      toast.error("Please answer all questions");
      return;
    }
    
    setFitmentLoading(true);
    try {
      const response = await apiClient.post("/funding/ai-fitment", {
        funding_option_id: selectedOption.id,
        funding_type: "pre_ipo",
        ...fitmentForm
      });
      setFitmentResult(response.data);
      toast.success("AI analysis complete!");
    } catch (error) {
      console.error("AI fitment failed:", error);
      toast.error("Failed to calculate fitment");
    } finally {
      setFitmentLoading(false);
    }
  };

  const handleBookConsultation = async () => {
    if (!consultForm.preferred_date || !consultForm.preferred_time || !consultForm.company_name || !consultForm.contact_phone) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setConsultLoading(true);
    try {
      await apiClient.post("/funding/book-consultation", {
        funding_type: "pre_ipo",
        funding_option_id: selectedOption.id,
        ...consultForm,
        quiz_score: fitmentResult?.probability_score
      });
      toast.success("Consultation booked successfully!");
      setShowConsultDialog(false);
      setShowFitmentDialog(false);
      setSelectedOption(null);
      setFitmentResult(null);
      setFitmentForm({ annual_revenue: "", current_debt: "", funding_goal: "" });
      setConsultForm({
        preferred_date: "",
        preferred_time: "",
        company_name: "",
        contact_name: user?.name || "",
        contact_email: user?.email || "",
        contact_phone: "",
        notes: ""
      });
    } catch (error) {
      console.error("Booking failed:", error);
      toast.error("Failed to book consultation");
    } finally {
      setConsultLoading(false);
    }
  };

  const openFitmentDialog = (option) => {
    setSelectedOption(option);
    setFitmentResult(null);
    setFitmentForm({ annual_revenue: "", current_debt: "", funding_goal: "" });
    setShowFitmentDialog(true);
  };

  const openConsultDialog = (option) => {
    setSelectedOption(option);
    setShowConsultDialog(true);
  };

  // Generate next 14 days for date picker
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
        days.push(date.toISOString().split('T')[0]);
      }
    }
    return days;
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
    <div className="flex min-h-screen bg-gray-50" data-testid="pre-ipo-funding-page">
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
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">Pre-IPO Funding Options</h1>
              <p className="text-muted-foreground">Capital solutions for growth and IPO readiness</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {options.map((option) => {
              const IconComponent = ICON_MAP[option.icon] || TrendingUp;
              
              return (
                <Card
                  key={option.id}
                  className="border border-border hover:border-blue-300 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                  data-testid={`funding-option-${option.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-black text-lg mb-1 group-hover:text-blue-600 transition-colors">
                          {option.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {option.long_description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {option.typical_amount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {option.timeline}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => openFitmentDialog(option)}
                      >
                        <Brain className="w-4 h-4" />
                        AI Fitment
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 gap-1"
                        onClick={() => openConsultDialog(option)}
                      >
                        <Users className="w-4 h-4" />
                        Get Expert Help
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      {/* AI Fitment Dialog */}
      <Dialog open={showFitmentDialog} onOpenChange={setShowFitmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              AI Funding Fitment Calculator
            </DialogTitle>
            <DialogDescription>
              {selectedOption?.name} - Quick eligibility assessment
            </DialogDescription>
          </DialogHeader>
          
          {!fitmentResult ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>What is your Annual Revenue?</Label>
                <Select value={fitmentForm.annual_revenue} onValueChange={(v) => setFitmentForm({...fitmentForm, annual_revenue: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select revenue range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="less_5cr">Less than ₹5 Crores</SelectItem>
                    <SelectItem value="5_25cr">₹5 - 25 Crores</SelectItem>
                    <SelectItem value="25_100cr">₹25 - 100 Crores</SelectItem>
                    <SelectItem value="more_100cr">More than ₹100 Crores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>What is your Current Debt Level?</Label>
                <Select value={fitmentForm.current_debt} onValueChange={(v) => setFitmentForm({...fitmentForm, current_debt: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select debt level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_debt">No debt</SelectItem>
                    <SelectItem value="low">Low (less than 30% of revenue)</SelectItem>
                    <SelectItem value="moderate">Moderate (30-60% of revenue)</SelectItem>
                    <SelectItem value="high">High (more than 60% of revenue)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>What is your Funding Goal?</Label>
                <Select value={fitmentForm.funding_goal} onValueChange={(v) => setFitmentForm({...fitmentForm, funding_goal: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select funding purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="working_capital">Working Capital</SelectItem>
                    <SelectItem value="expansion">Business Expansion</SelectItem>
                    <SelectItem value="debt_repayment">Debt Repayment</SelectItem>
                    <SelectItem value="ipo_readiness">IPO Readiness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFitmentDialog(false)}>Cancel</Button>
                <Button 
                  onClick={handleAIFitment} 
                  disabled={fitmentLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {fitmentLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Calculate Fitment
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Score Display */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke={fitmentResult.probability_score >= 70 ? "#22c55e" : fitmentResult.probability_score >= 50 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${(fitmentResult.probability_score / 100) * 352} 352`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-black">{fitmentResult.probability_score}%</span>
                  </div>
                </div>
                <p className="font-semibold text-black">Probability of Success</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">{fitmentResult.explanation}</p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Recommendation:</strong> {fitmentResult.recommendation}
                </p>
              </div>
              
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setFitmentResult(null)}>
                  Try Again
                </Button>
                <Button 
                  onClick={() => {
                    setShowFitmentDialog(false);
                    openConsultDialog(selectedOption);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Discuss with Expert
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Consultation Booking Dialog */}
      <Dialog open={showConsultDialog} onOpenChange={setShowConsultDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Schedule Expert Consultation
            </DialogTitle>
            <DialogDescription>
              Discuss {selectedOption?.name} with our funding experts
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                value={consultForm.company_name}
                onChange={(e) => setConsultForm({...consultForm, company_name: e.target.value})}
                placeholder="Your company name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preferred Date *</Label>
                <Select value={consultForm.preferred_date} onValueChange={handleDateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent>
                    {getNextDays().map((date) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Preferred Time *</Label>
                <Select 
                  value={consultForm.preferred_time} 
                  onValueChange={(v) => setConsultForm({...consultForm, preferred_time: v})}
                  disabled={!consultForm.preferred_date}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Contact Phone *</Label>
              <Input
                value={consultForm.contact_phone}
                onChange={(e) => setConsultForm({...consultForm, contact_phone: e.target.value})}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Input
                value={consultForm.notes}
                onChange={(e) => setConsultForm({...consultForm, notes: e.target.value})}
                placeholder="Any specific topics to discuss"
              />
            </div>
            
            {fitmentResult && (
              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                <p className="text-blue-800">
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  AI Fitment Score: <strong>{fitmentResult.probability_score}%</strong> - This will be shared with the expert.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConsultDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleBookConsultation} 
              disabled={consultLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {consultLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Booking
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PreIPOFunding;
