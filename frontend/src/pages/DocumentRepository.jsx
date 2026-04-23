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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft, Upload, RotateCcw, Trash2, Plus, FileText, Download,
  Loader2, FolderOpen, CheckCircle2, AlertTriangle, X,
} from "lucide-react";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const isAllowed = (file) => {
  if (!file) return false;
  const ct = (file.type || "").toLowerCase();
  return ct.startsWith("image/") || ALLOWED_MIME.includes(ct);
};

const prettySize = (bytes) => {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const DocumentRepository = ({ user, apiClient }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [project, setProject] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { kind, item }
  const [addDialog, setAddDialog] = useState({ open: false, category: "", title: "", remarks: "" });
  const fileInputs = useRef({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get(`/projects/${projectId}/document-repository`);
      setGroups(r.data.groups || []);
      setProject(r.data.project);
    } catch (e) {
      toast.error("Failed to load document repository");
      if (e.response?.status === 404) navigate("/drhp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [projectId]);

  const totalItems = groups.reduce((s, g) => s + g.items.length, 0);
  const uploadedItems = groups.reduce((s, g) => s + g.items.filter((i) => i.file).length, 0);

  const triggerFilePick = (itemId) => {
    const el = fileInputs.current[itemId];
    if (el) { el.value = ""; el.click(); }
  };

  const handleFileSelected = async (item, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAllowed(file)) {
      toast.error("Only PDF, Word, or image files are allowed. Please re-upload in a supported format.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(`File is ${(file.size / (1024 * 1024)).toFixed(2)}MB — exceeds 5MB limit. Please re-upload a smaller file.`);
      return;
    }
    setBusyId(item.item_id);
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await apiClient.post(
        `/projects/${projectId}/document-repository/items/${item.item_id}/upload`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      toast.success(r.data?.reupload ? "File re-uploaded" : "File uploaded");
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setBusyId(null);
    }
  };

  const doDeleteFile = async (item) => {
    setBusyId(item.item_id);
    try {
      await apiClient.delete(`/projects/${projectId}/document-repository/items/${item.item_id}/file`);
      toast.success("File deleted");
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Delete failed");
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  };

  const doDeleteLine = async (item) => {
    setBusyId(item.item_id);
    try {
      await apiClient.delete(`/projects/${projectId}/document-repository/items/${item.item_id}`);
      toast.success("Line item deleted");
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Delete failed");
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  };

  const doAddLine = async () => {
    if (!addDialog.title.trim() || !addDialog.category) {
      toast.error("Title and category are required");
      return;
    }
    try {
      await apiClient.post(`/projects/${projectId}/document-repository/items`, {
        category: addDialog.category,
        title: addDialog.title,
        remarks: addDialog.remarks,
      });
      toast.success("Line item added");
      setAddDialog({ open: false, category: "", title: "", remarks: "" });
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not add line item");
    }
  };

  const downloadFile = async (item) => {
    try {
      const r = await apiClient.get(
        `/projects/${projectId}/document-repository/items/${item.item_id}/download`,
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.file.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="document-repository-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-10 bg-white border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/project/${projectId}/command-center`)}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
                data-testid="docrepo-back-btn"
              >
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
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white border-[#1DA1F2] text-[#1DA1F2]">
                {uploadedItems}/{totalItems} Documents Uploaded
              </Badge>
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
              <span>
                Allowed formats: <b>PDF, Word (.doc/.docx), Images</b> only. Max file size: <b>5 MB</b>.
                Uploads outside this spec (e.g., .zip) will be rejected — please re-upload in a supported format.
              </span>
            </div>

            {groups.map((group) => (
              <section key={group.category} data-testid={`docrepo-category-${group.order}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-[#1DA1F2]/10 rounded-lg flex items-center justify-center text-xs font-bold text-[#1DA1F2]">
                    {group.order}
                  </div>
                  <h2 className="text-base font-bold text-gray-900">{group.category}</h2>
                  <div className="flex-1 border-b border-gray-200" />
                  <span className="text-xs text-gray-500">{group.items.filter(i => i.file).length}/{group.items.length} uploaded</span>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {group.items.map((item, idx) => {
                    const isBusy = busyId === item.item_id;
                    const hasFile = !!item.file;
                    return (
                      <div
                        key={item.item_id}
                        className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${hasFile ? "bg-emerald-50/30" : ""}`}
                        data-testid={`docrepo-row-${item.item_id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-[11px] font-semibold text-gray-600 mt-0.5">
                            {group.order}.{idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                              {item.is_custom && <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-blue-50 text-blue-700 border-blue-200">Custom</Badge>}
                              {hasFile && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] py-0 px-1.5"><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Uploaded</Badge>}
                            </div>
                            {item.remarks && <p className="text-xs text-gray-500 mt-0.5">{item.remarks}</p>}
                            {hasFile && (
                              <div className="mt-1.5 inline-flex items-center gap-2 text-[11px] text-gray-600 bg-white border border-gray-200 rounded px-2 py-1">
                                <FileText className="w-3 h-3 text-[#1DA1F2]" />
                                <span className="font-medium truncate max-w-[260px]">{item.file.filename}</span>
                                <span className="text-gray-400">·</span>
                                <span>{prettySize(item.file.size)}</span>
                                <span className="text-gray-400">·</span>
                                <button onClick={() => downloadFile(item)} className="text-[#1DA1F2] hover:underline inline-flex items-center gap-0.5" data-testid={`docrepo-download-${item.item_id}`}>
                                  <Download className="w-3 h-3" /> Download
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Hidden file input */}
                          <input
                            ref={(el) => (fileInputs.current[item.item_id] = el)}
                            type="file"
                            accept=".pdf,.doc,.docx,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="hidden"
                            onChange={(e) => handleFileSelected(item, e)}
                            data-testid={`docrepo-file-input-${item.item_id}`}
                          />

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {!hasFile ? (
                              <Button
                                size="sm"
                                className="h-8 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white text-xs gap-1.5"
                                onClick={() => triggerFilePick(item.item_id)}
                                disabled={isBusy}
                                data-testid={`docrepo-upload-btn-${item.item_id}`}
                              >
                                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                Upload
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                                onClick={() => setConfirm({ kind: "reupload", item })}
                                disabled={isBusy}
                                data-testid={`docrepo-reupload-btn-${item.item_id}`}
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Re-Upload
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1.5 border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => setConfirm({ kind: hasFile ? "delete_file" : "delete_line", item })}
                              disabled={isBusy}
                              data-testid={`docrepo-delete-btn-${item.item_id}`}
                              title={hasFile ? "Delete uploaded file" : "Delete this line item"}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </Button>
                          </div>
                        </div>

                        {/* Per-line add/remove line controls */}
                        <div className="flex items-center gap-2 mt-2 ml-10">
                          <button
                            onClick={() => setAddDialog({ open: true, category: group.category, title: "", remarks: "" })}
                            className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-[#1DA1F2]"
                            data-testid={`docrepo-addline-${item.item_id}`}
                            title="Add a new line in this section"
                          >
                            <Plus className="w-3 h-3" /> Add line
                          </button>
                          <span className="text-gray-300">·</span>
                          <button
                            onClick={() => setConfirm({ kind: "delete_line", item })}
                            className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-600"
                            data-testid={`docrepo-removeline-${item.item_id}`}
                            title="Remove this entire line item from the repository"
                          >
                            <X className="w-3 h-3" /> Remove line
                          </button>
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

      {/* Confirmation dialog for Re-Upload, Delete file, Delete line */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent data-testid="docrepo-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "reupload" && "Are you sure you want to re-upload this document?"}
              {confirm?.kind === "delete_file" && "Are you sure you want to delete this document?"}
              {confirm?.kind === "delete_line" && "Are you sure you want to delete this line item?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "reupload" && <>The existing file <b>{confirm?.item?.file?.filename}</b> will be replaced. This action is recorded in the Project Audit Log.</>}
              {confirm?.kind === "delete_file" && <>The uploaded file <b>{confirm?.item?.file?.filename}</b> will be removed. The line item will stay in the checklist. Recorded in the Project Audit Log.</>}
              {confirm?.kind === "delete_line" && (
                <>The line item <b>{confirm?.item?.title}</b>{confirm?.item?.file && <> along with its uploaded file <b>{confirm?.item?.file?.filename}</b></>} will be permanently removed from this project. Recorded in the Project Audit Log.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="docrepo-confirm-no">No</AlertDialogCancel>
            <AlertDialogAction
              data-testid="docrepo-confirm-yes"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (!confirm) return;
                if (confirm.kind === "reupload") {
                  const item = confirm.item;
                  setConfirm(null);
                  setTimeout(() => triggerFilePick(item.item_id), 80);
                } else if (confirm.kind === "delete_file") {
                  doDeleteFile(confirm.item);
                } else if (confirm.kind === "delete_line") {
                  doDeleteLine(confirm.item);
                }
              }}
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add custom line dialog */}
      <Dialog open={addDialog.open} onOpenChange={(o) => setAddDialog((d) => ({ ...d, open: o }))}>
        <DialogContent className="sm:max-w-[520px]" data-testid="docrepo-add-dialog">
          <DialogHeader>
            <DialogTitle>Add new line item</DialogTitle>
            <DialogDescription>
              Track an additional document that isn't already in the SEBI checklist for this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Category</Label>
              <Input value={addDialog.category} readOnly className="mt-1 bg-gray-50" />
            </div>
            <div>
              <Label htmlFor="new-title" className="text-xs">Document Title <span className="text-red-500">*</span></Label>
              <Input
                id="new-title"
                data-testid="docrepo-add-title"
                value={addDialog.title}
                onChange={(e) => setAddDialog((d) => ({ ...d, title: e.target.value }))}
                placeholder="e.g., Board Resolution for Buyback"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-remarks" className="text-xs">Remarks (optional)</Label>
              <Textarea
                id="new-remarks"
                data-testid="docrepo-add-remarks"
                value={addDialog.remarks}
                onChange={(e) => setAddDialog((d) => ({ ...d, remarks: e.target.value }))}
                placeholder="Why this document matters, any specific SEBI reg reference..."
                rows={3}
                className="mt-1 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog({ open: false, category: "", title: "", remarks: "" })}>Cancel</Button>
            <Button onClick={doAddLine} className="bg-[#1DA1F2] hover:bg-[#1a8cd8]" data-testid="docrepo-add-confirm">Add line</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentRepository;
