import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft, Upload, Trash2, Plus, FileText, Download, Eye,
  Loader2, FolderOpen, CheckCircle2, AlertTriangle, Clock, CornerDownRight, X,
} from "lucide-react";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const isAllowed = (file) => {
  const ct = (file?.type || "").toLowerCase();
  return ct.startsWith("image/") || ALLOWED_MIME.includes(ct);
};
const prettySize = (b) => !b && b !== 0 ? "—" : b < 1024 ? `${b} B` : b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/(1024*1024)).toFixed(2)} MB`;
const formatDT = (iso) => {
  if (!iso) return "";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

const DocumentRepository = ({ user, apiClient }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [summary, setSummary] = useState({ total_lines: 0, uploaded: 0, pending: 0 });
  const [project, setProject] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { kind, item }
  const [draftDesc, setDraftDesc] = useState({}); // item_id -> local draft
  const fileInputs = useRef({});
  const [viewer, setViewer] = useState(null); // { item, url, contentType, filename } | null

  const closeViewer = () => {
    setViewer((v) => {
      if (v?.url) URL.revokeObjectURL(v.url);
      return null;
    });
  };

  const openViewer = async (item) => {
    if (!item.file) return;
    const ct = (item.file.content_type || "").toLowerCase();
    setBusyId(item.item_id);
    try {
      const r = await apiClient.get(
        `/projects/${projectId}/document-repository/items/${item.item_id}/view`,
        { responseType: "blob" }
      );
      const blob = new Blob([r.data], { type: ct || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      setViewer({ item, url, contentType: ct, filename: item.file.filename });
    } catch {
      toast.error("Could not open document");
    } finally {
      setBusyId(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get(`/projects/${projectId}/document-repository`);
      setGroups(r.data.groups || []);
      setSummary(r.data.summary || { total_lines: 0, uploaded: 0, pending: 0 });
      setProject(r.data.project);
    } catch (e) {
      toast.error("Failed to load document repository");
      if (e.response?.status === 404) navigate("/drhp");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [projectId]);

  const triggerFilePick = (itemId) => {
    const el = fileInputs.current[itemId];
    if (el) { el.value = ""; el.click(); }
  };

  const handleFileSelected = async (item, e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!isAllowed(file)) { toast.error("Only PDF, Word, or image files are allowed. Please re-upload in a supported format."); return; }
    if (file.size > MAX_BYTES) { toast.error(`File is ${(file.size/(1024*1024)).toFixed(2)}MB — exceeds 5MB limit.`); return; }
    setBusyId(item.item_id);
    try {
      const form = new FormData(); form.append("file", file);
      const r = await apiClient.post(`/projects/${projectId}/document-repository/items/${item.item_id}/upload`, form, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(r.data?.reupload ? "File re-uploaded" : "File uploaded");
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally { setBusyId(null); }
  };

  const doDeleteFile = async (item) => {
    setBusyId(item.item_id);
    try {
      await apiClient.delete(`/projects/${projectId}/document-repository/items/${item.item_id}/file`);
      toast.success("File deleted"); await fetchData();
    } catch (err) { toast.error(err?.response?.data?.detail || "Delete failed"); }
    finally { setBusyId(null); setConfirm(null); }
  };

  const doDeleteLine = async (item) => {
    setBusyId(item.item_id);
    try {
      await apiClient.delete(`/projects/${projectId}/document-repository/items/${item.item_id}`);
      toast.success("Line item deleted"); await fetchData();
    } catch (err) { toast.error(err?.response?.data?.detail || "Delete failed"); }
    finally { setBusyId(null); setConfirm(null); }
  };

  const addSubLine = async (parentItem) => {
    setBusyId(parentItem.item_id);
    try {
      await apiClient.post(`/projects/${projectId}/document-repository/items`, {
        parent_item_id: parentItem.item_id, title: "", description: "",
      });
      toast.success("Sub-line added");
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not add sub-line");
    } finally { setBusyId(null); }
  };

  const saveDescription = async (item) => {
    const val = draftDesc[item.item_id];
    if (val === undefined || val === (item.description || "")) return;
    try {
      await apiClient.patch(`/projects/${projectId}/document-repository/items/${item.item_id}`, { description: val });
      setDraftDesc((d) => { const n = { ...d }; delete n[item.item_id]; return n; });
      await fetchData();
    } catch { toast.error("Could not save description"); }
  };

  const downloadFile = async (item) => {
    try {
      const r = await apiClient.get(`/projects/${projectId}/document-repository/items/${item.item_id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a"); a.href = url; a.download = item.file.filename; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Download failed"); }
  };

  const pct = summary.total_lines ? Math.round((summary.uploaded / summary.total_lines) * 100) : 0;

  // Reusable row renderer — works for both parent and child
  const renderRow = (item, number, isChild = false) => {
    const isBusy = busyId === item.item_id;
    const hasFile = !!item.file;
    const descVal = draftDesc[item.item_id] !== undefined ? draftDesc[item.item_id] : (item.description || "");
    return (
      <div
        key={item.item_id}
        className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${hasFile ? "bg-emerald-50/30" : ""} ${isChild ? "bg-gray-50/60 pl-10" : ""}`}
        data-testid={`docrepo-row-${item.item_id}`}
      >
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 rounded-md flex items-center justify-center mt-0.5 ${isChild ? "w-10 h-7 bg-indigo-100 text-[10px] font-bold text-indigo-700" : "w-8 h-7 bg-gray-100 text-[11px] font-semibold text-gray-600"}`}>
            {isChild && <CornerDownRight className="w-2.5 h-2.5 mr-0.5" />}
            {number}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`${isChild ? "text-xs" : "text-sm"} font-semibold text-gray-900`}>
                {item.title || (isChild ? "Additional document (please describe)" : "Untitled")}
              </h3>
              {item.is_custom && !isChild && <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-blue-50 text-blue-700 border-blue-200">Custom</Badge>}
              {isChild && <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-indigo-50 text-indigo-700 border-indigo-200">Sub-item</Badge>}
              {hasFile && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] py-0 px-1.5"><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Uploaded</Badge>}
            </div>
            {item.remarks && !isChild && <p className="text-xs text-gray-500 mt-0.5">{item.remarks}</p>}

            {/* Description text box (editable) — shown for sub-items always, and for custom parents */}
            {(isChild || item.is_custom) && (
              <div className="mt-1.5">
                <Input
                  value={descVal}
                  onChange={(e) => setDraftDesc((d) => ({ ...d, [item.item_id]: e.target.value }))}
                  onBlur={() => saveDescription(item)}
                  placeholder="Add a short description for this document (e.g. 'Supplementary MOA amendment dated May-2023')"
                  className="h-8 text-xs bg-white"
                  data-testid={`docrepo-desc-${item.item_id}`}
                />
              </div>
            )}

            {hasFile && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 text-[11px] text-gray-600 bg-white border border-gray-200 rounded px-2 py-1">
                  <FileText className="w-3 h-3 text-[#1DA1F2]" />
                  <span className="font-medium truncate max-w-[260px]">{item.file.filename}</span>
                  <span className="text-gray-400">·</span>
                  <span>{prettySize(item.file.size)}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500" data-testid={`docrepo-last-upload-${item.item_id}`}>
                  <Clock className="w-3 h-3" /> Last upload: <span className="text-gray-700 font-medium">{formatDT(item.file.uploaded_at)}</span>
                </span>
              </div>
            )}
          </div>

          <input
            ref={(el) => (fileInputs.current[item.item_id] = el)}
            type="file"
            accept=".pdf,.doc,.docx,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => handleFileSelected(item, e)}
            data-testid={`docrepo-file-input-${item.item_id}`}
          />

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasFile && (
              <>
                <Button size="sm" variant="outline"
                  className="h-8 text-xs gap-1.5 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  onClick={() => openViewer(item)} disabled={isBusy}
                  data-testid={`docrepo-view-btn-${item.item_id}`}>
                  <Eye className="w-3.5 h-3.5" /> View
                </Button>
                <Button size="sm" variant="outline"
                  className="h-8 text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => downloadFile(item)} disabled={isBusy}
                  data-testid={`docrepo-download-btn-${item.item_id}`}>
                  <Download className="w-3.5 h-3.5" /> Download
                </Button>
              </>
            )}
            {!hasFile ? (
              <Button size="sm" className="h-8 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white text-xs gap-1.5"
                onClick={() => triggerFilePick(item.item_id)} disabled={isBusy}
                data-testid={`docrepo-upload-btn-${item.item_id}`}>
                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Upload
              </Button>
            ) : (
              <Button size="sm"
                className="h-8 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white text-xs gap-1.5"
                onClick={() => setConfirm({ kind: "reupload", item })} disabled={isBusy}
                data-testid={`docrepo-upload-btn-${item.item_id}`}>
                <Upload className="w-3.5 h-3.5" /> Upload
              </Button>
            )}
            <Button size="sm" variant="outline"
              className="h-8 text-xs gap-1.5 border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => setConfirm({ kind: hasFile ? "delete_file" : "delete_line", item })} disabled={isBusy}
              data-testid={`docrepo-delete-btn-${item.item_id}`}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="document-repository-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-10 bg-white border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(`/project/${projectId}/command-center`)}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
                data-testid="docrepo-back-btn">
                <ArrowLeft className="w-4 h-4" /> Back to Command Center
              </button>
              <div className="w-px h-6 bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#1DA1F2] to-indigo-600 rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-black">Document Repository</h1>
                  <p className="text-xs text-muted-foreground">{project?.company_name || "DRHP Project"} • SEBI Detailed DRHP Checklist</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload tracker */}
          <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3" data-testid="docrepo-tracker">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Big X/Y counter */}
              <div className="flex items-center gap-3" data-testid="docrepo-counter">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-emerald-600 tabular-nums" data-testid="docrepo-counter-uploaded">{summary.uploaded}</span>
                  <span className="text-2xl font-semibold text-gray-400">/</span>
                  <span className="text-3xl font-extrabold text-[#003366] tabular-nums" data-testid="docrepo-counter-total">{summary.total_lines}</span>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">documents uploaded</span>
                  <span className="text-[11px] text-rose-600 font-medium" data-testid="docrepo-counter-pending">
                    {summary.pending} pending to upload
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-[240px] max-w-md">
                <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
                  <span>Progress</span>
                  <span className="font-semibold">{pct}%</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden border border-blue-100">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                    style={{ width: `${pct}%` }} data-testid="tracker-progress-bar" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="p-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
          </div>
        ) : (
          <div className="p-8 space-y-8">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Allowed formats: <b>PDF, Word (.doc/.docx), Images</b> only. Max file size: <b>5 MB</b>. Use <b>Add line</b> under any row to track additional uploads for the same document point (numbered 2.4.1, 2.4.2 etc.).</span>
            </div>

            {groups.map((group) => (
              <section key={group.category} data-testid={`docrepo-category-${group.order}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-[#1DA1F2]/10 rounded-lg flex items-center justify-center text-xs font-bold text-[#1DA1F2]">
                    {group.order}
                  </div>
                  <h2 className="text-base font-bold text-gray-900">{group.category}</h2>
                  <div className="flex-1 border-b border-gray-200" />
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {group.items.map((parent, idx) => {
                    const parentNumber = `${group.order}.${idx + 1}`;
                    return (
                      <div key={parent.item_id}>
                        {renderRow(parent, parentNumber, false)}
                        {/* Children (sub-lines) */}
                        {(parent.children || []).map((child, cIdx) => {
                          const childNumber = `${parentNumber}.${child.sub_line_order || (cIdx + 1)}`;
                          return renderRow(child, childNumber, true);
                        })}
                        {/* Add line + Remove line controls row */}
                        <div className="flex items-center gap-2 pl-4 pr-4 py-1.5 bg-gray-50 border-b border-gray-100 last:border-b-0">
                          <button
                            onClick={() => addSubLine(parent)}
                            disabled={busyId === parent.item_id}
                            className="inline-flex items-center gap-1 text-[11px] text-gray-600 hover:text-[#1DA1F2] font-medium disabled:opacity-50"
                            data-testid={`docrepo-addsubline-${parent.item_id}`}
                            title={`Add sub-item under ${parentNumber}`}
                          >
                            <Plus className="w-3 h-3" /> Add line (as {parentNumber}.{((parent.children || []).length) + 1})
                          </button>
                          <span className="text-gray-300">·</span>
                          <span className="text-[11px] text-gray-400">
                            {(parent.children || []).length} sub-item{(parent.children || []).length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent data-testid="docrepo-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "reupload" && "Replace existing document?"}
              {confirm?.kind === "delete_file" && "Delete this document?"}
              {confirm?.kind === "delete_line" && "Delete this line item?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "reupload" && (
                <>
                  A document already exists for this line — <b>{confirm?.item?.file?.filename}</b>.
                  Choose <b>Yes, replace</b> to upload a new file (the current one will be archived for 60&nbsp;days before being permanently deleted),
                  <b> View current</b> to inspect it first, or <b>No</b> to cancel.
                </>
              )}
              {confirm?.kind === "delete_file" && (
                <>
                  The uploaded file <b>{confirm?.item?.file?.filename}</b> will be removed from this line and stored in the audit log for <b>60&nbsp;days</b> before being permanently deleted. The line item itself stays in the checklist.
                </>
              )}
              {confirm?.kind === "delete_line" && (
                <>
                  The line item <b>{confirm?.item?.title}</b>{confirm?.item?.file && <> along with its uploaded file <b>{confirm?.item?.file?.filename}</b> (archived for 60&nbsp;days)</>} will be permanently removed from the checklist. Recorded in the Project Audit Log.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="docrepo-confirm-no">No</AlertDialogCancel>
            {confirm?.kind === "reupload" && (
              <Button
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 gap-1.5"
                data-testid="docrepo-confirm-view-current"
                onClick={() => {
                  const item = confirm.item;
                  setConfirm(null);
                  setTimeout(() => openViewer(item), 80);
                }}
              >
                <Eye className="w-3.5 h-3.5" /> View current document
              </Button>
            )}
            <AlertDialogAction
              data-testid="docrepo-confirm-yes"
              className={confirm?.kind === "reupload" ? "bg-[#1DA1F2] hover:bg-[#1a8cd8]" : "bg-red-600 hover:bg-red-700"}
              onClick={() => {
                if (!confirm) return;
                if (confirm.kind === "reupload") {
                  const item = confirm.item; setConfirm(null);
                  setTimeout(() => triggerFilePick(item.item_id), 80);
                } else if (confirm.kind === "delete_file") { doDeleteFile(confirm.item); }
                else if (confirm.kind === "delete_line") { doDeleteLine(confirm.item); }
              }}
            >
              {confirm?.kind === "reupload" ? "Yes, replace" : "Yes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── In-app document viewer (read-only) ─── */}
      <Dialog open={!!viewer} onOpenChange={(o) => !o && closeViewer()}>
        <DialogContent
          className="max-w-5xl w-[92vw] h-[88vh] p-0 flex flex-col"
          data-testid="docrepo-viewer-dialog"
        >
          <DialogHeader className="px-5 py-3 border-b border-gray-200 flex-row items-center justify-between space-y-0">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2 truncate">
                <Eye className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span className="truncate">{viewer?.filename || "Document viewer"}</span>
              </DialogTitle>
              <DialogDescription className="text-[11px] text-gray-500 mt-0.5">
                Read-only preview. Download disabled inside this viewer — close to use the dedicated Download button.
              </DialogDescription>
            </div>
            <button
              onClick={closeViewer}
              className="ml-3 inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex-shrink-0"
              data-testid="docrepo-viewer-close"
              aria-label="Close viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </DialogHeader>
          <div className="flex-1 bg-gray-100 overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
            {viewer && (() => {
              const ct = viewer.contentType || "";
              if (ct.startsWith("image/")) {
                return (
                  <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                    <img
                      src={viewer.url}
                      alt={viewer.filename}
                      className="max-w-full max-h-full object-contain shadow"
                      draggable={false}
                      data-testid="docrepo-viewer-image"
                    />
                  </div>
                );
              }
              if (ct === "application/pdf") {
                // #toolbar=0 hides Chrome PDF download/print buttons (best-effort)
                return (
                  <iframe
                    src={`${viewer.url}#toolbar=0&navpanes=0`}
                    title={viewer.filename}
                    className="w-full h-full border-0 bg-white"
                    data-testid="docrepo-viewer-pdf"
                  />
                );
              }
              return (
                <div className="h-full flex flex-col items-center justify-center text-center p-10">
                  <FileText className="w-14 h-14 text-gray-300 mb-3" />
                  <p className="text-sm font-semibold text-gray-700 mb-1">In-browser preview not available for this format</p>
                  <p className="text-xs text-gray-500 max-w-md">
                    Word documents (.doc / .docx) cannot render natively in the browser viewer.
                    Close this dialog and use <b>Download</b> to open the file in Word or Google Docs.
                  </p>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentRepository;
