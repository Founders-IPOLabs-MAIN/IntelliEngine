"""
Automated Business Valuation Module - Calculation Engine
Compliant with Indian regulatory frameworks:
- Companies Act 2013 / Rule 11UA
- SEBI (ICDR) Regulations 2018
- Income Tax Act 1961 Section 56(2)(viib)
- ICAI Valuation Standards 2018
"""

import math


def calculate_dcf_valuation(financial_data: dict, config: dict) -> dict:
    """
    Discounted Cash Flow (DCF) valuation.
    Projects FCFF for N years, applies WACC discounting, Gordon Growth terminal value.
    """
    wacc = config.get("wacc", 12) / 100
    growth_rate = config.get("growth_rate", 15) / 100
    terminal_growth = config.get("terminal_growth", 4) / 100
    projection_years = config.get("projection_years", 5)

    years_data = financial_data.get("years_data", [])
    if not years_data:
        return {"error": "No financial data provided", "valuation": 0}

    latest = years_data[-1]
    pat = latest.get("pat", 0)
    depreciation = latest.get("depreciation", 0)
    capex = latest.get("capex", 0)
    working_capital_change = latest.get("working_capital_change", 0)
    revenue = latest.get("revenue", 0)
    ebitda = latest.get("ebitda", 0)
    total_debt = latest.get("total_debt", 0)
    total_cash = latest.get("cash_equivalents", 0)

    # Base FCFF
    base_fcff = pat + depreciation - capex - working_capital_change
    if base_fcff <= 0:
        base_fcff = ebitda * 0.6 if ebitda > 0 else revenue * 0.1

    # Project FCFF
    projections = []
    pv_fcff_sum = 0
    current_fcff = base_fcff

    for year in range(1, projection_years + 1):
        current_fcff = current_fcff * (1 + growth_rate)
        discount_factor = 1 / ((1 + wacc) ** year)
        pv_fcff = current_fcff * discount_factor
        pv_fcff_sum += pv_fcff
        projections.append({
            "year": year,
            "fcff": round(current_fcff, 2),
            "discount_factor": round(discount_factor, 4),
            "pv_fcff": round(pv_fcff, 2)
        })

    # Terminal Value (Gordon Growth Model)
    if wacc <= terminal_growth:
        return {"error": "WACC must be greater than terminal growth rate", "valuation": 0}

    terminal_fcff = current_fcff * (1 + terminal_growth)
    terminal_value = terminal_fcff / (wacc - terminal_growth)
    pv_terminal = terminal_value / ((1 + wacc) ** projection_years)

    enterprise_value = pv_fcff_sum + pv_terminal
    equity_value = enterprise_value - total_debt + total_cash

    # Sensitivity analysis: WACC ±2%, growth ±1%
    sensitivity = []
    for wacc_adj in [-0.02, -0.01, 0, 0.01, 0.02]:
        row = {"wacc": round((wacc + wacc_adj) * 100, 1)}
        for growth_adj in [-0.01, 0, 0.01]:
            adj_wacc = wacc + wacc_adj
            adj_growth = terminal_growth + growth_adj
            if adj_wacc <= adj_growth:
                row[f"tg_{round((terminal_growth + growth_adj)*100, 1)}"] = "N/A"
                continue
            adj_terminal_fcff = current_fcff * (1 + adj_growth)
            adj_tv = adj_terminal_fcff / (adj_wacc - adj_growth)
            adj_pv_tv = adj_tv / ((1 + adj_wacc) ** projection_years)
            adj_ev = pv_fcff_sum + adj_pv_tv
            adj_equity = adj_ev - total_debt + total_cash
            row[f"tg_{round((terminal_growth + growth_adj)*100, 1)}"] = round(adj_equity, 2)
        sensitivity.append(row)

    return {
        "method": "Discounted Cash Flow (DCF)",
        "standard": "ICAI Valuation Standard 301 - DCF Approach",
        "base_fcff": round(base_fcff, 2),
        "projections": projections,
        "pv_fcff_sum": round(pv_fcff_sum, 2),
        "terminal_value": round(terminal_value, 2),
        "pv_terminal_value": round(pv_terminal, 2),
        "enterprise_value": round(enterprise_value, 2),
        "net_debt": round(total_debt - total_cash, 2),
        "equity_value": round(max(equity_value, 0), 2),
        "valuation": round(max(equity_value, 0), 2),
        "assumptions": {
            "wacc": round(wacc * 100, 2),
            "growth_rate": round(growth_rate * 100, 2),
            "terminal_growth": round(terminal_growth * 100, 2),
            "projection_years": projection_years,
            "cost_of_equity_basis": "CAPM (India 10Y G-Sec + Equity Risk Premium)",
        },
        "sensitivity": sensitivity,
        "formula": f"FCFF (₹{base_fcff:.2f}) projected at {growth_rate*100:.0f}% for {projection_years} years, discounted at WACC {wacc*100:.1f}%"
    }


