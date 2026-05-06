// Canonical schema for the BV Engine input form (P&L, Balance Sheet,
// Assumptions). Mirrors the user's "Input sheet - Valuations.xlsx" exactly.
// All formulas from the source spreadsheet are encoded as `compute` functions
// so the UI can show live derived rows. Do NOT change the formulas — they
// match the .xlsx the user supplied verbatim.

// ────────────────────────────────────────────────────────────────────────────
// P&L (Income Statement) row catalogue
// ────────────────────────────────────────────────────────────────────────────
// Column order in the form: [fy0, fy1, fy2] = [oldest, mid, latest]. The user
// can rename the labels (defaults: FY 2024, FY 2025, FY 2026).

export const PL_ROWS = [
  // Revenue group
  { id: "rev_ops",         label: "Revenue from Operations",                     type: "input" },
  { id: "rev_other",       label: "Other Revenue",                                type: "input" },
  { id: "rev_total",       label: "Total Revenue",                                type: "computed",
    compute: (g) => g("rev_ops") + g("rev_other") },
  // Direct expenses & gross profit
  { id: "direct_expenses", label: "Direct Expenses",                              type: "input" },
  { id: "gross_profit",    label: "Gross Profit",                                 type: "computed",
    compute: (g) => g("rev_total") - g("direct_expenses") },
  { id: "gross_margin",    label: "Gross Margin %",                               type: "computed",
    format: "pct", compute: (g) => safeDiv(g("gross_profit"), g("rev_ops")) },
  // SG&A & EBITDA
  { id: "sga",             label: "Selling, General & Administrative",           type: "input" },
  { id: "less_nonrec",     label: "Less Non-recurring expenses",                  type: "input" },
  { id: "adj_sga",         label: "Adjusted SG&A",                                type: "computed",
    compute: (g) => g("sga") - g("less_nonrec") },
  { id: "ebitda",          label: "EBITDA",                                       type: "computed",
    bold: true, compute: (g) => g("rev_total") - g("adj_sga") },
  { id: "ebitda_margin",   label: "EBITDA Margin %",                              type: "computed",
    format: "pct", compute: (g) => safeDiv(g("ebitda"), g("rev_ops")) },
  // D&A & PBT
  { id: "da",              label: "Depreciation & Amortization",                  type: "input" },
  { id: "op_pbt",          label: "Operating Profit (PBT, pre-other-income)",     type: "computed",
    compute: (g) => g("ebitda") - g("da") },
  { id: "op_pbt_margin",   label: "Operating (PBT) Margin %",                     type: "computed",
    format: "pct", compute: (g) => safeDiv(g("op_pbt"), g("rev_ops")) },
  // Other income/expense block
  { id: "interest_exp",    label: "Interest Expense",                             type: "input" },
  { id: "interest_inc",    label: "Interest Income",                              type: "input" },
  { id: "other_income",    label: "Other Income / (Loss)",                        type: "input" },
  { id: "jv_earnings",     label: "Equity in earnings/(loss) of JV",              type: "input" },
  { id: "non_rec_other",   label: "Non-recurring expenses (other)",               type: "input" },
  { id: "tot_other",       label: "Total Other Income / (Expense)",               type: "computed",
    compute: (g) => g("interest_exp") + g("interest_inc") + g("other_income") + g("jv_earnings") + g("non_rec_other") },
  // Tax & net
  // EBT formula in the .xlsx is =B20-B29 (Operating profit minus Total Other).
  // Total Other typically carries negative values (e.g. interest expense = -6),
  // so subtracting it adds them back. We preserve the exact formula.
  { id: "ebt",             label: "Earnings before Income Tax",                   type: "computed",
    compute: (g) => g("op_pbt") - g("tot_other") },
  { id: "tax_rate",        label: "Tax Rate (decimal, e.g. 0.25)",                type: "input", format: "raw" },
  { id: "income_tax",      label: "Income Tax",                                   type: "computed",
    compute: (g) => g("ebt") * g("tax_rate") },
  { id: "earn_continuing", label: "Earnings from Continuing Operations",          type: "computed",
    compute: (g) => g("ebt") - g("income_tax") },
  { id: "discont_ops",     label: "Discontinued Operations, net",                 type: "input" },
  { id: "nci",             label: "Non-Controlling Interest",                     type: "input" },
  { id: "net_profit",      label: "Net Earnings (Net Profit)",                    type: "computed",
    bold: true, compute: (g) => g("earn_continuing") - g("discont_ops") - g("nci") },
  { id: "net_margin",      label: "Net Margin %",                                 type: "computed",
    format: "pct", compute: (g) => safeDiv(g("net_profit"), g("rev_ops")) },
  // Shares & EPS — # of shares is sourced from the BS sheet (A38)
  { id: "shares_lakhs",    label: "Number of O/S Shares (in Lacs)",              type: "computed",
    compute: (g, bsG) => bsG("shares_outstanding") },
  { id: "eps",             label: "EPS (₹/share)",                                type: "computed",
    format: "raw", compute: (g) => safeDiv(g("net_profit"), g("shares_lakhs")) },
];

