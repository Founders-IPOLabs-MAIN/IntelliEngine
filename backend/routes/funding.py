from fastapi import APIRouter, HTTPException, Depends
from shared import (db, logger, User, get_current_user,
    datetime, timezone, uuid, os)
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# Pre-IPO Funding Options
PRE_IPO_FUNDING_OPTIONS = [
    {
        "id": "angel_seed",
        "name": "Angel & Seed Investment",
        "description": "Early-stage equity for scaling operations",
        "long_description": "Angel investors and seed funds provide initial capital to help MSMEs grow their business, build their team, and prepare for subsequent funding rounds. This is typically the first external funding a company receives.",
        "typical_amount": "₹25 Lakhs - ₹5 Crores",
        "timeline": "2-6 months",
        "icon": "Sparkles"
    },
    {
        "id": "venture_capital",
        "name": "Venture Capital (VC)",
        "description": "Institutional growth capital for high-potential MSMEs",
        "long_description": "VCs invest larger amounts in exchange for equity, bringing not just capital but strategic guidance, industry connections, and operational expertise to help scale rapidly.",
        "typical_amount": "₹5 Crores - ₹100 Crores",
        "timeline": "3-9 months",
        "icon": "TrendingUp"
    },
    {
        "id": "private_equity",
        "name": "Private Equity (PE)",
        "description": "Large-scale funding for restructuring or major expansion",
        "long_description": "PE firms invest in established companies looking for significant capital for expansion, acquisitions, or restructuring before going public. They often take board seats and actively participate in governance.",
        "typical_amount": "₹50 Crores - ₹500 Crores+",
        "timeline": "6-12 months",
        "icon": "Building2"
    },
    {
        "id": "bridge_financing",
        "name": "Bridge Financing",
        "description": "Short-term loans to cover expenses until IPO proceeds arrive",
        "long_description": "Bridge loans provide temporary funding to cover operational expenses, IPO-related costs, or working capital needs during the gap between IPO filing and actual fund receipt.",
        "typical_amount": "₹5 Crores - ₹50 Crores",
        "timeline": "1-3 months",
        "icon": "ArrowRightLeft"
    },
    {
        "id": "mezzanine",
        "name": "Mezzanine Funding",
        "description": "Hybrid debt-equity to strengthen balance sheet before DRHP filing",
        "long_description": "Mezzanine financing combines debt and equity features, often used to strengthen the company's financial position before filing the DRHP. It typically converts to equity or gets repaid from IPO proceeds.",
        "typical_amount": "₹10 Crores - ₹100 Crores",
        "timeline": "3-6 months",
        "icon": "Layers"
    },
    {
        "id": "pre_ipo_placement",
        "name": "Pre-IPO Placement",
        "description": "Selling shares to select investors at negotiated price before public issue",
        "long_description": "Companies can sell a portion of shares to institutional investors, HNIs, or strategic partners before the IPO at a negotiated price. This validates company valuation and creates momentum for the public offering.",
        "typical_amount": "₹25 Crores - ₹200 Crores",
        "timeline": "2-4 months",
        "icon": "Users"
    }
]

