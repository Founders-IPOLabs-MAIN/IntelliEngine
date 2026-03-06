import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  User,
  Building2,
  MapPin,
  Briefcase,
  Shield,
  FileText,
  X,
  Upload,
  Calendar,
  AlertTriangle,
  Eye,
  Edit3,
  Star
} from "lucide-react";

// Registration number field configurations per category
const REGISTRATION_FIELDS = {
  merchant_bankers: [
    { id: "sebi_registration", label: "SEBI Registration Number", placeholder: "INM000XXXXX", required: true, format: "SEBI format" },
    { id: "pan_entity", label: "PAN (Entity)", placeholder: "AAAAA0000A", required: true, format: "10 characters" }
  ],
  chartered_accountants: [
    { id: "icai_membership", label: "ICAI Membership Number", placeholder: "123456", required: true, format: "5 or 6 digits" },
    { id: "frn", label: "Firm Registration Number (FRN)", placeholder: "000000X", required: false, format: "Firm FRN" }
  ],
  peer_auditors: [
    { id: "peer_review_cert", label: "Peer Review Certificate Number", placeholder: "PRXXXX", required: true, format: "PR Certificate" },
    { id: "udin", label: "UDIN (Unique Document Identification Number)", placeholder: "24XXXXXX...", required: false, format: "18 characters" }
  ],
  company_secretaries: [
    { id: "icsi_membership", label: "ICSI Membership Number (ACS/FCS)", placeholder: "ACS12345 or FCS12345", required: true, format: "ACS/FCS + number" },
    { id: "cop_number", label: "Certificate of Practice (CoP) Number", placeholder: "12345", required: true, format: "CoP Number" }
  ],
  legal_tax: [
    { id: "bar_council", label: "Bar Council Enrollment Number", placeholder: "XX/XXXX/XXXX", required: true, format: "State/Year/Number" },
    { id: "firm_gstin", label: "Firm GSTIN (for Law Firms)", placeholder: "22AAAAA0000A1Z5", required: false, format: "15 characters" }
  ],
  valuation_experts: [
    { id: "ibbi_registration", label: "IBBI Registration Number", placeholder: "IBBI/RV/XX/XXXX/XXXXX", required: true, format: "IBBI format" },
    { id: "rvo_membership", label: "Registered Valuer Organization (RVO) Membership", placeholder: "RVO Membership ID", required: true, format: "RVO ID" }
  ],
  independent_directors: [
    { id: "din", label: "Director Identification Number (DIN)", placeholder: "00000000", required: true, format: "8 digits" },
    { id: "iddb_registration", label: "IDDB Registration Number", placeholder: "IDDB Registration", required: true, format: "Independent Director's Databank" }
  ],
  rta: [
    { id: "sebi_registration", label: "SEBI Registration Number (Category I or II)", placeholder: "INR000XXXXX", required: true, format: "SEBI format" },
    { id: "pan_entity", label: "PAN (Entity)", placeholder: "AAAAA0000A", required: true, format: "10 characters" }
  ],
  bankers: [
    { id: "sebi_registration", label: "SEBI Registration Number", placeholder: "INB000XXXXX", required: true, format: "SEBI format" },
    { id: "rbi_license", label: "RBI License Number", placeholder: "RBI License", required: true, format: "RBI format" }
  ],
  cfo_finance: [
    { id: "pan_personal", label: "PAN (Personal)", placeholder: "AAAAA0000A", required: true, format: "10 characters" },
    { id: "din", label: "DIN (if holding Board seat)", placeholder: "00000000", required: false, format: "8 digits" }
  ],
  ipo_consultants: [
    { id: "gstin", label: "GSTIN", placeholder: "22AAAAA0000A1Z5", required: true, format: "15 characters" },
    { id: "udyam_registration", label: "Udyam Registration Number (if MSME)", placeholder: "UDYAM-XX-00-0000000", required: false, format: "Udyam format" }
  ],
  nse_bse_brokers: [
    { id: "sebi_registration", label: "SEBI Registration Number", placeholder: "INZ000XXXXX", required: true, format: "SEBI Broker format" },
    { id: "exchange_membership", label: "NSE/BSE Membership ID", placeholder: "Exchange Member ID", required: true, format: "Exchange format" }
  ],
  credit_rating: [
    { id: "sebi_registration", label: "SEBI Registration Number (CRA)", placeholder: "IN/CRA/000", required: true, format: "SEBI CRA format" },
    { id: "pan_entity", label: "PAN (Entity)", placeholder: "AAAAA0000A", required: true, format: "10 characters" }
  ],
  monitoring_agency: [
    { id: "sebi_registration", label: "SEBI Registration Number", placeholder: "INM000XXXXX", required: true, format: "SEBI format" },
    { id: "pan_entity", label: "PAN (Entity)", placeholder: "AAAAA0000A", required: true, format: "10 characters" }
  ],
  underwriters: [
    { id: "sebi_registration", label: "SEBI Registration Number (Underwriter)", placeholder: "INUxxxxxx", required: true, format: "SEBI Underwriter format" },
    { id: "pan_entity", label: "PAN (Entity)", placeholder: "AAAAA0000A", required: true, format: "10 characters" }
  ]
};