// ────────────────────────────────────────────────────────────────────────────
// Balance Sheet row catalogue
// ────────────────────────────────────────────────────────────────────────────
export const BS_ROWS = [
  { id: "_h_assets",        label: "ASSETS",                              type: "header" },
  { id: "_h_nca",           label: "Non-Current Assets",                  type: "subheader" },
  { id: "tangible_nca",     label: "Tangible Assets (Non-current)",       type: "input" },
  { id: "noncurrent_inv",   label: "Non-current Investments",             type: "input" },
  { id: "lt_loans",         label: "Long Term Loans & Advances",          type: "input" },
  { id: "advance_tax",      label: "Advance Tax",                         type: "input" },
  { id: "total_nca",        label: "Total Non-Current Assets",            type: "computed",
    compute: (g) => g("tangible_nca") + g("noncurrent_inv") + g("lt_loans") + g("advance_tax") },

  { id: "_h_ca",            label: "Current Assets",                      type: "subheader" },
  { id: "cash",             label: "Cash and Cash Equivalents",           type: "input" },
  { id: "ar",               label: "Accounts Receivable",                 type: "input" },
  { id: "inventory",        label: "Inventory",                           type: "input" },
  { id: "st_loans",         label: "Short Term Loans & Advances",         type: "input" },
  { id: "other_ca",         label: "Other Current Assets",                type: "input" },
  { id: "total_ca",         label: "Total Current Assets",                type: "computed",
    compute: (g) => g("cash") + g("ar") + g("inventory") + g("st_loans") + g("other_ca") },

  { id: "total_assets",     label: "Total Assets",                        type: "computed", bold: true,
    compute: (g) => g("total_nca") + g("total_ca") },

  { id: "_h_liab",          label: "LIABILITIES",                         type: "header" },
  { id: "_h_eq",            label: "Stockholders' Equity",                type: "subheader" },
  { id: "share_capital",    label: "Share Capital",                       type: "input" },
  { id: "reserves",         label: "Reserves & Surplus",                  type: "input" },
  { id: "total_se",         label: "Total Stockholders' Equity",          type: "computed",
    compute: (g) => g("share_capital") + g("reserves") },

  { id: "lt_debt",          label: "Long-term Debt",                      type: "input" },
  { id: "deferred_tax",     label: "Deferred Income Taxes",               type: "input" },
  { id: "lt_provisions",    label: "Long Term Provisions",                type: "input" },
  { id: "total_ncl",        label: "Total Non-Current Liabilities",       type: "computed",
    compute: (g) => g("lt_debt") + g("deferred_tax") + g("lt_provisions") },

  { id: "_h_cl",            label: "Current Liabilities",                 type: "subheader" },
  { id: "ap",               label: "Accounts Payable",                    type: "input" },
  { id: "accrued",          label: "Total Accrued Expenses",              type: "input" },
  { id: "st_borrowings",    label: "Short Term Borrowings",               type: "input" },
  { id: "other_cl",         label: "Other Current Liabilities",           type: "input" },
  // NOTE: the source .xlsx formula =SUM(B30:B32) sums only AP+Accrued+ST Borrowings
  // (excludes Other CL). We preserve the exact formula.
  { id: "total_cl",         label: "Total Current Liabilities",           type: "computed",
    compute: (g) => g("ap") + g("accrued") + g("st_borrowings") },

  { id: "total_eq_liab",    label: "Total Stockholders' Equity & Liabilities", type: "computed", bold: true,
    compute: (g) => g("total_se") + g("total_ncl") + g("total_cl") },

  { id: "_h_extras",        label: "Derived (used by DCF & Valuation)",   type: "subheader" },
  { id: "shares_outstanding", label: "No. of shares outstanding (Lacs)", type: "input" },
  // Capex per FY = ΔTangible from prior FY. FY0 (oldest) = 0 by convention.
  { id: "capex",            label: "Capital Expenditure (= ΔTangible)",   type: "computed",
    compute: (g, _, prior) => prior ? g("tangible_nca") - prior("tangible_nca") : 0 },
  { id: "wc",               label: "Working Capital (TCA – TCL)",         type: "computed",
    compute: (g) => g("total_ca") - g("total_cl") },
  { id: "wc_change",        label: "Change in Working Capital",           type: "computed",
    compute: (g, _, prior) => prior ? g("wc") - prior("wc") : 0 },
];