# Post-IPO Funding Options
POST_IPO_FUNDING_OPTIONS = [
    {
        "id": "fpo",
        "name": "Follow-on Public Offer (FPO)",
        "description": "Issuing additional shares to the public after initial listing",
        "long_description": "An FPO allows listed companies to raise additional capital by issuing new shares to the public. It's suitable when significant capital is needed and market conditions are favorable.",
        "typical_amount": "₹100 Crores - ₹1000 Crores+",
        "timeline": "4-8 months",
        "icon": "Repeat"
    },
    {
        "id": "rights_issue",
        "name": "Rights Issue",
        "description": "Offering existing shareholders the right to buy additional shares at a discount",
        "long_description": "Existing shareholders get the first right to purchase new shares proportionate to their holdings, typically at a discount to market price. This rewards loyal shareholders while raising capital.",
        "typical_amount": "₹50 Crores - ₹500 Crores",
        "timeline": "2-4 months",
        "icon": "Award"
    },
    {
        "id": "qip",
        "name": "Qualified Institutional Placement (QIP)",
        "description": "Raising capital quickly from institutional investors",
        "long_description": "QIP is a faster route for listed companies to raise capital from Qualified Institutional Buyers (QIBs) like mutual funds, insurance companies, and foreign institutional investors without the extensive paperwork of a public offer.",
        "typical_amount": "₹100 Crores - ₹2000 Crores",
        "timeline": "1-2 months",
        "icon": "Landmark"
    },
    {
        "id": "preferential_allotment",
        "name": "Preferential Allotment",
        "description": "Issuing shares to a specific group of investors on private placement basis",
        "long_description": "Companies can issue shares to specific investors (promoters, strategic investors, institutions) on preferential basis. Useful for bringing in strategic partners or strengthening promoter holding.",
        "typical_amount": "₹25 Crores - ₹200 Crores",
        "timeline": "1-3 months",
        "icon": "UserPlus"
    },
    {
        "id": "ncds",
        "name": "Debt via NCDs",
        "description": "Issuing Non-Convertible Debentures to raise long-term debt",
        "long_description": "NCDs are debt instruments that pay fixed interest and return principal at maturity. Listed companies can issue NCDs publicly or privately to raise debt capital without diluting equity.",
        "typical_amount": "₹50 Crores - ₹500 Crores",
        "timeline": "2-4 months",
        "icon": "FileText"
    }
]

# Funding Partners (Real Indian Partners)
FUNDING_PARTNERS = {
    "investment_banks": [
        {"name": "Kotak Mahindra Capital", "type": "Domestic", "description": "Leading investment bank for IPOs and M&A", "website": "www.investmentbank.kotak.com"},
        {"name": "ICICI Securities", "type": "Domestic", "description": "Full-service investment banking and brokerage", "website": "www.icicisecurities.com"},
        {"name": "Axis Capital", "type": "Domestic", "description": "IPO advisory and capital markets services", "website": "www.axiscapital.co.in"},
        {"name": "JM Financial", "type": "Domestic", "description": "Investment banking and wealth management", "website": "www.jmfl.com"},
        {"name": "SBI Capital Markets", "type": "Domestic", "description": "State Bank group's investment banking arm", "website": "www.sbicaps.com"},
        {"name": "Jefferies India", "type": "Global", "description": "Global investment bank with India presence", "website": "www.jefferies.com"},
        {"name": "Morgan Stanley India", "type": "Global", "description": "Leading global investment bank", "website": "www.morganstanley.com"},
        {"name": "JP Morgan India", "type": "Global", "description": "Global financial services leader", "website": "www.jpmorgan.com"},
        {"name": "Avendus Capital", "type": "Domestic", "description": "Technology-focused investment bank", "website": "www.avendus.com"},
        {"name": "Edelweiss Financial", "type": "Domestic", "description": "Diversified financial services", "website": "www.edelweiss.in"}
    ],
    "hni_networks": [
        {"name": "Indian Angel Network (IAN)", "type": "Angel Network", "description": "India's largest angel investor network with 198+ investments", "website": "www.indianangelnetwork.com"},
        {"name": "Mumbai Angels Network", "type": "Angel Network", "description": "750+ members, 200+ investments, 100+ exits", "website": "www.mumbaiangels.com"},
        {"name": "JITO Angel Network", "type": "Angel Network", "description": "450+ investors, ₹147+ crores invested", "website": "www.jitoangelnetwork.com"},
        {"name": "Hyderabad Angels", "type": "Angel Network", "description": "Early-stage funding with global investor network", "website": "www.hyderabadangels.in"},
        {"name": "Phoenix Angels", "type": "Angel Network", "description": "Not-for-profit angel network", "website": "www.phoenixangels.in"},
        {"name": "LetsVenture", "type": "Platform", "description": "India's largest angel investing platform", "website": "www.letsventure.com"},
        {"name": "Venture Catalysts", "type": "Incubator", "description": "Leading startup incubator and angel fund", "website": "www.venturecatalysts.in"},
        {"name": "ah! Ventures", "type": "Angel Fund", "description": "SEBI-registered angel fund", "website": "www.ahventures.in"}
    ],
    "sovereign_wealth_funds": [
        {"name": "Abu Dhabi Investment Authority (ADIA)", "type": "Sovereign Fund", "description": "One of the world's largest sovereign wealth funds, active in India", "website": "www.adia.ae"},
        {"name": "GIC (Singapore)", "type": "Sovereign Fund", "description": "Singapore's sovereign wealth fund with major India investments", "website": "www.gic.com.sg"},
        {"name": "Temasek Holdings", "type": "Sovereign Fund", "description": "Singapore investment company with significant India portfolio", "website": "www.temasek.com.sg"},
        {"name": "Mubadala Investment Company", "type": "Sovereign Fund", "description": "Abu Dhabi-based global investor", "website": "www.mubadala.com"},
        {"name": "Qatar Investment Authority", "type": "Sovereign Fund", "description": "Qatar's sovereign wealth fund", "website": "www.qia.qa"},
        {"name": "NIIF (National Investment & Infrastructure Fund)", "type": "Indian Sovereign", "description": "India's quasi-sovereign wealth fund for infrastructure", "website": "www.niifindia.in"},
        {"name": "Public Investment Fund (Saudi)", "type": "Sovereign Fund", "description": "Saudi Arabia's sovereign wealth fund", "website": "www.pif.gov.sa"}
    ],
    "banks": [
        {"name": "State Bank of India", "type": "Public Sector", "description": "India's largest bank with comprehensive MSME financing", "website": "www.sbi.co.in"},
        {"name": "HDFC Bank", "type": "Private Sector", "description": "Leading private bank with strong corporate banking", "website": "www.hdfcbank.com"},
        {"name": "ICICI Bank", "type": "Private Sector", "description": "Major private bank with investment banking capabilities", "website": "www.icicibank.com"},
        {"name": "Bank of Baroda", "type": "Public Sector", "description": "Large PSU bank with MSME focus", "website": "www.bankofbaroda.in"},
        {"name": "Axis Bank", "type": "Private Sector", "description": "Third-largest private sector bank", "website": "www.axisbank.com"},
        {"name": "Punjab National Bank", "type": "Public Sector", "description": "Major PSU bank with nationwide presence", "website": "www.pnbindia.in"},
        {"name": "Kotak Mahindra Bank", "type": "Private Sector", "description": "Full-service private bank", "website": "www.kotak.com"},
        {"name": "Yes Bank", "type": "Private Sector", "description": "Private bank with corporate focus", "website": "www.yesbank.in"}
    ]
}

