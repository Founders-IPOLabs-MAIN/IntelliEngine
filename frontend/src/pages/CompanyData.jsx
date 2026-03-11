import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import DocumentUploader from "@/components/DocumentUploader";
import {
  Building2,
  ChevronRight,
  Loader2,
  Save,
  CheckCircle2,
  FileText,
  ArrowLeft,
  Upload
} from "lucide-react";

const CompanyData = ({ user, apiClient }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [formData, setFormData] = useState({});
  const [activeSection, setActiveSection] = useState("corporate_identification");

  const fetchData = useCallback(async () => {
    try {
      const response = await apiClient.get(`/projects/${projectId}/company-data`);
      setData(response.data);
      setFormData(response.data.data || {});
    } catch (error) {
      console.error("Failed to fetch company data:", error);
      toast.error("Failed to load company data");
    } finally {
      setLoading(false);
    }
  }, [apiClient, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFieldChange = (sectionKey, fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] || {}),
        [fieldId]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiClient.post(`/projects/${projectId}/company-data`, {
        data: formData
      });
      toast.success("Company data saved successfully. Data synced to all DRHP modules.");
      setData(prev => ({ ...prev, stats: response.data.stats }));
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save company data");
    } finally {
      setSaving(false);
    }
  };

  // Handle data extracted from document upload
  const handleDataExtracted = (extractedData) => {
    if (!extractedData) return;
    
    // Map extracted fields to form sections
    const fieldMappings = {
      full_legal_name: ["corporate_identification", "full_legal_name"],
      cin: ["corporate_identification", "cin"],
      pan: ["corporate_identification", "pan"],
      gstin: ["corporate_identification", "gstin"],
      registered_office_address: ["corporate_identification", "registered_address"],
      corporate_office_address: ["corporate_identification", "corporate_address"],
      website: ["corporate_identification", "website"],
      email: ["corporate_identification", "email"],
      phone: ["corporate_identification", "phone"],
      date_of_incorporation: ["corporate_identification", "incorporation_date"],
      business_description: ["business_details", "business_description"],
      main_objects: ["business_details", "main_objects"],
      authorized_capital: ["share_capital", "authorized_capital"],
      paid_up_capital: ["share_capital", "paid_up_capital"],
      sector: ["business_details", "sector"],
      total_revenue: ["financials", "total_revenue"],
      net_profit: ["financials", "net_profit"]
    };
    
    const newFormData = { ...formData };
    let fieldsPopulated = 0;
    
    Object.entries(extractedData).forEach(([key, value]) => {
      if (value && fieldMappings[key]) {
        const [section, field] = fieldMappings[key];
        if (!newFormData[section]) {
          newFormData[section] = {};
        }
        newFormData[section][field] = value;
        fieldsPopulated++;
      }
    });
    
    if (fieldsPopulated > 0) {
      setFormData(newFormData);
      toast.success(`${fieldsPopulated} fields auto-populated from document`);
    }
  };

  const renderField = (sectionKey, field) => {
    const value = formData[sectionKey]?.[field.id] || "";
    
    if (field.type === "textarea" || field.type === "table") {
      return (
        <div key={field.id} className="space-y-2">
          <Label className="text-gray-700 flex items-center gap-2">
            {field.label}
            {field.required && <span className="text-red-500 text-xs">*</span>}
          </Label>
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(sectionKey, field.id, e.target.value)}
            className="bg-white border-gray-300 text-gray-900 min-h-[100px]"
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
          {field.type === "table" && <p className="text-xs text-gray-500">Enter each item on a new line</p>}
        </div>
      );
    }
    
    return (
      <div key={field.id} className="space-y-2">
        <Label className="text-gray-700 flex items-center gap-2">
          {field.label}
          {field.required && <span className="text-red-500 text-xs">*</span>}
        </Label>
        <Input
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
          value={value}
          onChange={(e) => handleFieldChange(sectionKey, field.id, e.target.value)}
          className="bg-white border-gray-300 text-gray-900"
          placeholder={`Enter ${field.label.toLowerCase()}...`}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
        </main>
      </div>
    );
  }

  if (!data) return null;

  const sections = Object.entries(data.sections);

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="company-data-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(`/project/${projectId}/command-center`)} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Company Data</h1>
                <p className="text-xs text-gray-500">Corporate & Business Information</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={`${data.stats.pending > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                {data.stats.completed}/{data.stats.total} Complete
              </Badge>
              <Button onClick={handleSave} disabled={saving} className="bg-[#1DA1F2] hover:bg-[#1a8cd8]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Document Upload Section */}
          <div className="mb-6">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <Upload className="w-6 h-6 text-[#1DA1F2]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Quick Upload with OCR</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Upload company documents (MOA, AOA, Certificates) and we'll automatically extract and populate the fields below.
                      Data syncs to all DRHP modules.
                    </p>
                    <DocumentUploader
                      apiClient={apiClient}
                      projectId={projectId}
                      moduleName="company_data"
                      onDataExtracted={handleDataExtracted}
                      compact={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Section Navigation */}
            <div className="col-span-3">
              <Card className="bg-white border-gray-200 sticky top-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-900 text-sm">Sections</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="space-y-1">
                      {sections.map(([key, section]) => {
                        const sectionData = formData[key] || {};
                        const filledFields = Object.values(sectionData).filter(v => v && String(v).trim()).length;
                        const totalFields = section.fields.length;
                        const isComplete = filledFields === totalFields;
                        
                        return (
                          <button
                            key={key}
                            onClick={() => setActiveSection(key)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                              activeSection === key 
                                ? 'bg-[#1DA1F2]/10 text-[#1DA1F2]' 
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <span className="text-sm font-medium truncate pr-2">{section.name}</span>
                            {isComplete ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <span className="text-xs text-gray-400 flex-shrink-0">{filledFields}/{totalFields}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Form Content */}
            <div className="col-span-9">
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#1DA1F2]" />
                    {data.sections[activeSection]?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {data.sections[activeSection]?.fields.map(field => renderField(activeSection, field))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanyData;
