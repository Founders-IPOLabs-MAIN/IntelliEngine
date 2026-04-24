from fastapi import APIRouter, HTTPException, Depends
from shared import (db, logger, User, get_current_user, promote_new_user,
    datetime, timezone, uuid, os)
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# ============ IPO ASSESSMENT MODULE ============

# SEBI Eligibility Criteria
SEBI_MAINBOARD_CRITERIA = {
    "net_tangible_assets_min": 3,  # Crores for each of last 3 years
    "operating_profit_avg_min": 15,  # Crores average over 3 years
    "net_worth_min": 1,  # Crores for each of last 3 years
    "min_dilution_percent": 25  # Minimum public offering
}

SEBI_SME_CRITERIA = {
    "post_issue_capital_min": 1,  # Crores
    "post_issue_capital_max": 25,  # Crores
    "positive_net_worth": True,
    "profitable_years_min": 2
}

# Assessment Models
class AssessmentCompanyInfo(BaseModel):
    company_type: str  # private_limited / public_limited
    target_board: str  # sme / mainboard
    reporting_unit: str = "crores"  # lacs / crores

class AssessmentPLData(BaseModel):
    year1_pat: float  # Net Profit After Tax
    year2_pat: float
    year3_pat: float
    year1_ebitda: float
    year2_ebitda: float
    year3_ebitda: float
    year1_revenue: float
    year2_revenue: float
    year3_revenue: float

class AssessmentBalanceSheet(BaseModel):
    total_debt: float
    total_cash: float
    net_tangible_assets_y1: float
    net_tangible_assets_y2: float
    net_tangible_assets_y3: float
    net_worth_y1: float
    net_worth_y2: float
    net_worth_y3: float
    depreciation: float
    capital_expenditure: float
    working_capital_change: float

class AssessmentProjections(BaseModel):
    growth_rate: float  # Expected 5-year growth rate (%)
    wacc: float  # Weighted Average Cost of Capital (%)
    terminal_growth: float = 3.0  # Terminal growth rate (%)

class AssessmentMarketData(BaseModel):
    industry_pe: float
    peer_pe: float

class IPOAssessmentRequest(BaseModel):
    company_info: AssessmentCompanyInfo
    pl_data: AssessmentPLData
    balance_sheet: AssessmentBalanceSheet
    projections: AssessmentProjections
    market_data: AssessmentMarketData
    governance_compliance: dict = {}  # {question_id: "yes"/"no"}
    issue_type: str = "fresh"  # fresh / ofs / both
    dilution_percent: float = 25.0

def convert_to_crores(value: float, unit: str) -> float:
    """Convert value to crores if in lacs"""
    if unit == "lacs":
        return value / 100
    return value

def calculate_pe_valuation(pat: float, pe_multiple: float) -> dict:
    """PE Valuation Calculator"""
    if pat <= 0:
        return {
            "valuation": 0,
            "method": "P/E Multiple",
            "warning": "Negative PAT - P/E valuation not applicable"
        }
    
    valuation = pat * pe_multiple
    return {
        "valuation": round(valuation, 2),
        "method": "P/E Multiple",
        "pe_used": pe_multiple,
        "pat_used": pat,
        "formula": f"PAT (₹{pat:.2f} Cr) × P/E ({pe_multiple:.1f}x) = ₹{valuation:.2f} Cr"
    }