# Quiz Questions for Eligibility
QUIZ_QUESTIONS = {
    "common": [
        {
            "id": "annual_revenue",
            "question": "What is your Annual Revenue (Current FY)?",
            "type": "single_choice",
            "options": [
                {"value": "less_5cr", "label": "< ₹5 Crores", "score": 10},
                {"value": "5_25cr", "label": "₹5 - 25 Crores", "score": 25},
                {"value": "25_100cr", "label": "₹25 - 100 Crores", "score": 40},
                {"value": "more_100cr", "label": "> ₹100 Crores", "score": 50}
            ]
        },
        {
            "id": "profitability",
            "question": "What is your Profitability Status (EBITDA)?",
            "type": "single_choice",
            "options": [
                {"value": "negative", "label": "Negative", "score": 5},
                {"value": "breakeven", "label": "Break-even", "score": 15},
                {"value": "positive_1yr", "label": "Positive for 1 year", "score": 30},
                {"value": "positive_3yr", "label": "Positive for 3+ years", "score": 50}
            ]
        },
        {
            "id": "operational_history",
            "question": "How many years has your company been operational?",
            "type": "single_choice",
            "options": [
                {"value": "less_1yr", "label": "Less than 1 year", "score": 5},
                {"value": "1_3yr", "label": "1-3 years", "score": 15},
                {"value": "3_5yr", "label": "3-5 years", "score": 30},
                {"value": "more_5yr", "label": "More than 5 years", "score": 50}
            ]
        },
        {
            "id": "existing_loans",
            "question": "Do you have any existing loans or debt?",
            "type": "single_choice",
            "options": [
                {"value": "no_debt", "label": "No debt", "score": 40},
                {"value": "low_debt", "label": "Yes, but manageable (<30% of revenue)", "score": 30},
                {"value": "moderate_debt", "label": "Yes, moderate (30-60% of revenue)", "score": 20},
                {"value": "high_debt", "label": "Yes, high (>60% of revenue)", "score": 10}
            ]
        }
    ],
    "pre_ipo": [
        {
            "id": "audit_status",
            "question": "Are your financials audited by a Peer-Reviewed Auditor?",
            "type": "single_choice",
            "options": [
                {"value": "yes", "label": "Yes", "score": 50},
                {"value": "in_progress", "label": "In Progress", "score": 25},
                {"value": "no", "label": "No", "score": 10}
            ]
        },
        {
            "id": "funding_goal",
            "question": "What is the primary purpose of funding?",
            "type": "single_choice",
            "options": [
                {"value": "working_capital", "label": "Working Capital", "score": 30},
                {"value": "debt_repayment", "label": "Debt Repayment", "score": 25},
                {"value": "capex", "label": "Capital Expenditure (CapEx)", "score": 35},
                {"value": "rd", "label": "Research & Development", "score": 40}
            ]
        }
    ],
    "post_ipo": [
        {
            "id": "current_listing",
            "question": "Where is your company currently listed?",
            "type": "single_choice",
            "options": [
                {"value": "nse_emerge", "label": "NSE Emerge", "score": 30},
                {"value": "bse_sme", "label": "BSE SME", "score": 30},
                {"value": "mainboard", "label": "NSE/BSE Mainboard", "score": 50}
            ]
        },
        {
            "id": "shareholding_pattern",
            "question": "Are the promoters' shares locked-in or pledged?",
            "type": "single_choice",
            "options": [
                {"value": "no_pledge", "label": "No, shares are free", "score": 50},
                {"value": "locked_in", "label": "Locked-in (regulatory)", "score": 35},
                {"value": "pledged", "label": "Yes, shares are pledged", "score": 15}
            ]
        }
    ]
}

