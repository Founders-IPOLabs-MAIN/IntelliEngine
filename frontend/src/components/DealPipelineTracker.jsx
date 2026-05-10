import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Save, TrendingUp, AlertTriangle } from "lucide-react";

const SEGMENTS  = ["SME", "Main Board", "Both", "Other"];
const STAGES    = [
  "Drafting", "Filing", "Listed", "Hold", "Financial Audit",
  "DPI", "RHP", "Allotment", "Listing", "Withdrawn", "Other",
];

const stageBadge = (stage) => {
  const map = {
    "Drafting":         "bg-blue-50 text-blue-700 border-blue-200",
    "Filing":           "bg-indigo-50 text-indigo-700 border-indigo-200",
    "DPI":              "bg-violet-50 text-violet-700 border-violet-200",
    "RHP":              "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    "Allotment":        "bg-amber-50 text-amber-700 border-amber-200",
    "Listing":          "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Listed":           "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Hold":             "bg-orange-50 text-orange-700 border-orange-200",
    "Financial Audit":  "bg-cyan-50 text-cyan-700 border-cyan-200",
    "Withdrawn":        "bg-red-50 text-red-700 border-red-200",
  };
  return map[stage] || "bg-gray-50 text-gray-600 border-gray-200";
};

const blankRow = () => ({
  client_name: "", project_lead: "", segment: "", stage: "",
  key_pending_items: "", issues: "", target_filing: "", techflow: "",
});

