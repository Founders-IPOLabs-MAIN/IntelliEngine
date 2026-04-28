import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import {
  DocumentEditorContainerComponent,
  Toolbar,
} from "@syncfusion/ej2-react-documenteditor";
import { Loader2 } from "lucide-react";

DocumentEditorContainerComponent.Inject(Toolbar);

const SERVICE_URL = "https://ej2services.syncfusion.com/production/web-services/api/documenteditor/";
const API_URL = process.env.REACT_APP_BACKEND_URL;

const SyncfusionDocEditor = forwardRef(({ projectId, boardType = "sme", apiClient, onSaveComplete }, ref) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasDoc, setHasDoc] = useState(false);

  useImperativeHandle(ref, () => ({
    save: handleSave,
    exportDocx: handleExport,
  }));

  useEffect(() => {
    loadDocument();
  }, [projectId, boardType]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/drhp-docx?board_type=${boardType}`,
        { credentials: "include", headers: getAuthHeaders() }
      );

      if (response.status === 404) {
        setHasDoc(false);
        setLoading(false);
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch document");

      const blob = await response.blob();
      setHasDoc(true);

      // Convert blob to base64 and open via Syncfusion service
      const formData = new FormData();
      formData.append("files", blob, "document.docx");

      const importRes = await fetch(`${SERVICE_URL}Import`, {
        method: "POST",
        body: formData,
      });

      if (!importRes.ok) throw new Error("Syncfusion import failed");

      const sfml = await importRes.json();

      // Wait for container to be ready
      const waitForEditor = () => {
        const editor = containerRef.current;
        if (editor?.documentEditor) {
          editor.documentEditor.open(JSON.stringify(sfml));
          setLoading(false);
        } else {
          setTimeout(waitForEditor, 200);
        }
      };
      waitForEditor();
    } catch (e) {
      console.error("Load error:", e);
      setError(e.message);
      setLoading(false);
    }
  };

  const getAuthHeaders = () => {
    const cookies = document.cookie.split(";");
    const sessionCookie = cookies.find((c) => c.trim().startsWith("session_token="));
    const token = sessionCookie ? sessionCookie.split("=")[1]?.trim() : "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleSave = async () => {
    const editor = containerRef.current?.documentEditor;
    if (!editor) return { success: false, error: "Editor not ready" };

    try {
      const blob = await editor.saveAsBlob("Docx");
      const formData = new FormData();
      formData.append("file", blob, `drhp_${projectId}_${boardType}.docx`);

      const res = await fetch(
        `${API_URL}/api/projects/${projectId}/drhp-docx?board_type=${boardType}`,
        { method: "POST", body: formData, credentials: "include", headers: getAuthHeaders() }
      );

      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      onSaveComplete?.();
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const handleExport = async () => {
    const editor = containerRef.current?.documentEditor;
    if (!editor) return;
    editor.save(`DRHP_${projectId}_${boardType}`, "Docx");
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-red-200 p-8">
        <div className="text-center">
          <p className="text-red-600 font-medium text-sm mb-1">Failed to load document</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative" data-testid="syncfusion-doc-editor">
      {loading && (
        <div className="absolute inset-0 z-50 bg-white/80 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2] mx-auto mb-2" />
            <p className="text-sm text-gray-500">{hasDoc ? "Loading document in editor..." : "Checking for document..."}</p>
          </div>
        </div>
      )}

      {!hasDoc && !loading && (
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8">
          <div className="text-center">
            <p className="text-gray-600 font-medium text-sm mb-1">No .docx file found</p>
            <p className="text-xs text-gray-400">Import a Word document first using the Import button above, then switch to Document Editor mode.</p>
          </div>
        </div>
      )}

      <div style={{ display: hasDoc ? "block" : "none", height: "calc(100vh - 160px)" }}>
        <DocumentEditorContainerComponent
          ref={containerRef}
          height="100%"
          serviceUrl={SERVICE_URL}
          enableToolbar={true}
          enableSpellCheck={false}
          enableTableOfContentsDialog={true}
          enableBookmarkDialog={true}
          enableFontDialog={true}
          enableTableDialog={true}
          enableImageResizer={true}
          enableComment={true}
          showPropertiesPane={true}
          data-testid="syncfusion-editor-container"
        />
      </div>
    </div>
  );
});

SyncfusionDocEditor.displayName = "SyncfusionDocEditor";

export default SyncfusionDocEditor;
