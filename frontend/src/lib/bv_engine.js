// Pure-math engine for the BV Engine module — no React, no DOM.
// All monetary inputs / outputs are in ₹ Lakhs.
//
// Reference: "Valuation tool prompt.docx" + "Valuation Module - output.xlsx"
//   - DCF: 5-year FCFF model with Gordon Growth terminal value
//   - NAV: adjusted-net-asset value with brand + goodwill add-backs
//   - Comparable: 3 sub-multiples (EV/EBITDA, EV/Revenue, P/E) averaged
//   - Weights: DCF 50%, NAV 25%, Comparable 25%

import { UNLISTED_DISCOUNT } from "@/data/sector_peer_multiples";

const round2 = (n) => Math.round(n * 100) / 100;

// ────────────────────────────────────────────────────────────────────────────
// Input shape (for reference)
// ────────────────────────────────────────────────────────────────────────────
// inputs = {
//   company_name, sector_id,
//   shares_lakhs,
//   // Historical (₹ L)
//   revenue: { fy1: , fy2: , fy3: },   // fy3 = latest actual
//   ebitda:  { fy1: , fy2: , fy3: },
//   pat_fy3, total_assets_fy3, total_debt_fy3, cash_fy3,
//   shareholders_equity_fy3, net_fixed_assets_fy3,
//   // NAV-specific balance sheet items (₹ L)
//   accounts_receivable, other_current_assets,
//   accounts_payable, accrued_expenses, long_term_debt,
//   intangible_brand, goodwill,
//   // DCF assumptions (decimals; e.g., 0.12 = 12%)
//   wacc, revenue_cagr, ebitda_margin_steady, depreciation_pct, capex_pct,
//   wc_change_pct, tax_rate, terminal_growth, projection_years,
//   // Comparable
//   ev_ebitda_multiple, ev_revenue_multiple, pe_multiple,
//   apply_unlisted_discount,    // boolean
//   // Weights (decimals)
//   weight_dcf, weight_nav, weight_comparable,
// }