def calculate_dcf_valuation(
    base_fcf: float, 
    growth_rate: float, 
    wacc: float, 
    terminal_growth: float = 3.0,
    years: int = 5
) -> dict:
    """DCF Business Valuation Calculator"""
    if wacc <= terminal_growth:
        return {
            "valuation": 0,
            "method": "DCF",
            "warning": "WACC must be greater than terminal growth rate"
        }
    
    # Project FCF for 5 years
    fcf_projections = []
    current_fcf = base_fcf
    pv_fcf_sum = 0
    
    for year in range(1, years + 1):
        current_fcf = current_fcf * (1 + growth_rate / 100)
        discount_factor = 1 / ((1 + wacc / 100) ** year)
        pv_fcf = current_fcf * discount_factor
        pv_fcf_sum += pv_fcf
        fcf_projections.append({
            "year": year,
            "fcf": round(current_fcf, 2),
            "pv_fcf": round(pv_fcf, 2)
        })
    
    # Terminal Value using Gordon Growth
    terminal_fcf = current_fcf * (1 + terminal_growth / 100)
    terminal_value = terminal_fcf / ((wacc - terminal_growth) / 100)
    pv_terminal = terminal_value / ((1 + wacc / 100) ** years)
    
    total_value = pv_fcf_sum + pv_terminal
    
    return {
        "valuation": round(total_value, 2),
        "method": "DCF (Discounted Cash Flow)",
        "pv_fcf_sum": round(pv_fcf_sum, 2),
        "terminal_value": round(terminal_value, 2),
        "pv_terminal_value": round(pv_terminal, 2),
        "fcf_projections": fcf_projections,
        "formula": f"Sum of PV(FCF) + PV(Terminal Value) = ₹{pv_fcf_sum:.2f} + ₹{pv_terminal:.2f} = ₹{total_value:.2f} Cr"
    }

def calculate_issue_size(valuation: float, dilution_percent: float, issue_type: str) -> dict:
    """Issue Size Calculator"""
    post_money_valuation = valuation
    issue_size = (post_money_valuation * dilution_percent) / 100
    
    return {
        "post_money_valuation": round(post_money_valuation, 2),
        "dilution_percent": dilution_percent,
        "issue_type": issue_type,
        "total_issue_size": round(issue_size, 2),
        "formula": f"Valuation (₹{post_money_valuation:.2f} Cr) × Dilution ({dilution_percent}%) = ₹{issue_size:.2f} Cr"
    }

def calculate_fcfe(
    net_income: float,
    depreciation: float,
    capex: float,
    working_capital_change: float,
    net_debt_change: float = 0
) -> dict:
    """Free Cash Flow to Equity Calculator"""
    fcfe = net_income + depreciation - capex - working_capital_change + net_debt_change
    
    return {
        "fcfe": round(fcfe, 2),
        "components": {
            "net_income": net_income,
            "add_depreciation": depreciation,
            "less_capex": capex,
            "less_wc_change": working_capital_change,
            "net_debt_change": net_debt_change
        },
        "formula": f"PAT + D&A - CapEx - ΔWC + Net Debt = ₹{net_income:.2f} + ₹{depreciation:.2f} - ₹{capex:.2f} - ₹{working_capital_change:.2f} = ₹{fcfe:.2f} Cr",
        "fcfe_yield": round((fcfe / net_income * 100), 2) if net_income > 0 else 0
    }

