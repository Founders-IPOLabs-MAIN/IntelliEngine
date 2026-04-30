import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import {
  DocumentEditorContainerComponent,
  Toolbar,
} from "@syncfusion/ej2-react-documenteditor";
import { Loader2 } from "lucide-react";

DocumentEditorContainerComponent.Inject(Toolbar);

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SyncfusionDocEditor = forwardRef(({ projectId, boardType = "sme", apiClient, onSaveComplete }, ref) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const sfdtRes = await fetch(
        `${API_URL}/api/projects/${projectId}/drhp-sfdt?board_type=${boardType}`,
        { credentials: "include", headers: getAuthHeaders() }
      );

      const waitForEditor = (openFn) => {
        const editor = containerRef.current;
        if (editor?.documentEditor) {
          openFn(editor.documentEditor);
          setLoading(false);
        } else {
          setTimeout(() => waitForEditor(openFn), 50);
        }
      };

      if (sfdtRes.ok) {
        const sfdt = await sfdtRes.text();
        waitForEditor((de) => de.open(sfdt));
        return;
      }

      const docxRes = await fetch(
        `${API_URL}/api/projects/${projectId}/drhp-docx?board_type=${boardType}`,
        { credentials: "include", headers: getAuthHeaders() }
      );

      if (docxRes.status === 404) {
        waitForEditor((de) => de.openBlank());
        return;
      }

      const blob = await docxRes.blob();
      const formData = new FormData();
      formData.append("files", blob, "document.docx");
      const importRes = await fetch(`${API_URL}/api/doceditor/Import`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: getAuthHeaders(),
      });

      if (importRes.ok) {
        const sfdt = await importRes.text();
        waitForEditor((de) => de.open(sfdt));
      } else {
        waitForEditor((de) => de.openBlank());
      }
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
          <p className="text-red-600 font-medium text-sm mb-1">Failed to load editor</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative syncfusion-editor-wrap" data-testid="syncfusion-doc-editor">
      {loading && (
        <div className="absolute inset-0 z-50 bg-white/80 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2] mx-auto mb-2" />
            <p className="text-sm text-gray-500">Initializing Document Editor...</p>
          </div>
        </div>
      )}

      <style>{`
        .syncfusion-editor-wrap {
          width: 100%;
          overflow: hidden;
        }
        /* Compact toolbar - wrap to 2 lines, smaller icons */
        .syncfusion-editor-wrap .e-de-toolbar {
          flex-wrap: wrap !important;
          height: auto !important;
          min-height: unset !important;
          padding: 2px 4px !important;
        }
        .syncfusion-editor-wrap .e-de-toolbar .e-toolbar-items {
          flex-wrap: wrap !important;
          height: auto !important;
        }
        .syncfusion-editor-wrap .e-de-toolbar .e-toolbar-item .e-tbar-btn {
          padding: 3px 6px !important;
          min-width: unset !important;
        }
        .syncfusion-editor-wrap .e-de-toolbar .e-toolbar-item .e-tbar-btn .e-btn-icon {
          font-size: 14px !important;
        }
        .syncfusion-editor-wrap .e-de-toolbar .e-toolbar-item .e-tbar-btn .e-tbar-btn-text {
          font-size: 10px !important;
          line-height: 1.2 !important;
        }
        .syncfusion-editor-wrap .e-de-toolbar .e-toolbar-item {
          padding: 1px !important;
          margin: 1px !important;
        }
        /* Left-align the document page (remove center padding) */
        .syncfusion-editor-wrap .e-de-ctn {
          padding-left: 0 !important;
        }
        .syncfusion-editor-wrap .e-documenteditor {
          padding-left: 0 !important;
        }
        .syncfusion-editor-wrap .e-de-doc-cntr {
          margin-left: 0 !important;
          justify-content: flex-start !important;
        }
        /* Scrollbars inside the page area */
        .syncfusion-editor-wrap .e-de-ctn,
        .syncfusion-editor-wrap .e-documenteditorcontainer {
          overflow: auto !important;
        }
        /* Properties pane hidden by default for more space */
        .syncfusion-editor-wrap .e-de-property-pane {
          display: none !important;
        }
        /* Status bar compact */
        .syncfusion-editor-wrap .e-de-status-bar {
          height: 24px !important;
          padding: 0 8px !important;
          font-size: 11px !important;
        }
      `}</style>

      <div style={{ height: "calc(100vh - 130px)", width: "100%" }}>
        <DocumentEditorContainerComponent
          ref={containerRef}
          height="100%"
          width="100%"
          serviceUrl={`${API_URL}/api/doceditor/`}
          enableToolbar={true}
          enableSpellCheck={false}
          enableTableOfContentsDialog={true}
          enableBookmarkDialog={true}
          enableFontDialog={true}
          enableTableDialog={true}
          enableImageResizer={true}
          enableComment={true}
          showPropertiesPane={false}
          data-testid="syncfusion-editor-container"
        />
      </div>
    </div>
  );
});

SyncfusionDocEditor.displayName = "SyncfusionDocEditor";

export default SyncfusionDocEditor;
