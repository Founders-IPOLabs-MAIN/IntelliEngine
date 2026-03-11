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
import {
  Users,
  ChevronRight,
  Loader2,
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  User,
  Upload
} from "lucide-react";

const PromoterChecklist = ({ user, apiClient }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [promoters, setPromoters] = useState([]);
  const [activePromoter, setActivePromoter] = useState(null);
  const [activeSection, setActiveSection] = useState("personal_info");
  const [formData, setFormData] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promoterToDelete, setPromoterToDelete] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await apiClient.get(`/projects/${projectId}/promoter-checklist`);
      setData(response.data);
      setPromoters(response.data.promoters || []);
      if (response.data.promoters?.length > 0) {
        setActivePromoter(response.data.promoters[0].promoter_id);
        setFormData(response.data.promoters[0].data || {});
      }
    } catch (error) {
      console.error("Failed to fetch promoter data:", error);
      toast.error("Failed to load promoter checklist");
    } finally {
      setLoading(false);
    }
  }, [apiClient, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePromoterChange = (promoterId) => {
    const promoter = promoters.find(p => p.promoter_id === promoterId);
    setActivePromoter(promoterId);
    setFormData(promoter?.data || {});
    setActiveSection("personal_info");
  };

  const handleAddPromoter = () => {
    const newPromoter = { promoter_id: `new_${Date.now()}`, data: {}, isNew: true };
    setPromoters([...promoters, newPromoter]);
    setActivePromoter(newPromoter.promoter_id);
    setFormData({});
    setActiveSection("personal_info");
  };

  const handleFieldChange = (sectionKey, fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] || {}), [fieldId]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiClient.post(`/projects/${projectId}/promoter-checklist`, {
        promoter_id: activePromoter?.startsWith('new_') ? null : activePromoter,
        data: formData
      });
      const updatedPromoters = promoters.map(p => 
        p.promoter_id === activePromoter 
          ? { ...p, promoter_id: response.data.promoter_id, data: formData, isNew: false }
          : p
      );
      setPromoters(updatedPromoters);
      setActivePromoter(response.data.promoter_id);
      toast.success("Promoter saved successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to save promoter data");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!promoterToDelete) return;
    try {
      if (!promoterToDelete.startsWith('new_')) {
        await apiClient.delete(`/projects/${projectId}/promoter-checklist/${promoterToDelete}`);
      }
      const updatedPromoters = promoters.filter(p => p.promoter_id !== promoterToDelete);
      setPromoters(updatedPromoters);
      if (activePromoter === promoterToDelete) {
        if (updatedPromoters.length > 0) {
          setActivePromoter(updatedPromoters[0].promoter_id);
          setFormData(updatedPromoters[0].data || {});
        } else {
          setActivePromoter(null);
          setFormData({});
        }
      }
      toast.success("Promoter deleted");
      setDeleteDialogOpen(false);
      setPromoterToDelete(null);
    } catch (error) {
      toast.error("Failed to delete promoter");
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
            <SelectContent className="bg-white border-gray-200">
              {field.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
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
        <Input type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text"} value={value} onChange={(e) => handleFieldChange(sectionKey, field.id, e.target.value)} className="bg-white border-gray-300" placeholder={`Enter ${field.label.toLowerCase()}...`} />
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
    <div className="flex min-h-screen bg-gray-50" data-testid="promoter-checklist-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(`/project/${projectId}/command-center`)} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
                <ArrowLeft className="w-4 h-4" />Back
              </button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Promoter Checklist</h1>
                <p className="text-xs text-gray-500">Promoter Details & KYC</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${data.stats.pending > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                {data.stats.pending > 0 ? `${data.stats.pending} Pending` : 'Complete'}
              </Badge>
              <Button onClick={handleAddPromoter} variant="outline" className="border-gray-300">
                <Plus className="w-4 h-4 mr-2" />Add Promoter
              </Button>
              <Button onClick={handleSave} disabled={saving || !activePromoter} className="bg-[#1DA1F2] hover:bg-[#1a8cd8]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {promoters.length === 0 ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Promoters Added</h3>
                <p className="text-gray-500 mb-4">Add your first promoter to start</p>
                <Button onClick={handleAddPromoter} className="bg-[#1DA1F2]"><Plus className="w-4 h-4 mr-2" />Add Promoter</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-3">
                <Card className="bg-white border-gray-200 mb-4">
                  <CardHeader className="pb-2"><CardTitle className="text-gray-900 text-sm">Promoters ({promoters.length})</CardTitle></CardHeader>
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      {promoters.map((promoter, idx) => (
                        <div key={promoter.promoter_id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${activePromoter === promoter.promoter_id ? 'bg-[#1DA1F2]/10 text-[#1DA1F2]' : 'text-gray-600 hover:bg-gray-100'}`} onClick={() => handlePromoterChange(promoter.promoter_id)}>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><User className="w-4 h-4" /></div>
                            <span className="text-sm font-medium truncate">{promoter.data?.personal_info?.legal_name || `Promoter ${idx + 1}`}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setPromoterToDelete(promoter.promoter_id); setDeleteDialogOpen(true); }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white border-gray-200">
                  <CardHeader className="pb-2"><CardTitle className="text-gray-900 text-sm">Sections</CardTitle></CardHeader>
                  <CardContent className="p-2">
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-1">
                        {sections.map(([key, section]) => {
                          const sectionData = formData[key] || {};
                          const filledFields = Object.values(sectionData).filter(v => v && String(v).trim()).length;
                          return (
                            <button key={key} onClick={() => setActiveSection(key)} className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${activeSection === key ? 'bg-[#1DA1F2]/10 text-[#1DA1F2]' : 'text-gray-600 hover:bg-gray-100'}`}>
                              <span className="text-sm truncate pr-2">{section.name}</span>
                              <span className="text-xs text-gray-400">{filledFields}/{section.fields.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-9">
                <Card className="bg-white border-gray-200">
                  <CardHeader><CardTitle className="text-gray-900">{data.sections[activeSection]?.name}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      {data.sections[activeSection]?.fields.map(field => (
                        <div key={field.id} className={field.type === "textarea" || field.type === "table" ? "col-span-2" : ""}>{renderField(activeSection, field)}</div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader><DialogTitle>Delete Promoter</DialogTitle></DialogHeader>
          <p className="text-gray-600">Are you sure you want to delete this promoter?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromoterChecklist;
