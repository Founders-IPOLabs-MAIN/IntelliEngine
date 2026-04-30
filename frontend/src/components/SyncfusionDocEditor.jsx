import { forwardRef, useRef, useImperativeHandle } from "react";
import {
  DocumentEditorContainerComponent,
  Toolbar,
} from "@syncfusion/ej2-react-documenteditor";

DocumentEditorContainerComponent.Inject(Toolbar);

const SyncfusionDocEditor = forwardRef(({ projectId, boardType = "sme", apiClient, onSaveComplete }, ref) => {
  const containerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    save: handleSave,
    exportDocx: handleExport,
  }));

  const handleSave = async () => {
    const editor = containerRef.current?.documentEditor;
    if (!editor) return { success: false, error: "Editor not ready" };
    try {
      const blob = await editor.saveAsBlob("Docx");
      const formData = new FormData();
      formData.append("file", blob, `drhp_${projectId}_${boardType}.docx`);
      const API_URL = process.env.REACT_APP_BACKEND_URL;
      const cookies = document.cookie.split(";");
      const sessionCookie = cookies.find((c) => c.trim().startsWith("session_token="));
      const token = sessionCookie ? sessionCookie.split("=")[1]?.trim() : "";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(
        `${API_URL}/api/projects/${projectId}/drhp-docx?board_type=${boardType}`,
        { method: "POST", body: formData, credentials: "include", headers }
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

  return (
    <div className="flex-1 flex flex-col" data-testid="syncfusion-doc-editor" style={{ height: "calc(100vh - 130px)" }}>
      <DocumentEditorContainerComponent
        ref={containerRef}
        id="container"
        height="100%"
        serviceUrl="https://document.syncfusion.com/web-services/docx-editor/api/documenteditor/"
        enableToolbar={true}
      />
    </div>
  );
});

SyncfusionDocEditor.displayName = "SyncfusionDocEditor";

export default SyncfusionDocEditor;
