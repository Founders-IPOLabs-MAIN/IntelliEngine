import { forwardRef, useRef, useImperativeHandle, useEffect, useState } from "react";
import {
  DocumentEditorContainerComponent,
  Toolbar,
} from "@syncfusion/ej2-react-documenteditor";

DocumentEditorContainerComponent.Inject(Toolbar);

const SyncfusionDocEditor = forwardRef(({ projectId, boardType = "sme", apiClient, onSaveComplete }, ref) => {
  const containerRef = useRef(null);
  // True once we've attempted the auto-hydration for this (projectId, boardType).
  const hydratedKey = useRef("");
  const [hydrating, setHydrating] = useState(false);

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

  // ── Auto-load on mount ────────────────────────────────────────────────────
  // 1. Try the project's saved SFDT first (user's prior work always wins).
  // 2. Otherwise, load the predefined default template so the user never has
  //    to upload a DOCX manually.
  // The default lives at /app/backend/assets/drhp_defaults/<board>_board_default.docx
  // — admins can swap that file to update the template.
  useEffect(() => {
    if (!projectId) return;
    const key = `${projectId}::${boardType}`;
    if (hydratedKey.current === key) return;

    let cancelled = false;

    const openInEditor = (sfdt) => {
      const containerEl = document.getElementById("container");
      const editor = containerEl?.ej2_instances?.[0]?.documentEditor;
      if (!editor) return false;
      try {
        editor.open(typeof sfdt === "string" ? sfdt : JSON.stringify(sfdt));
        return true;
      } catch (err) {
        console.warn("Syncfusion open() failed", err);
        return false;
      }
    };

    const waitForEditor = async () => {
      for (let i = 0; i < 40; i += 1) {  // up to ~4s
        const editor = document.getElementById("container")?.ej2_instances?.[0]?.documentEditor;
        if (editor) return editor;
        await new Promise((r) => setTimeout(r, 100));
      }
      return null;
    };

    const hydrate = async () => {
      setHydrating(true);
      const editor = await waitForEditor();
      if (cancelled || !editor) { setHydrating(false); return; }

      // 1. Try project SFDT
      try {
        const res = await apiClient.get(
          `/projects/${projectId}/drhp-sfdt?board_type=${boardType}`
        );
        if (!cancelled && res?.data) {
          openInEditor(res.data);
          hydratedKey.current = key;
          setHydrating(false);
          return;
        }
      } catch (e) {
        // 404 expected for fresh projects — fall through to default template.
      }

      // 2. Auto-load the predefined default template
      try {
        const res = await apiClient.get(
          `/drhp/default-template/sfdt?board=${boardType}`
        );
        if (!cancelled && res?.data) {
          openInEditor(res.data);
        }
      } catch (e) {
        console.warn("Default DRHP template not available", e);
      } finally {
        hydratedKey.current = key;
        if (!cancelled) setHydrating(false);
      }
    };

    hydrate();
    return () => { cancelled = true; };
  }, [projectId, boardType]);  // eslint-disable-line

  return (
    <div className="flex-1 flex flex-col" data-testid="syncfusion-doc-editor" style={{ height: "calc(100vh - 130px)" }}>
      {hydrating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none" data-testid="syncfusion-hydrating">
          <div className="bg-white/90 border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-700 shadow">
            Loading template…
          </div>
        </div>
      )}
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