def calculate_nav_valuation(financial_data: dict, config: dict) -> dict:
    """
    Net Asset Value (NAV) valuation.
    Book value adjusted for fair value of assets and liabilities.
    """
    illiquidity_discount = config.get("illiquidity_discount", 20) / 100
    years_data = financial_data.get("years_data", [])
    if not years_data:
        return {"error": "No financial data provided", "valuation": 0}

    latest = years_data[-1]
    total_assets = latest.get("total_assets", 0)
    total_liabilities = latest.get("total_liabilities", 0)
    net_worth = latest.get("net_worth", 0)
    shares_outstanding = financial_data.get("shares_outstanding", 1)

    # Fair value adjustments
    land_building_adj = config.get("land_building_adj", 0)
    investment_adj = config.get("investment_adj", 0)
    inventory_adj = config.get("inventory_adj", 0)
    receivable_adj = config.get("receivable_adj", 0)
    contingent_liabilities = config.get("contingent_liabilities", 0)

    total_adjustments = land_building_adj + investment_adj + inventory_adj + receivable_adj
    adjusted_net_worth = net_worth + total_adjustments - contingent_liabilities

    # Going concern NAV
    going_concern_nav = max(adjusted_net_worth, 0)
    per_share_going_concern = going_concern_nav / shares_outstanding if shares_outstanding > 0 else 0

    # Liquidation NAV (typically 20-30% discount)
    liquidation_nav = going_concern_nav * 0.75
    per_share_liquidation = liquidation_nav / shares_outstanding if shares_outstanding > 0 else 0

    # Illiquidity-adjusted value (for unlisted shares)
    illiquidity_adjusted = going_concern_nav * (1 - illiquidity_discount)

    adjustments_detail = []
    if land_building_adj != 0:
        adjustments_detail.append({"item": "Land & Buildings (Fair Value)", "amount": round(land_building_adj, 2)})
    if investment_adj != 0:
        adjustments_detail.append({"item": "Investments (Market/DCF)", "amount": round(investment_adj, 2)})
    if inventory_adj != 0:
        adjustments_detail.append({"item": "Inventory (NRV Basis)", "amount": round(inventory_adj, 2)})
    if receivable_adj != 0:
        adjustments_detail.append({"item": "Receivables (Doubtful Debts)", "amount": round(receivable_adj, 2)})
    if contingent_liabilities != 0:
        adjustments_detail.append({"item": "Contingent Liabilities", "amount": round(-contingent_liabilities, 2)})

    return {
        "method": "Net Asset Value (NAV)",
        "standard": "AS 10, AS 13, Ind AS 113 – Fair Value Measurement",
        "total_assets": round(total_assets, 2),
        "total_liabilities": round(total_liabilities, 2),
        "book_net_worth": round(net_worth, 2),
        "adjustments": adjustments_detail,
        "total_adjustments": round(total_adjustments - contingent_liabilities, 2),
        "adjusted_net_worth": round(adjusted_net_worth, 2),
        "going_concern_nav": round(going_concern_nav, 2),
        "liquidation_nav": round(liquidation_nav, 2),
        "illiquidity_discount_pct": round(illiquidity_discount * 100, 1),
        "illiquidity_adjusted_nav": round(illiquidity_adjusted, 2),
        "shares_outstanding": shares_outstanding,
        "per_share_going_concern": round(per_share_going_concern, 2),
        "per_share_liquidation": round(per_share_liquidation, 2),
        "valuation": round(going_concern_nav, 2),
        "formula": f"Book Net Worth (₹{net_worth:.2f}) + Adjustments (₹{total_adjustments - contingent_liabilities:.2f}) = ₹{adjusted_net_worth:.2f}"
    }