def check_sebi_eligibility(data: IPOAssessmentRequest, unit: str) -> dict:
    """Check SEBI eligibility criteria"""
    bs = data.balance_sheet
    pl = data.pl_data
    target = data.company_info.target_board
    
    # Convert to crores if needed
    def to_cr(val):
        return convert_to_crores(val, unit)
    
    if target == "mainboard":
        criteria = SEBI_MAINBOARD_CRITERIA
        
        # Check Net Tangible Assets (min 3Cr each year)
        nta_y1 = to_cr(bs.net_tangible_assets_y1)
        nta_y2 = to_cr(bs.net_tangible_assets_y2)
        nta_y3 = to_cr(bs.net_tangible_assets_y3)
        nta_check = all([nta >= criteria["net_tangible_assets_min"] for nta in [nta_y1, nta_y2, nta_y3]])
        nta_min = min(nta_y1, nta_y2, nta_y3)
        
        # Check Operating Profit (avg 15Cr over 3 years)
        op_avg = (to_cr(pl.year1_ebitda) + to_cr(pl.year2_ebitda) + to_cr(pl.year3_ebitda)) / 3
        op_check = op_avg >= criteria["operating_profit_avg_min"]
        
        # Check Net Worth (min 1Cr each year)
        nw_y1 = to_cr(bs.net_worth_y1)
        nw_y2 = to_cr(bs.net_worth_y2)
        nw_y3 = to_cr(bs.net_worth_y3)
        nw_check = all([nw >= criteria["net_worth_min"] for nw in [nw_y1, nw_y2, nw_y3]])
        nw_min = min(nw_y1, nw_y2, nw_y3)
        
        checks = [
            {
                "criterion": "Net Tangible Assets (≥₹3Cr each year)",
                "required": f"≥ ₹{criteria['net_tangible_assets_min']} Cr",
                "actual": f"Min: ₹{nta_min:.2f} Cr",
                "passed": nta_check,
                "gap": max(0, criteria["net_tangible_assets_min"] - nta_min) if not nta_check else 0
            },
            {
                "criterion": "Avg Operating Profit (≥₹15Cr over 3 years)",
                "required": f"≥ ₹{criteria['operating_profit_avg_min']} Cr",
                "actual": f"₹{op_avg:.2f} Cr",
                "passed": op_check,
                "gap": max(0, criteria["operating_profit_avg_min"] - op_avg) if not op_check else 0
            },
            {
                "criterion": "Net Worth (≥₹1Cr each year)",
                "required": f"≥ ₹{criteria['net_worth_min']} Cr",
                "actual": f"Min: ₹{nw_min:.2f} Cr",
                "passed": nw_check,
                "gap": max(0, criteria["net_worth_min"] - nw_min) if not nw_check else 0
            }
        ]
        
        passed_count = sum(1 for c in checks if c["passed"])
        
        return {
            "board": "Mainboard (NSE/BSE)",
            "checks": checks,
            "passed_count": passed_count,
            "total_checks": len(checks),
            "eligible": passed_count == len(checks)
        }
    
    else:  # SME
        criteria = SEBI_SME_CRITERIA
        
        # Positive Net Worth
        nw_positive = all([
            to_cr(bs.net_worth_y1) > 0,
            to_cr(bs.net_worth_y2) > 0,
            to_cr(bs.net_worth_y3) > 0
        ])
        
        # Profitable for at least 2 years
        profits = [to_cr(pl.year1_pat), to_cr(pl.year2_pat), to_cr(pl.year3_pat)]
        profitable_years = sum(1 for p in profits if p > 0)
        profit_check = profitable_years >= criteria["profitable_years_min"]
        
        checks = [
            {
                "criterion": "Positive Net Worth",
                "required": "Positive in all 3 years",
                "actual": "Met" if nw_positive else "Not Met",
                "passed": nw_positive,
                "gap": 0
            },
            {
                "criterion": "Profitability Track Record",
                "required": f"≥ {criteria['profitable_years_min']} years",
                "actual": f"{profitable_years} years",
                "passed": profit_check,
                "gap": max(0, criteria["profitable_years_min"] - profitable_years) if not profit_check else 0
            }
        ]
        
        passed_count = sum(1 for c in checks if c["passed"])
        
        return {
            "board": "SME Board (NSE Emerge / BSE SME)",
            "checks": checks,
            "passed_count": passed_count,
            "total_checks": len(checks),
            "eligible": passed_count == len(checks)
        }

# Governance question positive answer mapping
GOVERNANCE_POSITIVE_ANSWERS = {
    "gc_1": "yes", "gc_2": "no", "gc_3": "no", "gc_4": "no", "gc_5": "yes",
    "gc_6": "no", "gc_7": "yes", "gc_8": "yes", "gc_9": "no", "gc_10": "yes",
    "gc_11": "yes", "gc_12": "yes", "gc_13": "yes", "gc_14": "yes", "gc_15": "yes",
    "gc_16": "yes", "gc_17": "yes", "gc_18": "yes", "gc_19": "yes", "gc_20": "yes",
    "gc_21": "no", "gc_22": "yes", "gc_23": "yes", "gc_24": "yes", "gc_25": "yes",
    "gc_26": "yes", "gc_27": "yes", "gc_28": "yes", "gc_29": "yes", "gc_30": "yes",
    "gc_31": "yes", "gc_32": "yes", "gc_33": "yes", "gc_34": "yes", "gc_35": "no",
    "gc_36": "no", "gc_37": "no", "gc_38": "no", "gc_39": "yes", "gc_40": "yes",
    "gc_41": "no", "gc_42": "no", "gc_43": "yes", "gc_44": "no", "gc_45": "yes",
    "gc_46": "no", "gc_47": "yes", "gc_48": "yes", "gc_49": "yes", "gc_50": "no",
    "gc_51": "no", "gc_52": "yes", "gc_53": "no", "gc_54": "yes", "gc_55": "yes",
}

