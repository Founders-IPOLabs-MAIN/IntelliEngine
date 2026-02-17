import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ChevronRight,
  Upload,
  Download,
  FileText,
  Trash2,
  Loader2,
  Save,
  Scan,
  Check,
  AlertCircle,
  Clock,
  X
} from "lucide-react";

const SectionEditor = ({ user, apiClient }) => {
  const { projectId, sectionId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [project, setProject] = useState(null);
  const [section, setSection] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState({});
  const [content, setContent] = useState("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId, sectionId]);

  const fetchData = async () => {
    try {
      const [projectRes, sectionRes, docsRes] = await Promise.all([
        apiClient.get(`/projects/${projectId}`),
        apiClient.get(`/projects/${projectId}/sections/${sectionId}`),
        apiClient.get(`/documents?section_id=${sectionId}`)
      ]);
      setProject(projectRes.data);
      setSection(sectionRes.data);
      setDocuments(docsRes.data);
      setContent(sectionRes.data.content?.text || "");
    } catch (error) {
      console.error("Failed to fetch data:", error);
      navigate(`/drhp-builder/${projectId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/projects/${projectId}/sections/${sectionId}`, {
        content: { text: content },
        status: section.status
      });
      toast.success("Section saved successfully");
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await apiClient.put(`/projects/${projectId}/sections/${sectionId}`, {
        status: newStatus
      });
      setSection(response.data);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("project_id", projectId);
        formData.append("section_id", sectionId);
        
        const response = await apiClient.post("/documents/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        
        setDocuments(prev => [...prev, response.data]);
        toast.success(`${file.name} uploaded successfully`);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await apiClient.get(`/documents/${doc.document_id}/download`, {
        responseType: "blob"
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download document");
    }
  };

  const handleDelete = async (docId) => {
    try {
      await apiClient.delete(`/documents/${docId}`);
      setDocuments(prev => prev.filter(d => d.document_id !== docId));
      toast.success("Document deleted");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleOCR = async (doc) => {
    setOcrProcessing(prev => ({ ...prev, [doc.document_id]: true }));
    try {
      const response = await apiClient.post(`/documents/${doc.document_id}/ocr`, {
        document_id: doc.document_id,
        prompt: "Extract all text, tables, and structured data from this document. Organize the output clearly."
      });
      
      // Append OCR text to content
      setContent(prev => prev + (prev ? "\n\n" : "") + "--- OCR Extracted Text ---\n" + response.data.ocr_text);
      
      // Update document in list
      setDocuments(prev => prev.map(d => 
        d.document_id === doc.document_id 
          ? { ...d, ocr_status: "completed", ocr_text: response.data.ocr_text }
          : d
      ));
      
      toast.success("OCR completed successfully");
    } catch (error) {
      console.error("OCR failed:", error);
      toast.error("OCR processing failed");
    } finally {
      setOcrProcessing(prev => ({ ...prev, [doc.document_id]: false }));
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const getOcrStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <Check className="w-4 h-4 text-green-600" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white" data-testid="section-editor-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-border px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <button onClick={() => navigate("/dashboard")} className="hover:text-black">Dashboard</button>
            <ChevronRight className="w-4 h-4" />
            <button onClick={() => navigate(`/drhp-builder/${projectId}`)} className="hover:text-black">DRHP Builder</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-black font-medium">{section?.section_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-black">
                {section?.section_name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {project?.company_name} DRHP
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={section?.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-32" data-testid="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-2"
                data-testid="save-btn"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                ) : (
                  <><Save className="w-4 h-4" />Save</>
                )}
              </Button>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Editor */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Section Content</CardTitle>
                  <CardDescription>Edit the content for this DRHP section</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter section content here..."
                    className="min-h-[400px] font-mono text-sm resize-none"
                    data-testid="content-textarea"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Documents Panel */}
            <div className="space-y-6">
              {/* Upload Zone */}
              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Documents
                  </CardTitle>
                  <CardDescription>Upload and manage documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`drop-zone rounded-lg p-6 text-center cursor-pointer transition-colors ${dragOver ? "drag-over" : ""}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="upload-zone"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                    />
                    {uploading ? (
                      <Loader2 className="w-8 h-8 mx-auto text-[#1DA1F2] animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 mx-auto text-gray-400" />
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      {uploading ? "Uploading..." : "Drop files here or click to upload"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, Word, Excel, Images
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Document List */}
              {documents.length > 0 && (
                <Card className="border border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Uploaded Files ({documents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="max-h-[300px]">
                      <div className="divide-y divide-border">
                        {documents.map((doc) => (
                          <div key={doc.document_id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-gray-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-black truncate" title={doc.filename}>
                                  {doc.filename}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {formatFileSize(doc.file_size)}
                                  </span>
                                  <span className="text-xs flex items-center gap-1" title={`OCR: ${doc.ocr_status}`}>
                                    {getOcrStatusIcon(doc.ocr_status)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleOCR(doc)}
                                disabled={ocrProcessing[doc.document_id]}
                                data-testid={`ocr-btn-${doc.document_id}`}
                              >
                                {ocrProcessing[doc.document_id] ? (
                                  <><Loader2 className="w-3 h-3 animate-spin" />Processing</>
                                ) : (
                                  <><Scan className="w-3 h-3" />OCR Scan</>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleDownload(doc)}
                                data-testid={`download-btn-${doc.document_id}`}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(doc.document_id)}
                                data-testid={`delete-btn-${doc.document_id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SectionEditor;