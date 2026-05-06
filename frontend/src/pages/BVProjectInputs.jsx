import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Save, ArrowRight, Sparkles, BarChart3, FileText, Layers, Calculator, Info } from "lucide-react";
import { toast } from "sonner";
import {
  PL_ROWS, BS_ROWS, ASSUMPTION_ROWS,
  computeBSColumns, computePLColumns, autoSuggestAssumptions, bvProjectToEngineInputs,
} from "@/lib/bv_input_schema";
import { fmtL } from "@/lib/bv_engine";

const fmtPct = (v) => (v == null ? "—" : `${(v * 100).toFixed(2)}%`);

// ────────────────────────────────────────────────────────────────────────────
// Tabular form for P&L or BS — three FY columns, live computed cells.
// ────────────────────────────────────────────────────────────────────────────
const FinancialTable = ({ rows, raw, computed, onChange, fyLabels, testidPrefix }) => {
  const renderCell = (row, fy) => {
    if (row.type === "computed") {
      const val = computed?.[fy]?.[row.id];
      return (
        <div
          className={`text-right text-xs px-2 py-1.5 rounded bg-white/[0.025] ${row.bold ? "text-white font-semibold" : "text-white/70"}`}
          data-testid={`${testidPrefix}-${row.id}-${fy}`}
        >
          {row.format === "pct" ? fmtPct(val) : fmtL(val)}
        </div>
      );
    }
    return (
      <Input
        type="number"
        step="any"
        value={raw?.[row.id]?.[fy] ?? ""}
        onChange={(e) => onChange(row.id, fy, e.target.value === "" ? 0 : Number(e.target.value))}
        className="bg-white/[0.03] border-white/10 text-white text-xs h-8 text-right"
        placeholder="0"
        data-testid={`${testidPrefix}-${row.id}-${fy}`}
      />
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-white/45 uppercase tracking-[0.1em] text-[10px]">
          <tr>
            <th className="text-left py-2 pr-4 w-1/2">Line Item</th>
            <th className="text-right py-2 px-2">{fyLabels[2]}</th>
            <th className="text-right py-2 px-2">{fyLabels[1]}</th>
            <th className="text-right py-2 px-2">{fyLabels[0]}</th>
          </tr>
        </thead>
        <tbody className="text-white/85">
          {rows.map((row) => {
            if (row.type === "header") {
              return (
                <tr key={row.id}><td colSpan={4} className="pt-4 pb-1 text-[11px] uppercase tracking-[0.15em] text-violet-300/80 font-semibold">{row.label}</td></tr>
              );
            }
            if (row.type === "subheader") {
              return (
                <tr key={row.id}><td colSpan={4} className="pt-2 pb-1 text-[11px] uppercase tracking-[0.12em] text-white/45 font-medium">{row.label}</td></tr>
              );
            }
            return (
              <tr key={row.id} className={`border-t border-white/5 ${row.bold ? "bg-white/[0.03]" : ""}`}>
                <td className={`py-1.5 pr-4 ${row.bold ? "text-white font-semibold" : "text-white/65"}`}>
                  {row.label}
                  {row.type === "computed" && <span className="ml-1.5 text-[9px] text-violet-300/60 uppercase">auto</span>}
                </td>
                <td className="px-1 py-1">{renderCell(row, "fy2")}</td>
                <td className="px-1 py-1">{renderCell(row, "fy1")}</td>
                <td className="px-1 py-1">{renderCell(row, "fy0")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const BVProjectInputs = ({ user, apiClient }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef(null);

  // Load project
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(`/bv-projects/${projectId}`);
        setProject(res.data);
      } catch (e) {
        toast.error("Could not load project");
        navigate("/valuation-2");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);  // eslint-disable-line

  // Auto-save (debounced) on any change
  useEffect(() => {
    if (!project || loading) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await apiClient.put(`/bv-projects/${projectId}`, {
          company_name: project.company_name,
          website: project.website,
          plan_for_ipo: project.plan_for_ipo,
          ipo_timeline: project.ipo_timeline,
          fy_labels: project.fy_labels,
          pl: project.pl,
          bs: project.bs,
          assumptions: project.assumptions,
          engine_config: project.engine_config,
        });
      } catch (e) {
        // silent — surfaces only on explicit save
      } finally {
        setSaving(false);
      }
    }, 800);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [project]);  // eslint-disable-line

  const setField = (key, val) => setProject((p) => ({ ...p, [key]: val }));
  const setFy = (idx, val) => setProject((p) => {
    const arr = [...(p.fy_labels || ["FY 2023-24", "FY 2024-25", "FY 2025-26"])];
    arr[idx] = val;
    return { ...p, fy_labels: arr };
  });
  const setPlCell = (id, fy, v) => setProject((p) => ({
    ...p, pl: { ...p.pl, [id]: { ...(p.pl?.[id] || {}), [fy]: v } },
  }));
  const setBsCell = (id, fy, v) => setProject((p) => ({
    ...p, bs: { ...p.bs, [id]: { ...(p.bs?.[id] || {}), [fy]: v } },
  }));
  const setAssumption = (id, v) => setProject((p) => ({
    ...p, assumptions: { ...(p.assumptions || {}), [id]: v },
  }));

  // Live computations
  const bsComputed = useMemo(() => project ? computeBSColumns(project.bs || {}) : null, [project]);
  const plComputed = useMemo(() => project ? computePLColumns(project.pl || {}, bsComputed || {}) : null, [project, bsComputed]);
  const auto = useMemo(() => (plComputed && bsComputed) ? autoSuggestAssumptions(plComputed, bsComputed) : null, [plComputed, bsComputed]);

  const handleSaveAndOpen = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/bv-projects/${projectId}`, project);
      toast.success("Inputs saved");
      navigate(`/valuation-2/${projectId}`);
    } catch (e) {
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="flex min-h-screen bg-black">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 p-8 text-white/55">
          <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading…
        </main>
      </div>
    );
  }

  const fyLabels = project.fy_labels || ["FY 2023-24", "FY 2024-25", "FY 2025-26"];

  return (
    <div className="flex min-h-screen bg-black" data-testid="bv-input-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-[#111] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
             style={{ background: "radial-gradient(circle at 25% 20%, rgba(167,139,250,0.4), transparent 40%), radial-gradient(circle at 80% 70%, rgba(34,211,238,0.3), transparent 45%)" }} />

        <div className="relative z-10 px-8 lg:px-12 py-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[10px] tracking-[0.18em] uppercase text-white/55 mb-3">
                <Sparkles className="w-3 h-3 text-violet-300" />
                BV Engine — Input Sheet
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                {project.company_name || "Untitled BV Project"}
              </h1>
              <p className="text-sm text-white/55 mt-2 max-w-2xl">
                All figures in <strong className="text-white/75">INR Lacs</strong>. Auto-saves as you type. Computed rows are auto-derived from the spreadsheet formulas.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/45">
              {saving && <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>}
              {!saving && <span>✓ Auto-saved</span>}
            </div>
          </div>

          {/* Company header card */}
          <Card className="bg-white/[0.04] backdrop-blur-xl border border-white/10 mb-4">
            <CardContent className="p-5 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-[11px] text-white/55">Company Name</Label>
                <Input value={project.company_name || ""} onChange={(e) => setField("company_name", e.target.value)} className="bg-white/[0.03] border-white/10 text-white text-sm h-9 mt-1" data-testid="bv-input-company" />
              </div>
              <div>
                <Label className="text-[11px] text-white/55">Website</Label>
                <Input value={project.website || ""} onChange={(e) => setField("website", e.target.value)} placeholder="https://" className="bg-white/[0.03] border-white/10 text-white text-sm h-9 mt-1" data-testid="bv-input-website" />
              </div>
              <div>
                <Label className="text-[11px] text-white/55">Plan for IPO?</Label>
                <select
                  value={project.plan_for_ipo || ""}
                  onChange={(e) => setField("plan_for_ipo", e.target.value || null)}
                  className="bg-white/[0.03] border border-white/10 rounded-md text-white text-sm h-9 px-2 mt-1 w-full"
                  data-testid="bv-input-plan-ipo"
                >
                  <option value="" className="bg-[#111]">— select —</option>
                  <option value="yes" className="bg-[#111]">Yes</option>
                  <option value="no" className="bg-[#111]">No</option>
                </select>
              </div>
              <div>
                <Label className="text-[11px] text-white/55">IPO Timeline</Label>
                <select
                  value={project.ipo_timeline || ""}
                  disabled={project.plan_for_ipo !== "yes"}
                  onChange={(e) => setField("ipo_timeline", e.target.value || null)}
                  className="bg-white/[0.03] border border-white/10 rounded-md text-white text-sm h-9 px-2 mt-1 w-full disabled:opacity-40"
                  data-testid="bv-input-ipo-timeline"
                >
                  <option value="" className="bg-[#111]">—</option>
                  <option value="12m" className="bg-[#111]">Within 12 months</option>
                  <option value="18m" className="bg-[#111]">Within 18 months</option>
                  <option value="beyond" className="bg-[#111]">Beyond 18 months</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* FY labels */}
          <Card className="bg-white/[0.04] backdrop-blur-xl border border-white/10 mb-4">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-violet-300" />
                <h3 className="text-[13px] font-semibold text-white tracking-tight">Financial Year Labels</h3>
                <span className="text-[10px] text-white/45 ml-2">(latest → oldest, left to right)</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {/* Display order is reversed (newest left) but storage stays oldest → latest */}
                {[2, 1, 0].map((idx) => (
                  <Input key={idx} value={fyLabels[idx]} onChange={(e) => setFy(idx, e.target.value)}
                    className="bg-white/[0.03] border-white/10 text-white text-sm h-9"
                    data-testid={`bv-fy-${idx}`} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabs — PL / BS / Assumptions */}
          <Tabs defaultValue="pl" className="w-full">
            <TabsList className="bg-white/[0.04] border border-white/10 p-1 rounded-full mb-4" data-testid="bv-input-tabs">
              <TabsTrigger value="pl" className="rounded-full text-xs px-5 py-1.5 data-[state=active]:bg-white data-[state=active]:text-black text-white/60">P&L (Income Statement)</TabsTrigger>
              <TabsTrigger value="bs" className="rounded-full text-xs px-5 py-1.5 data-[state=active]:bg-white data-[state=active]:text-black text-white/60">Balance Sheet</TabsTrigger>
              <TabsTrigger value="assumptions" className="rounded-full text-xs px-5 py-1.5 data-[state=active]:bg-white data-[state=active]:text-black text-white/60">DCF Assumptions</TabsTrigger>
            </TabsList>

            <TabsContent value="pl">
              <Card className="bg-white/[0.04] backdrop-blur-xl border border-white/10">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-violet-300" />
                    <h3 className="text-[13px] font-semibold text-white">Income Statement (₹ Lacs)</h3>
                  </div>
                  <FinancialTable rows={PL_ROWS} raw={project.pl} computed={plComputed} onChange={setPlCell} fyLabels={fyLabels} testidPrefix="bv-pl" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bs">
              <Card className="bg-white/[0.04] backdrop-blur-xl border border-white/10">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-violet-300" />
                    <h3 className="text-[13px] font-semibold text-white">Balance Sheet (₹ Lacs)</h3>
                  </div>
                  <FinancialTable rows={BS_ROWS} raw={project.bs} computed={bsComputed} onChange={setBsCell} fyLabels={fyLabels} testidPrefix="bv-bs" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assumptions">
              <Card className="bg-white/[0.04] backdrop-blur-xl border border-white/10">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-4 h-4 text-violet-300" />
                    <h3 className="text-[13px] font-semibold text-white">DCF Assumptions</h3>
                    <span className="text-[10px] text-white/45 ml-2">decimals — 0.12 = 12%. Override any value; leave blank to use the auto-suggested historical average.</span>
                  </div>
                  <div className="space-y-2">
                    {ASSUMPTION_ROWS.map((row) => {
                      const stored = project.assumptions?.[row.id];
                      const isAuto = stored == null || stored === "";
                      const autoVal = isAuto && auto ? auto[row.id] : null;
                      const display = stored ?? row.default ?? autoVal ?? "";
                      return (
                        <div key={row.id} className="grid grid-cols-12 gap-3 items-start py-2 border-b border-white/5">
                          <div className="col-span-4">
                            <div className="text-[12px] text-white/85">{row.label}</div>
                            <div className="text-[10px] text-white/40 italic mt-0.5 flex items-start gap-1">
                              <Info className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" />
                              <span>{row.reasoning}</span>
                            </div>
                          </div>
                          <div className="col-span-3">
                            <Input
                              type="number"
                              step={row.integer ? 1 : "any"}
                              value={display === null ? "" : display}
                              onChange={(e) => setAssumption(row.id, e.target.value === "" ? null : Number(e.target.value))}
                              className="bg-white/[0.03] border-white/10 text-white text-sm h-9 text-right"
                              data-testid={`bv-asm-${row.id}`}
                            />
                          </div>
                          <div className="col-span-5 text-[10px] text-white/45 italic flex items-center pt-2">
                            {autoVal != null && isAuto && (
                              <span>Auto-suggested from history: <strong className="text-violet-300/80">{
                                row.id === "projection_years" ? autoVal :
                                row.id === "ebitda_margin_steady" || row.id === "depreciation_pct" || row.id === "capex_pct" || row.id === "wc_change_pct"
                                  ? `${(autoVal * 100).toFixed(2)}%`
                                  : autoVal.toFixed(4)
                              }</strong></span>
                            )}
                            {row.default != null && stored == null && row.id !== "ebitda_margin_steady" && row.id !== "depreciation_pct" && row.id !== "capex_pct" && row.id !== "wc_change_pct" && (
                              <span className="ml-2">Default: <strong className="text-white/65">{row.default}</strong></span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action bar */}
          <div className="sticky bottom-4 z-20 mt-6">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white/[0.06] backdrop-blur-xl border border-white/15 rounded-2xl px-5 py-4 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]">
              <div className="text-[11px] text-white/50">
                Inputs auto-save as you type. When you're ready, open the live valuation engine.
              </div>
              <div className="flex gap-2">
                <Button onClick={() => navigate("/valuation-2")} variant="outline" className="bg-transparent border-white/15 text-white/70 hover:bg-white/5 rounded-full px-5 h-9 text-xs">
                  Back to Projects
                </Button>
                <Button onClick={handleSaveAndOpen} disabled={saving} className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white rounded-full px-6 h-9 text-xs font-medium gap-1" data-testid="bv-save-open-engine">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save & Open Valuation Engine <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BVProjectInputs;
