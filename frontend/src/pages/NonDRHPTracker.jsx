import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import { FileCheck, ChevronRight, Loader2, Save, CheckCircle2, Clock, AlertCircle, ArrowLeft } from "lucide-react";

const NonDRHPTracker = ({ user, apiClient }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [items, setItems] = useState({});
  const [activeSection, setActiveSection] = useState("corporate_restructuring");

  const fetchData = useCallback(async () => {
    try {
      const response = await apiClient.get(`/projects/${projectId}/non-drhp-tracker`);
      setData(response.data);
      setItems(response.data.items || {});
    } catch (error) {
      toast.error("Failed to load Non-DRHP Tracker");
    } finally {
      setLoading(false);
    }
  }, [apiClient, projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleItemChange = (itemId, field, value) => {
    setItems(prev => ({ ...prev, [itemId]: { ...(prev[itemId] || {}), [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiClient.post(`/projects/${projectId}/non-drhp-tracker`, { items });
      setData(prev => ({ ...prev, stats: response.data.stats }));
      toast.success("Non-DRHP Tracker saved successfully");
    } catch (error) {
      toast.error("Failed to save tracker");
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Yes": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "In Progress": return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) return (<div className="flex min-h-screen bg-gray-50"><Sidebar user={user} apiClient={apiClient} /><main className="flex-1 ml-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" /></main></div>);
  if (!data) return null;

  const sections = Object.entries(data.sections);
  const completionPercent = data.stats.total > 0 ? Math.round((data.stats.completed / data.stats.total) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="non-drhp-tracker-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(`/project/${projectId}/command-center`)} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" />Back</button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center"><FileCheck className="w-5 h-5 text-indigo-600" /></div>
              <div><h1 className="text-lg font-semibold text-gray-900">Non-DRHP Tracker</h1><p className="text-xs text-gray-500">Non-DRHP Compliance Items</p></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-32"><Progress value={completionPercent} className="h-2" /></div>
                <Badge className={`${data.stats.pending > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>{data.stats.completed}/{data.stats.total} Complete</Badge>
              </div>
              <Button onClick={handleSave} disabled={saving} className="bg-[#1DA1F2] hover:bg-[#1a8cd8]">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save</Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-3">
              <Card className="bg-white border-gray-200 sticky top-6">
                <CardHeader className="pb-2"><CardTitle className="text-gray-900 text-sm">Sections</CardTitle></CardHeader>
                <CardContent className="p-2">
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="space-y-1">
                      {sections.map(([key, section]) => {
                        const sectionItems = section.items;
                        const completedInSection = sectionItems.filter(item => items[item.id]?.status === "Yes").length;
                        const inProgressInSection = sectionItems.filter(item => items[item.id]?.status === "In Progress").length;
                        return (
                          <button key={key} onClick={() => setActiveSection(key)} className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${activeSection === key ? 'bg-[#1DA1F2]/10 text-[#1DA1F2]' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <span className="text-sm truncate pr-2">{section.name}</span>
                            <div className="flex items-center gap-1">
                              {completedInSection > 0 && <span className="text-xs text-green-600">{completedInSection}</span>}
                              {inProgressInSection > 0 && <span className="text-xs text-amber-600">/{inProgressInSection}</span>}
                              <span className="text-xs text-gray-400">/{sectionItems.length}</span>
                            </div>
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
                  <div className="space-y-3">
                    {data.sections[activeSection]?.items.map((item, idx) => (
                      <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50 hover:border-gray-300 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 mb-3">{item.label}</p>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="text-gray-500 text-xs">Status</Label>
                              <Select value={items[item.id]?.status || ""} onValueChange={(v) => handleItemChange(item.id, "status", v)}>
                                <SelectTrigger className="bg-white border-gray-300 h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent className="bg-white"><SelectItem value="Yes" className="text-green-600">Yes</SelectItem><SelectItem value="In Progress" className="text-amber-600">In Progress</SelectItem><SelectItem value="No" className="text-gray-500">No</SelectItem></SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-gray-500 text-xs">Responsible</Label>
                              <Input value={items[item.id]?.responsible || ""} onChange={(e) => handleItemChange(item.id, "responsible", e.target.value)} className="bg-white border-gray-300 h-8 text-sm" placeholder="Name..." />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-gray-500 text-xs">Target Date</Label>
                              <Input type="date" value={items[item.id]?.target_date || ""} onChange={(e) => handleItemChange(item.id, "target_date", e.target.value)} className="bg-white border-gray-300 h-8 text-sm" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-gray-500 text-xs">Remarks</Label>
                              <Input value={items[item.id]?.remarks || ""} onChange={(e) => handleItemChange(item.id, "remarks", e.target.value)} className="bg-white border-gray-300 h-8 text-sm" placeholder="Notes..." />
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">{getStatusIcon(items[item.id]?.status)}</div>
                      </div>
                    ))}
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

export default NonDRHPTracker;
