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
import DocumentUploader from "@/components/DocumentUploader";
import { UserCheck, ChevronRight, Loader2, Save, Plus, Trash2, ArrowLeft, User, Upload } from "lucide-react";

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
      toast.error("Failed to load KMP checklist");
    } finally {
      setLoading(false);
    }
  }, [apiClient, projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleKMPChange = (kmpId) => {
    const kmp = kmps.find(k => k.kmp_id === kmpId);
    setActiveKMP(kmpId);
    setFormData(kmp?.data || {});
    setActiveSection("personal_info");
  };

  const handleAddKMP = () => {
    const newKMP = { kmp_id: `new_${Date.now()}`, data: {}, isNew: true };
    setKmps([...kmps, newKMP]);
    setActiveKMP(newKMP.kmp_id);
    setFormData({});
  };

  const handleFieldChange = (sectionKey, fieldId, value) => {
    setFormData(prev => ({ ...prev, [sectionKey]: { ...(prev[sectionKey] || {}), [fieldId]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiClient.post(`/projects/${projectId}/kmp-checklist`, {
        kmp_id: activeKMP?.startsWith('new_') ? null : activeKMP,
        data: formData
      });
      const updatedKmps = kmps.map(k => k.kmp_id === activeKMP ? { ...k, kmp_id: response.data.kmp_id, data: formData, isNew: false } : k);
      setKmps(updatedKmps);
      setActiveKMP(response.data.kmp_id);
      toast.success("KMP saved successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to save KMP data");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!kmpToDelete) return;
    try {
      if (!kmpToDelete.startsWith('new_')) await apiClient.delete(`/projects/${projectId}/kmp-checklist/${kmpToDelete}`);
      const updatedKmps = kmps.filter(k => k.kmp_id !== kmpToDelete);
      setKmps(updatedKmps);
      if (activeKMP === kmpToDelete) {
        if (updatedKmps.length > 0) { setActiveKMP(updatedKmps[0].kmp_id); setFormData(updatedKmps[0].data || {}); }
        else { setActiveKMP(null); setFormData({}); }
      }
      toast.success("KMP deleted");
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete KMP");
    }
  };

  const renderField = (sectionKey, field) => {
    const value = formData[sectionKey]?.[field.id] || "";
    if (field.type === "select") {
      return (
        <div key={field.id} className="space-y-2">
          <Label className="text-gray-700">{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
          <Select value={value} onValueChange={(v) => handleFieldChange(sectionKey, field.id, v)}>
            <SelectTrigger className="bg-white border-gray-300"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent className="bg-white">{field.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      );
    }
    if (field.type === "textarea" || field.type === "table") {
      return (
        <div key={field.id} className="space-y-2">
          <Label className="text-gray-700">{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
          <Textarea value={value} onChange={(e) => handleFieldChange(sectionKey, field.id, e.target.value)} className="bg-white border-gray-300 min-h-[100px]" placeholder={`Enter ${field.label.toLowerCase()}...`} />
        </div>
      );
    }
    return (
      <div key={field.id} className="space-y-2">
        <Label className="text-gray-700">{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
        <Input type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text"} value={value} onChange={(e) => handleFieldChange(sectionKey, field.id, e.target.value)} className="bg-white border-gray-300" />
      </div>
    );
  };

  if (loading) return (<div className="flex min-h-screen bg-gray-50"><Sidebar user={user} apiClient={apiClient} /><main className="flex-1 ml-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" /></main></div>);
  if (!data) return null;
  const sections = Object.entries(data.sections);

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="kmp-checklist-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(`/project/${projectId}/command-center`)} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" />Back</button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center"><UserCheck className="w-5 h-5 text-green-600" /></div>
              <div><h1 className="text-lg font-semibold text-gray-900">KMP Checklist</h1><p className="text-xs text-gray-500">Key Managerial Personnel</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${data.stats.pending > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>{data.stats.pending > 0 ? `${data.stats.pending} Pending` : 'Complete'}</Badge>
              <Button onClick={handleAddKMP} variant="outline" className="border-gray-300"><Plus className="w-4 h-4 mr-2" />Add KMP</Button>
              <Button onClick={handleSave} disabled={saving || !activeKMP} className="bg-[#1DA1F2] hover:bg-[#1a8cd8]">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save</Button>
            </div>
          </div>
        </header>
        <div className="p-6">
          {/* Document Upload Section */}
          <div className="mb-6">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <Upload className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Quick Upload with OCR</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Upload KMP documents (appointment letters, ID proofs) and we'll auto-extract the information.
                      Data syncs to all DRHP modules.
                    </p>
                    <DocumentUploader
                      apiClient={apiClient}
                      projectId={projectId}
                      moduleName="kmp_checklist"
                      onDataExtracted={(extractedData) => {
                        if (extractedData && activeKMP) {
                          const newFormData = { ...formData };
                          Object.entries(extractedData).forEach(([key, value]) => {
                            if (value) {
                              if (key.includes('name')) newFormData.personal_info = { ...newFormData.personal_info, legal_name: value };
                              if (key.includes('din')) newFormData.personal_info = { ...newFormData.personal_info, din: value };
                              if (key.includes('pan')) newFormData.personal_info = { ...newFormData.personal_info, pan: value };
                              if (key.includes('designation')) newFormData.professional_profile = { ...newFormData.professional_profile, designation: value };
                            }
                          });
                          setFormData(newFormData);
                          toast.success("KMP data extracted and populated");
                        }
                      }}
                      compact={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {kmps.length === 0 ? (
            <Card className="bg-white border-gray-200"><CardContent className="flex flex-col items-center justify-center py-12"><UserCheck className="w-12 h-12 text-gray-300 mb-4" /><h3 className="text-lg font-medium text-gray-900 mb-2">No KMPs Added</h3><p className="text-gray-500 mb-4">Add your first Key Managerial Personnel</p><Button onClick={handleAddKMP} className="bg-[#1DA1F2]"><Plus className="w-4 h-4 mr-2" />Add KMP</Button></CardContent></Card>
          ) : (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-3">
                <Card className="bg-white border-gray-200 mb-4"><CardHeader className="pb-2"><CardTitle className="text-gray-900 text-sm">KMPs ({kmps.length})</CardTitle></CardHeader><CardContent className="p-2"><div className="space-y-1">{kmps.map((kmp, idx) => (<div key={kmp.kmp_id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${activeKMP === kmp.kmp_id ? 'bg-[#1DA1F2]/10 text-[#1DA1F2]' : 'text-gray-600 hover:bg-gray-100'}`} onClick={() => handleKMPChange(kmp.kmp_id)}><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><User className="w-4 h-4" /></div><div className="min-w-0"><span className="text-sm font-medium truncate block">{kmp.data?.personal_info?.legal_name || `KMP ${idx + 1}`}</span><span className="text-xs text-gray-400 truncate block">{kmp.data?.professional_profile?.designation || 'No designation'}</span></div></div><button onClick={(e) => { e.stopPropagation(); setKmpToDelete(kmp.kmp_id); setDeleteDialogOpen(true); }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div>))}</div></CardContent></Card>
                <Card className="bg-white border-gray-200"><CardHeader className="pb-2"><CardTitle className="text-gray-900 text-sm">Sections</CardTitle></CardHeader><CardContent className="p-2"><ScrollArea className="h-[300px]"><div className="space-y-1">{sections.map(([key, section]) => { const sectionData = formData[key] || {}; const filledFields = Object.values(sectionData).filter(v => v && String(v).trim()).length; return (<button key={key} onClick={() => setActiveSection(key)} className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${activeSection === key ? 'bg-[#1DA1F2]/10 text-[#1DA1F2]' : 'text-gray-600 hover:bg-gray-100'}`}><span className="text-sm truncate pr-2">{section.name}</span><span className="text-xs text-gray-400">{filledFields}/{section.fields.length}</span></button>); })}</div></ScrollArea></CardContent></Card>
              </div>
              <div className="col-span-9"><Card className="bg-white border-gray-200"><CardHeader><CardTitle className="text-gray-900">{data.sections[activeSection]?.name}</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-6">{data.sections[activeSection]?.fields.map(field => (<div key={field.id} className={field.type === "textarea" || field.type === "table" ? "col-span-2" : ""}>{renderField(activeSection, field)}</div>))}</div></CardContent></Card></div>
            </div>
          )}
        </div>
      </main>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}><DialogContent className="bg-white"><DialogHeader><DialogTitle>Delete KMP</DialogTitle></DialogHeader><p className="text-gray-600">Are you sure you want to delete this KMP?</p><DialogFooter><Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button><Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
};

export default KMPChecklist;