const ProfessionalRegister = ({ user, apiClient }) => {
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState("basic");
  
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
    top_3_expertise: [],
    registration_numbers: {},
    // Document uploads
    pan_document: null,
    pan_file_name: "",
    aadhaar_document: null,
    aadhaar_file_name: "",
    registration_document: null,
    registration_file_name: "",
    registration_expiry_date: "",
    // Services
    services: [],
    pricing_model: "",
    hourly_rate: "",
    // Consent
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

  const handleRegistrationFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      registration_numbers: {
        ...prev.registration_numbers,
        [fieldId]: value
      }
    }));
  };

  const handleExpertiseToggle = (tag) => {
    setFormData(prev => {
      const isSelected = prev.expertise_tags.includes(tag);
      let newExpertise = isSelected
        ? prev.expertise_tags.filter(t => t !== tag)
        : [...prev.expertise_tags, tag];
      
      // Also update top 3 if removing
      let newTop3 = prev.top_3_expertise;
      if (isSelected && prev.top_3_expertise.includes(tag)) {
        newTop3 = prev.top_3_expertise.filter(t => t !== tag);
      }
      
      return {
        ...prev,
        expertise_tags: newExpertise,
        top_3_expertise: newTop3
      };
    });
  };

  const handleTop3Toggle = (tag) => {
    setFormData(prev => {
      const isTop3 = prev.top_3_expertise.includes(tag);
      if (isTop3) {
        return { ...prev, top_3_expertise: prev.top_3_expertise.filter(t => t !== tag) };
      } else if (prev.top_3_expertise.length < 3) {
        return { ...prev, top_3_expertise: [...prev.top_3_expertise, tag] };
      } else {
        toast.error("You can only select 3 top expertise areas");
        return prev;
      }
    });
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

  const handleFileUpload = async (type, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPG, and PNG files are allowed");
      return;
    }

    // Convert to base64 for storage
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        [`${type}_document`]: reader.result,
        [`${type}_file_name`]: file.name
      }));
      toast.success(`${type.toUpperCase()} document uploaded successfully`);
    };
    reader.readAsDataURL(file);
  };

  const isExpiryValid = () => {
    if (!formData.registration_expiry_date) return false;
    const expiry = new Date(formData.registration_expiry_date);
    return expiry > new Date();
  };

  const getRegistrationFields = () => {
    if (!formData.category_id) return [];
    return REGISTRATION_FIELDS[formData.category_id] || [];
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.category_id && formData.name && formData.email && formData.mobile;
      case 2:
        // Validate registration numbers
        const fields = getRegistrationFields();
        const requiredFields = fields.filter(f => f.required);
        return requiredFields.every(f => formData.registration_numbers[f.id]?.trim());
      case 3:
        return formData.locations.length > 0 && formData.years_experience && formData.top_3_expertise.length === 3;
      case 4:
        // Documents validation
        if (!formData.pan_document) return false;
        if (!formData.aadhaar_document) return false;
        if (!formData.registration_document) return false;
        if (!isExpiryValid()) return false;
        return true;
      case 5:
        return formData.consent_display && formData.terms_accepted;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    for (let i = 1; i <= 5; i++) {
      if (!validateStep(i)) {
        toast.error(`Please complete all required fields in Step ${i}`);
        setCurrentStep(i);
        return;
      }
    }
    
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        years_experience: parseInt(formData.years_experience) || 0,
        hourly_rate: formData.hourly_rate ? parseInt(formData.hourly_rate) : null
      };
      
      await apiClient.post("/matchmaker/professionals", payload);
      toast.success("Profile created successfully! It will be reviewed and published shortly.");
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
    { number: 2, title: "Registration", icon: FileText },
    { number: 3, title: "Expertise", icon: Briefcase },
    { number: 4, title: "Documents", icon: Upload },
    { number: 5, title: "Review", icon: Eye }
  ];

  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : id;
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
    <div className="flex min-h-screen bg-gray-50" data-testid="professional-register-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Compact Header */}
        <header className="bg-white border-b border-border px-6 py-3">
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
                <h1 className="text-lg font-bold text-black">Register as a Professional</h1>
                <p className="text-xs text-muted-foreground">Join India's premier IPO marketplace</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/matchmaker/edit-profile")}
                className="gap-1 text-xs"
              >
                <Edit3 className="w-3 h-3" />
                Edit Existing Profile
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Compact Progress Steps */}
          <div className="flex items-center justify-between mb-6 bg-white rounded-lg p-3 border border-border">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <button
                  onClick={() => validateStep(currentStep) && setCurrentStep(step.number)}
                  className={`flex items-center gap-2 ${currentStep >= step.number ? "text-[#1DA1F2]" : "text-muted-foreground"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                    currentStep > step.number ? "bg-[#1DA1F2] text-white" :
                    currentStep === step.number ? "bg-[#1DA1F2]/10 border-2 border-[#1DA1F2]" :
                    "bg-gray-100"
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`text-xs font-medium hidden md:block ${currentStep >= step.number ? "text-black" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div className={`w-8 md:w-16 h-0.5 mx-2 ${currentStep > step.number ? "bg-[#1DA1F2]" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <Card className="border border-border">
              <CardHeader className="py-4">
                <CardTitle className="text-base">Basic Information</CardTitle>
                <CardDescription className="text-xs">Tell us about yourself and your practice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Select Your Primary Role <span className="text-red-500">*</span></Label>
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
                  <div className="space-y-1">
                    <Label className="text-sm">Full Name <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      placeholder="Your full name"
                      data-testid="name-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Agency/Firm Name</Label>
                    <Input
                      value={formData.agency_name}
                      onChange={(e) => handleFieldChange("agency_name", e.target.value)}
                      placeholder="Your firm name (if applicable)"
                      data-testid="agency-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm">Email Address <span className="text-red-500">*</span></Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      placeholder="your@email.com"
                      data-testid="email-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Mobile Number <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.mobile}
                      onChange={(e) => handleFieldChange("mobile", e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      data-testid="mobile-input"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Registration Numbers */}
          {currentStep === 2 && (
            <Card className="border border-border">
              <CardHeader className="py-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1DA1F2]" />
                  Registration Numbers
                </CardTitle>
                <CardDescription className="text-xs">
                  {formData.category_id ? (
                    <>Mandatory registration details for <strong>{getCategoryName(formData.category_id)}</strong></>
                  ) : (
                    "Please select a category first"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!formData.category_id ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Please go back and select your professional category</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                      <p className="text-xs text-amber-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <strong>Mandatory:</strong> All fields marked with * are required to complete your profile.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {getRegistrationFields().map((field) => (
                        <div key={field.id} className="space-y-1">
                          <Label className="text-sm">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </Label>
                          <Input
                            value={formData.registration_numbers[field.id] || ""}
                            onChange={(e) => handleRegistrationFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            data-testid={`registration-${field.id}`}
                          />
                          <p className="text-[10px] text-muted-foreground">Format: {field.format}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Professional Details & Expertise */}
          {currentStep === 3 && (
            <Card className="border border-border">
              <CardHeader className="py-4">
                <CardTitle className="text-base">Professional Details & Expertise</CardTitle>
                <CardDescription className="text-xs">Share your experience and select your top 3 expertise areas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Service Locations <span className="text-red-500">*</span></Label>
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
                    <Button onClick={handleAddLocation} variant="outline" size="sm">Add</Button>
                  </div>
                  {formData.locations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.locations.map((city) => (
                        <Badge key={city} variant="secondary" className="gap-1 text-xs">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm">Years of Experience <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={formData.years_experience}
                      onChange={(e) => handleFieldChange("years_experience", e.target.value)}
                      placeholder="e.g., 10"
                      data-testid="experience-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Professional Summary</Label>
                    <Input
                      value={formData.professional_summary}
                      onChange={(e) => handleFieldChange("professional_summary", e.target.value)}
                      placeholder="Brief description of your expertise"
                      data-testid="summary-input"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Areas of Expertise <span className="text-red-500">*</span></Label>
                    <Badge variant="outline" className="text-xs">
                      Top 3 Selected: {formData.top_3_expertise.length}/3
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Select your expertise areas, then mark your <strong>Top 3</strong> by clicking the star</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {expertiseTags.map((tag) => {
                      const isSelected = formData.expertise_tags.includes(tag);
                      const isTop3 = formData.top_3_expertise.includes(tag);
                      
                      return (
                        <div key={tag} className="flex items-center">
                          <Badge
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer text-xs ${isSelected ? "bg-[#1DA1F2]" : ""} ${isTop3 ? "ring-2 ring-yellow-400" : ""}`}
                            onClick={() => handleExpertiseToggle(tag)}
                          >
                            {tag}
                          </Badge>
                          {isSelected && (
                            <button
                              onClick={() => handleTop3Toggle(tag)}
                              className={`ml-1 p-0.5 rounded ${isTop3 ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"}`}
                              title={isTop3 ? "Remove from Top 3" : "Add to Top 3"}
                            >
                              <Star className={`w-3.5 h-3.5 ${isTop3 ? "fill-current" : ""}`} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {formData.top_3_expertise.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                      <p className="text-xs text-yellow-800 font-medium mb-1">Your Top 3 Expertise:</p>
                      <div className="flex gap-2">
                        {formData.top_3_expertise.map((tag, idx) => (
                          <Badge key={tag} className="bg-yellow-500 text-xs">
                            #{idx + 1} {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Document Uploads */}
          {currentStep === 4 && (
            <Card className="border border-border">
              <CardHeader className="py-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#1DA1F2]" />
                  Document Uploads
                </CardTitle>
                <CardDescription className="text-xs">Upload required identity and registration documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Accepted formats:</strong> PDF, JPG, PNG (Max 5MB each)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* PAN Upload */}
                  <div className="space-y-2 p-3 border border-border rounded-lg">
                    <Label className="text-sm font-medium">PAN Card <span className="text-red-500">*</span></Label>
                    <p className="text-[10px] text-muted-foreground">For individual verification</p>
                    <div className="mt-2">
                      <input
                        type="file"
                        id="pan-upload"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload("pan", e)}
                        className="hidden"
                      />
                      <label
                        htmlFor="pan-upload"
                        className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          formData.pan_document ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-[#1DA1F2]"
                        }`}
                      >
                        {formData.pan_document ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-700">{formData.pan_file_name}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">Upload PAN</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Aadhaar Upload */}
                  <div className="space-y-2 p-3 border border-border rounded-lg">
                    <Label className="text-sm font-medium">Aadhaar Card <span className="text-red-500">*</span></Label>
                    <p className="text-[10px] text-muted-foreground">Personal or firm verification</p>
                    <div className="mt-2">
                      <input
                        type="file"
                        id="aadhaar-upload"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload("aadhaar", e)}
                        className="hidden"
                      />
                      <label
                        htmlFor="aadhaar-upload"
                        className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          formData.aadhaar_document ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-[#1DA1F2]"
                        }`}
                      >
                        {formData.aadhaar_document ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-700">{formData.aadhaar_file_name}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">Upload Aadhaar</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Registration/Membership Certificate */}
                <div className="space-y-2 p-3 border border-border rounded-lg">
                  <Label className="text-sm font-medium">Registration/Membership Certificate <span className="text-red-500">*</span></Label>
                  <p className="text-[10px] text-muted-foreground">Upload your professional registration or membership certificate</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <input
                        type="file"
                        id="registration-upload"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload("registration", e)}
                        className="hidden"
                      />
                      <label
                        htmlFor="registration-upload"
                        className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          formData.registration_document ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-[#1DA1F2]"
                        }`}
                      >
                        {formData.registration_document ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-700">{formData.registration_file_name}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">Upload Certificate</span>
                          </>
                        )}
                      </label>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Certificate Expiry Date <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        value={formData.registration_expiry_date}
                        onChange={(e) => handleFieldChange("registration_expiry_date", e.target.value)}
                        className="text-sm"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {formData.registration_expiry_date && !isExpiryValid() && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Certificate has expired. Please upload a valid certificate.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <Card className="border border-border">
                <CardHeader className="py-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#1DA1F2]" />
                    Review Your Profile
                  </CardTitle>
                  <CardDescription className="text-xs">Please review all information before submitting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 h-8">
                      <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
                      <TabsTrigger value="registration" className="text-xs">Registration</TabsTrigger>
                      <TabsTrigger value="expertise" className="text-xs">Expertise</TabsTrigger>
                      <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-3 pt-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>Category:</strong> {getCategoryName(formData.category_id)}</div>
                        <div><strong>Name:</strong> {formData.name}</div>
                        <div><strong>Email:</strong> {formData.email}</div>
                        <div><strong>Mobile:</strong> {formData.mobile}</div>
                        {formData.agency_name && <div><strong>Firm:</strong> {formData.agency_name}</div>}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="registration" className="space-y-3 pt-3">
                      <div className="space-y-2 text-sm">
                        {Object.entries(formData.registration_numbers).map(([key, value]) => (
                          value && (
                            <div key={key} className="flex justify-between">
                              <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong>
                              <span>{value}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="expertise" className="space-y-3 pt-3">
                      <div><strong>Locations:</strong> {formData.locations.join(", ")}</div>
                      <div><strong>Experience:</strong> {formData.years_experience} years</div>
                      <div>
                        <strong>Top 3 Expertise:</strong>
                        <div className="flex gap-1 mt-1">
                          {formData.top_3_expertise.map((tag) => (
                            <Badge key={tag} className="bg-yellow-500 text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="documents" className="space-y-3 pt-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          {formData.pan_document ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-500" />}
                          <span>PAN: {formData.pan_file_name || "Not uploaded"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {formData.aadhaar_document ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-500" />}
                          <span>Aadhaar: {formData.aadhaar_file_name || "Not uploaded"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {formData.registration_document ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-500" />}
                          <span>Certificate: {formData.registration_file_name || "Not uploaded"}</span>
                        </div>
                        <div><strong>Expiry:</strong> {formData.registration_expiry_date || "Not set"}</div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Consent Section */}
              <Card className="border border-border">
                <CardContent className="py-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consent_display"
                      checked={formData.consent_display}
                      onCheckedChange={(v) => handleFieldChange("consent_display", v)}
                    />
                    <div>
                      <label htmlFor="consent_display" className="font-medium text-sm text-black cursor-pointer">
                        Display Profile to Visitors <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        I consent to displaying my profile information to IPO-seeking companies.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms_accepted"
                      checked={formData.terms_accepted}
                      onCheckedChange={(v) => handleFieldChange("terms_accepted", v)}
                      data-testid="terms-checkbox"
                    />
                    <div>
                      <label htmlFor="terms_accepted" className="font-medium text-sm text-black cursor-pointer">
                        I agree to the Terms of Use <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        By checking this box, I confirm that I have read and agree to the{" "}
                        <a href="/terms-of-use" target="_blank" className="text-[#1DA1F2] hover:underline">Terms of Use</a> and{" "}
                        <a href="/legal-disclaimer" target="_blank" className="text-[#1DA1F2] hover:underline">Legal Disclaimer</a>.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            {currentStep < 5 ? (
              <Button
                size="sm"
                onClick={() => {
                  if (validateStep(currentStep)) {
                    setCurrentStep(s => s + 1);
                  } else {
                    if (currentStep === 3 && formData.top_3_expertise.length !== 3) {
                      toast.error("Please select exactly 3 top expertise areas");
                    } else {
                      toast.error("Please fill all required fields");
                    }
                  }
                }}
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8]"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting || !formData.consent_display || !formData.terms_accepted}
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8]"
                data-testid="submit-registration-btn"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Submit Profile
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