def calculate_comparable_valuation(financial_data: dict, config: dict) -> dict:
    """
    Comparable Company Multiple (CCM) valuation.
    Uses peer multiples applied to subject company metrics.
    """
    years_data = financial_data.get("years_data", [])
    if not years_data:
        return {"error": "No financial data provided", "valuation": 0}

    latest = years_data[-1]
    pat = latest.get("pat", 0)
    ebitda = latest.get("ebitda", 0)
    revenue = latest.get("revenue", 0)
    net_worth = latest.get("net_worth", 0)

    peers = config.get("peers", [])
    if not peers:
        # Default industry multiples
        peers = [
            {"name": "Industry Average", "pe": 20, "ev_ebitda": 12, "pb": 2.5, "ev_sales": 3}
        ]

    # Calculate median multiples
    pe_multiples = [p["pe"] for p in peers if p.get("pe", 0) > 0]
    ev_ebitda_multiples = [p["ev_ebitda"] for p in peers if p.get("ev_ebitda", 0) > 0]
    pb_multiples = [p["pb"] for p in peers if p.get("pb", 0) > 0]
    ev_sales_multiples = [p["ev_sales"] for p in peers if p.get("ev_sales", 0) > 0]

    def median(lst):
        if not lst:
            return 0
        s = sorted(lst)
        n = len(s)
        return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2

    def avg(lst):
        return sum(lst) / len(lst) if lst else 0

    median_pe = median(pe_multiples)
    median_ev_ebitda = median(ev_ebitda_multiples)
    median_pb = median(pb_multiples)
    median_ev_sales = median(ev_sales_multiples)

    # Apply multiples
    valuations = {}
    if pat > 0 and median_pe > 0:
        valuations["pe"] = {"multiple": round(median_pe, 1), "metric": round(pat, 2), "value": round(pat * median_pe, 2), "label": "P/E × PAT"}
    if ebitda > 0 and median_ev_ebitda > 0:
        valuations["ev_ebitda"] = {"multiple": round(median_ev_ebitda, 1), "metric": round(ebitda, 2), "value": round(ebitda * median_ev_ebitda, 2), "label": "EV/EBITDA × EBITDA"}
    if net_worth > 0 and median_pb > 0:
        valuations["pb"] = {"multiple": round(median_pb, 1), "metric": round(net_worth, 2), "value": round(net_worth * median_pb, 2), "label": "P/B × Net Worth"}
    if revenue > 0 and median_ev_sales > 0:
        valuations["ev_sales"] = {"multiple": round(median_ev_sales, 1), "metric": round(revenue, 2), "value": round(revenue * median_ev_sales, 2), "label": "EV/Sales × Revenue"}

    # Average of applicable multiples
    values = [v["value"] for v in valuations.values()]
    avg_valuation = sum(values) / len(values) if values else 0

    return {
        "method": "Comparable Company Multiples (CCM)",
        "standard": "ICAI Valuation Standard 303 – Market Approach",
        "peers": peers,
        "multiples_summary": {
            "pe": {"median": round(median_pe, 1), "average": round(avg(pe_multiples), 1)},
            "ev_ebitda": {"median": round(median_ev_ebitda, 1), "average": round(avg(ev_ebitda_multiples), 1)},
            "pb": {"median": round(median_pb, 1), "average": round(avg(pb_multiples), 1)},
            "ev_sales": {"median": round(median_ev_sales, 1), "average": round(avg(ev_sales_multiples), 1)},
        },
        "applied_valuations": valuations,
        "average_valuation": round(avg_valuation, 2),
        "valuation": round(avg_valuation, 2),
        "formula": f"Average of applicable market multiples applied to subject company metrics"
    }