# Funding Module Models
class FundingDisclaimerConsent(BaseModel):
    agreed: bool
    timestamp: str
    user_id: str

class ExpertConsultationRequest(BaseModel):
    funding_type: str  # pre_ipo/post_ipo
    funding_option_id: str
    preferred_date: str
    preferred_time: str
    company_name: str
    contact_name: str
    contact_email: str
    contact_phone: str
    notes: Optional[str] = None
    quiz_score: Optional[int] = None
    quiz_tier: Optional[str] = None

class QuizSubmission(BaseModel):
    funding_type: str  # pre_ipo/post_ipo
    answers: dict  # question_id -> answer_value

class AIFitmentRequest(BaseModel):
    funding_option_id: str
    funding_type: str
    annual_revenue: str
    current_debt: str
    funding_goal: str

# Funding Module Endpoints


# Funding Module Endpoints



@router.get("/funding/pre-ipo-options")
async def get_pre_ipo_options():
    """Get all Pre-IPO funding options"""
    return {"options": PRE_IPO_FUNDING_OPTIONS}

@router.get("/funding/post-ipo-options")
async def get_post_ipo_options():
    """Get all Post-IPO funding options"""
    return {"options": POST_IPO_FUNDING_OPTIONS}

@router.get("/funding/partners")
async def get_funding_partners(category: Optional[str] = None):
    """Get funding partners, optionally filtered by category"""
    if category and category in FUNDING_PARTNERS:
        return {"partners": {category: FUNDING_PARTNERS[category]}}
    return {"partners": FUNDING_PARTNERS}

@router.get("/funding/quiz-questions")
async def get_quiz_questions(funding_type: str = "pre_ipo"):
    """Get quiz questions based on funding type"""
    questions = QUIZ_QUESTIONS["common"].copy()
    if funding_type == "pre_ipo":
        questions.extend(QUIZ_QUESTIONS["pre_ipo"])
    else:
        questions.extend(QUIZ_QUESTIONS["post_ipo"])
    return {"questions": questions, "funding_type": funding_type}

