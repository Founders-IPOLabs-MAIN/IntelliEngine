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

const ISSUE_TYPE_OPTIONS = ["IPO", "FPO"];
const PRICING_METHOD_OPTIONS = ["Bookbuilding", "Fixed Price"];
const SALES_TYPE_OPTIONS = ["Fresh Capital Only", "OFS Only", "Fresh Capital cum OFS"];

const REGISTRAR_OPTIONS = [
  "Aarthi Consultants Pvt.Ltd.",
  "Abhipra Capital Limited",
  "Accurate Securities & Registry Pvt.Ltd.",
  "Adroit Corporate Services Pvt.Ltd.",
  "Alankit Assignments Ltd.",
  "Ankit Consultancy Pvt.Ltd.",
  "Beetal Financial & Computer Services Pvt.Ltd.",
  "Bigshare Services Pvt.Ltd.",
  "Cameo Corporate Services Ltd.",
  "CB Management Services Pvt.Ltd.",
  "Datamatics Business Soultions Ltd.",
  "Integrated Registry Management Services Pvt.Ltd.",
  "Investor Services of India Ltd.",
  "Kfin Technologies Ltd.",
  "Maashitla Securities Pvt.Ltd.",
  "Maheshwari Datamatics Pvt.Ltd.",
  "MAS Services Ltd.",
  "MCS Share Transfer Agent Ltd.",
  "Mondkar Computers Pvt.Ltd.",
  "Mudra RTA Ventures Private Limited",
  "MUFG Intime India Pvt.Ltd.",
  "Niche Technologies Pvt.Ltd.",
  "NSDL Database Management Ltd.",
  "Purva Sharegistry (India) Pvt.Ltd.",
  "RCMC Share Registry Pvt.Ltd.",
  "S.K.D.C.Consultants Ltd.",
  "S.K.Infosolutions Pvt.Ltd.",
  "Satellite Corporate Services Pvt.Ltd.",
  "Sharepro Services Pvt.Ltd.",
  "Sharex Dynamic (India) Pvt.Ltd.",
  "Skyline Financial Services Pvt.Ltd.",
  "Universal Capital Securities Pvt.Ltd.",
  "Venture Capital & Corporate Investments Ltd."
];

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
  const [issueType, setIssueType] = useState("");
  const [pricingMethod, setPricingMethod] = useState("");
  const [salesType, setSalesType] = useState("");
  const [registrar, setRegistrar] = useState("");
  const [docRepoSummary, setDocRepoSummary] = useState({ total_lines: 0, uploaded: 0, pending: 0, pct: 0 });

  const fetchData = useCallback(async () => {
    try {
      const [projectRes, dashRes, repoRes] = await Promise.all([
        apiClient.get(`/projects/${projectId}/command-center`),
        apiClient.get(`/projects/${projectId}/dashboard-data`).catch(() => ({ data: null })),
        apiClient.get(`/projects/${projectId}/document-repository/summary`).catch(() => ({ data: null }))
      ]);
      setData(projectRes.data);
      if (repoRes.data) setDocRepoSummary(repoRes.data);

      if (dashRes.data && dashRes.data.project_head) {
        setProjectHead(dashRes.data.project_head || { name: "", email: "", mobile: "" });
        if (dashRes.data.client_pocs?.length) setClientPocs(dashRes.data.client_pocs);
        if (dashRes.data.client_key_data?.length) setClientKeyData(dashRes.data.client_key_data);
        if (dashRes.data.drhp_submission_date) setDrhpSubmissionDate(dashRes.data.drhp_submission_date);
        if (dashRes.data.drhp_first_draft_date) setDrhpFirstDraftDate(dashRes.data.drhp_first_draft_date);
        if (dashRes.data.board_selection) setBoardSelection(dashRes.data.board_selection);
        if (dashRes.data.pending_items?.length) setPendingItems(dashRes.data.pending_items);
        if (dashRes.data.issue_type) setIssueType(dashRes.data.issue_type);
        if (dashRes.data.pricing_method) setPricingMethod(dashRes.data.pricing_method);
        if (dashRes.data.sales_type) setSalesType(dashRes.data.sales_type);
        if (dashRes.data.registrar) setRegistrar(dashRes.data.registrar);
      }
    } catch (error) {
      console.error("Failed to fetch command center data:", error);
      if (error.response?.status === 404) navigate(data?.project?.user_login_type ? `/drhp/${data.project.user_login_type}` : "/drhp");
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
        pending_items: pendingItems,
        issue_type: issueType,
        pricing_method: pricingMethod,
        sales_type: salesType,
        registrar: registrar
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
              <button
                onClick={() => navigate(data?.project?.user_login_type ? `/drhp/${data.project.user_login_type}` : "/drhp")}
                className="text-gray-500 hover:text-gray-700 text-sm"
                data-testid="cc-back-to-projects"
              >
                DRHP Projects
              </button>
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

          {/* Deal-shape pill row — one-glance context */}
          {(issueType || pricingMethod || salesType || registrar || boardSelection) ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5" data-testid="deal-shape-pills">
              {issueType && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5" data-testid="pill-issue-type">
                  <span className="text-blue-400">ISSUE</span> {issueType}
                </span>
              )}
              {pricingMethod && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2 py-0.5" data-testid="pill-pricing-method">
                  <span className="text-purple-400">PRICING</span> {pricingMethod}
                </span>
              )}
              {salesType && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5" data-testid="pill-sales-type">
                  <span className="text-emerald-400">SALES</span> {salesType}
                </span>
              )}
              {boardSelection && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2 py-0.5" data-testid="pill-board">
                  <span className="text-indigo-400">BOARD</span> {boardSelection}
                </span>
              )}
              {registrar && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5" data-testid="pill-registrar" title={registrar}>
                  <span className="text-amber-400">RTA</span> {registrar.length > 28 ? registrar.slice(0, 28) + "…" : registrar}
                </span>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <button
                onClick={() => document.querySelector('[data-testid="issue-trackers"]')?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="text-[10px] font-medium text-gray-400 hover:text-[#1DA1F2] flex items-center gap-1"
                data-testid="setup-deal-shape-btn"
              >
                <Plus className="w-3 h-3" /> Set up deal shape (Issue Type, Pricing, Sales, Board, RTA)
              </button>
            </div>
          )}
        </header>

        <div className="p-4">
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
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold text-gray-900">Document Repository</span>
                <span className="text-[10px] text-gray-500 tabular-nums" data-testid="cc-docrepo-counter">
                  <span className="font-bold text-emerald-600">{docRepoSummary.uploaded}</span>
                  <span className="text-gray-400"> / </span>
                  <span className="font-bold text-indigo-700">{docRepoSummary.total_lines}</span>
                  <span className="text-gray-500"> uploaded</span>
                  {docRepoSummary.pending > 0 && (
                    <span className="text-rose-600"> · {docRepoSummary.pending} pending</span>
                  )}
                </span>
              </div>
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

              {/* Column 2: Issue Trackers */}
              <div className="border border-gray-100 rounded-md p-2.5 space-y-2" data-testid="issue-trackers">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Issue Trackers</p>

                <div>
                  <label className="text-[10px] font-semibold text-gray-600 mb-0.5 block">Issue Type</label>
                  <select
                    value={issueType}
                    onChange={e => setIssueType(e.target.value)}
                    className="w-full h-7 text-xs border rounded px-2"
                    data-testid="tracker-issue-type"
                  >
                    <option value="">Select…</option>
                    {ISSUE_TYPE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-gray-600 mb-0.5 block">Pricing Method</label>
                  <select
                    value={pricingMethod}
                    onChange={e => setPricingMethod(e.target.value)}
                    className="w-full h-7 text-xs border rounded px-2"
                    data-testid="tracker-pricing-method"
                  >
                    <option value="">Select…</option>
                    {PRICING_METHOD_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-gray-600 mb-0.5 block">Sales Type</label>
                  <select
                    value={salesType}
                    onChange={e => setSalesType(e.target.value)}
                    className="w-full h-7 text-xs border rounded px-2"
                    data-testid="tracker-sales-type"
                  >
                    <option value="">Select…</option>
                    {SALES_TYPE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-gray-600 mb-0.5 block">Registrar (RTA)</label>
                  <select
                    value={registrar}
                    onChange={e => setRegistrar(e.target.value)}
                    className="w-full h-7 text-xs border rounded px-2"
                    data-testid="tracker-registrar"
                  >
                    <option value="">Select registrar…</option>
                    {REGISTRAR_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
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

            {/* ═══ KEY PERSONNEL TABLE ═══ */}
            <div className="mt-6 pt-5 border-t border-gray-200" data-testid="key-personnel-section">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Key Personnel</h4>
                  <p className="text-[11px] text-gray-500">Core people driving this IPO mandate — advisors, officers and operational POCs.</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addKeyData}
                  className="h-7 text-xs gap-1.5 border-[#1DA1F2]/30 text-[#1DA1F2] hover:bg-blue-50"
                  data-testid="add-key-personnel-btn"
                >
                  <Plus className="w-3 h-3" /> Add Person
                </Button>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-xs" data-testid="key-personnel-table">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 uppercase text-[10px] tracking-wide w-[18%]">Role</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 uppercase text-[10px] tracking-wide w-[26%]">Name</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 uppercase text-[10px] tracking-wide w-[30%]">Email</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 uppercase text-[10px] tracking-wide w-[20%]">Mobile</th>
                      <th className="px-3 py-2 w-[6%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientKeyData.map((item, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60" data-testid={`key-personnel-row-${i}`}>
                        <td className="px-3 py-1.5">
                          <Input
                            placeholder="Role"
                            value={item.role}
                            onChange={e => { const u = [...clientKeyData]; u[i].role = e.target.value; setClientKeyData(u); }}
                            className="h-7 text-xs font-medium border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-[#1DA1F2] px-2"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <Input
                            placeholder="Full name"
                            value={item.name}
                            onChange={e => { const u = [...clientKeyData]; u[i].name = e.target.value; setClientKeyData(u); }}
                            className="h-7 text-xs border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-[#1DA1F2] px-2"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <Input
                            placeholder="email@company.com"
                            value={item.email}
                            onChange={e => { const u = [...clientKeyData]; u[i].email = e.target.value; setClientKeyData(u); }}
                            className="h-7 text-xs border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-[#1DA1F2] px-2"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <Input
                            placeholder="+91 XXXXX XXXXX"
                            value={item.mobile}
                            onChange={e => { const u = [...clientKeyData]; u[i].mobile = e.target.value; setClientKeyData(u); }}
                            className="h-7 text-xs border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-[#1DA1F2] px-2"
                          />
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          {clientKeyData.length > 1 && (
                            <button
                              onClick={() => removeKeyData(i)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                              data-testid={`remove-key-personnel-${i}`}
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {clientKeyData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-gray-400 text-xs">
                          No key personnel added. Click "Add Person" to start.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommandCenter;
