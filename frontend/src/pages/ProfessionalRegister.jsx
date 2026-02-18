import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  Shield,
  FileText,
  X
} from "lucide-react";

const ProfessionalRegister = ({ user, apiClient }) => {
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    category_id: "",
    name: user?.name || "",
    agency_name: "",
    email: user?.email || "",
    mobile: "",
    locations: [],
    years_experience: "",
    professional_summary: "",
    expertise_tags: [],
    sebi_registration: "",
    ca_cs_membership: "",
    services: [],
    pricing_model: "",
    hourly_rate: "",
    consent_display: true,
    consent_marketing: false,
    terms_accepted: false
  });
  
  const [newService, setNewService] = useState({ name: "", price: "" });
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

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
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExpertiseToggle = (tag) => {
    setFormData(prev => ({
      ...prev,
      expertise_tags: prev.expertise_tags.includes(tag)
        ? prev.expertise_tags.filter(t => t !== tag)
        : [...prev.expertise_tags, tag]
    }));
  };

  const handleAddLocation = () => {
    if (selectedCity && !formData.locations.includes(selectedCity)) {
      setFormData(prev => ({
        ...prev,
        locations: [...prev.locations, selectedCity]
      }));
      setSelectedCity("");
    }
  };

  const handleRemoveLocation = (city) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter(c => c !== city)
    }));
  };

  const handleAddService = () => {
    if (newService.name) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, { ...newService }]
      }));
      setNewService({ name: "", price: "" });
    }
  };

  const handleRemoveService = (index) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.category_id && formData.name && formData.email && formData.mobile;
      case 2:
        return formData.locations.length > 0 && formData.years_experience;
      case 3:
        return true; // Optional fields
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        years_experience: parseInt(formData.years_experience) || 0,
        hourly_rate: formData.hourly_rate ? parseInt(formData.hourly_rate) : null
      };
      
      await apiClient.post("/matchmaker/professionals", payload);
      toast.success("Profile created successfully!");
      navigate("/matchmaker");
    } catch (error) {
      console.error("Failed to create profile:", error);
      toast.error("Failed to create profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "Basic Info", icon: User },
    { number: 2, title: "Professional Details", icon: Briefcase },
    { number: 3, title: "Services & Consent", icon: Shield }
  ];

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
    <div className="flex min-h-screen bg-gray-50" data-testid="professional-register-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-border px-8 py-4">
          <button
            onClick={() => navigate("/matchmaker")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-black mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Match Maker
          </button>
          <h1 className="text-2xl font-bold text-black">Register as a Professional</h1>
          <p className="text-muted-foreground">Join India's premier IPO marketplace</p>
        </header>

        <div className="max-w-3xl mx-auto px-8 py-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center gap-3 ${currentStep >= step.number ? "text-[#1DA1F2]" : "text-muted-foreground"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep > step.number ? "bg-[#1DA1F2] text-white" :
                    currentStep === step.number ? "bg-[#1DA1F2]/10 border-2 border-[#1DA1F2]" :
                    "bg-gray-100"
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`font-medium ${currentStep >= step.number ? "text-black" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-24 h-0.5 mx-4 ${currentStep > step.number ? "bg-[#1DA1F2]" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Tell us about yourself and your practice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Your Primary Role *</Label>
                  <Select value={formData.category_id} onValueChange={(v) => handleFieldChange("category_id", v)}>
                    <SelectTrigger data-testid="category-select">
                      <SelectValue placeholder="Choose your professional category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      placeholder="Your full name"
                      data-testid="name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Agency/Firm Name</Label>
                    <Input
                      value={formData.agency_name}
                      onChange={(e) => handleFieldChange("agency_name", e.target.value)}
                      placeholder="Your firm name (if applicable)"
                      data-testid="agency-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email Address *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      placeholder="your@email.com"
                      data-testid="email-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number *</Label>
                    <Input
                      value={formData.mobile}
                      onChange={(e) => handleFieldChange("mobile", e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      data-testid="mobile-input"
                    />
                    <p className="text-xs text-muted-foreground">Will be verified via OTP for profile verification</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Professional Details */}
          {currentStep === 2 && (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Professional Details</CardTitle>
                <CardDescription>Share your experience and expertise</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Service Locations *</Label>
                  <div className="flex gap-2">
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddLocation} variant="outline">Add</Button>
                  </div>
                  {formData.locations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.locations.map((city) => (
                        <Badge key={city} variant="secondary" className="gap-1">
                          <MapPin className="w-3 h-3" />
                          {city}
                          <button onClick={() => handleRemoveLocation(city)}>
                            <X className="w-3 h-3 ml-1" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Years of Experience *</Label>
                  <Input
                    type="number"
                    value={formData.years_experience}
                    onChange={(e) => handleFieldChange("years_experience", e.target.value)}
                    placeholder="e.g., 10"
                    data-testid="experience-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Professional Summary</Label>
                  <Textarea
                    value={formData.professional_summary}
                    onChange={(e) => handleFieldChange("professional_summary", e.target.value)}
                    placeholder="Describe your services, value proposition, and expertise..."
                    rows={4}
                    data-testid="summary-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subject Matter Expertise</Label>
                  <div className="flex flex-wrap gap-2">
                    {expertiseTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={formData.expertise_tags.includes(tag) ? "default" : "outline"}
                        className={`cursor-pointer ${formData.expertise_tags.includes(tag) ? "bg-[#1DA1F2]" : ""}`}
                        onClick={() => handleExpertiseToggle(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SEBI Registration Number</Label>
                    <Input
                      value={formData.sebi_registration}
                      onChange={(e) => handleFieldChange("sebi_registration", e.target.value)}
                      placeholder="INM000XXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CA/CS Membership Number</Label>
                    <Input
                      value={formData.ca_cs_membership}
                      onChange={(e) => handleFieldChange("ca_cs_membership", e.target.value)}
                      placeholder="Membership number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Services & Consent */}
          {currentStep === 3 && (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Services & Consent</CardTitle>
                <CardDescription>List your services and provide consent for data display</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Services Offered</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      placeholder="Service name"
                      className="flex-1"
                    />
                    <Input
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                      placeholder="Price (optional)"
                      className="w-32"
                    />
                    <Button onClick={handleAddService} variant="outline">Add</Button>
                  </div>
                  {formData.services.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {formData.services.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span>{service.name}</span>
                          <div className="flex items-center gap-2">
                            {service.price && <span className="text-muted-foreground">{service.price}</span>}
                            <button onClick={() => handleRemoveService(index)} className="text-red-500">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pricing Model</Label>
                    <Select value={formData.pricing_model} onValueChange={(v) => handleFieldChange("pricing_model", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pricing model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly Rate</SelectItem>
                        <SelectItem value="fixed">Fixed Project Fee</SelectItem>
                        <SelectItem value="negotiable">Negotiable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.pricing_model === "hourly" && (
                    <div className="space-y-2">
                      <Label>Hourly Rate (₹)</Label>
                      <Input
                        type="number"
                        value={formData.hourly_rate}
                        onChange={(e) => handleFieldChange("hourly_rate", e.target.value)}
                        placeholder="e.g., 5000"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Consent Section - DPDP Act 2023 Compliance */}
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-black flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#1DA1F2]" />
                    Data Consent (DPDP Act 2023)
                  </h4>
                  
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consent_display"
                      checked={formData.consent_display}
                      onCheckedChange={(v) => handleFieldChange("consent_display", v)}
                    />
                    <div>
                      <label htmlFor="consent_display" className="font-medium text-black cursor-pointer">
                        Display Profile to Visitors *
                      </label>
                      <p className="text-sm text-muted-foreground">
                        I consent to displaying my profile information to IPO-seeking companies and visitors on the platform.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consent_marketing"
                      checked={formData.consent_marketing}
                      onCheckedChange={(v) => handleFieldChange("consent_marketing", v)}
                    />
                    <div>
                      <label htmlFor="consent_marketing" className="font-medium text-black cursor-pointer">
                        Marketing Communications
                      </label>
                      <p className="text-sm text-muted-foreground">
                        I consent to receiving marketing communications and having my profile used for promotional purposes.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-4">
                    You can deactivate or delete your profile at any time. Personal data will be removed after a 30-day cool-off period as per DPDP Act 2023.
                  </p>
                </div>

                <Separator />

                {/* Click-Wrap Agreement */}
                <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-semibold text-black flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    Terms of Use Agreement
                  </h4>
                  
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms_accepted"
                      checked={formData.terms_accepted}
                      onCheckedChange={(v) => handleFieldChange("terms_accepted", v)}
                      data-testid="terms-checkbox"
                    />
                    <div>
                      <label htmlFor="terms_accepted" className="font-medium text-black cursor-pointer">
                        I agree to the Terms of Use *
                      </label>
                      <p className="text-sm text-muted-foreground">
                        By checking this box, I confirm that I have read and agree to the{" "}
                        <a
                          href="/terms-of-use"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1DA1F2] hover:underline font-medium"
                          data-testid="terms-link"
                        >
                          Terms of Use
                        </a>{" "}
                        and{" "}
                        <a
                          href="/legal-disclaimer"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1DA1F2] hover:underline font-medium"
                          data-testid="legal-disclaimer-link"
                        >
                          Legal Disclaimer
                        </a>{" "}
                        of IntelliEngine by IPO Labs.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < 3 ? (
              <Button
                onClick={() => {
                  if (validateStep(currentStep)) {
                    setCurrentStep(s => s + 1);
                  } else {
                    toast.error("Please fill all required fields");
                  }
                }}
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8]"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting || !formData.consent_display || !formData.terms_accepted}
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8]"
                data-testid="submit-registration-btn"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Create Profile
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfessionalRegister;