def calculate_ddm_valuation(financial_data: dict, config: dict) -> dict:
    """
    Dividend Discount Model (DDM) for dividend-paying companies.
    """
    years_data = financial_data.get("years_data", [])
    if not years_data:
        return {"error": "No financial data", "valuation": 0}

    latest = years_data[-1]
    dividend_per_share = latest.get("dividend_per_share", 0)
    shares_outstanding = financial_data.get("shares_outstanding", 1)

    if dividend_per_share <= 0:
        return {
            "method": "Dividend Discount Model (DDM)",
            "warning": "Company has no dividend history — DDM not applicable",
            "valuation": 0
        }

    cost_of_equity = config.get("cost_of_equity", 14) / 100
    dividend_growth = config.get("dividend_growth", 5) / 100

    if cost_of_equity <= dividend_growth:
        return {"error": "Cost of equity must exceed dividend growth rate", "valuation": 0}

    # Gordon Growth Model
    value_per_share = (dividend_per_share * (1 + dividend_growth)) / (cost_of_equity - dividend_growth)
    total_value = value_per_share * shares_outstanding

    return {
        "method": "Dividend Discount Model (DDM)",
        "standard": "Gordon Growth Model",
        "current_dps": round(dividend_per_share, 2),
        "projected_dps": round(dividend_per_share * (1 + dividend_growth), 2),
        "cost_of_equity": round(cost_of_equity * 100, 2),
        "dividend_growth": round(dividend_growth * 100, 2),
        "value_per_share": round(value_per_share, 2),
        "shares_outstanding": shares_outstanding,
        "valuation": round(total_value, 2),
        "formula": f"D1 / (Ke - g) = ₹{dividend_per_share * (1 + dividend_growth):.2f} / ({cost_of_equity*100:.1f}% - {dividend_growth*100:.1f}%)"
    }


def calculate_financial_ratios(financial_data: dict) -> dict:
    """Calculate key financial ratios from the data."""
    years_data = financial_data.get("years_data", [])
    if not years_data:
        return {}

    latest = years_data[-1]
    revenue = latest.get("revenue", 0)
    ebitda = latest.get("ebitda", 0)
    pat = latest.get("pat", 0)
    net_worth = latest.get("net_worth", 0)
    total_assets = latest.get("total_assets", 0)
    total_debt = latest.get("total_debt", 0)
    current_assets = latest.get("current_assets", 0)
    current_liabilities = latest.get("current_liabilities", 0)

    ratios = {}
    if revenue > 0:
        ratios["ebitda_margin"] = round((ebitda / revenue) * 100, 2) if ebitda else 0
        ratios["pat_margin"] = round((pat / revenue) * 100, 2) if pat else 0
        ratios["asset_turnover"] = round(revenue / total_assets, 2) if total_assets > 0 else 0
    if net_worth > 0:
        ratios["roe"] = round((pat / net_worth) * 100, 2) if pat else 0
        ratios["debt_equity"] = round(total_debt / net_worth, 2) if total_debt else 0
    if total_assets > 0:
        ratios["roce"] = round((ebitda / total_assets) * 100, 2) if ebitda else 0
    if current_liabilities > 0:
        ratios["current_ratio"] = round(current_assets / current_liabilities, 2) if current_assets else 0

    # Revenue growth
    if len(years_data) >= 2:
        prev_rev = years_data[-2].get("revenue", 0)
        if prev_rev > 0:
            ratios["revenue_growth"] = round(((revenue - prev_rev) / prev_rev) * 100, 2)

    # 3-year CAGR
    if len(years_data) >= 3:
        first_rev = years_data[0].get("revenue", 0)
        n = len(years_data) - 1
        if first_rev > 0 and revenue > 0:
            ratios["revenue_cagr"] = round(((revenue / first_rev) ** (1 / n) - 1) * 100, 2)
        first_pat = years_data[0].get("pat", 0)
        if first_pat > 0 and pat > 0:
            ratios["pat_cagr"] = round(((pat / first_pat) ** (1 / n) - 1) * 100, 2)

    return ratios


def compute_weighted_valuation(results: dict, weights: dict) -> dict:
    """Compute weighted average valuation from multiple methods."""
    total_weight = 0
    weighted_sum = 0
    method_values = []

    for method, result in results.items():
        if method == "ddm" and result.get("warning"):
            continue
        val = result.get("valuation", 0)
        if val <= 0:
            continue
        w = weights.get(method, 0)
        weighted_sum += val * w
        total_weight += w
        method_values.append({"method": method, "value": val, "weight": w})

    if total_weight > 0:
        weighted_avg = weighted_sum / total_weight
    else:
        # Equal weight fallback
        valid = [m["value"] for m in method_values if m["value"] > 0]
        weighted_avg = sum(valid) / len(valid) if valid else 0

    # Value range (±10%)
    low = weighted_avg * 0.9
    high = weighted_avg * 1.1

    return {
        "weighted_average": round(weighted_avg, 2),
        "value_range_low": round(low, 2),
        "value_range_high": round(high, 2),
        "method_values": method_values,
        "total_weight": round(total_weight, 2)
    }