// ────────────────────────────────────────────────────────────────────────────
// DCF Assumptions catalogue
// Defaults & reasoning copied verbatim from the input sheet
// ────────────────────────────────────────────────────────────────────────────
export const ASSUMPTION_ROWS = [
  { id: "wacc", label: "WACC", default: 0.12,
    reasoning: "To be provided. Suggested 12% — can be changed by client." },
  { id: "revenue_cagr", label: "Revenue CAGR (Growth rate)", default: 0.15,
    reasoning: "To be provided. Suggested 15% — can be changed by client." },
  { id: "ebitda_margin_steady", label: "EBITDA Margin (steady)", default: null,
    reasoning: "Suggested = average EBITDA margin over the 3 historical FYs (auto-computed from P&L)." },
  { id: "depreciation_pct", label: "Depreciation % of Revenue", default: null,
    reasoning: "Suggested = average D&A / Total Revenue over the 3 historical FYs." },
  { id: "capex_pct", label: "Capex % of Revenue", default: null,
    reasoning: "Suggested = average ΔTangible / Total Revenue over the 3 historical FYs." },
  { id: "wc_change_pct", label: "ΔWorking Capital % of Revenue", default: null,
    reasoning: "Suggested = average ΔWorking Capital / Total Revenue over the 3 historical FYs." },
  { id: "tax_rate", label: "Tax Rate", default: 0.25,
    reasoning: "Sec 115BAB / effective rate. Use the company's current effective rate." },
  { id: "terminal_growth", label: "Terminal Growth Rate", default: 0.04,
    reasoning: "Long-run sustainable growth (≈ India long-term GDP-deflator). 3–4% is typical." },
  { id: "projection_years", label: "Projection Period (Years)", default: 5, integer: true,
    reasoning: "Standard DCF window (5 years)." },
];

function safeDiv(a, b) {
  if (!b || b === 0) return 0;
  return a / b;
}

// ────────────────────────────────────────────────────────────────────────────
// Live computation — given raw inputs, return computed values for every row
// Returns: { fy0: { rowId: value }, fy1: {...}, fy2: {...} }
// ────────────────────────────────────────────────────────────────────────────
export function computePLColumns(plRaw, bsComputed) {
  const result = { fy0: {}, fy1: {}, fy2: {} };
  ["fy0", "fy1", "fy2"].forEach((fy) => {
    const get = (id) => {
      const r = result[fy][id];
      if (r !== undefined) return r;
      const raw = plRaw?.[id]?.[fy];
      return Number(raw) || 0;
    };
    const bsGet = (id) => Number(bsComputed?.[fy]?.[id]) || 0;
    PL_ROWS.forEach((row) => {
      if (row.type === "input") {
        result[fy][row.id] = Number(plRaw?.[row.id]?.[fy]) || 0;
      } else if (row.type === "computed") {
        result[fy][row.id] = row.compute(get, bsGet);
      }
    });
  });
  return result;
}

export function computeBSColumns(bsRaw) {
  const result = { fy0: {}, fy1: {}, fy2: {} };
  const fyOrder = ["fy0", "fy1", "fy2"];
  fyOrder.forEach((fy, idx) => {
    const get = (id) => {
      const r = result[fy][id];
      if (r !== undefined) return r;
      return Number(bsRaw?.[id]?.[fy]) || 0;
    };
    const priorFy = idx > 0 ? fyOrder[idx - 1] : null;
    const prior = priorFy ? (id) => Number(result[priorFy]?.[id]) || 0 : null;
    BS_ROWS.forEach((row) => {
      if (row.type === "header" || row.type === "subheader") return;
      if (row.type === "input") {
        result[fy][row.id] = Number(bsRaw?.[row.id]?.[fy]) || 0;
      } else if (row.type === "computed") {
        result[fy][row.id] = row.compute(get, null, prior);
      }
    });
  });
  return result;
}

