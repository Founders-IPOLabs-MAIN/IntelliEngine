import { useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, RefreshCcw, Calculator, Layers, Building2, TrendingUp, Info, BarChart3 } from "lucide-react";
import { SECTOR_PEER_MULTIPLES, UNLISTED_DISCOUNT } from "@/data/sector_peer_multiples";
import { calculateDCF, calculateNAV, calculateComparable, weightedSummary, fmtL } from "@/lib/bv_engine";

const DEFAULT_INPUTS = {
  company_name: "",
  sector_id: "edtech_training",
  shares_lakhs: 1.5,
  revenue: { fy1: 852.11, fy2: 937.32, fy3: 979.93 },
  ebitda:  { fy1: 503.05, fy2: 552.03, fy3: 554.76 },
  pat_fy3: 409.11,
  total_assets_fy3: 1605.74,
  total_debt_fy3: 72.00,
  cash_fy3: 64.63,
  shareholders_equity_fy3: 1201.49,
  net_fixed_assets_fy3: 1267.00,
  accounts_receivable: 220.50,
  other_current_assets: 42.00,
  accounts_payable: 201.00,
  accrued_expenses: 131.00,
  long_term_debt: 72.00,
  intangible_brand: 200,
  goodwill: 150,
  wacc: 0.12,
  revenue_cagr: 0.15,
  ebitda_margin_steady: 0.55,
  depreciation_pct: 0.0157,
  capex_pct: 0.20,
  wc_change_pct: 0.02,
  tax_rate: 0.25,
  terminal_growth: 0.04,
  projection_years: 5,
  ev_ebitda_multiple: 10,
  ev_revenue_multiple: 3,
  pe_multiple: 15,
  apply_unlisted_discount: true,
  weight_dcf: 0.50,
  weight_nav: 0.25,
  weight_comparable: 0.25,
};

const FieldNum = ({ label, value, onChange, suffix, hint, testid, step = "any" }) => (
  <div className="flex flex-col gap-1">
    <Label className="text-[11px] text-white/55">{label}</Label>
    <div className="relative">
      <Input
        type="number"
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="bg-white/[0.03] border-white/10 text-white text-sm h-9 pr-12"
        data-testid={testid}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/40">
          {suffix}
        </span>
      )}
    </div>
    {hint && <p className="text-[10px] text-white/35 italic">{hint}</p>}
  </div>
);

const Section = ({ title, icon: Icon, children }) => (
  <Card className="bg-white/[0.04] backdrop-blur-xl border border-white/10">
    <CardContent className="p-5">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-4 h-4 text-violet-300" />}
        <h3 className="text-[13px] font-semibold text-white tracking-tight">{title}</h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>
    </CardContent>
  </Card>
);