// ────────────────────────────────────────────────────────────────────────────
// 1. DCF — 5-year FCFF model
// ────────────────────────────────────────────────────────────────────────────
export function calculateDCF(i) {
  const baseRevenue = Number(i.revenue?.fy3) || 0;
  const years = Number(i.projection_years) || 5;
  const cagr = Number(i.revenue_cagr) || 0;
  const margin = Number(i.ebitda_margin_steady) || 0;
  const dapct = Number(i.depreciation_pct) || 0;
  const capexPct = Number(i.capex_pct) || 0;
  const wcPct = Number(i.wc_change_pct) || 0;
  const tax = Number(i.tax_rate) || 0;
  const wacc = Number(i.wacc) || 0;
  const tg = Number(i.terminal_growth) || 0;
  const debt = Number(i.total_debt_fy3) || 0;
  const cash = Number(i.cash_fy3) || 0;
  const shares = Number(i.shares_lakhs) || 0;

  const projections = [];
  let lastFCFF = 0;
  for (let n = 1; n <= years; n += 1) {
    const revenue = baseRevenue * Math.pow(1 + cagr, n);
    const ebitda = revenue * margin;
    const da = revenue * dapct;
    const ebit = ebitda - da;
    const nopat = ebit * (1 - tax);
    const capex = revenue * capexPct;
    const dwc = revenue * wcPct;
    const fcff = nopat + da - capex - dwc;
    const discountFactor = 1 / Math.pow(1 + wacc, n);
    const pvFcff = fcff * discountFactor;
    projections.push({
      year_label: `FY${new Date().getFullYear() + n}E`,
      year_index: n,
      revenue: round2(revenue),
      growth: round2(cagr * 100),
      ebitda: round2(ebitda),
      ebitda_margin: round2(margin * 100),
      da: round2(da),
      ebit: round2(ebit),
      tax: round2(ebit * tax),
      nopat: round2(nopat),
      capex: round2(capex),
      change_wc: round2(dwc),
      fcff: round2(fcff),
      discount_factor: round2(discountFactor * 10000) / 10000,
      pv_fcff: round2(pvFcff),
    });
    lastFCFF = fcff;
  }
  const sumPV = projections.reduce((s, r) => s + r.pv_fcff, 0);
  const terminalValue = wacc > tg ? (lastFCFF * (1 + tg)) / (wacc - tg) : 0;
  const pvTerminal = terminalValue / Math.pow(1 + wacc, years);
  const ev = sumPV + pvTerminal;
  const equity = ev - debt + cash;
  const per_share = shares > 0 ? equity / shares : 0;

  return {
    method: "DCF",
    projections,
    sum_pv_fcff: round2(sumPV),
    terminal_value: round2(terminalValue),
    pv_terminal_value: round2(pvTerminal),
    enterprise_value: round2(ev),
    less_debt: round2(debt),
    add_cash: round2(cash),
    equity_value: round2(equity),
    per_share: round2(per_share),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 2. NAV — Adjusted Net Asset Value (with brand + goodwill add-backs)
// ────────────────────────────────────────────────────────────────────────────
export function calculateNAV(i) {
  const cash = Number(i.cash_fy3) || 0;
  const ar = Number(i.accounts_receivable) || 0;
  const oca = Number(i.other_current_assets) || 0;
  const nfa = Number(i.net_fixed_assets_fy3) || 0;
  const intang = Number(i.intangible_brand) || 0;
  const goodwill = Number(i.goodwill) || 0;
  const ap = Number(i.accounts_payable) || 0;
  const accr = Number(i.accrued_expenses) || 0;
  const ltd = Number(i.long_term_debt) || Number(i.total_debt_fy3) || 0;
  const shares = Number(i.shares_lakhs) || 0;

  const arHaircut = ar * 0.05;
  const arAdjusted = ar - arHaircut;

  const lines = [
    { label: "Cash & Cash Equivalents",          book: cash,    adjusted: cash,        basis: "At book — liquid" },
    { label: "Accounts Receivable",              book: ar,      adjusted: round2(arAdjusted), basis: "5% haircut applied for recoverability" },
    { label: "Other Current Assets",             book: oca,     adjusted: oca,         basis: "At book" },
    { label: "Net Fixed / Tangible Assets",      book: nfa,     adjusted: nfa,         basis: "At book; revaluation skipped (conservative)" },
    { label: "Intangible — Brand Value (Add)",   book: 0,       adjusted: intang,      basis: "AI-suggested intangible (track record, IPs, approvals)" },
    { label: "Goodwill / Regulatory (Add)",      book: 0,       adjusted: goodwill,    basis: "AI-suggested regulatory / strategic goodwill" },
  ];

  const totalAdjAssets = lines.reduce((s, l) => s + l.adjusted, 0);
  const liabLines = [
    { label: "Accounts Payable",       value: ap,   basis: "At book" },
    { label: "Total Accrued Expenses", value: accr, basis: "At book" },
    { label: "Long-term Debt",         value: ltd,  basis: "At book" },
  ];
  const totalLiabilities = liabLines.reduce((s, l) => s + l.value, 0);
  const equity = totalAdjAssets - totalLiabilities;
  const per_share = shares > 0 ? equity / shares : 0;

  return {
    method: "NAV",
    asset_lines: lines.map((l) => ({ ...l, book: round2(l.book), adjusted: round2(l.adjusted) })),
    liability_lines: liabLines.map((l) => ({ ...l, value: round2(l.value) })),
    total_adjusted_assets: round2(totalAdjAssets),
    total_liabilities: round2(totalLiabilities),
    equity_value: round2(equity),
    per_share: round2(per_share),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Comparable Company — EV/EBITDA, EV/Revenue, P/E (avg)
// ────────────────────────────────────────────────────────────────────────────
export function calculateComparable(i) {
  const revenue = Number(i.revenue?.fy3) || 0;
  const ebitda = Number(i.ebitda?.fy3) || 0;
  const pat = Number(i.pat_fy3) || 0;
  const debt = Number(i.total_debt_fy3) || 0;
  const cash = Number(i.cash_fy3) || 0;
  const shares = Number(i.shares_lakhs) || 0;

  const discount = i.apply_unlisted_discount ? 1 - UNLISTED_DISCOUNT : 1;
  const evEbitdaMult = (Number(i.ev_ebitda_multiple) || 0) * discount;
  const evRevMult    = (Number(i.ev_revenue_multiple) || 0) * discount;
  const peMult       = (Number(i.pe_multiple) || 0) * discount;

  const evEbitdaEv = ebitda * evEbitdaMult;
  const evEbitdaEq = evEbitdaEv - debt + cash;
  const evRevEv = revenue * evRevMult;
  const evRevEq = evRevEv - debt + cash;
  const peEq = pat * peMult; // P/E gives equity directly
  const avgEq = (evEbitdaEq + evRevEq + peEq) / 3;
  const per_share = shares > 0 ? avgEq / shares : 0;

  return {
    method: "Comparable Company",
    discount_applied_pct: i.apply_unlisted_discount ? UNLISTED_DISCOUNT * 100 : 0,
    sub_methods: [
      { name: "EV/EBITDA", multiple: round2(evEbitdaMult), base: round2(ebitda),  ev: round2(evEbitdaEv), equity: round2(evEbitdaEq) },
      { name: "EV/Revenue", multiple: round2(evRevMult),   base: round2(revenue), ev: round2(evRevEv),    equity: round2(evRevEq) },
      { name: "P/E",        multiple: round2(peMult),       base: round2(pat),     ev: 0,                 equity: round2(peEq) },
    ],
    average_equity_value: round2(avgEq),
    per_share: round2(per_share),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Weighted summary
// ────────────────────────────────────────────────────────────────────────────
export function weightedSummary(dcf, nav, comp, weights) {
  const wDcf = Number(weights.weight_dcf) || 0;
  const wNav = Number(weights.weight_nav) || 0;
  const wCmp = Number(weights.weight_comparable) || 0;
  const totalW = wDcf + wNav + wCmp || 1;
  const norm = (w) => w / totalW;

  const eqDcf = dcf.equity_value;
  const eqNav = nav.equity_value;
  const eqCmp = comp.average_equity_value;

  const weightedEq =
    eqDcf * norm(wDcf) + eqNav * norm(wNav) + eqCmp * norm(wCmp);

  const shares = weights.shares_lakhs || 0;
  return {
    rows: [
      { method: "DCF",                weight: round2(norm(wDcf) * 100), equity: round2(eqDcf), weighted: round2(eqDcf * norm(wDcf)) },
      { method: "NAV",                weight: round2(norm(wNav) * 100), equity: round2(eqNav), weighted: round2(eqNav * norm(wNav)) },
      { method: "Comparable Company", weight: round2(norm(wCmp) * 100), equity: round2(eqCmp), weighted: round2(eqCmp * norm(wCmp)) },
    ],
    weighted_equity_value: round2(weightedEq),
    weighted_per_share: shares > 0 ? round2(weightedEq / shares) : 0,
  };
}

// Helper to format numbers in Indian-style (lakh/crore commas)
export function fmtL(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const v = Number(n);
  if (!isFinite(v)) return "—";
  return v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
