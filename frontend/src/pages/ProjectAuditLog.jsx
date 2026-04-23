import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft, ScrollText, RefreshCw, Loader2, User, Clock, Search,
  Upload, RotateCcw, Trash2, Plus, Eye, FileText,
} from "lucide-react";

const ACTION_META = {
  upload_document:   { label: "Uploaded",      icon: Upload,     color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  reupload_document: { label: "Re-Uploaded",   icon: RotateCcw,  color: "bg-amber-100 text-amber-700 border-amber-200" },
  delete_file:       { label: "File Deleted",  icon: Trash2,     color: "bg-rose-100 text-rose-700 border-rose-200" },
  delete_line:       { label: "Line Deleted",  icon: Trash2,     color: "bg-red-100 text-red-700 border-red-200" },
  add_line:          { label: "Line Added",    icon: Plus,       color: "bg-blue-100 text-blue-700 border-blue-200" },
  view_repository:   { label: "Viewed Repo",   icon: Eye,        color: "bg-gray-100 text-gray-700 border-gray-200" },
  view_audit_log:    { label: "Viewed Audit",  icon: Eye,        color: "bg-gray-100 text-gray-700 border-gray-200" },
};

const ProjectAuditLog = ({ user, apiClient }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get(`/projects/${projectId}/audit-log?limit=500`);
      setLogs(r.data.logs || []);
      setProject(r.data.project);
    } catch (e) {
      toast.error("Failed to load audit log");
      if (e.response?.status === 404) navigate("/drhp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [projectId]);

  const q = search.trim().toLowerCase();
  const filtered = logs.filter((l) => {
    if (actionFilter !== "all" && l.action !== actionFilter) return false;
    if (!q) return true;
    return [l.user_email, l.user_name, l.action, l.module, JSON.stringify(l.details || {})]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  const summary = {
    uploads: logs.filter((l) => l.action === "upload_document" || l.action === "reupload_document").length,
    deletes: logs.filter((l) => l.action === "delete_file" || l.action === "delete_line").length,
    line_changes: logs.filter((l) => l.action === "add_line" || l.action === "delete_line").length,
    total: logs.length,
  };

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="project-audit-log-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-10 bg-white border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/project/${projectId}/command-center`)}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
                data-testid="audit-back-btn"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Command Center
              </button>
              <div className="w-px h-6 bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <ScrollText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-black">Project Audit Log</h1>
                  <p className="text-xs text-muted-foreground">{project?.company_name || "DRHP Project"} • Scoped to this project only</p>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5" data-testid="audit-refresh-btn">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </header>

        <div className="p-8 space-y-6">
          {/* Stat strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Events", value: summary.total, color: "text-[#1DA1F2]" },
              { label: "Uploads", value: summary.uploads, color: "text-emerald-600" },
              { label: "Deletes", value: summary.deletes, color: "text-rose-600" },
              { label: "Line Changes", value: summary.line_changes, color: "text-blue-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
              <Input
                placeholder="Search by user, file name, action..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
                data-testid="audit-search-input"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-9 w-48" data-testid="audit-action-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="upload_document">Uploads</SelectItem>
                <SelectItem value="reupload_document">Re-Uploads</SelectItem>
                <SelectItem value="delete_file">File Deletes</SelectItem>
                <SelectItem value="delete_line">Line Deletes</SelectItem>
                <SelectItem value="add_line">Line Additions</SelectItem>
                <SelectItem value="view_repository">Repository Views</SelectItem>
                <SelectItem value="view_audit_log">Audit Views</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-16 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#1DA1F2]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-16 text-center text-gray-500" data-testid="audit-empty">
                <ScrollText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No audit entries match your filters.</p>
              </div>
            ) : (
              <Table data-testid="audit-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Module / Details</TableHead>
                    <TableHead className="w-[200px]">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => {
                    const meta = ACTION_META[l.action] || { label: l.action, icon: FileText, color: "bg-gray-100 text-gray-700 border-gray-200" };
                    const Icon = meta.icon;
                    const d = l.details || {};
                    return (
                      <TableRow key={l.log_id} data-testid={`audit-row-${l.log_id}`}>
                        <TableCell>
                          <Badge className={`${meta.color} gap-1 font-medium`}>
                            <Icon className="w-3 h-3" /> {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-gray-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-900 truncate">{l.user_name || "—"}</p>
                              <p className="text-[11px] text-gray-500 truncate">{l.user_email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-gray-800">
                            <span className="inline-block bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 text-[10px] mr-1.5 uppercase tracking-wide">{l.module?.replace("_", " ")}</span>
                            {d.title && <span className="font-medium">{d.title}</span>}
                          </p>
                          {d.filename && (
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              <FileText className="w-3 h-3 inline mr-1" />
                              {d.filename}
                              {d.size_bytes && <> · {(d.size_bytes / 1024).toFixed(1)} KB</>}
                            </p>
                          )}
                          {d.deleted_filename && (
                            <p className="text-[11px] text-rose-600 mt-0.5">
                              <Trash2 className="w-3 h-3 inline mr-1" /> {d.deleted_filename}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-[11px] text-gray-600">
                            <Clock className="w-3 h-3" />
                            {new Date(l.timestamp).toLocaleString()}
                          </div>
                          {l.ip && <p className="text-[10px] text-gray-400 mt-0.5">IP: {l.ip}</p>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectAuditLog;