const BVEngine = ({ user, apiClient }) => {
  const [inp, setInp] = useState(DEFAULT_INPUTS);

  const set = (path, value) => {
    setInp((prev) => {
      if (path.includes(".")) {
        const [a, b] = path.split(".");
        return { ...prev, [a]: { ...prev[a], [b]: value } };
      }
      return { ...prev, [path]: value };
    });
  };

  // When the user picks a sector, auto-fill the comparable multiples.
  const applySectorMultiples = (sector_id) => {
    const s = SECTOR_PEER_MULTIPLES.find((x) => x.id === sector_id);
    if (!s) return;
    setInp((p) => ({
      ...p,
      sector_id,
      ev_ebitda_multiple: s.ev_ebitda,
      ev_revenue_multiple: s.ev_revenue,
      pe_multiple: s.pe,
    }));
  };

  const sector = SECTOR_PEER_MULTIPLES.find((s) => s.id === inp.sector_id) || SECTOR_PEER_MULTIPLES[0];

  // Live calculations — re-run on every input change (deterministic & cheap)
  const dcf = useMemo(() => calculateDCF(inp), [inp]);
  const nav = useMemo(() => calculateNAV(inp), [inp]);
  const cmp = useMemo(() => calculateComparable(inp), [inp]);
  const summary = useMemo(
    () => weightedSummary(dcf, nav, cmp, {
      weight_dcf: inp.weight_dcf,
      weight_nav: inp.weight_nav,
      weight_comparable: inp.weight_comparable,
      shares_lakhs: inp.shares_lakhs,
    }),
    [dcf, nav, cmp, inp.weight_dcf, inp.weight_nav, inp.weight_comparable, inp.shares_lakhs]
  );

  const handleReset = () => setInp(DEFAULT_INPUTS);

  return (
    <div className="flex min-h-screen bg-black" data-testid="bv-engine-page">
      <Sidebar user={user} apiClient={apiClient} />

      <main className="flex-1 ml-64 relative">
        {/* Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-[#111] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 20% 25%, rgba(167,139,250,0.4), transparent 40%), radial-gradient(circle at 85% 75%, rgba(34,211,238,0.3), transparent 45%)",
          }}
        />

        <div className="relative z-10 px-8 lg:px-12 py-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[10px] tracking-[0.18em] uppercase text-white/55 mb-3">
                <Sparkles className="w-3 h-3 text-violet-300" />
                BV Engine
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                Business Valuation Engine
              </h1>
              <p className="text-sm text-white/55 mt-2 max-w-2xl">
                DCF · NAV · Comparable Company — three valuations running in parallel.
                All figures in <strong className="text-white/75">₹ Lakhs</strong>.
              </p>
            </div>
            <Button
              onClick={handleReset}
              variant="outline"
              className="bg-transparent border-white/15 text-white/70 hover:bg-white/5 rounded-full gap-1.5 px-4 h-9 text-xs"
              data-testid="bv-reset-btn"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Reset Inputs
            </Button>
          </div>

          {/* Inputs */}
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="bg-white/[0.04] border border-white/10 p-1 rounded-full mb-4 flex-wrap" data-testid="bv-tabs">
              <TabsTrigger value="company" className="rounded-full text-xs px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-black text-white/60">Company</TabsTrigger>
              <TabsTrigger value="financials" className="rounded-full text-xs px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-black text-white/60">Financials</TabsTrigger>
              <TabsTrigger value="balance" className="rounded-full text-xs px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-black text-white/60">Balance Sheet</TabsTrigger>
              <TabsTrigger value="dcf" className="rounded-full text-xs px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-black text-white/60">DCF Assumptions</TabsTrigger>
              <TabsTrigger value="comp" className="rounded-full text-xs px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-black text-white/60">Comparables</TabsTrigger>
            </TabsList>

            <TabsContent value="company">
              <Section title="Company Profile" icon={Building2}>
                <div className="flex flex-col gap-1 col-span-2">
                  <Label className="text-[11px] text-white/55">Company name</Label>
                  <Input value={inp.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="e.g., OERC Group / XYZ Pvt Ltd"
                    className="bg-white/[0.03] border-white/10 text-white text-sm h-9" data-testid="bv-company-name" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] text-white/55">Sector (auto-selects peer multiples)</Label>
                  <select
                    value={inp.sector_id}
                    onChange={(e) => applySectorMultiples(e.target.value)}
                    className="bg-white/[0.03] border border-white/10 rounded-md text-white text-sm h-9 px-2"
                    data-testid="bv-sector-select"
                  >
                    {SECTOR_PEER_MULTIPLES.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#111]">{s.label}</option>
                    ))}
                  </select>
                </div>
                <FieldNum label="No. of shares (lakhs)" value={inp.shares_lakhs} onChange={(v) => set("shares_lakhs", v)} testid="bv-shares" />
              </Section>
            </TabsContent>

            <TabsContent value="financials">
              <Section title="Historical P&L (₹ Lakhs)" icon={TrendingUp}>
                <FieldNum label="Revenue FY-3" value={inp.revenue.fy1} onChange={(v) => set("revenue.fy1", v)} testid="bv-rev-fy1" />
                <FieldNum label="Revenue FY-2" value={inp.revenue.fy2} onChange={(v) => set("revenue.fy2", v)} testid="bv-rev-fy2" />
                <FieldNum label="Revenue FY-1 (latest)" value={inp.revenue.fy3} onChange={(v) => set("revenue.fy3", v)} testid="bv-rev-fy3" />
                <FieldNum label="EBITDA FY-3" value={inp.ebitda.fy1} onChange={(v) => set("ebitda.fy1", v)} testid="bv-eb-fy1" />
                <FieldNum label="EBITDA FY-2" value={inp.ebitda.fy2} onChange={(v) => set("ebitda.fy2", v)} testid="bv-eb-fy2" />
                <FieldNum label="EBITDA FY-1 (latest)" value={inp.ebitda.fy3} onChange={(v) => set("ebitda.fy3", v)} testid="bv-eb-fy3" />
                <FieldNum label="PAT FY-1" value={inp.pat_fy3} onChange={(v) => set("pat_fy3", v)} testid="bv-pat" />
                <FieldNum label="Total Assets FY-1" value={inp.total_assets_fy3} onChange={(v) => set("total_assets_fy3", v)} testid="bv-ta" />
                <FieldNum label="Shareholders' Equity FY-1" value={inp.shareholders_equity_fy3} onChange={(v) => set("shareholders_equity_fy3", v)} testid="bv-se" />
              </Section>
            </TabsContent>

            <TabsContent value="balance">
              <Section title="Balance Sheet (₹ Lakhs) — used by NAV" icon={Layers}>
                <FieldNum label="Cash & Cash Equivalents" value={inp.cash_fy3} onChange={(v) => set("cash_fy3", v)} testid="bv-cash" />
                <FieldNum label="Accounts Receivable" value={inp.accounts_receivable} onChange={(v) => set("accounts_receivable", v)} hint="5% recoverability haircut applied" testid="bv-ar" />
                <FieldNum label="Other Current Assets" value={inp.other_current_assets} onChange={(v) => set("other_current_assets", v)} testid="bv-oca" />
                <FieldNum label="Net Fixed Assets" value={inp.net_fixed_assets_fy3} onChange={(v) => set("net_fixed_assets_fy3", v)} testid="bv-nfa" />
                <FieldNum label="Total Debt" value={inp.total_debt_fy3} onChange={(v) => set("total_debt_fy3", v)} testid="bv-debt" />
                <FieldNum label="Long-term Debt (NAV)" value={inp.long_term_debt} onChange={(v) => set("long_term_debt", v)} testid="bv-ltd" />
                <FieldNum label="Accounts Payable" value={inp.accounts_payable} onChange={(v) => set("accounts_payable", v)} testid="bv-ap" />
                <FieldNum label="Accrued Expenses" value={inp.accrued_expenses} onChange={(v) => set("accrued_expenses", v)} testid="bv-accr" />
                <FieldNum label="Brand Intangible (NAV add-back)" value={inp.intangible_brand} onChange={(v) => set("intangible_brand", v)} hint="AI-suggested intangible value" testid="bv-brand" />
                <FieldNum label="Regulatory Goodwill (NAV add-back)" value={inp.goodwill} onChange={(v) => set("goodwill", v)} hint="AI-suggested strategic goodwill" testid="bv-gw" />
              </Section>
            </TabsContent>

            <TabsContent value="dcf">
              <Section title="DCF Assumptions (decimals — 0.12 = 12%)" icon={Calculator}>
                <FieldNum label="WACC" value={inp.wacc} onChange={(v) => set("wacc", v)} suffix="dec" testid="bv-wacc" />
                <FieldNum label="Revenue CAGR" value={inp.revenue_cagr} onChange={(v) => set("revenue_cagr", v)} suffix="dec" testid="bv-cagr" />
                <FieldNum label="EBITDA Margin (steady)" value={inp.ebitda_margin_steady} onChange={(v) => set("ebitda_margin_steady", v)} suffix="dec" testid="bv-margin" />
                <FieldNum label="Depreciation % of Revenue" value={inp.depreciation_pct} onChange={(v) => set("depreciation_pct", v)} suffix="dec" testid="bv-dpct" />
                <FieldNum label="Capex % of Revenue" value={inp.capex_pct} onChange={(v) => set("capex_pct", v)} suffix="dec" testid="bv-capexpct" />
                <FieldNum label="ΔWorking Capital % of Revenue" value={inp.wc_change_pct} onChange={(v) => set("wc_change_pct", v)} suffix="dec" testid="bv-wcpct" />
                <FieldNum label="Tax Rate" value={inp.tax_rate} onChange={(v) => set("tax_rate", v)} suffix="dec" hint="Sec 115BAB / effective" testid="bv-tax" />
                <FieldNum label="Terminal Growth Rate" value={inp.terminal_growth} onChange={(v) => set("terminal_growth", v)} suffix="dec" testid="bv-tg" />
                <FieldNum label="Projection Period (Years)" value={inp.projection_years} onChange={(v) => set("projection_years", v)} testid="bv-years" />
              </Section>
            </TabsContent>

            <TabsContent value="comp">
              <Section title={`Comparable Multiples — peer set: ${sector.peers.slice(0, 3).join(", ")}…`} icon={BarChart3}>
                <FieldNum label="EV/EBITDA Multiple" value={inp.ev_ebitda_multiple} onChange={(v) => set("ev_ebitda_multiple", v)} suffix="x" testid="bv-evebitda" />
                <FieldNum label="EV/Revenue Multiple" value={inp.ev_revenue_multiple} onChange={(v) => set("ev_revenue_multiple", v)} suffix="x" testid="bv-evrev" />
                <FieldNum label="P/E Multiple" value={inp.pe_multiple} onChange={(v) => set("pe_multiple", v)} suffix="x" testid="bv-pe" />
                <div className="col-span-2 lg:col-span-3 flex items-center gap-3 mt-1">
                  <input
                    id="bv-discount"
                    type="checkbox"
                    checked={inp.apply_unlisted_discount}
                    onChange={(e) => set("apply_unlisted_discount", e.target.checked)}
                    className="h-4 w-4 accent-violet-400"
                    data-testid="bv-discount-toggle"
                  />
                  <Label htmlFor="bv-discount" className="text-xs text-white/65">
                    Apply 22.5% unlisted-discount on listed peer multiples (NSE/BSE-derived)
                  </Label>
                </div>
                <p className="col-span-2 lg:col-span-3 text-[11px] text-white/40 italic flex gap-1.5">
                  <Info className="w-3 h-3 mt-0.5" />
                  Defaults are median multiples for the chosen sector — derived from listed
                  NSE/BSE peers. Override if you have a tighter peer set.
                </p>
              </Section>
            </TabsContent>
          </Tabs>

          {/* Weights row */}
          <Card className="bg-white/[0.04] backdrop-blur-xl border border-white/10 mt-4">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-violet-300" />
                <h3 className="text-[13px] font-semibold text-white tracking-tight">Method Weights</h3>
                <span className="text-[10px] text-white/40 ml-2">(decimals — sum to 1.0)</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FieldNum label="DCF weight"             value={inp.weight_dcf}        onChange={(v) => set("weight_dcf", v)}        testid="bv-w-dcf" />
                <FieldNum label="NAV weight"             value={inp.weight_nav}        onChange={(v) => set("weight_nav", v)}        testid="bv-w-nav" />
                <FieldNum label="Comparable Co. weight"  value={inp.weight_comparable} onChange={(v) => set("weight_comparable", v)} testid="bv-w-cmp" />
              </div>
            </CardContent>
          </Card>

          {/* OUTPUT — three method cards */}
          <div className="mt-8 mb-3 flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Output — Live Valuation</h2>
            <span className="text-[11px] text-white/40">recomputed on every input change</span>
          </div>

          <div className="grid lg:grid-cols-3 gap-4" data-testid="bv-output-grid">
            {/* DCF card */}
            <Card className="bg-gradient-to-br from-indigo-500/[0.08] to-indigo-500/[0.02] border border-indigo-400/20" data-testid="bv-card-dcf">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-indigo-300" />
                  <h3 className="text-sm font-semibold text-white">DCF Method</h3>
                  <span className="ml-auto text-[10px] text-white/40">Weight {Math.round(inp.weight_dcf * 100)}%</span>
                </div>
                <div className="text-3xl font-bold text-white tracking-tight">₹ {fmtL(dcf.equity_value)}<span className="text-base text-white/40 ml-1">L</span></div>
                <div className="text-[11px] text-white/55 mt-0.5">Equity Value · per share ₹ {fmtL(dcf.per_share)} L</div>
                <div className="mt-4 grid grid-cols-2 gap-y-1 text-[11px] text-white/65">
                  <div>Sum PV of FCFFs</div><div className="text-right text-white/85">₹ {fmtL(dcf.sum_pv_fcff)}</div>
                  <div>Terminal Value</div><div className="text-right text-white/85">₹ {fmtL(dcf.terminal_value)}</div>
                  <div>PV of Terminal</div><div className="text-right text-white/85">₹ {fmtL(dcf.pv_terminal_value)}</div>
                  <div>Enterprise Value</div><div className="text-right text-white/85">₹ {fmtL(dcf.enterprise_value)}</div>
                  <div>Less: Debt</div><div className="text-right text-white/85">₹ {fmtL(dcf.less_debt)}</div>
                  <div>Add: Cash</div><div className="text-right text-white/85">₹ {fmtL(dcf.add_cash)}</div>
                </div>
                <p className="text-[10px] text-white/35 mt-3 italic leading-relaxed">
                  Ref: DCF per RBI FDI Pricing Master Directions; Sec. 56(2)(x) IT Act for unlisted shares.
                </p>
              </CardContent>
            </Card>

            {/* NAV card */}
            <Card className="bg-gradient-to-br from-emerald-500/[0.08] to-emerald-500/[0.02] border border-emerald-400/20" data-testid="bv-card-nav">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-emerald-300" />
                  <h3 className="text-sm font-semibold text-white">NAV Method</h3>
                  <span className="ml-auto text-[10px] text-white/40">Weight {Math.round(inp.weight_nav * 100)}%</span>
                </div>
                <div className="text-3xl font-bold text-white tracking-tight">₹ {fmtL(nav.equity_value)}<span className="text-base text-white/40 ml-1">L</span></div>
                <div className="text-[11px] text-white/55 mt-0.5">Equity NAV · per share ₹ {fmtL(nav.per_share)} L</div>
                <div className="mt-4 grid grid-cols-2 gap-y-1 text-[11px] text-white/65">
                  <div>Total Adjusted Assets</div><div className="text-right text-white/85">₹ {fmtL(nav.total_adjusted_assets)}</div>
                  <div>Total Liabilities</div><div className="text-right text-white/85">₹ {fmtL(nav.total_liabilities)}</div>
                  <div>Brand Intangible</div><div className="text-right text-white/85">₹ {fmtL(inp.intangible_brand)}</div>
                  <div>Regulatory Goodwill</div><div className="text-right text-white/85">₹ {fmtL(inp.goodwill)}</div>
                </div>
                <p className="text-[10px] text-white/35 mt-3 italic leading-relaxed">
                  Ref: Rule 11UA, IT Rules 1962. Conservative floor value with brand &amp; goodwill add-backs.
                </p>
              </CardContent>
            </Card>

            {/* Comparable card */}
            <Card className="bg-gradient-to-br from-amber-500/[0.08] to-amber-500/[0.02] border border-amber-400/20" data-testid="bv-card-comp">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-amber-300" />
                  <h3 className="text-sm font-semibold text-white">Comparable Co.</h3>
                  <span className="ml-auto text-[10px] text-white/40">Weight {Math.round(inp.weight_comparable * 100)}%</span>
                </div>
                <div className="text-3xl font-bold text-white tracking-tight">₹ {fmtL(cmp.average_equity_value)}<span className="text-base text-white/40 ml-1">L</span></div>
                <div className="text-[11px] text-white/55 mt-0.5">Avg Equity Value · per share ₹ {fmtL(cmp.per_share)} L</div>
                <div className="mt-4 space-y-1 text-[11px] text-white/65">
                  {cmp.sub_methods.map((m) => (
                    <div key={m.name} className="grid grid-cols-2">
                      <div>{m.name} ({m.multiple}x on {fmtL(m.base)})</div>
                      <div className="text-right text-white/85">₹ {fmtL(m.equity)}</div>
                    </div>
                  ))}
                  {inp.apply_unlisted_discount && (
                    <div className="text-[10px] text-amber-300/70 italic mt-1.5">
                      {Math.round(UNLISTED_DISCOUNT * 100)}% unlisted discount applied to peer multiples.
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-white/35 mt-3 italic leading-relaxed">
                  Peer set: {sector.peers.join(", ")} (sector median, NSE/BSE-derived).
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Weighted Summary */}
          <Card className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/15 mt-5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-violet-300" />
                <h3 className="text-sm font-semibold text-white tracking-tight">Weighted Equity Value (Indicative)</h3>
              </div>
              <div className="grid lg:grid-cols-3 gap-6 items-center">
                <div className="lg:col-span-1">
                  <div className="text-[11px] text-white/55 uppercase tracking-[0.18em] mb-1">Indicative Equity</div>
                  <div className="text-4xl font-bold text-white tracking-tight">
                    ₹ {fmtL(summary.weighted_equity_value)}<span className="text-xl text-white/40 ml-1">L</span>
                  </div>
                  <div className="text-xs text-white/55 mt-1">
                    Per share: ₹ {fmtL(summary.weighted_per_share)} L / lakh share
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <table className="w-full text-xs">
                    <thead className="text-white/45 uppercase tracking-[0.12em] text-[10px]">
                      <tr><th className="text-left py-2">Method</th><th className="text-right py-2">Weight</th><th className="text-right py-2">Equity (₹ L)</th><th className="text-right py-2">Weighted (₹ L)</th></tr>
                    </thead>
                    <tbody>
                      {summary.rows.map((r) => (
                        <tr key={r.method} className="border-t border-white/5">
                          <td className="py-2 text-white/85">{r.method}</td>
                          <td className="py-2 text-right text-white/65">{r.weight}%</td>
                          <td className="py-2 text-right text-white/85">{fmtL(r.equity)}</td>
                          <td className="py-2 text-right text-white">{fmtL(r.weighted)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-[10px] text-white/35 mt-4 italic leading-relaxed">
                Indicative valuation — not investment, legal or tax advice. DCF preferred under
                RBI FDI Pricing Master Directions. NAV per Rule 11UA, IT Rules 1962. Comparable
                method uses listed-peer multiples with an unlisted discount.
              </p>
            </CardContent>
          </Card>

          {/* DCF Projection table */}
          <Card className="bg-white/[0.04] backdrop-blur-xl border border-white/10 mt-5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-indigo-300" />
                <h3 className="text-[13px] font-semibold text-white">DCF Projection (₹ Lakhs)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]" data-testid="bv-dcf-projection">
                  <thead className="text-white/45 uppercase tracking-[0.1em] text-[10px]">
                    <tr>
                      <th className="text-left py-2 pr-4">Line Item</th>
                      {dcf.projections.map((p) => (
                        <th key={p.year_label} className="text-right py-2 px-2">{p.year_label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-white/80">
                    {[
                      ["Revenue", "revenue"], ["EBITDA", "ebitda"], ["D&A", "da"],
                      ["EBIT", "ebit"], ["Tax", "tax"], ["NOPAT", "nopat"],
                      ["Capex", "capex"], ["ΔWC", "change_wc"], ["FCFF", "fcff"],
                      ["Discount Factor", "discount_factor"], ["PV of FCFF", "pv_fcff"],
                    ].map(([label, key]) => (
                      <tr key={key} className="border-t border-white/5">
                        <td className="py-1.5 pr-4 text-white/65">{label}</td>
                        {dcf.projections.map((p) => (
                          <td key={p.year_label} className="text-right py-1.5 px-2">
                            {key === "discount_factor" ? p[key].toFixed(4) : fmtL(p[key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="h-12" />
        </div>
      </main>
    </div>
  );
};

export default BVEngine;