@router.post("/funding/quiz-evaluate")
async def evaluate_quiz(
    submission: QuizSubmission,
    user: User = Depends(get_current_user)
):
    """Evaluate quiz answers and return eligibility score with AI analysis"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Calculate base score
    total_score = 0
    max_possible = 0
    answer_details = []
    
    # Get questions for this funding type
    questions = QUIZ_QUESTIONS["common"].copy()
    if submission.funding_type == "pre_ipo":
        questions.extend(QUIZ_QUESTIONS["pre_ipo"])
    else:
        questions.extend(QUIZ_QUESTIONS["post_ipo"])
    
    # Calculate score
    for question in questions:
        q_id = question["id"]
        if q_id in submission.answers:
            answer_value = submission.answers[q_id]
            for option in question["options"]:
                if option["value"] == answer_value:
                    total_score += option["score"]
                    answer_details.append({
                        "question": question["question"],
                        "answer": option["label"],
                        "score": option["score"]
                    })
                    break
        max_possible += max(opt["score"] for opt in question["options"])
    
    # Normalize score to 0-100
    normalized_score = int((total_score / max_possible) * 100) if max_possible > 0 else 0
    
    # Determine tier
    if normalized_score >= 80:
        tier = "high_readiness"
        tier_label = "High Readiness"
        tier_message = "You are highly eligible! We are fast-tracking you to our Senior IPO Consultant."
        tier_action = "vip_booking"
    elif normalized_score >= 50:
        tier = "potentially_ready"
        tier_label = "Potentially Ready"
        tier_message = "You have a strong foundation. A discovery call will help bridge the gaps."
        tier_action = "standard_booking"
    else:
        tier = "early_stage"
        tier_label = "Early Stage"
        tier_message = "You're on the right track! We recommend our 'IPO Preparation Toolkit' before your first consultation."
        tier_action = "toolkit_download"
    
    # Generate AI Profile Summary
    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"quiz_eval_{uuid.uuid4().hex[:8]}",
            system_message="You are an IPO funding expert. Generate a brief, professional profile summary based on the quiz responses."
        ).with_model("openai", "gpt-5.2")
        
        answers_text = "\n".join([f"- {d['question']}: {d['answer']}" for d in answer_details])
        prompt = f"""Based on these quiz responses for {submission.funding_type.replace('_', '-').upper()} funding eligibility:

{answers_text}

Overall Score: {normalized_score}/100 (Tier: {tier_label})

Generate a 3-4 sentence professional summary for our IPO consultant. Include:
1. Key financial strengths
2. Potential areas to address
3. Recommended funding approach

Keep it concise and actionable."""

        ai_summary = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        logger.error(f"AI summary generation failed: {e}")
        ai_summary = f"Company has scored {normalized_score}/100 in {submission.funding_type.replace('_', '-').upper()} funding eligibility assessment. Based on the responses, the company falls in the '{tier_label}' category."
    
    # Store quiz result
    quiz_result = {
        "quiz_id": f"quiz_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "funding_type": submission.funding_type,
        "answers": submission.answers,
        "score": normalized_score,
        "tier": tier,
        "ai_summary": ai_summary,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.funding_quiz_results.insert_one(quiz_result)
    
    return {
        "score": normalized_score,
        "tier": tier,
        "tier_label": tier_label,
        "tier_message": tier_message,
        "tier_action": tier_action,
        "answer_details": answer_details,
        "ai_summary": ai_summary,
        "quiz_id": quiz_result["quiz_id"]
    }

@router.post("/funding/ai-fitment")
async def calculate_ai_fitment(
    request: AIFitmentRequest,
    user: User = Depends(get_current_user)
):
    """AI Funding Fitment Calculator - Quick 3-question analysis"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Find the funding option details
    all_options = PRE_IPO_FUNDING_OPTIONS + POST_IPO_FUNDING_OPTIONS
    funding_option = next((opt for opt in all_options if opt["id"] == request.funding_option_id), None)
    
    if not funding_option:
        raise HTTPException(status_code=404, detail="Funding option not found")
    
    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"fitment_{uuid.uuid4().hex[:8]}",
            system_message="You are an expert IPO funding advisor. Provide quick, accurate funding fitment analysis."
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""Analyze funding fitment for:

Funding Type: {funding_option['name']}
Description: {funding_option['long_description']}
Typical Amount: {funding_option['typical_amount']}

Company Details:
- Annual Revenue: {request.annual_revenue}
- Current Debt Level: {request.current_debt}
- Funding Goal: {request.funding_goal}