def calculate_governance_score(answers: dict) -> dict:
    """Calculate governance/compliance score from Yes/No answers"""
    if not answers:
        return {"score": 0, "total": 55, "positive_count": 0, "negative_count": 0, "unanswered": 55}
    
    positive_count = 0
    negative_count = 0
    total_answered = 0
    flagged_items = []
    
    for qid, expected in GOVERNANCE_POSITIVE_ANSWERS.items():
        user_answer = answers.get(qid)
        if user_answer is None:
            continue
        total_answered += 1
        if user_answer == expected:
            positive_count += 1
        else:
            negative_count += 1
            flagged_items.append(qid)
    
    total_questions = len(GOVERNANCE_POSITIVE_ANSWERS)
    score = round((positive_count / total_questions) * 100) if total_questions > 0 else 0
    
    return {
        "score": score,
        "total": total_questions,
        "positive_count": positive_count,
        "negative_count": negative_count,
        "unanswered": total_questions - total_answered,
        "flagged_items": flagged_items
    }

def determine_readiness_status(eligibility: dict, pe_valuation: dict, dcf_valuation: dict, fcfe: dict, governance: dict = None) -> dict:
    """Determine overall IPO readiness status"""
    issues = []
    
    # Check eligibility
    if not eligibility["eligible"]:
        failed_checks = [c for c in eligibility["checks"] if not c["passed"]]
        for check in failed_checks:
            issues.append({
                "type": "eligibility",
                "severity": "critical",
                "description": f"{check['criterion']}: Required {check['required']}, Current {check['actual']}"
            })
    
    # Check valuation concerns
    if pe_valuation.get("warning"):
        issues.append({
            "type": "valuation",
            "severity": "warning",
            "description": pe_valuation["warning"]
        })
    
    if dcf_valuation.get("warning"):
        issues.append({
            "type": "valuation",
            "severity": "warning",
            "description": dcf_valuation["warning"]
        })
    
    # Check FCFE
    if fcfe["fcfe"] < 0:
        issues.append({
            "type": "cash_flow",
            "severity": "warning",
            "description": f"Negative FCFE (₹{fcfe['fcfe']:.2f} Cr) - May concern dividend-seeking investors"
        })
    
    # Determine status
    critical_issues = [i for i in issues if i["severity"] == "critical"]
    warning_issues = [i for i in issues if i["severity"] == "warning"]
    
    # Base financial score
    if len(critical_issues) == 0 and len(warning_issues) == 0:
        status = "ready"
        status_label = "IPO Ready"
        status_message = "Your company meets all SEBI criteria and financial benchmarks for an IPO!"
        financial_score = 90
    elif len(critical_issues) == 0 and len(warning_issues) <= 2:
        status = "ready"
        status_label = "IPO Ready (with minor concerns)"
        status_message = "Your company is eligible for IPO with some areas to address."
        financial_score = 75
    elif len(critical_issues) <= 1:
        status = "planning_required"
        status_label = "Requires 1-2 Years Planning"
        status_message = "You're on the path to IPO! Focus on addressing the identified gaps."
        financial_score = 50
    else:
        status = "not_eligible"
        status_label = "Not Yet Eligible"
        status_message = "Your company needs to strengthen its financials before considering an IPO."
        financial_score = 25
    
    # Blend governance score (60% financial, 40% governance)
    governance_score = governance.get("score", 0) if governance else 0
    if governance and governance.get("total", 0) > 0:
        score = round(financial_score * 0.6 + governance_score * 0.4)
        # Governance can downgrade status
        if governance_score < 40:
            issues.append({
                "type": "governance",
                "severity": "critical",
                "description": f"Governance score critically low ({governance_score}/100) - Major compliance gaps need immediate attention"
            })
            if status == "ready":
                status = "planning_required"
                status_label = "Requires Governance Improvements"
                status_message = "Financial metrics are strong but governance gaps need to be addressed before IPO."
        elif governance_score < 65:
            issues.append({
                "type": "governance",
                "severity": "warning",
                "description": f"Governance score moderate ({governance_score}/100) - Several compliance areas need improvement"
            })
    else:
        score = financial_score
    
    return {
        "status": status,
        "status_label": status_label,
        "status_message": status_message,
        "score": score,
        "financial_score": financial_score,
        "governance_score": governance_score,
        "issues": issues,
        "critical_count": len([i for i in issues if i["severity"] == "critical"]),
        "warning_count": len([i for i in issues if i["severity"] == "warning"])
    }





