import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  UserCheck,
  ChevronRight,
  Loader2,
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  User
} from "lucide-react";

const KMPChecklist = ({ user, apiClient }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [kmps, setKmps] = useState([]);
  const [activeKMP, setActiveKMP] = useState(null);
  const [activeSection, setActiveSection] = useState("personal_info");
  const [formData, setFormData] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [kmpToDelete, setKmpToDelete] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await apiClient.get(`/projects/${projectId}/kmp-checklist`);
      setData(response.data);
      setKmps(response.data.kmps || []);
      if (response.data.kmps?.length > 0) {
        setActiveKMP(response.data.kmps[0].kmp_id);
        setFormData(response.data.kmps[0].data || {});
      }
    } catch (error) {
      console.error("Failed to fetch KMP data:", error);
      toast.error("Failed to load KMP checklist");
    } finally {
      setLoading(false);
    }
  }, [apiClient, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleKMPChange = (kmpId) => {
    const kmp = kmps.find(k => k.kmp_id === kmpId);
    setActiveKMP(kmpId);
    setFormData(kmp?.data || {});
    setActiveSection("personal_info");
  };

  const handleAddKMP = () => {
    const newKMP = {
      kmp_id: `new_${Date.now()}`,
      data: {},
      isNew: true
    };
    setKmps([...kmps, newKMP]);
    setActiveKMP(newKMP.kmp_id);
    setFormData({});
    setActiveSection("personal_info");
  };

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
      const response = await apiClient.post(`/projects/${projectId}/kmp-checklist`, {
        kmp_id: activeKMP?.startsWith('new_') ? null : activeKMP,
        data: formData
      });
      
      const updatedKmps = kmps.map(k => 
        k.kmp_id === activeKMP 
          ? { ...k, kmp_id: response.data.kmp_id, data: formData, isNew: false }
          : k
      );
      setKmps(updatedKmps);
      setActiveKMP(response.data.kmp_id);
      
      toast.success("KMP saved successfully");
      fetchData();
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save KMP data");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!kmpToDelete) return;
    
    try {
      if (!kmpToDelete.startsWith('new_')) {
        await apiClient.delete(`/projects/${projectId}/kmp-checklist/${kmpToDelete}`);
      }
      
      const updatedKmps = kmps.filter(k => k.kmp_id !== kmpToDelete);
      setKmps(updatedKmps);
      
      if (activeKMP === kmpToDelete) {
        if (updatedKmps.length > 0) {
          setActiveKMP(updatedKmps[0].kmp_id);
          setFormData(updatedKmps[0].data || {});
        } else {
          setActiveKMP(null);
          setFormData({});
        }
      }
      
      toast.success("KMP deleted");
      setDeleteDialogOpen(false);
      setKmpToDelete(null);
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete KMP");
    }
  };

  const renderField = (sectionKey, field) => {
    const value = formData[sectionKey]?.[field.id] || "";
    
    if (field.type === "select") {
      return (
        <div key={field.id} className="space-y-2">
          <Label className="text-gray-300 flex items-center gap-2">
            {field.label}
            {field.required && <span className="text-red-400 text-xs">*</span>}
          </Label>
          <Select value={value} onValueChange={(v) => handleFieldChange(sectionKey, field.id, v)}>
            <SelectTrigger className="bg-[#0a0a0a] border-gray-800 text-white">
              <SelectValue placeholder={`Select...`} />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-gray-800">
              {field.options?.map(opt => (
                <SelectItem key={opt} value={opt} className="text-white">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    
    if (field.type === "textarea" || field.type === "table") {
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
    
    return (
      <div key={field.id} className="space-y-2">
        <Label className="text-gray-300 flex items-center gap-2">
          {field.label}
          {field.required && <span className="text-red-400 text-xs">*</span>}
        </Label>
        <Input
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
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
          <Loader2 className="w-10 h-10 animate-spin text-[#1DA1F2]" />
        </main>
      </div>
    );
  }

  if (!data) return null;

  const sections = Object.entries(data.sections);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]" data-testid="kmp-checklist-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64 pb-20">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(`/project/${projectId}/command-center`)} className="text-gray-400 hover:text-white flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <ChevronRight className="w-4 h-4 text-gray-600" />
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">KMP Checklist</h1>
                <p className="text-xs text-gray-500">Key Managerial Personnel</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={`${data.stats.pending > 0 ? 'bg-[#FFBF00]/20 text-[#FFBF00]' : 'bg-[#00FF41]/20 text-[#00FF41]'}`}>
                {data.stats.pending > 0 ? `${data.stats.pending} Pending` : 'Complete'}
              </Badge>
              <Button onClick={handleAddKMP} variant="outline" className="border-gray-700 text-gray-300">
                <Plus className="w-4 h-4 mr-2" />
                Add KMP
              </Button>
              <Button onClick={handleSave} disabled={saving || !activeKMP} className="bg-[#1DA1F2] hover:bg-[#1a8cd8]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {kmps.length === 0 ? (
            <Card className="bg-[#111] border-gray-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserCheck className="w-12 h-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No KMPs Added</h3>
                <p className="text-gray-500 mb-4">Add your first Key Managerial Personnel to start</p>
                <Button onClick={handleAddKMP} className="bg-[#1DA1F2]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add KMP
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-12 gap-6">
              {/* KMP List */}
              <div className="col-span-3">
                <Card className="bg-[#111] border-gray-800 mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">KMPs ({kmps.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      {kmps.map((kmp, idx) => (
                        <div
                          key={kmp.kmp_id}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                            activeKMP === kmp.kmp_id ? 'bg-[#1DA1F2]/10 text-[#1DA1F2]' : 'text-gray-400 hover:bg-gray-800'
                          }`}
                          onClick={() => handleKMPChange(kmp.kmp_id)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                              <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-medium truncate block">
                                {kmp.data?.personal_info?.legal_name || `KMP ${idx + 1}`}
                              </span>
                              <span className="text-xs text-gray-500 truncate block">
                                {kmp.data?.professional_profile?.designation || 'No designation'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setKmpToDelete(kmp.kmp_id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Section Navigation */}
                <Card className="bg-[#111] border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Sections</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-1">
                        {sections.map(([key, section]) => {
                          const sectionData = formData[key] || {};
                          const filledFields = Object.values(sectionData).filter(v => v && String(v).trim()).length;
                          const totalFields = section.fields.length;
                          
                          return (
                            <button
                              key={key}
                              onClick={() => setActiveSection(key)}
                              className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                                activeSection === key ? 'bg-[#1DA1F2]/10 text-[#1DA1F2]' : 'text-gray-400 hover:bg-gray-800'
                              }`}
                            >
                              <span className="text-sm truncate pr-2">{section.name}</span>
                              <span className="text-xs text-gray-500">{filledFields}/{totalFields}</span>
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
                    <CardTitle className="text-white">{data.sections[activeSection]?.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      {data.sections[activeSection]?.fields.map(field => (
                        <div key={field.id} className={field.type === "textarea" || field.type === "table" ? "col-span-2" : ""}>
                          {renderField(activeSection, field)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#111] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete KMP</DialogTitle>
          </DialogHeader>
          <p className="text-gray-400">Are you sure you want to delete this KMP? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-gray-700">Cancel</Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KMPChecklist;