// ────────────────────────────────────────────────────────────────────────────
// Auto-suggest assumptions from historical averages — used when the
// assumption cell is null (i.e., user hasn't overridden).
// ────────────────────────────────────────────────────────────────────────────
export function autoSuggestAssumptions(plComp, bsComp) {
  const fyKeys = ["fy0", "fy1", "fy2"];
  const avg = (vals) => vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;

  // EBITDA margin steady = avg(EBITDA / Revenue from Ops) — skip zeros
  const margins = fyKeys.map((fy) => {
    const rev = plComp[fy]?.rev_ops || 0;
    const eb  = plComp[fy]?.ebitda || 0;
    return rev > 0 ? eb / rev : null;
  }).filter((v) => v !== null && isFinite(v));

  const dapcts = fyKeys.map((fy) => {
    const tot = plComp[fy]?.rev_total || 0;
    const da = plComp[fy]?.da || 0;
    return tot > 0 ? da / tot : null;
  }).filter((v) => v !== null && isFinite(v));

  const capexPcts = fyKeys.map((fy) => {
    const tot = plComp[fy]?.rev_total || 0;
    const cx = bsComp[fy]?.capex || 0;
    return tot > 0 ? cx / tot : null;
  }).filter((v) => v !== null && isFinite(v));

  const wcPcts = fyKeys.map((fy) => {
    const tot = plComp[fy]?.rev_total || 0;
    const dwc = bsComp[fy]?.wc_change || 0;
    return tot > 0 ? dwc / tot : null;
  }).filter((v) => v !== null && isFinite(v));

  return {
    ebitda_margin_steady: avg(margins),
    depreciation_pct:     avg(dapcts),
    capex_pct:            avg(capexPcts),
    wc_change_pct:        avg(wcPcts),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Adapter — convert a saved BV project's stored inputs into the shape the
// existing BV Engine math (calculateDCF / calculateNAV / calculateComparable)
// expects.
// ────────────────────────────────────────────────────────────────────────────
export function bvProjectToEngineInputs(project) {
  const plRaw = project?.pl || {};
  const bsRaw = project?.bs || {};
  const a = project?.assumptions || {};
  const ec = project?.engine_config || {};

  const bsComp = computeBSColumns(bsRaw);
  const plComp = computePLColumns(plRaw, bsComp);
  const auto = autoSuggestAssumptions(plComp, bsComp);

  // Pull latest-FY actuals (fy2 = latest)
  const latestPl = plComp.fy2;
  const latestBs = bsComp.fy2;

  return {
    company_name: project?.company_name || "",
    sector_id: ec.sector_id || "edtech_training",
    shares_lakhs: latestBs?.shares_outstanding || 0,
    revenue: {
      fy1: plComp.fy0?.rev_total || 0,
      fy2: plComp.fy1?.rev_total || 0,
      fy3: plComp.fy2?.rev_total || 0,
    },
    ebitda: {
      fy1: plComp.fy0?.ebitda || 0,
      fy2: plComp.fy1?.ebitda || 0,
      fy3: plComp.fy2?.ebitda || 0,
    },
    pat_fy3: latestPl?.net_profit || 0,
    total_assets_fy3: latestBs?.total_assets || 0,
    total_debt_fy3: latestBs?.lt_debt || 0,
    cash_fy3: latestBs?.cash || 0,
    shareholders_equity_fy3: latestBs?.total_se || 0,
    net_fixed_assets_fy3: latestBs?.tangible_nca || 0,
    accounts_receivable: latestBs?.ar || 0,
    other_current_assets: latestBs?.other_ca || 0,
    accounts_payable: latestBs?.ap || 0,
    accrued_expenses: latestBs?.accrued || 0,
    long_term_debt: latestBs?.lt_debt || 0,
    intangible_brand: ec.intangible_brand ?? 0,
    goodwill: ec.goodwill ?? 0,
    wacc: a.wacc ?? 0.12,
    revenue_cagr: a.revenue_cagr ?? 0.15,
    ebitda_margin_steady: a.ebitda_margin_steady ?? auto.ebitda_margin_steady,
    depreciation_pct: a.depreciation_pct ?? auto.depreciation_pct,
    capex_pct: a.capex_pct ?? auto.capex_pct,
    wc_change_pct: a.wc_change_pct ?? auto.wc_change_pct,
    tax_rate: a.tax_rate ?? 0.25,
    terminal_growth: a.terminal_growth ?? 0.04,
    projection_years: a.projection_years ?? 5,
    ev_ebitda_multiple: ec.ev_ebitda_multiple ?? 10,
    ev_revenue_multiple: ec.ev_revenue_multiple ?? 3,
    pe_multiple: ec.pe_multiple ?? 15,
    apply_unlisted_discount: ec.apply_unlisted_discount ?? true,
    weight_dcf: ec.weight_dcf ?? 0.5,
    weight_nav: ec.weight_nav ?? 0.25,
    weight_comparable: ec.weight_comparable ?? 0.25,
  };
}
