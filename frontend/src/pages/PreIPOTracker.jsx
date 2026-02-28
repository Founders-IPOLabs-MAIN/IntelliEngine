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
import {
  ClipboardList,
  ChevronRight,
  Loader2,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Building2
} from "lucide-react";

const PreIPOTracker = ({ user, apiClient }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [items, setItems] = useState({});
  const [generalInfo, setGeneralInfo] = useState({});
  const [activeSection, setActiveSection] = useState("corporate_governance");

  const fetchData = useCallback(async () => {
    try {
      const response = await apiClient.get(`/projects/${projectId}/pre-ipo-tracker`);
      setData(response.data);
      setItems(response.data.items || {});
      setGeneralInfo(response.data.general_info || {});
    } catch (error) {
      console.error("Failed to fetch tracker data:", error);
      toast.error("Failed to load Pre-IPO Tracker");
    } finally {
      setLoading(false);
    }
  }, [apiClient, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleItemChange = (itemId, field, value) => {
    setItems(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        [field]: value
      }
    }));
  };

  const handleGeneralInfoChange = (field, value) => {
    setGeneralInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiClient.post(`/projects/${projectId}/pre-ipo-tracker`, {
        items,
        general_info: generalInfo
      });
      setData(prev => ({ ...prev, stats: response.data.stats }));
      toast.success("Pre-IPO Tracker saved successfully");
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save tracker");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Yes": return "text-[#00FF41]";
      case "In Progress": return "text-[#FFBF00]";
      case "No": return "text-gray-500";
      default: return "text-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Yes": return <CheckCircle2 className="w-4 h-4 text-[#00FF41]" />;
      case "In Progress": return <Clock className="w-4 h-4 text-[#FFBF00]" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
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
  const completionPercent = data.stats.total > 0 
    ? Math.round((data.stats.completed / data.stats.total) * 100) 
    : 0;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]" data-testid="pre-ipo-tracker-page">
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
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Pre-IPO Tracker</h1>
                <p className="text-xs text-gray-500">IPO Readiness Checklist</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-32">
                  <Progress value={completionPercent} className="h-2" />
                </div>
                <Badge className={`${data.stats.pending > 0 ? 'bg-[#FFBF00]/20 text-[#FFBF00]' : 'bg-[#00FF41]/20 text-[#00FF41]'}`}>
                  {data.stats.completed}/{data.stats.total} Complete
                </Badge>
              </div>
              <Button onClick={handleSave} disabled={saving} className="bg-[#1DA1F2] hover:bg-[#1a8cd8]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* General Information */}
          <Card className="bg-[#111] border-gray-800 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#1DA1F2]" />
                General Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs">IPO Type</Label>
                  <Select 
                    value={generalInfo.ipo_type || ""} 
                    onValueChange={(v) => handleGeneralInfoChange("ipo_type", v)}
                  >
                    <SelectTrigger className="bg-[#0a0a0a] border-gray-800 text-white h-9">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] border-gray-800">
                      <SelectItem value="Mainboard" className="text-white">Mainboard</SelectItem>
                      <SelectItem value="SME" className="text-white">SME</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs">Target Filing Date</Label>
                  <Input
                    type="date"
                    value={generalInfo.target_filing_date || ""}
                    onChange={(e) => handleGeneralInfoChange("target_filing_date", e.target.value)}
                    className="bg-[#0a0a0a] border-gray-800 text-white h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs">Lead Manager</Label>
                  <Input
                    value={generalInfo.lead_manager || ""}
                    onChange={(e) => handleGeneralInfoChange("lead_manager", e.target.value)}
                    className="bg-[#0a0a0a] border-gray-800 text-white h-9"
                    placeholder="Enter lead manager..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs">Prepared By</Label>
                  <Input
                    value={generalInfo.prepared_by || ""}
                    onChange={(e) => handleGeneralInfoChange("prepared_by", e.target.value)}
                    className="bg-[#0a0a0a] border-gray-800 text-white h-9"
                    placeholder="Enter name..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-12 gap-6">
            {/* Section Navigation */}
            <div className="col-span-3">
              <Card className="bg-[#111] border-gray-800 sticky top-24">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm">Sections</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ScrollArea className="h-[calc(100vh-350px)]">
                    <div className="space-y-1">
                      {sections.map(([key, section]) => {
                        const sectionItems = section.items;
                        const completedInSection = sectionItems.filter(item => items[item.id]?.status === "Yes").length;
                        const inProgressInSection = sectionItems.filter(item => items[item.id]?.status === "In Progress").length;
                        
                        return (
                          <button
                            key={key}
                            onClick={() => setActiveSection(key)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                              activeSection === key 
                                ? 'bg-[#1DA1F2]/10 text-[#1DA1F2]' 
                                : 'text-gray-400 hover:bg-gray-800'
                            }`}
                          >
                            <span className="text-sm truncate pr-2">{section.name}</span>
                            <div className="flex items-center gap-1">
                              {completedInSection > 0 && (
                                <span className="text-xs text-[#00FF41]">{completedInSection}</span>
                              )}
                              {inProgressInSection > 0 && (
                                <span className="text-xs text-[#FFBF00]">/{inProgressInSection}</span>
                              )}
                              <span className="text-xs text-gray-500">/{sectionItems.length}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Checklist Content */}
            <div className="col-span-9">
              <Card className="bg-[#111] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">{data.sections[activeSection]?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.sections[activeSection]?.items.map((item, idx) => (
                      <div 
                        key={item.id} 
                        className="flex items-start gap-4 p-4 rounded-lg border border-gray-800 bg-[#0a0a0a] hover:border-gray-700 transition-colors"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white mb-3">{item.label}</p>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="text-gray-500 text-xs">Status</Label>
                              <Select 
                                value={items[item.id]?.status || ""} 
                                onValueChange={(v) => handleItemChange(item.id, "status", v)}
                              >
                                <SelectTrigger className="bg-[#111] border-gray-800 text-white h-8 text-sm">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111] border-gray-800">
                                  <SelectItem value="Yes" className="text-[#00FF41]">Yes</SelectItem>
                                  <SelectItem value="In Progress" className="text-[#FFBF00]">In Progress</SelectItem>
                                  <SelectItem value="No" className="text-gray-400">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-gray-500 text-xs">Responsible</Label>
                              <Input
                                value={items[item.id]?.responsible || ""}
                                onChange={(e) => handleItemChange(item.id, "responsible", e.target.value)}
                                className="bg-[#111] border-gray-800 text-white h-8 text-sm"
                                placeholder="Name..."
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-gray-500 text-xs">Target Date</Label>
                              <Input
                                type="date"
                                value={items[item.id]?.target_date || ""}
                                onChange={(e) => handleItemChange(item.id, "target_date", e.target.value)}
                                className="bg-[#111] border-gray-800 text-white h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-gray-500 text-xs">Remarks</Label>
                              <Input
                                value={items[item.id]?.remarks || ""}
                                onChange={(e) => handleItemChange(item.id, "remarks", e.target.value)}
                                className="bg-[#111] border-gray-800 text-white h-8 text-sm"
                                placeholder="Notes..."
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusIcon(items[item.id]?.status)}
                        </div>
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

export default PreIPOTracker;
