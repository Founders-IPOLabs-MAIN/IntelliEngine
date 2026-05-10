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
  Briefcase,
  Users,
  UserCircle2,
  Filter,
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
          {/* Centralised Corporate Repository */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1DA1F2] to-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Centralised Corporate Repository</h2>
              <p className="text-[10px] text-gray-500">Upload and manage all corporate data. Data syncs across DRHP chapters.</p>
            </div>
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

          {/* Important & Pending — Full-width attention block */}
          <div className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 mb-3" data-testid="pending-tracker">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-bold text-orange-800">Important &amp; Pending</p>
              <span className="text-[10px] text-orange-600/80">Track key blockers and outstanding action items for this project</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {pendingItems.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[11px] font-medium bg-red-100 text-red-700 border border-red-200 rounded-full px-2.5 py-0.5">
                  {item.label}
                  <button onClick={() => removePendingItem(i)} className="text-red-400 hover:text-red-700"><Trash2 className="w-2.5 h-2.5" /></button>
                </span>
              ))}
              {pendingItems.length === 0 && (
                <span className="text-[11px] text-orange-600/70 italic">No pending items — add one below.</span>
              )}
            </div>
            <div className="flex gap-2">
              <select onChange={e => { if (e.target.value) { addPendingItem(e.target.value); e.target.value = ""; }}} className="h-7 text-[11px] border border-orange-200 rounded px-2 bg-white w-56">
                <option value="">+ Add from list</option>
                {PENDING_OPTIONS.filter(o => !pendingItems.find(p => p.label === o)).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <input type="text" value={customPending} onChange={e => setCustomPending(e.target.value)} placeholder="Or add a custom item…" className="flex-1 h-7 text-[11px] border border-orange-200 rounded px-2" onKeyDown={e => { if (e.key === 'Enter' && customPending.trim()) { addPendingItem(customPending.trim()); setCustomPending(""); }}} />
              <button onClick={() => { if (customPending.trim()) { addPendingItem(customPending.trim()); setCustomPending(""); }}} className="h-7 px-3 text-[11px] bg-orange-500 text-white rounded hover:bg-orange-600 font-semibold">Add</button>
            </div>
          </div>

          {/* ═══ PROJECT WORKSPACE — Unified Dashboard + Key Personnel ═══ */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden" data-testid="project-dashboard">
            {/* Twitter-blue header strip */}
            <div className="bg-gradient-to-r from-[#1DA1F2] via-[#1a8cd8] to-[#0c7abf] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/30">
                  <Briefcase className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-white tracking-tight">Project Workspace</h3>
                  <p className="text-[10.5px] text-blue-50/90">Project details, contacts, dates &amp; key personnel</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleSaveDashboard}
                disabled={saving}
                className="h-8 text-xs gap-1.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur"
                data-testid="save-dashboard-btn"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </Button>
            </div>

            {/* ─── Section 1: Project Details ─── */}
            <div className="p-5">
              <SectionHeader number="01" title="Project Details" subtitle="Contacts, issue tracking &amp; key dates" />

              <div className="grid grid-cols-3 gap-4">
                {/* Column 1: Contacts */}
                <div className="space-y-3">
                  {/* Project Head */}
                  <FieldGroup icon={<UserCircle2 className="w-3.5 h-3.5" />} title="Project Head">
                    <Input placeholder="Full name" value={projectHead.name} onChange={e => setProjectHead({...projectHead, name: e.target.value})} className="h-8 text-[12.5px] border-gray-200 focus-visible:ring-[#1DA1F2] focus-visible:border-[#1DA1F2]" />
                    <Input placeholder="Email address" value={projectHead.email} onChange={e => setProjectHead({...projectHead, email: e.target.value})} className="h-8 text-[12.5px] border-gray-200 focus-visible:ring-[#1DA1F2] focus-visible:border-[#1DA1F2]" />
                    <Input placeholder="Mobile" value={projectHead.mobile} onChange={e => setProjectHead({...projectHead, mobile: e.target.value})} className="h-8 text-[12.5px] border-gray-200 focus-visible:ring-[#1DA1F2] focus-visible:border-[#1DA1F2]" />
                  </FieldGroup>

                  {/* Client POC */}
                  <FieldGroup
                    icon={<Users className="w-3.5 h-3.5" />}
                    title="Client POC"
                    action={
                      <button onClick={addClientPoc} className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#1DA1F2] hover:text-blue-700">
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    }
                  >
                    <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                      {clientPocs.map((poc, i) => (
                        <div key={i} className="space-y-1 rounded-md bg-blue-50/40 border border-blue-100 p-2">
                          <div className="flex items-center gap-1">
                            <Input placeholder="Name" value={poc.name} onChange={e => { const u = [...clientPocs]; u[i].name = e.target.value; setClientPocs(u); }} className="h-7 text-[12px] border-gray-200 bg-white focus-visible:ring-[#1DA1F2] flex-1" />
                            {clientPocs.length > 1 && <button onClick={() => removeClientPoc(i)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>}
                          </div>
                          <div className="flex gap-1">
                            <Input placeholder="Email" value={poc.email} onChange={e => { const u = [...clientPocs]; u[i].email = e.target.value; setClientPocs(u); }} className="h-7 text-[12px] border-gray-200 bg-white focus-visible:ring-[#1DA1F2] flex-1" />
                            <Input placeholder="Mobile" value={poc.mobile} onChange={e => { const u = [...clientPocs]; u[i].mobile = e.target.value; setClientPocs(u); }} className="h-7 text-[12px] border-gray-200 bg-white focus-visible:ring-[#1DA1F2] w-24" />
                          </div>
                          <select value={poc.title} onChange={e => { const u = [...clientPocs]; u[i].title = e.target.value; setClientPocs(u); }} className="w-full h-7 text-[12px] border border-gray-200 bg-white rounded px-2 text-gray-700">
                            <option value="">— Title —</option>
                            <option value="Owner">Owner</option>
                            <option value="Promoter">Promoter</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </FieldGroup>
                </div>

                {/* Column 2: Issue Trackers */}
                <FieldGroup icon={<Filter className="w-3.5 h-3.5" />} title="Issue Trackers">
                  <FormSelect label="Issue Type" value={issueType} onChange={setIssueType} options={ISSUE_TYPE_OPTIONS} testid="tracker-issue-type" />
                  <FormSelect label="Pricing Method" value={pricingMethod} onChange={setPricingMethod} options={PRICING_METHOD_OPTIONS} testid="tracker-pricing-method" />
                  <FormSelect label="Sales Type" value={salesType} onChange={setSalesType} options={SALES_TYPE_OPTIONS} testid="tracker-sales-type" />
                  <FormSelect label="Registrar (RTA)" value={registrar} onChange={setRegistrar} options={REGISTRAR_OPTIONS} placeholder="Select registrar…" testid="tracker-registrar" />
                </FieldGroup>

                {/* Column 3: Dates + Board */}
                <FieldGroup icon={<Calendar className="w-3.5 h-3.5" />} title="Timeline &amp; Board">
                  <FormDate label="DRHP Submission Date" value={drhpSubmissionDate} onChange={setDrhpSubmissionDate} testid="drhp-submission-date" />
                  <FormDate label="First Draft Date" value={drhpFirstDraftDate} onChange={setDrhpFirstDraftDate} testid="drhp-first-draft-date" />
                  <div>
                    <label className="text-[10.5px] font-semibold text-gray-500 mb-1 block uppercase tracking-wide">Board</label>
                    <select value={boardSelection} onChange={e => setBoardSelection(e.target.value)} className="w-full h-8 text-[12.5px] border border-gray-200 rounded-md px-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:border-[#1DA1F2]" data-testid="board-selection">
                      <option value="">— Select Board —</option>
                      {BOARD_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </FieldGroup>
              </div>
            </div>

            {/* ─── Soft divider ─── */}
            <div className="relative px-5">
              <div className="border-t border-dashed border-gray-200"></div>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white px-3 text-[9.5px] uppercase tracking-[0.18em] font-bold text-gray-400">Team</div>
            </div>

            {/* ─── Section 2: Key Personnel ─── */}
            <div className="p-5" data-testid="key-personnel-section">
              <div className="flex items-center justify-between mb-3.5">
                <SectionHeader number="02" title="Key Personnel" subtitle="Core people driving this IPO mandate — advisors, officers and operational POCs." inline />
                <Button
                  size="sm"
                  onClick={addKeyData}
                  className="h-8 text-xs gap-1.5 bg-[#1DA1F2] hover:bg-[#0c7abf] text-white shadow-sm"
                  data-testid="add-key-personnel-btn"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Person
                </Button>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="grid grid-cols-[18%_28%_30%_18%_6%] bg-gradient-to-r from-blue-50/60 to-blue-50/30 border-b border-gray-200 px-3 py-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#1DA1F2]">Role</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#1DA1F2]">Name</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#1DA1F2]">Email</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#1DA1F2]">Mobile</div>
                  <div></div>
                </div>
                <div data-testid="key-personnel-table">
                  {clientKeyData.map((item, i) => (
                    <div key={i} className="grid grid-cols-[18%_28%_30%_18%_6%] items-center border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors px-3 py-1" data-testid={`key-personnel-row-${i}`}>
                      <div className="flex items-center gap-2 pr-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1DA1F2] to-blue-600 text-white text-[10.5px] font-bold flex items-center justify-center shadow-sm flex-shrink-0">
                          {(item.role || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <Input
                          placeholder="Role"
                          value={item.role}
                          onChange={e => { const u = [...clientKeyData]; u[i].role = e.target.value; setClientKeyData(u); }}
                          className="h-7 text-[12.5px] font-semibold border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-[#1DA1F2] px-1.5 text-gray-900"
                        />
                      </div>
                      <Input placeholder="Full name" value={item.name} onChange={e => { const u = [...clientKeyData]; u[i].name = e.target.value; setClientKeyData(u); }} className="h-7 text-[12.5px] border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-[#1DA1F2] px-2" />
                      <Input placeholder="email@company.com" value={item.email} onChange={e => { const u = [...clientKeyData]; u[i].email = e.target.value; setClientKeyData(u); }} className="h-7 text-[12.5px] border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-[#1DA1F2] px-2" />
                      <Input placeholder="+91 XXXXX XXXXX" value={item.mobile} onChange={e => { const u = [...clientKeyData]; u[i].mobile = e.target.value; setClientKeyData(u); }} className="h-7 text-[12.5px] border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-[#1DA1F2] px-2" />
                      <div className="text-right">
                        {clientKeyData.length > 1 && (
                          <button onClick={() => removeKeyData(i)} className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-50" data-testid={`remove-key-personnel-${i}`} title="Remove">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {clientKeyData.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-[12px]">
                      No key personnel added. Click <span className="font-semibold text-[#1DA1F2]">"Add Person"</span> to start.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// ─────────────────────── helper sub-components ───────────────────────
const SectionHeader = ({ number, title, subtitle, inline = false }) => (
  <div className={inline ? "flex-1" : "mb-4"}>
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold tracking-[0.18em] text-[#1DA1F2]">{number}</span>
      <h4 className="text-[13.5px] font-bold text-gray-900">{title}</h4>
    </div>
    {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

const FieldGroup = ({ icon, title, action, children }) => (
  <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-white to-blue-50/20 p-3 space-y-2 hover:border-blue-200 hover:shadow-[0_0_15px_rgba(29,161,242,0.05)] transition-all">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded bg-[#1DA1F2]/10 text-[#1DA1F2] flex items-center justify-center">{icon}</div>
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-gray-700">{title}</p>
      </div>
      {action}
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

const FormSelect = ({ label, value, onChange, options, placeholder = "Select…", testid }) => (
  <div>
    <label className="text-[10.5px] font-semibold text-gray-500 mb-1 block uppercase tracking-wide">{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-8 text-[12.5px] border border-gray-200 rounded-md px-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:border-[#1DA1F2]"
      data-testid={testid}
    >
      <option value="">{placeholder}</option>
      {options.map(v => <option key={v} value={v}>{v}</option>)}
    </select>
  </div>
);

const FormDate = ({ label, value, onChange, testid }) => (
  <div>
    <label className="text-[10.5px] font-semibold text-gray-500 mb-1 block uppercase tracking-wide">{label}</label>
    <div className="relative">
      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1DA1F2]/70 pointer-events-none" />
      <input type="date" value={value} onChange={e => onChange(e.target.value)} className="w-full h-8 text-[12.5px] border border-gray-200 rounded-md pl-8 pr-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:border-[#1DA1F2]" data-testid={testid} />
    </div>
  </div>
);

export default CommandCenter;