const DealPipelineTracker = ({ apiClient }) => {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [dirty, setDirty]     = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await apiClient.get("/drhp/deal-pipeline");
        setRows(r.data.mandates?.length ? r.data.mandates : [blankRow()]);
      } catch {
        setRows([blankRow()]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  const update = (i, key, val) => {
    setRows((r) => r.map((row, idx) => idx === i ? { ...row, [key]: val } : row));
    setDirty(true);
  };

  const addRow    = () => { setRows((r) => [...r, blankRow()]); setDirty(true); };
  const removeRow = (i) => { setRows((r) => r.filter((_, idx) => idx !== i)); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try {
      await apiClient.post("/drhp/deal-pipeline/bulk-replace", {
        mandates: rows.filter((r) => Object.values(r).some((v) => (v || "").trim())),
      });
      toast.success("Deal pipeline saved");
      setDirty(false);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not save pipeline");
    }
    setSaving(false);
  };

  const stats = useMemo(() => {
    const populated = rows.filter((r) => r.client_name?.trim());
    const byStage = populated.reduce((acc, r) => {
      const k = r.stage || "Unassigned";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    return { total: populated.length, byStage };
  }, [rows]);

  return (
    <section className="mt-10" data-testid="deal-pipeline-section">
      {/* Header strip */}
      <div className="bg-gradient-to-r from-[#1DA1F2] via-[#1a8cd8] to-[#0c7abf] rounded-t-xl px-5 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-white/15 backdrop-blur ring-1 ring-white/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-white tracking-tight">Deal Pipeline — All Active Mandates</h3>
            <p className="text-[11px] text-blue-50/90">Track every IPO mandate end-to-end. Add a row per client, mark progress, capture pending items.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stats.total > 0 && (
            <Badge className="bg-white/15 backdrop-blur border-white/30 text-white text-[11px] font-semibold">
              {stats.total} active
            </Badge>
          )}
          <Button
            size="sm"
            onClick={save}
            disabled={!dirty || saving}
            className="h-8 text-xs gap-1.5 bg-white text-[#0c7abf] hover:bg-blue-50 disabled:opacity-60"
            data-testid="deal-pipeline-save"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {dirty ? "Save Changes" : "Saved"}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white border border-gray-200 border-t-0 rounded-b-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-10 text-[12px] text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin inline-block mr-1.5" /> Loading pipeline…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]" data-testid="deal-pipeline-table">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50/50 to-blue-50/20 border-b border-gray-200">
                  {[
                    "Client Name", "Project Lead", "Segment", "Stage",
                    "Key Pending Items", "Issues", "Target Filing", "TechFlow", "",
                  ].map((h, i) => (
                    <th key={i} className={`px-2.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#1DA1F2] ${i === 8 ? "w-8" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-blue-50/20 transition-colors group" data-testid={`deal-pipeline-row-${i}`}>
                    <td className="px-1.5 py-1">
                      <Input
                        value={row.client_name}
                        onChange={(e) => update(i, "client_name", e.target.value)}
                        placeholder="Client Co. Pvt Ltd"
                        className="h-7 text-[12.5px] border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-[#1DA1F2] px-2 font-semibold"
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <Input
                        value={row.project_lead}
                        onChange={(e) => update(i, "project_lead", e.target.value)}
                        placeholder="Lead name"
                        className="h-7 text-[12.5px] border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-[#1DA1F2] px-2"
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <select
                        value={row.segment}
                        onChange={(e) => update(i, "segment", e.target.value)}
                        className="w-full h-7 text-[12.5px] border-0 bg-transparent focus:ring-1 focus:ring-[#1DA1F2] focus:outline-none rounded px-1.5 text-gray-700"
                      >
                        <option value="">—</option>
                        {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-1.5 py-1">
                      <div className="flex items-center gap-1">
                        <select
                          value={row.stage}
                          onChange={(e) => update(i, "stage", e.target.value)}
                          className="w-full h-7 text-[12.5px] border-0 bg-transparent focus:ring-1 focus:ring-[#1DA1F2] focus:outline-none rounded px-1.5 text-gray-700"
                        >
                          <option value="">—</option>
                          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {row.stage && (
                          <Badge className={`${stageBadge(row.stage)} text-[9.5px] px-1.5 py-0 h-5 font-semibold flex-shrink-0`} variant="outline">
                            {row.stage}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-1.5 py-1">
                      <Input
                        value={row.key_pending_items}
                        onChange={(e) => update(i, "key_pending_items", e.target.value)}
                        placeholder="Audit completion, BRLM finalisation…"
                        className="h-7 text-[12.5px] border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-[#1DA1F2] px-2"
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <div className="flex items-center gap-1">
                        {row.issues?.trim() && <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                        <Input
                          value={row.issues}
                          onChange={(e) => update(i, "issues", e.target.value)}
                          placeholder="None"
                          className="h-7 text-[12.5px] border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-[#1DA1F2] px-2"
                        />
                      </div>
                    </td>
                    <td className="px-1.5 py-1">
                      <Input
                        value={row.target_filing}
                        onChange={(e) => update(i, "target_filing", e.target.value)}
                        placeholder="Q3 FY26 / Already Filed"
                        className="h-7 text-[12.5px] border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-[#1DA1F2] px-2"
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <Input
                        value={row.techflow}
                        onChange={(e) => update(i, "techflow", e.target.value)}
                        placeholder="0–10"
                        className="h-7 text-[12.5px] border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-[#1DA1F2] px-2 text-center"
                      />
                    </td>
                    <td className="px-1.5 py-1 text-right">
                      <button
                        onClick={() => removeRow(i)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
                        data-testid={`deal-pipeline-remove-${i}`}
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-3 py-2 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
          <Button
            size="sm"
            variant="outline"
            onClick={addRow}
            className="h-7 text-[11.5px] gap-1.5 border-blue-200 text-[#1DA1F2] hover:bg-blue-50"
            data-testid="deal-pipeline-add-row"
          >
            <Plus className="w-3.5 h-3.5" /> Add Mandate
          </Button>
          {Object.keys(stats.byStage).length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(stats.byStage).map(([stage, n]) => (
                <Badge key={stage} className={`${stageBadge(stage)} text-[10px] px-2 py-0.5 font-semibold`} variant="outline">
                  {stage}: {n}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DealPipelineTracker;
