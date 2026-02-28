import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  Building2,
  ChevronRight,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  FileText,
  ArrowLeft
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
      toast.success("Company data saved successfully");
      setData(prev => ({ ...prev, stats: response.data.stats }));
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save company data");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (sectionKey, field) => {
    const value = formData[sectionKey]?.[field.id] || "";
    
    if (field.type === "textarea") {
      return (
        <div key={field.id} className="space-y-2">
          <Label className="text-gray-300 flex items-center gap-2">
            {field.label}
            {field.required && <span className="text-red-400 text-xs">*</span>}
          </Label>
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(sectionKey, field.id, e.target.value)}
            className="bg-[#0a0a0a] border-gray-800 text-white min-h-[100px]"
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
        </div>
      );
    }
    
    if (field.type === "table") {
      return (
        <div key={field.id} className="space-y-2">
          <Label className="text-gray-300 flex items-center gap-2">
            {field.label}
            {field.required && <span className="text-red-400 text-xs">*</span>}
          </Label>
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(sectionKey, field.id, e.target.value)}
            className="bg-[#0a0a0a] border-gray-800 text-white min-h-[120px]"
            placeholder={`Enter ${field.label.toLowerCase()} (one entry per line)...`}
          />
          <p className="text-xs text-gray-500">Enter each item on a new line</p>
        </div>
      );
    }
    
    return (
      <div key={field.id} className="space-y-2">
        <Label className="text-gray-300 flex items-center gap-2">
          {field.label}
          {field.required && <span className="text-red-400 text-xs">*</span>}
        </Label>
        <Input
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
          value={value}
          onChange={(e) => handleFieldChange(sectionKey, field.id, e.target.value)}
          className="bg-[#0a0a0a] border-gray-800 text-white"
          placeholder={`Enter ${field.label.toLowerCase()}...`}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#1DA1F2]" />
            <p className="text-gray-400 text-sm">Loading Company Data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const sections = Object.entries(data.sections);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]" data-testid="company-data-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64 pb-20">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(`/project/${projectId}/command-center`)} 
                className="text-gray-400 hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <ChevronRight className="w-4 h-4 text-gray-600" />
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Company Data</h1>
                <p className="text-xs text-gray-500">Corporate & Business Information</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge className={`${data.stats.pending > 0 ? 'bg-[#FFBF00]/20 text-[#FFBF00]' : 'bg-[#00FF41]/20 text-[#00FF41]'}`}>
                  {data.stats.completed}/{data.stats.total} Complete
                </Badge>
              </div>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Section Navigation */}
            <div className="col-span-3">
              <Card className="bg-[#111] border-gray-800 sticky top-24">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm">Sections</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ScrollArea className="h-[calc(100vh-250px)]">
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
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                          >
                            <span className="text-sm font-medium truncate pr-2">{section.name}</span>
                            {isComplete ? (
                              <CheckCircle2 className="w-4 h-4 text-[#00FF41] flex-shrink-0" />
                            ) : (
                              <span className="text-xs text-gray-500 flex-shrink-0">{filledFields}/{totalFields}</span>
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
              <Card className="bg-[#111] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
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
