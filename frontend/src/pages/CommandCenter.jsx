import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  FileText,
  ChevronRight,
  Loader2,
  Building2,
  Landmark,
  Eye,
  Download,
  FolderOpen,
  ScrollText,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Save
} from "lucide-react";

const PENDING_OPTIONS = [
  "Shares Demat", "Private to Public", "KMP Appointments",
  "Indp. Directors Appointment", "RTA Process", "Funding",
  "Audit Reports", "Website", "Payments"
];

const BOARD_OPTIONS = ["BSE SME", "NSE Emerge", "NSE Main", "BSE Main"];

const KEY_DATA_ROLES = ["CA", "CFO", "Sales POC", "IT POC", "Auditors"];

const CommandCenter = ({ user, apiClient }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);

  // Dashboard state
  const [projectHead, setProjectHead] = useState({ name: "", email: "", mobile: "" });
  const [clientPocs, setClientPocs] = useState([{ name: "", email: "", mobile: "", title: "Owner" }]);
  const [clientKeyData, setClientKeyData] = useState(
    KEY_DATA_ROLES.map(role => ({ role, name: "", email: "", mobile: "" }))
  );
  const [drhpSubmissionDate, setDrhpSubmissionDate] = useState("");
  const [drhpFirstDraftDate, setDrhpFirstDraftDate] = useState("");
  const [boardSelection, setBoardSelection] = useState("");
  const [pendingItems, setPendingItems] = useState([]);
  const [customPending, setCustomPending] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [projectRes, dashRes] = await Promise.all([
        apiClient.get(`/projects/${projectId}/command-center`),
        apiClient.get(`/projects/${projectId}/dashboard-data`).catch(() => ({ data: null }))
      ]);
      setData(projectRes.data);

      if (dashRes.data && dashRes.data.project_head) {
        setProjectHead(dashRes.data.project_head || { name: "", email: "", mobile: "" });
        if (dashRes.data.client_pocs?.length) setClientPocs(dashRes.data.client_pocs);
        if (dashRes.data.client_key_data?.length) setClientKeyData(dashRes.data.client_key_data);
        if (dashRes.data.drhp_submission_date) setDrhpSubmissionDate(dashRes.data.drhp_submission_date);
        if (dashRes.data.drhp_first_draft_date) setDrhpFirstDraftDate(dashRes.data.drhp_first_draft_date);
        if (dashRes.data.board_selection) setBoardSelection(dashRes.data.board_selection);
        if (dashRes.data.pending_items?.length) setPendingItems(dashRes.data.pending_items);
      }
    } catch (error) {
      console.error("Failed to fetch command center data:", error);
      if (error.response?.status === 404) navigate("/drhp");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [apiClient, projectId, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveDashboard = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/projects/${projectId}/dashboard-data`, {
        project_head: projectHead,
        client_pocs: clientPocs,
        client_key_data: clientKeyData,
        drhp_submission_date: drhpSubmissionDate,
        drhp_first_draft_date: drhpFirstDraftDate,
        board_selection: boardSelection,
        pending_items: pendingItems
      });
      toast.success("Dashboard saved");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const addClientPoc = () => setClientPocs([...clientPocs, { name: "", email: "", mobile: "", title: "" }]);
  const removeClientPoc = (i) => setClientPocs(clientPocs.filter((_, idx) => idx !== i));

  const addKeyData = () => setClientKeyData([...clientKeyData, { role: "", name: "", email: "", mobile: "" }]);
  const removeKeyData = (i) => setClientKeyData(clientKeyData.filter((_, idx) => idx !== i));

  const addPendingItem = (item) => {
    if (item && !pendingItems.find(p => p.label === item)) {
      setPendingItems([...pendingItems, { label: item, status: "pending" }]);
    }
  };
  const removePendingItem = (i) => setPendingItems(pendingItems.filter((_, idx) => idx !== i));

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
  const { project, section_stats } = data;

  const checklistModules = [
    { id: "company-data", title: "Company Data", subtitle: "Corporate & Business Info", path: `/project/${projectId}/company-data`, pending: data.checklists?.company_data?.pending || 0 },
    { id: "promoter-checklist", title: "Promoter Checklist", subtitle: "Promoter Details & KYC", path: `/project/${projectId}/promoter-checklist`, pending: data.checklists?.promoter?.pending || 0 },
    { id: "kmp-checklist", title: "KMP Checklist", subtitle: "Key Managerial Personnel", path: `/project/${projectId}/kmp-checklist`, pending: data.checklists?.kmp?.pending || 0 },
    { id: "pre-ipo-tracker", title: "Pre-IPO Tracker", subtitle: "IPO Readiness", path: `/project/${projectId}/pre-ipo-tracker`, pending: data.checklists?.pre_ipo?.pending || 0 },
    { id: "non-drhp-tracker", title: "Non-DRHP Tracker", subtitle: "Compliance Items", path: `/project/${projectId}/non-drhp-tracker`, pending: data.checklists?.non_drhp?.pending || 0 }
  ];

  const boardRaw = (project?.board_type || "").toLowerCase();
  const showMainBoard = !boardRaw || boardRaw === "main board" || boardRaw === "mainboard";
  const showSME = !boardRaw || boardRaw === "sme";

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="command-center-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/drhp")} className="text-gray-500 hover:text-gray-700 text-sm">DRHP Projects</button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <h1 className="text-lg font-semibold text-gray-900">{project.company_name}</h1>
              <Badge className="bg-[#1DA1F2]/10 text-[#1DA1F2] border-[#1DA1F2]/20">Command Center</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Review feature coming soon")}>
                <Eye className="w-3.5 h-3.5" /> Review All
              </Button>
              <Button size="sm" className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-1.5" onClick={() => toast.info("Export feature coming soon")}>
                <Download className="w-3.5 h-3.5" /> Export DRHP
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4">
          {/* Centralised Corporate Repository */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1DA1F2] to-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Centralised Corporate Repository</h2>
              <p className="text-[10px] text-gray-500">Upload and manage all corporate data. Data syncs across DRHP chapters.</p>
            </div>
          </div>

          {/* 5 Checklist Buttons - Compact */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            {checklistModules.map((module) => (
              <button
                key={module.id}
                onClick={() => navigate(module.path)}
                className="flex flex-col justify-between p-2.5 rounded-md border border-blue-100 bg-blue-50/50 hover:border-[#1DA1F2] hover:bg-blue-50 transition-all h-[72px]"
                data-testid={`${module.id}-btn`}
              >
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-900">{module.title}</p>
                  <p className="text-[9px] text-gray-500">{module.subtitle}</p>
                </div>
                <Badge className={`text-[9px] px-1.5 py-0 ${module.pending > 0 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                  {module.pending > 0 ? `${module.pending} Pending` : 'Done'}
                </Badge>
              </button>
            ))}
          </div>

          {/* 3 Action Buttons - Single Row Compact */}
          <div className="flex gap-2 mb-3">
            {showMainBoard && (
              <button onClick={() => navigate(`/project/${projectId}/drhp-output?board=mainboard`)} className="flex items-center gap-2 px-3 py-2 rounded-md border border-blue-200 bg-blue-50 hover:shadow-sm hover:border-blue-300 transition-all group flex-1" data-testid="drhp-output-mainboard">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><Landmark className="w-3.5 h-3.5 text-white" /></div>
                <span className="text-xs font-semibold text-gray-900">Main Board DRHP</span>
                <ChevronRight className="w-3.5 h-3.5 text-blue-400 ml-auto" />
              </button>
            )}
            {showSME && (
              <button onClick={() => navigate(`/project/${projectId}/drhp-output?board=sme`)} className="flex items-center gap-2 px-3 py-2 rounded-md border border-emerald-200 bg-emerald-50 hover:shadow-sm hover:border-emerald-300 transition-all group flex-1" data-testid="drhp-output-sme">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><Building2 className="w-3.5 h-3.5 text-white" /></div>
                <span className="text-xs font-semibold text-gray-900">SME Board DRHP</span>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
              </button>
            )}
            <button onClick={() => navigate(`/project/${projectId}/document-repository`)} className="flex items-center gap-2 px-3 py-2 rounded-md border border-indigo-200 bg-indigo-50 hover:shadow-sm hover:border-indigo-300 transition-all group flex-1" data-testid="cc-document-repository-btn">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center"><FolderOpen className="w-3.5 h-3.5 text-white" /></div>
              <span className="text-xs font-semibold text-gray-900">Document Repository</span>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-400 ml-auto" />
            </button>
            <button onClick={() => navigate(`/project/${projectId}/audit-log`)} className="flex items-center gap-2 px-3 py-2 rounded-md border border-purple-200 bg-purple-50 hover:shadow-sm hover:border-purple-300 transition-all group flex-1" data-testid="cc-audit-log-btn">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center"><ScrollText className="w-3.5 h-3.5 text-white" /></div>
              <span className="text-xs font-semibold text-gray-900">Project Audit Log</span>
              <ChevronRight className="w-3.5 h-3.5 text-purple-400 ml-auto" />
            </button>
          </div>

          {/* ═══ PROJECT DASHBOARD ═══ */}
          <div className="bg-white border border-gray-200 rounded-lg p-4" data-testid="project-dashboard">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Project Dashboard</h3>
              <Button size="sm" onClick={handleSaveDashboard} disabled={saving} className="h-7 text-xs gap-1.5 bg-[#1DA1F2] hover:bg-[#1a8cd8]">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Column 1: Contacts */}
              <div className="space-y-3">
                {/* Project Head */}
                <div className="border border-gray-100 rounded-md p-2.5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Project Head</p>
                  <div className="space-y-1">
                    <Input placeholder="Name" value={projectHead.name} onChange={e => setProjectHead({...projectHead, name: e.target.value})} className="h-6 text-xs" />
                    <Input placeholder="Email" value={projectHead.email} onChange={e => setProjectHead({...projectHead, email: e.target.value})} className="h-6 text-xs" />
                    <Input placeholder="Mobile" value={projectHead.mobile} onChange={e => setProjectHead({...projectHead, mobile: e.target.value})} className="h-6 text-xs" />
                  </div>
                </div>

                {/* Client POC */}
                <div className="border border-gray-100 rounded-md p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Client POC</p>
                    <button onClick={addClientPoc} className="text-[#1DA1F2] hover:text-blue-700"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto">
                    {clientPocs.map((poc, i) => (
                      <div key={i} className="flex gap-1 items-start">
                        <div className="flex-1 space-y-0.5">
                          <Input placeholder="Name" value={poc.name} onChange={e => { const u = [...clientPocs]; u[i].name = e.target.value; setClientPocs(u); }} className="h-6 text-xs" />
                          <div className="flex gap-1">
                            <Input placeholder="Email" value={poc.email} onChange={e => { const u = [...clientPocs]; u[i].email = e.target.value; setClientPocs(u); }} className="h-6 text-xs flex-1" />
                            <Input placeholder="Mobile" value={poc.mobile} onChange={e => { const u = [...clientPocs]; u[i].mobile = e.target.value; setClientPocs(u); }} className="h-6 text-xs w-24" />
                          </div>
                          <select value={poc.title} onChange={e => { const u = [...clientPocs]; u[i].title = e.target.value; setClientPocs(u); }} className="w-full h-6 text-xs border rounded px-1.5">
                            <option value="">Title</option>
                            <option value="Owner">Owner</option>
                            <option value="Promoter">Promoter</option>
                          </select>
                        </div>
                        {clientPocs.length > 1 && <button onClick={() => removeClientPoc(i)} className="text-red-400 hover:text-red-600 mt-1"><Trash2 className="w-3 h-3" /></button>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 2: Key Data */}
              <div className="border border-gray-100 rounded-md p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Client Key Data</p>
                  <button onClick={addKeyData} className="text-[#1DA1F2] hover:text-blue-700"><Plus className="w-3.5 h-3.5" /></button>
                </div>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {clientKeyData.map((item, i) => (
                    <div key={i} className="flex gap-1 items-start bg-gray-50 rounded p-1.5">
                      <div className="flex-1 space-y-0.5">
                        <div className="flex gap-1">
                          <Input placeholder="Role" value={item.role} onChange={e => { const u = [...clientKeyData]; u[i].role = e.target.value; setClientKeyData(u); }} className="h-5 text-[10px] w-16 font-semibold" />
                          <Input placeholder="Name" value={item.name} onChange={e => { const u = [...clientKeyData]; u[i].name = e.target.value; setClientKeyData(u); }} className="h-5 text-[10px] flex-1" />
                        </div>
                        <div className="flex gap-1">
                          <Input placeholder="Email" value={item.email} onChange={e => { const u = [...clientKeyData]; u[i].email = e.target.value; setClientKeyData(u); }} className="h-5 text-[10px] flex-1" />
                          <Input placeholder="Mobile" value={item.mobile} onChange={e => { const u = [...clientKeyData]; u[i].mobile = e.target.value; setClientKeyData(u); }} className="h-5 text-[10px] w-20" />
                        </div>
                      </div>
                      {clientKeyData.length > 1 && <button onClick={() => removeKeyData(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Dates + Board + Pending */}
              <div className="space-y-3">
                {/* Dates & Board */}
                <div className="border border-gray-100 rounded-md p-2.5 space-y-2">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">DRHP Submission Date</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <input type="date" value={drhpSubmissionDate} onChange={e => setDrhpSubmissionDate(e.target.value)} className="flex-1 h-6 text-xs border rounded px-2" data-testid="drhp-submission-date" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">First Draft Date</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <input type="date" value={drhpFirstDraftDate} onChange={e => setDrhpFirstDraftDate(e.target.value)} className="flex-1 h-6 text-xs border rounded px-2" data-testid="drhp-first-draft-date" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Board</p>
                    <select value={boardSelection} onChange={e => setBoardSelection(e.target.value)} className="w-full h-7 text-xs border rounded px-2" data-testid="board-selection">
                      <option value="">Select Board</option>
                      {BOARD_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                {/* Important & Pending — High Visual */}
                <div className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 rounded-md p-2.5" data-testid="pending-tracker">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <p className="text-xs font-bold text-orange-800">Important & Pending</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {pendingItems.map((item, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[10px] font-medium bg-red-100 text-red-700 border border-red-200 rounded-full px-2 py-0.5">
                        {item.label}
                        <button onClick={() => removePendingItem(i)} className="text-red-400 hover:text-red-700"><Trash2 className="w-2.5 h-2.5" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <select onChange={e => { if (e.target.value) { addPendingItem(e.target.value); e.target.value = ""; }}} className="flex-1 h-6 text-[10px] border border-orange-200 rounded px-1.5 bg-white">
                      <option value="">+ Add from list</option>
                      {PENDING_OPTIONS.filter(o => !pendingItems.find(p => p.label === o)).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-1 mt-1">
                    <input type="text" value={customPending} onChange={e => setCustomPending(e.target.value)} placeholder="Custom item..." className="flex-1 h-6 text-[10px] border border-orange-200 rounded px-1.5" onKeyDown={e => { if (e.key === 'Enter' && customPending.trim()) { addPendingItem(customPending.trim()); setCustomPending(""); }}} />
                    <button onClick={() => { if (customPending.trim()) { addPendingItem(customPending.trim()); setCustomPending(""); }}} className="h-6 px-2 text-[10px] bg-orange-500 text-white rounded hover:bg-orange-600">Add</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommandCenter;