@router.post("/assessment/calculate")
async def run_ipo_assessment(
    data: IPOAssessmentRequest,
    user: User = Depends(get_current_user)
):
    """Run complete IPO Assessment with all 4 calculators"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    unit = data.company_info.reporting_unit
    
    # Convert all values to crores for calculations
    def to_cr(val):
        return convert_to_crores(val, unit)
    
    # Get latest year PAT for PE calculation
    latest_pat = to_cr(data.pl_data.year3_pat)
    avg_pe = (data.market_data.industry_pe + data.market_data.peer_pe) / 2
    
    # Calculate FCFE first (needed for DCF)
    fcfe_result = calculate_fcfe(
        net_income=latest_pat,
        depreciation=to_cr(data.balance_sheet.depreciation),
        capex=to_cr(data.balance_sheet.capital_expenditure),
        working_capital_change=to_cr(data.balance_sheet.working_capital_change)
    )
    
    # 1. PE Valuation
    pe_valuation = calculate_pe_valuation(latest_pat, avg_pe)
    
    # 2. DCF Valuation
    dcf_valuation = calculate_dcf_valuation(
        base_fcf=fcfe_result["fcfe"] if fcfe_result["fcfe"] > 0 else latest_pat * 0.6,
        growth_rate=data.projections.growth_rate,
        wacc=data.projections.wacc,
        terminal_growth=data.projections.terminal_growth
    )
    
    # 3. Issue Size Calculator
    avg_valuation = 0
    valid_valuations = []
    if pe_valuation.get("valuation", 0) > 0:
        valid_valuations.append(pe_valuation["valuation"])
    if dcf_valuation.get("valuation", 0) > 0:
        valid_valuations.append(dcf_valuation["valuation"])
    
    if valid_valuations:
        avg_valuation = sum(valid_valuations) / len(valid_valuations)
    
    issue_size = calculate_issue_size(
        valuation=avg_valuation,
        dilution_percent=data.dilution_percent,
        issue_type=data.issue_type
    )
    
    # 4. SEBI Eligibility Check
    eligibility = check_sebi_eligibility(data, unit)
    
    # 5. Governance/Compliance Score
    governance_result = calculate_governance_score(data.governance_compliance)
    
    # 6. Determine Readiness Status (now includes governance)
    readiness = determine_readiness_status(eligibility, pe_valuation, dcf_valuation, fcfe_result, governance_result)
    
    # Calculate suggested price band (10-15% discount)
    if avg_valuation > 0:
        price_band_low = avg_valuation * 0.85
        price_band_high = avg_valuation * 0.90
    else:
        price_band_low = 0
        price_band_high = 0
    
    # Generate AI-powered gap analysis
    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"assessment_{uuid.uuid4().hex[:8]}",
            system_message="""You are an expert Indian IPO advisor at SETU by IPO Labs. 
Your role is to analyze IPO readiness and provide actionable recommendations.
Only recommend services available on SETU platform:
1. DRHP Builder - For preparing Draft Red Herring Prospectus
2. The Match-Making Platform - For connecting with CAs, CSs, CFOs, legal experts
3. IPO Funding Module - For Pre-IPO and Post-IPO funding options
Do not recommend external services or competitors."""
        ).with_model("openai", "gpt-5.2")
        
        # Prepare context
        issues_text = "\n".join([f"- [{i['severity'].upper()}] {i['description']}" for i in readiness["issues"]])
        if not issues_text:
            issues_text = "No major issues identified."
        
        prompt = f"""Analyze this IPO readiness assessment for an Indian company:

Company: {data.company_info.company_type.replace('_', ' ').title()} targeting {data.company_info.target_board.upper()} listing

