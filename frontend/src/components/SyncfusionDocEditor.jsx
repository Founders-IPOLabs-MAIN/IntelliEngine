import { forwardRef, useRef, useImperativeHandle, useEffect, useState } from "react";
import {
  DocumentEditorContainerComponent,
  Toolbar,
} from "@syncfusion/ej2-react-documenteditor";

DocumentEditorContainerComponent.Inject(Toolbar);

// Syncfusion's hosted service — identical to the endpoint the Open / Upload
// toolbar button hits when the user uploads a .docx manually.
const SYNCFUSION_SERVICE_URL =
  "https://document.syncfusion.com/web-services/docx-editor/api/documenteditor/";

// Convert a .docx Blob → SFDT JSON via Syncfusion's /Import endpoint.
// Replicates the exact upload-parse code path used when the user clicks
// Open in the Syncfusion toolbar, so rendering quality is identical.
async function convertDocxBlobToSfdt(blob) {
  const form = new FormData();
  form.append("files", blob, "template.docx");
  const res = await fetch(`${SYNCFUSION_SERVICE_URL}Import`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Syncfusion Import failed (${res.status}): ${msg}`);
  }
  return await res.text();  // raw SFDT JSON string
}

const SyncfusionDocEditor = forwardRef(({ projectId, boardType = "sme", apiClient, onSaveComplete }, ref) => {
  const containerRef = useRef(null);
  // Tracks which (projectId, boardType) we've already auto-hydrated for.
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

  // ── Auto-load on every page entry ─────────────────────────────────────────
  //
  // Goal: whenever the user opens this page, the DOCX template is parsed &
  // rendered automatically — identical to what they'd see after a manual
  // "Open" via the Syncfusion toolbar.
  //
  // Flow:
  //  1. If the project already has saved SFDT (user previously edited), load
  //     THAT so their work is preserved.
  //  2. Otherwise, fetch the predefined .docx from our backend and pipe it
  //     through Syncfusion's /Import service — same path as manual upload —
  //     then open the returned SFDT. This guarantees rendering parity.
  //
  // The default DOCX lives at /app/backend/assets/drhp_defaults/<board>_board_default.docx
  // — overwrite that file to update the template for every new project.
  useEffect(() => {
    if (!projectId) return;
    const key = `${projectId}::${boardType}`;
    if (hydratedKey.current === key) return;

    let cancelled = false;

    const waitForEditor = async () => {
      for (let i = 0; i < 40; i += 1) {  // up to ~4s
        const editor = document.getElementById("container")?.ej2_instances?.[0]?.documentEditor;
        if (editor) return editor;
        await new Promise((r) => setTimeout(r, 100));
      }
      return null;
    };

    const openSfdt = (editor, sfdt) => {
      try {
        editor.open(typeof sfdt === "string" ? sfdt : JSON.stringify(sfdt));
        return true;
      } catch (err) {
        console.warn("Syncfusion open() failed", err);
        return false;
      }
    };

    const hydrate = async () => {
      setHydrating(true);
      const editor = await waitForEditor();
      if (cancelled || !editor) { setHydrating(false); return; }

      // 1. Prefer the project's saved SFDT (preserves user edits).
      try {
        const res = await apiClient.get(
          `/projects/${projectId}/drhp-sfdt?board_type=${boardType}`
        );
        if (!cancelled && res?.data) {
          openSfdt(editor, res.data);
          hydratedKey.current = key;
          setHydrating(false);
          return;
        }
      } catch (e) {
        // 404 for fresh projects — fall through to default template.
      }

      // 2. Fresh project — fetch the raw .docx and send it through the SAME
      //    Syncfusion /Import service the manual upload uses. This is what
      //    guarantees rendering/parsing parity with the upload flow.
      try {
        const API_URL = process.env.REACT_APP_BACKEND_URL;
        const cookies = document.cookie.split(";");
        const sessionCookie = cookies.find((c) => c.trim().startsWith("session_token="));
        const token = sessionCookie ? sessionCookie.split("=")[1]?.trim() : "";
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const docxRes = await fetch(
          `${API_URL}/api/drhp/default-template/docx?board=${boardType}`,
          { method: "GET", credentials: "include", headers }
        );
        if (!docxRes.ok) {
          console.warn("Default DRHP template not available", docxRes.status);
          return;
        }
        const blob = await docxRes.blob();
        const sfdt = await convertDocxBlobToSfdt(blob);
        if (!cancelled) {
          openSfdt(editor, sfdt);
        }
      } catch (e) {
        console.error("Auto-load via Syncfusion Import failed", e);
      } finally {
        hydratedKey.current = key;
        if (!cancelled) setHydrating(false);
      }
    };

    hydrate();
    return () => { cancelled = true; };
  }, [projectId, boardType]);  // eslint-disable-line

  return (
    <div className="flex-1 flex flex-col relative" data-testid="syncfusion-doc-editor" style={{ height: "calc(100vh - 130px)" }}>
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
        serviceUrl={SYNCFUSION_SERVICE_URL}
        enableToolbar={true}
      />
    </div>
  );
});

SyncfusionDocEditor.displayName = "SyncfusionDocEditor";

export default SyncfusionDocEditor;