Provide:
1. A probability score (0-100) of successfully securing this type of funding
2. A 2-sentence explanation
3. One key recommendation

Respond in JSON format:
{{"probability_score": 75, "explanation": "...", "recommendation": "..."}}"""

        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse response
        import json
        import re
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            result = json.loads(json_match.group())
        else:
            result = {
                "probability_score": 65,
                "explanation": "Based on your profile, you have moderate eligibility for this funding type.",
                "recommendation": "Consider scheduling a consultation for personalized advice."
            }
        
        # Log the fitment calculation
        await db.funding_fitment_logs.insert_one({
            "log_id": f"fit_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            "funding_option_id": request.funding_option_id,
            "probability_score": result["probability_score"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "funding_option": funding_option["name"],
            "probability_score": result["probability_score"],
            "explanation": result["explanation"],
            "recommendation": result["recommendation"]
        }
        
    except Exception as e:
        logger.error(f"AI fitment calculation failed: {e}")
        return {
            "funding_option": funding_option["name"],
            "probability_score": 60,
            "explanation": "Based on the provided information, you have moderate eligibility for this funding type.",
            "recommendation": "We recommend scheduling a consultation with our expert team for a detailed assessment."
        }

@router.post("/funding/book-consultation")
async def book_funding_consultation(
    request: ExpertConsultationRequest,
    user: User = Depends(get_current_user)
):
    """Book a consultation with IPO funding expert"""
    consultation_id = f"fcons_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    # Find the funding option details
    all_options = PRE_IPO_FUNDING_OPTIONS + POST_IPO_FUNDING_OPTIONS
    funding_option = next((opt for opt in all_options if opt["id"] == request.funding_option_id), None)
    
    consultation_doc = {
        "consultation_id": consultation_id,
        "user_id": user.user_id,
        "funding_type": request.funding_type,
        "funding_option_id": request.funding_option_id,
        "funding_option_name": funding_option["name"] if funding_option else request.funding_option_id,
        "preferred_date": request.preferred_date,
        "preferred_time": request.preferred_time,
        "company_name": request.company_name,
        "contact_name": request.contact_name,
        "contact_email": request.contact_email,
        "contact_phone": request.contact_phone,
        "notes": request.notes,
        "quiz_score": request.quiz_score,
        "quiz_tier": request.quiz_tier,
        "status": "requested",  # requested/confirmed/completed/cancelled
        "created_at": now.isoformat()
    }
    
    await db.funding_consultations.insert_one(consultation_doc)
    
    # In a real system, this would trigger email/SMS notifications
    # For now, we'll simulate a confirmation
    
    return {
        "consultation_id": consultation_id,
        "message": "Consultation request submitted successfully! Our team will confirm within 24 hours.",
        "confirmation": {
            "date": request.preferred_date,
            "time": request.preferred_time,
            "funding_topic": funding_option["name"] if funding_option else request.funding_option_id,
            "status": "Pending Confirmation"
        }
    }

@router.post("/funding/disclaimer-consent")
async def record_disclaimer_consent(
    consent: FundingDisclaimerConsent,
    user: User = Depends(get_current_user)
):
    """Record user's consent to funding disclaimer"""
    consent_doc = {
        "consent_id": f"consent_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "agreed": consent.agreed,
        "timestamp": consent.timestamp,
        "ip_address": None,  # Would capture in production
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.funding_consents.insert_one(consent_doc)
    
    return {"message": "Consent recorded successfully", "consent_id": consent_doc["consent_id"]}

@router.get("/funding/available-slots")
async def get_available_slots(date: str):
    """Get available consultation slots for a given date (mocked)"""
    # Mocked available slots
    base_slots = [
        "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
        "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
    ]
    
    # Check for already booked slots on this date
    booked = await db.funding_consultations.find(
        {"preferred_date": date, "status": {"$in": ["requested", "confirmed"]}},
        {"preferred_time": 1, "_id": 0}
    ).to_list(100)
    
    booked_times = [b["preferred_time"] for b in booked]
    available_slots = [slot for slot in base_slots if slot not in booked_times]
    
    return {"date": date, "available_slots": available_slots}