FINANCIAL HIGHLIGHTS:
- Latest Year PAT: ₹{latest_pat:.2f} Crores
- 3-Year Avg EBITDA: ₹{(to_cr(data.pl_data.year1_ebitda) + to_cr(data.pl_data.year2_ebitda) + to_cr(data.pl_data.year3_ebitda))/3:.2f} Crores
- FCFE: ₹{fcfe_result['fcfe']:.2f} Crores
- Net Worth (Latest): ₹{to_cr(data.balance_sheet.net_worth_y3):.2f} Crores

VALUATION:
- P/E Based: ₹{pe_valuation.get('valuation', 0):.2f} Crores
- DCF Based: ₹{dcf_valuation.get('valuation', 0):.2f} Crores
- Average: ₹{avg_valuation:.2f} Crores

ELIGIBILITY: {eligibility['board']}
- Passed: {eligibility['passed_count']}/{eligibility['total_checks']} criteria
- Eligible: {'Yes' if eligibility['eligible'] else 'No'}

GOVERNANCE/COMPLIANCE: {governance_result['score']}/100
- Positive answers: {governance_result['positive_count']}/{governance_result['total']}
- Flagged areas: {len(governance_result.get('flagged_items', []))} items need attention

ISSUES IDENTIFIED:
{issues_text}

READINESS SCORE: {readiness['score']}/100 ({readiness['status_label']})
(Financial: {readiness.get('financial_score', 0)}/100, Governance: {governance_result['score']}/100)

Provide a concise analysis (max 200 words) with:
1. Key strengths (2 bullet points)
2. Governance/compliance observations (1-2 bullet points)
3. Priority actions to improve readiness (2-3 bullet points)
4. Which SETU module to use first (DRHP Builder, Match Maker, or IPO Funding)

Use professional Indian financial terminology. Be direct and actionable."""

        ai_analysis = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        logger.error(f"AI analysis generation failed: {e}")
        ai_analysis = "AI analysis unavailable. Please consult with our experts through the Match Maker module for detailed guidance."
    
    # Store assessment result
    assessment_id = f"assess_{uuid.uuid4().hex[:12]}"
    assessment_doc = {
        "assessment_id": assessment_id,
        "user_id": user.user_id,
        "company_info": data.company_info.model_dump(),
        "input_data": {
            "pl_data": data.pl_data.model_dump(),
            "balance_sheet": data.balance_sheet.model_dump(),
            "projections": data.projections.model_dump(),
            "market_data": data.market_data.model_dump(),
            "governance_compliance": data.governance_compliance
        },
        "results": {
            "pe_valuation": pe_valuation,
            "dcf_valuation": dcf_valuation,
            "fcfe": fcfe_result,
            "issue_size": issue_size,
            "eligibility": eligibility,
            "readiness": readiness,
            "governance": governance_result
        },
        "ai_analysis": ai_analysis,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.ipo_assessments.insert_one(assessment_doc)
    await promote_new_user(user.user_id)
    
    return {
        "assessment_id": assessment_id,
        "company_info": {
            "type": data.company_info.company_type,
            "target_board": data.company_info.target_board,
            "reporting_unit": unit
        },
        "calculators": {
            "pe_valuation": pe_valuation,
            "dcf_valuation": dcf_valuation,
            "fcfe": fcfe_result,
            "issue_size": issue_size
        },
        "eligibility": eligibility,
        "readiness": readiness,
        "governance": governance_result,
        "valuation_summary": {
            "average_valuation": round(avg_valuation, 2),
            "suggested_price_band": {
                "low": round(price_band_low, 2),
                "high": round(price_band_high, 2)
            }
        },
        "ai_analysis": ai_analysis,
        "disclaimer": "This IPO Readiness Assessment is a preliminary analysis based on the information provided and SEBI's general guidelines. It is not a substitute for professional legal, financial, or accounting advice."
    }

@router.get("/assessment/history")
async def get_assessment_history(user: User = Depends(get_current_user)):
    """Get user's assessment history"""
    assessments = await db.ipo_assessments.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    return {"assessments": assessments}

@router.get("/assessment/{assessment_id}")
async def get_assessment_detail(
    assessment_id: str,
    user: User = Depends(get_current_user)
):
    """Get specific assessment details"""
    assessment = await db.ipo_assessments.find_one(
        {"assessment_id": assessment_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    return assessment
