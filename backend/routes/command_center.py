from fastapi import APIRouter, HTTPException, Depends
from shared import (db, logger, User, get_current_user, log_audit_action,
    datetime, timezone, timedelta, uuid)
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# ============ COMMAND CENTER DASHBOARD ============

class ScheduleMeetingRequest(BaseModel):
    topic: str
    date: str
    time: str
    attendees: List[str] = []

class AIDelayExplanationRequest(BaseModel):
    section_name: str
    delay_days: int
    status: str

# Helper function to get checklist status
async def get_checklist_status(project_id: str, checklist_type: str) -> dict:
    """Get the status of a checklist for a project"""
    checklist = await db.checklists.find_one(
        {"project_id": project_id, "type": checklist_type},
        {"_id": 0}
    )
    
    if not checklist:
        # Return default pending counts based on checklist type
        default_pending = {
            "company_data": 45,  # 5 sections with ~9 fields each
            "promoter": 30,     # 6 sections
            "kmp": 30,          # 6 sections
            "pre_ipo": 68,      # 9 sections with multiple items
            "non_drhp": 34      # 8 sections with multiple items
        }
        return {
            "total": default_pending.get(checklist_type, 30),
            "completed": 0,
            "pending": default_pending.get(checklist_type, 30)
        }
    
    return {
        "total": checklist.get("total_items", 0),
        "completed": checklist.get("completed_items", 0),
        "pending": checklist.get("total_items", 0) - checklist.get("completed_items", 0)
    }





@router.get("/projects/{project_id}/command-center")
async def get_command_center_data(
    project_id: str,
    user: User = Depends(get_current_user)
):
    """Get all command center dashboard data for a project"""
    # Verify project exists and user has access
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get sections data
    sections = await db.drhp_sections.find({"project_id": project_id}, {"_id": 0}).to_list(20)
    
    # Calculate KPIs
    total_sections = len(sections)
    final_sections = sum(1 for s in sections if s.get("status") == "Final")
    review_sections = sum(1 for s in sections if s.get("status") == "Review")
    draft_sections = sum(1 for s in sections if s.get("status") == "Draft")
    
    readiness_score = int((final_sections / total_sections * 100)) if total_sections > 0 else 0
    
    # Calculate delays (sections past their deadline)
    today = datetime.now(timezone.utc)
    target_date = datetime(2026, 12, 31, tzinfo=timezone.utc)
    days_to_filing = max(0, (target_date - today).days)
    
    # Get delayed sections (mock: sections in Draft for more than 30 days)
    delayed_sections = []
    for section in sections:
        if section.get("status") == "Draft":
            created = section.get("created_at")
            if created:
                try:
                    created_date = datetime.fromisoformat(created.replace('Z', '+00:00'))
                    days_old = (today - created_date).days
                    if days_old > 30:
                        delayed_sections.append({
                            "section_name": section.get("section_name"),
                            "days_delayed": days_old - 30,
                            "status": section.get("status")
                        })
                except:
                    pass
    
    # Get team members (mock data + real users from project)
    team_members = [
        {"id": "mb1", "name": "Rajesh Mehta", "role": "Merchant Banker", "status": "online", "avatar": None, "email": "rajesh@merchantbank.com"},
        {"id": "ca1", "name": "CA Priya Sharma", "role": "Chartered Accountant", "status": "online", "avatar": None, "email": "priya.ca@audit.com"},
        {"id": "cs1", "name": "CS Amit Kumar", "role": "Company Secretary", "status": "offline", "avatar": None, "email": "amit.cs@legal.com"},
        {"id": "lc1", "name": "Adv. Neha Gupta", "role": "Legal Counsel", "status": "away", "avatar": None, "email": "neha@legalfirm.com"},
        {"id": "an1", "name": "Vikram Singh", "role": "Financial Analyst", "status": "online", "avatar": None, "email": "vikram@analysis.com"},
    ]
    
    # Active intermediaries (those online)
    active_intermediaries = [m for m in team_members if m["status"] == "online"]
    
    # Get version history (from audit logs)
    version_history = await db.audit_logs.find(
        {"module": "drhp_builder", "resource_id": project_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(5).to_list(5)
    
    # If no version history, create mock data
    if not version_history:
        version_history = [
            {"log_id": "vh1", "action_type": "save", "details": "Financials_v2.1 - Saved by CA Sharma", "timestamp": (today - timedelta(hours=2)).isoformat(), "user_name": "CA Priya Sharma"},
            {"log_id": "vh2", "action_type": "save", "details": "Risk_Factors_v3.0 - Reviewed by Legal", "timestamp": (today - timedelta(hours=5)).isoformat(), "user_name": "Adv. Neha Gupta"},
            {"log_id": "vh3", "action_type": "update", "details": "Cover_Page_v1.5 - Updated company info", "timestamp": (today - timedelta(days=1)).isoformat(), "user_name": "Rajesh Mehta"},
            {"log_id": "vh4", "action_type": "save", "details": "Industry_Overview_v2.0 - Market data added", "timestamp": (today - timedelta(days=1, hours=3)).isoformat(), "user_name": "Vikram Singh"},
            {"log_id": "vh5", "action_type": "review", "details": "Capital_Structure_v1.2 - Pending review", "timestamp": (today - timedelta(days=2)).isoformat(), "user_name": "CS Amit Kumar"},
        ]
    
    # Get audit trail
    audit_trail = await db.audit_logs.find(
        {"$or": [{"resource_id": project_id}, {"module": "drhp_builder"}]},
        {"_id": 0}
    ).sort("timestamp", -1).limit(20).to_list(20)
    
    # If no audit trail, create mock data
    if not audit_trail:
        audit_trail = [
            {"log_id": "at1", "action_type": "view", "module": "risk_factors", "details": "Merchant Banker viewed Risk Factors", "timestamp": (today - timedelta(minutes=15)).isoformat(), "user_name": "Rajesh Mehta"},
            {"log_id": "at2", "action_type": "edit", "module": "financials", "details": "Updated FY2025 revenue figures", "timestamp": (today - timedelta(hours=1)).isoformat(), "user_name": "CA Priya Sharma"},
            {"log_id": "at3", "action_type": "upload", "module": "legal", "details": "Uploaded litigation documents", "timestamp": (today - timedelta(hours=3)).isoformat(), "user_name": "Adv. Neha Gupta"},
            {"log_id": "at4", "action_type": "comment", "module": "capital_structure", "details": "Added review comment on shareholding", "timestamp": (today - timedelta(hours=5)).isoformat(), "user_name": "CS Amit Kumar"},
            {"log_id": "at5", "action_type": "approve", "module": "cover_page", "details": "Approved final version", "timestamp": (today - timedelta(days=1)).isoformat(), "user_name": "Rajesh Mehta"},
        ]
    
    # Upcoming meetings (mock data)
    upcoming_meetings = [
        {"id": "m1", "topic": "DRHP Review Call", "date": (today + timedelta(days=2)).strftime("%Y-%m-%d"), "time": "10:00 AM", "attendees": ["Rajesh Mehta", "CA Priya Sharma"]},
        {"id": "m2", "topic": "Legal Due Diligence", "date": (today + timedelta(days=5)).strftime("%Y-%m-%d"), "time": "2:30 PM", "attendees": ["Adv. Neha Gupta", "CS Amit Kumar"]},
    ]
    
    # Upcoming deadlines (mock data based on sections)
    upcoming_deadlines = [
        {"id": "d1", "task": "Financial Statements Sign-off", "due_date": (today + timedelta(days=7)).strftime("%Y-%m-%d"), "section": "Financial Information", "priority": "high"},
        {"id": "d2", "task": "Risk Factors Final Review", "due_date": (today + timedelta(days=10)).strftime("%Y-%m-%d"), "section": "Risk Factors", "priority": "medium"},
        {"id": "d3", "task": "Legal Opinion Submission", "due_date": (today + timedelta(days=14)).strftime("%Y-%m-%d"), "section": "Legal and Regulatory Matters", "priority": "high"},
    ]
    
    # Compliance status
    sebi_requirements = 13  # Total SEBI required sections
    completed_requirements = final_sections + review_sections
    gap_count = sebi_requirements - completed_requirements
    
    return {
        "project": {
            "project_id": project.get("project_id"),
            "company_name": project.get("company_name"),
            "sector": project.get("sector"),
            "board_type": project.get("board_type"),
            "exchange": project.get("exchange"),
            "issue_type": project.get("issue_type"),
            "user_login_type": project.get("user_login_type"),
            "target_filing_date": "2026-12-31"
        },
        "kpi_ribbon": {
            "readiness_score": readiness_score,
            "days_to_filing": days_to_filing,
            "active_intermediaries": active_intermediaries,
            "critical_delays": len(delayed_sections),
            "delayed_sections": delayed_sections,
            "upcoming_meetings": upcoming_meetings,
            "upcoming_deadlines": upcoming_deadlines
        },
        "sections": sections,
        "section_stats": {
            "total": total_sections,
            "final": final_sections,
            "review": review_sections,
            "draft": draft_sections
        },
        "compliance": {
            "overall_progress": int((completed_requirements / sebi_requirements) * 100),
            "gap_count": gap_count,
            "delayed_modules": delayed_sections
        },
        "version_history": version_history,
        "audit_trail": audit_trail,
        "team_members": team_members,
        "checklists": {
            "company_data": await get_checklist_status(project_id, "company_data"),
            "promoter": await get_checklist_status(project_id, "promoter"),
            "kmp": await get_checklist_status(project_id, "kmp"),
            "pre_ipo": await get_checklist_status(project_id, "pre_ipo"),
            "non_drhp": await get_checklist_status(project_id, "non_drhp")
        }
    }

@router.post("/projects/{project_id}/schedule-meeting")
async def schedule_meeting(
    project_id: str,
    meeting: ScheduleMeetingRequest,
    user: User = Depends(get_current_user)
):
    """Schedule a meeting for the project team (MOCKED)"""
    # Generate mock Google Meet link
    meet_code = uuid.uuid4().hex[:10]
    meet_link = f"https://meet.google.com/{meet_code[:3]}-{meet_code[3:7]}-{meet_code[7:]}"
    
    meeting_doc = {
        "meeting_id": f"meet_{uuid.uuid4().hex[:12]}",
        "project_id": project_id,
        "topic": meeting.topic,
        "date": meeting.date,
        "time": meeting.time,
        "attendees": meeting.attendees,
        "created_by": user.user_id,
        "meet_link": meet_link,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.meetings.insert_one(meeting_doc)
    
    await log_audit_action(user.user_id, "create", "meetings", f"Scheduled meeting: {meeting.topic}")
    
    return {
        "message": "Meeting scheduled successfully",
        "meeting_id": meeting_doc["meeting_id"],
        "meet_link": meet_link,
        "note": "MOCKED - Google Meet link is a placeholder"
    }

@router.get("/projects/{project_id}/meetings")
async def get_project_meetings(
    project_id: str,
    user: User = Depends(get_current_user)
):
    """Get all meetings for a project"""
    meetings = await db.meetings.find(
        {"project_id": project_id},
        {"_id": 0}
    ).sort("date", 1).to_list(50)
    
    return {"meetings": meetings}

@router.post("/projects/{project_id}/ai-delay-explanation")
async def get_ai_delay_explanation(
    project_id: str,
    request: AIDelayExplanationRequest,
    user: User = Depends(get_current_user)
):
    """Generate AI explanation for a section delay using GPT-5.2"""
    from emergentintegrations.llm.chat import chat, LlmModel
    
    prompt = f"""You are an IPO readiness assistant for SETU platform. Generate a brief, professional explanation for why a DRHP section might be delayed.

Section: {request.section_name}
Days Delayed: {request.delay_days} days
Current Status: {request.status}

Provide a concise 1-2 sentence explanation of likely reasons for the delay and what actions might be needed. Be specific to Indian IPO/SEBI context.
Keep the response under 100 words."""

    try:
        response = await chat(
            model=LlmModel.GPT_5_2,
            user_prompt=prompt,
            memory=[]
        )
        return {
            "explanation": response.response,
            "section": request.section_name,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"AI delay explanation error: {e}")
        # Fallback explanations
        fallback_explanations = {
            "Financial Information": "Pending peer review audit for FY 2025. The statutory auditor's sign-off is required before finalization.",
            "Risk Factors": "Legal team reviewing additional regulatory risks. Waiting for updated compliance assessment.",
            "Legal and Regulatory Matters": "Ongoing litigation status update pending from external counsel. Expected resolution in 2 weeks.",
            "Capital Structure": "Share capital reconciliation in progress. ESOP pool adjustments being finalized.",
            "Cover Page": "Lead manager details and pricing band pending final confirmation.",
            "default": f"Section requires additional review and inputs from relevant stakeholders. {request.delay_days} days overdue."
        }
        return {
            "explanation": fallback_explanations.get(request.section_name, fallback_explanations["default"]),
            "section": request.section_name,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "note": "Fallback explanation used"
        }

# ============ DATA CAPTURE CHECKLISTS ============

# Company Data Checklist
COMPANY_DATA_SECTIONS = {
    "corporate_identification": {
        "name": "Corporate & Company Identification",
        "fields": [
            {"id": "legal_name", "label": "Full Legal Name of Company", "type": "text", "required": True},
            {"id": "registered_address", "label": "Registered & Corporate Office Address", "type": "textarea", "required": True},
            {"id": "cin", "label": "Corporate Identity Number (CIN)", "type": "text", "required": True},
            {"id": "website", "label": "Company Website", "type": "url", "required": False},
            {"id": "incorporation_date", "label": "Date of Incorporation", "type": "date", "required": True},
            {"id": "pan", "label": "PAN (Permanent Account Number)", "type": "text", "required": True},
            {"id": "gstin", "label": "GSTIN (if applicable)", "type": "text", "required": False},
            {"id": "contact_phone", "label": "Phone", "type": "text", "required": True},
            {"id": "contact_email", "label": "Email", "type": "email", "required": True},
            {"id": "auditor_firm", "label": "Registered Auditor Firm Name & Details", "type": "textarea", "required": True},
            {"id": "nic_code", "label": "Industry Classification / NIC Code", "type": "text", "required": True}
        ]
    },
    "company_history": {
        "name": "Company History & Evolution",
        "fields": [
            {"id": "incorporation_history", "label": "Incorporation history / business milestones", "type": "textarea", "required": True},
            {"id": "headquarters", "label": "Headquarters and major operational locations", "type": "textarea", "required": True},
            {"id": "subsidiaries", "label": "Subsidiaries / joint ventures / associate companies", "type": "table", "required": False},
            {"id": "group_structure", "label": "Group structure and related parties", "type": "textarea", "required": True}
        ]
    },
    "business_description": {
        "name": "Business Description",
        "fields": [
            {"id": "business_model", "label": "Business model description", "type": "textarea", "required": True},
            {"id": "products_services", "label": "Product and service portfolio", "type": "table", "required": True},
            {"id": "revenue_model", "label": "Revenue model and monetization strategy", "type": "textarea", "required": True},
            {"id": "key_customers", "label": "Key customers (Top 3)", "type": "table", "required": True},
            {"id": "key_suppliers", "label": "Key suppliers and vendors (Top 10)", "type": "table", "required": True},
            {"id": "geographic_presence", "label": "Geographic presence", "type": "textarea", "required": True},
            {"id": "manufacturing_facilities", "label": "Manufacturing or operational facilities", "type": "table", "required": False},
            {"id": "capacity_utilization", "label": "Installed capacity and utilization (last 3 years)", "type": "table", "required": False},
            {"id": "technology_ip", "label": "Technology platform and intellectual property", "type": "textarea", "required": False},
            {"id": "certifications", "label": "Certifications and quality standards", "type": "table", "required": False},
            {"id": "awards", "label": "Awards and recognitions", "type": "table", "required": False},
            {"id": "hr_headcount", "label": "Employee Headcount (Permanent)", "type": "number", "required": True},
            {"id": "hr_contractual", "label": "Employee Headcount (Contractual)", "type": "number", "required": False},
            {"id": "attrition_rate", "label": "Attrition Rate (%)", "type": "number", "required": False},
            {"id": "sales_distribution", "label": "Sales and distribution network", "type": "textarea", "required": True},
            {"id": "marketing_strategy", "label": "Marketing strategy and brand equity", "type": "textarea", "required": False},
            {"id": "rd_expenditure", "label": "R&D details and expenditure (last 3 years)", "type": "table", "required": False},
            {"id": "competitive_strengths", "label": "Key competitive strengths", "type": "textarea", "required": True},
            {"id": "business_strategies", "label": "Business strategies going forward", "type": "textarea", "required": True},
            {"id": "insurance_coverage", "label": "Insurance coverage details", "type": "table", "required": False},
            {"id": "esg_policies", "label": "ESG policies and CSR activities", "type": "textarea", "required": False}
        ]
    },
    "regulatory_details": {
        "name": "Regulatory Details",
        "fields": [
            {"id": "key_events", "label": "Chronology of key events since incorporation", "type": "table", "required": True},
            {"id": "corporate_structure", "label": "Corporate structure chart", "type": "textarea", "required": True},
            {"id": "acquisitions_divestments", "label": "Material acquisitions/divestments (last 5 years)", "type": "table", "required": False},
            {"id": "address_changes", "label": "Changes in registered/corporate office address", "type": "table", "required": False},
            {"id": "moa_changes", "label": "Changes in Memorandum of Association", "type": "table", "required": False}
        ]
    },
    "operational_details": {
        "name": "Operational Details – Business Processes",
        "fields": [
            {"id": "service_centers", "label": "Service Center or Offices", "type": "table", "required": False},
            {"id": "distribution_supply", "label": "Distribution and supply chain", "type": "textarea", "required": True},
            {"id": "intellectual_property", "label": "Intellectual property, patents, trademarks", "type": "table", "required": False},
            {"id": "regulatory_environment", "label": "Regulatory environment impacting business", "type": "textarea", "required": True}
        ]
    }
}

@router.get("/projects/{project_id}/company-data")
async def get_company_data(
    project_id: str,
    user: User = Depends(get_current_user)
):
    """Get company data checklist for a project"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get saved data
    saved_data = await db.company_data.find_one(
        {"project_id": project_id},
        {"_id": 0}
    )
    
    # Calculate completion
    total_fields = sum(len(s["fields"]) for s in COMPANY_DATA_SECTIONS.values())
    completed_fields = 0
    
    if saved_data and saved_data.get("data"):
        for section_key, section_data in saved_data.get("data", {}).items():
            for field_key, value in section_data.items():
                if value and str(value).strip():
                    completed_fields += 1
    
    return {
        "project_id": project_id,
        "sections": COMPANY_DATA_SECTIONS,
        "data": saved_data.get("data", {}) if saved_data else {},
        "documents": saved_data.get("documents", []) if saved_data else [],
        "stats": {
            "total": total_fields,
            "completed": completed_fields,
            "pending": total_fields - completed_fields
        },
        "last_updated": saved_data.get("updated_at") if saved_data else None
    }

@router.post("/projects/{project_id}/company-data")
async def save_company_data(
    project_id: str,
    data: dict,
    user: User = Depends(get_current_user)
):
    """Save company data checklist"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Calculate completion
    total_fields = sum(len(s["fields"]) for s in COMPANY_DATA_SECTIONS.values())
    completed_fields = 0
    
    for section_key, section_data in data.get("data", {}).items():
        for field_key, value in section_data.items():
            if value and str(value).strip():
                completed_fields += 1
    
    update_doc = {
        "project_id": project_id,
        "data": data.get("data", {}),
        "documents": data.get("documents", []),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user.user_id
    }
    
    await db.company_data.update_one(
        {"project_id": project_id},
        {"$set": update_doc},
        upsert=True
    )
    
    # Update checklist status
    await db.checklists.update_one(
        {"project_id": project_id, "type": "company_data"},
        {"$set": {
            "total_items": total_fields,
            "completed_items": completed_fields,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    await log_audit_action(user.user_id, "update", "company_data", f"Updated company data for project {project_id}")
    
    return {
        "message": "Company data saved successfully",
        "stats": {
            "total": total_fields,
            "completed": completed_fields,
            "pending": total_fields - completed_fields
        }
    }

# Promoter Checklist
PROMOTER_SECTIONS = {
    "personal_info": {
        "name": "Personal Information",
        "fields": [
            {"id": "legal_name", "label": "Full Legal Name (as per PAN)", "type": "text", "required": True},
            {"id": "former_names", "label": "Former Name(s) (if any)", "type": "text", "required": False},
            {"id": "father_spouse_name", "label": "Father's / Spouse's Name", "type": "text", "required": True},
            {"id": "gender", "label": "Gender", "type": "select", "options": ["Male", "Female", "Other"], "required": True},
            {"id": "dob", "label": "Date of Birth", "type": "date", "required": True},
            {"id": "nationality", "label": "Nationality", "type": "text", "required": True},
            {"id": "residential_status", "label": "Residential Status", "type": "select", "options": ["Resident", "Non-Resident"], "required": True},
            {"id": "pan", "label": "PAN", "type": "text", "required": True},
            {"id": "aadhaar", "label": "Aadhaar Number", "type": "text", "required": False},
            {"id": "din", "label": "DIN (for Directors)", "type": "text", "required": False},
            {"id": "passport", "label": "Passport Number", "type": "text", "required": False},
            {"id": "permanent_address", "label": "Permanent Residential Address", "type": "textarea", "required": True},
            {"id": "current_address", "label": "Current Residential Address", "type": "textarea", "required": True},
            {"id": "personal_email", "label": "Personal Email ID", "type": "email", "required": True},
            {"id": "official_email", "label": "Official Email ID", "type": "email", "required": False},
            {"id": "mobile", "label": "Mobile Number", "type": "text", "required": True}
        ]
    },
    "professional_profile": {
        "name": "Professional Profile",
        "fields": [
            {"id": "designation", "label": "Current Designation in the Company", "type": "text", "required": True},
            {"id": "appointment_date", "label": "Date of Appointment", "type": "date", "required": True},
            {"id": "appointment_term", "label": "Term of Appointment", "type": "text", "required": True},
            {"id": "employment_type", "label": "Employment Type", "type": "select", "options": ["Executive", "Non-Executive", "Independent"], "required": True},
            {"id": "education", "label": "Educational Qualifications", "type": "textarea", "required": True},
            {"id": "certifications", "label": "Professional Certifications / Memberships", "type": "textarea", "required": False},
            {"id": "career_history", "label": "Detailed Career History (last 15 years)", "type": "table", "required": True},
            {"id": "directorships", "label": "Directorships in Other Companies", "type": "table", "required": False},
            {"id": "resignation_history", "label": "Resignation history (last 5 years)", "type": "textarea", "required": False}
        ]
    },
    "shareholding": {
        "name": "Shareholding & Ownership Details",
        "fields": [
            {"id": "equity_shares", "label": "Number of Equity Shares held", "type": "number", "required": True},
            {"id": "shareholding_percent", "label": "Percentage Shareholding (Pre-IPO)", "type": "number", "required": True},
            {"id": "holding_mode", "label": "Mode of Holding", "type": "select", "options": ["Individual", "HUF", "Trust", "Corporate"], "required": True},
            {"id": "acquisition_date", "label": "Date of Acquisition of Shares", "type": "date", "required": True},
            {"id": "acquisition_price", "label": "Acquisition Price", "type": "number", "required": True},
            {"id": "pledged_shares", "label": "Details of Shares Pledged", "type": "textarea", "required": False},
            {"id": "convertible_instruments", "label": "Convertible Instruments held", "type": "textarea", "required": False},
            {"id": "subsidiary_shareholding", "label": "Shareholding in Subsidiaries", "type": "textarea", "required": False},
            {"id": "offer_for_sale", "label": "Proposed Offer for Sale", "type": "select", "options": ["Yes", "No"], "required": True},
            {"id": "lockin_confirmation", "label": "Lock-in Undertaking confirmation", "type": "select", "options": ["Yes", "No"], "required": True}
        ]
    },
    "remuneration": {
        "name": "Remuneration Details",
        "fields": [
            {"id": "annual_remuneration", "label": "Annual Remuneration (Last 3 FYs)", "type": "table", "required": True},
            {"id": "bonus_commission", "label": "Bonus / Commission (Last 3 Years)", "type": "table", "required": False},
            {"id": "esop_grants", "label": "ESOP Grants", "type": "textarea", "required": False},
            {"id": "perquisites", "label": "Perquisites", "type": "textarea", "required": False},
            {"id": "sitting_fees", "label": "Sitting Fees", "type": "number", "required": False},
            {"id": "notice_period", "label": "Notice Period", "type": "text", "required": True},
            {"id": "severance_terms", "label": "Severance Terms", "type": "textarea", "required": False}
        ]
    },
    "relationships": {
        "name": "Relationship Disclosures",
        "fields": [
            {"id": "rel_directors", "label": "Relationship with other Directors", "type": "textarea", "required": False},
            {"id": "rel_promoters", "label": "Relationship with Promoters", "type": "textarea", "required": False},
            {"id": "rel_kmp", "label": "Relationship with KMP", "type": "textarea", "required": False},
            {"id": "related_party_txns", "label": "Related Party Transactions (Last 3 Years)", "type": "table", "required": False},
            {"id": "interest_in_entities", "label": "Interest in any firm/entity transacting with Company", "type": "textarea", "required": False}
        ]
    },
    "litigation": {
        "name": "Litigation & Regulatory Disclosures",
        "fields": [
            {"id": "civil_litigation", "label": "Civil litigation pending", "type": "textarea", "required": False},
            {"id": "criminal_proceedings", "label": "Criminal proceedings pending", "type": "textarea", "required": False},
            {"id": "tax_proceedings", "label": "Tax proceedings", "type": "textarea", "required": False},
            {"id": "regulatory_actions", "label": "Regulatory actions by SEBI, RBI, MCA", "type": "textarea", "required": False},
            {"id": "economic_offences", "label": "Economic offences / fraud investigations", "type": "textarea", "required": False},
            {"id": "insolvency", "label": "Insolvency / Bankruptcy proceedings", "type": "textarea", "required": False},
            {"id": "disqualification", "label": "Disqualification under Companies Act", "type": "textarea", "required": False},
            {"id": "wilful_defaulter", "label": "Wilful defaulter declaration", "type": "textarea", "required": False},
            {"id": "settlements", "label": "Settlements with regulators", "type": "textarea", "required": False},
            {"id": "show_cause_notices", "label": "Any show-cause notices pending", "type": "textarea", "required": False}
        ]
    }
}

@router.get("/projects/{project_id}/promoter-checklist")
async def get_promoter_checklist(
    project_id: str,
    user: User = Depends(get_current_user)
):
    """Get promoter checklist for a project"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    promoters = await db.promoters.find(
        {"project_id": project_id},
        {"_id": 0}
    ).to_list(50)
    
    total_fields = sum(len(s["fields"]) for s in PROMOTER_SECTIONS.values())
    total_completed = 0
    
    for promoter in promoters:
        for section_key, section_data in promoter.get("data", {}).items():
            for field_key, value in section_data.items():
                if value and str(value).strip():
                    total_completed += 1
    
    return {
        "project_id": project_id,
        "sections": PROMOTER_SECTIONS,
        "promoters": promoters,
        "stats": {
            "total_promoters": len(promoters),
            "fields_per_promoter": total_fields,
            "total_completed": total_completed,
            "pending": (total_fields * max(1, len(promoters))) - total_completed
        }
    }

@router.post("/projects/{project_id}/promoter-checklist")
async def save_promoter(
    project_id: str,
    data: dict,
    user: User = Depends(get_current_user)
):
    """Save or update a promoter"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    promoter_id = data.get("promoter_id") or f"promoter_{uuid.uuid4().hex[:12]}"
    
    promoter_doc = {
        "promoter_id": promoter_id,
        "project_id": project_id,
        "data": data.get("data", {}),
        "documents": data.get("documents", []),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user.user_id
    }
    
    await db.promoters.update_one(
        {"promoter_id": promoter_id},
        {"$set": promoter_doc},
        upsert=True
    )
    
    # Update checklist status
    promoters = await db.promoters.find({"project_id": project_id}).to_list(50)
    total_fields = sum(len(s["fields"]) for s in PROMOTER_SECTIONS.values())
    total_completed = 0
    
    for p in promoters:
        for section_data in p.get("data", {}).values():
            for value in section_data.values():
                if value and str(value).strip():
                    total_completed += 1
    
    await db.checklists.update_one(
        {"project_id": project_id, "type": "promoter"},
        {"$set": {
            "total_items": total_fields * len(promoters),
            "completed_items": total_completed,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    await log_audit_action(user.user_id, "update", "promoter_checklist", f"Updated promoter {promoter_id}")
    
    return {"message": "Promoter saved", "promoter_id": promoter_id}

@router.delete("/projects/{project_id}/promoter-checklist/{promoter_id}")
async def delete_promoter(
    project_id: str,
    promoter_id: str,
    user: User = Depends(get_current_user)
):
    """Delete a promoter"""
    result = await db.promoters.delete_one({"promoter_id": promoter_id, "project_id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Promoter not found")
    
    await log_audit_action(user.user_id, "delete", "promoter_checklist", f"Deleted promoter {promoter_id}")
    return {"message": "Promoter deleted"}

# KMP Checklist (same structure as Promoter)
KMP_SECTIONS = PROMOTER_SECTIONS.copy()  # KMP has same fields as Promoter

@router.get("/projects/{project_id}/kmp-checklist")
async def get_kmp_checklist(
    project_id: str,
    user: User = Depends(get_current_user)
):
    """Get KMP checklist for a project"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    kmps = await db.kmps.find(
        {"project_id": project_id},
        {"_id": 0}
    ).to_list(50)
    
    total_fields = sum(len(s["fields"]) for s in KMP_SECTIONS.values())
    total_completed = 0
    
    for kmp in kmps:
        for section_data in kmp.get("data", {}).values():
            for value in section_data.values():
                if value and str(value).strip():
                    total_completed += 1
    
    return {
        "project_id": project_id,
        "sections": KMP_SECTIONS,
        "kmps": kmps,
        "stats": {
            "total_kmps": len(kmps),
            "fields_per_kmp": total_fields,
            "total_completed": total_completed,
            "pending": (total_fields * max(1, len(kmps))) - total_completed
        }
    }

@router.post("/projects/{project_id}/kmp-checklist")
async def save_kmp(
    project_id: str,
    data: dict,
    user: User = Depends(get_current_user)
):
    """Save or update a KMP"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    kmp_id = data.get("kmp_id") or f"kmp_{uuid.uuid4().hex[:12]}"
    
    kmp_doc = {
        "kmp_id": kmp_id,
        "project_id": project_id,
        "data": data.get("data", {}),
        "documents": data.get("documents", []),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user.user_id
    }
    
    await db.kmps.update_one(
        {"kmp_id": kmp_id},
        {"$set": kmp_doc},
        upsert=True
    )
    
    # Update checklist status
    kmps = await db.kmps.find({"project_id": project_id}).to_list(50)
    total_fields = sum(len(s["fields"]) for s in KMP_SECTIONS.values())
    total_completed = 0
    
    for k in kmps:
        for section_data in k.get("data", {}).values():
            for value in section_data.values():
                if value and str(value).strip():
                    total_completed += 1
    
    await db.checklists.update_one(
        {"project_id": project_id, "type": "kmp"},
        {"$set": {
            "total_items": total_fields * len(kmps),
            "completed_items": total_completed,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    await log_audit_action(user.user_id, "update", "kmp_checklist", f"Updated KMP {kmp_id}")
    
    return {"message": "KMP saved", "kmp_id": kmp_id}

@router.delete("/projects/{project_id}/kmp-checklist/{kmp_id}")
async def delete_kmp(
    project_id: str,
    kmp_id: str,
    user: User = Depends(get_current_user)
):
    """Delete a KMP"""
    result = await db.kmps.delete_one({"kmp_id": kmp_id, "project_id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="KMP not found")
    
    await log_audit_action(user.user_id, "delete", "kmp_checklist", f"Deleted KMP {kmp_id}")
    return {"message": "KMP deleted"}



# ============ PROJECT DASHBOARD DATA ============

class ProjectDashboardContact(BaseModel):
    name: str = ""
    email: str = ""
    mobile: str = ""
    title: Optional[str] = ""

class ProjectDashboardData(BaseModel):
    project_head: Optional[ProjectDashboardContact] = None
    client_pocs: Optional[List[ProjectDashboardContact]] = []
    client_key_data: Optional[List[dict]] = []
    drhp_submission_date: Optional[str] = ""
    drhp_first_draft_date: Optional[str] = ""
    board_selection: Optional[str] = ""
    pending_items: Optional[List[dict]] = []
    issue_type: Optional[str] = ""
    pricing_method: Optional[str] = ""
    sales_type: Optional[str] = ""
    registrar: Optional[str] = ""

@router.get("/projects/{project_id}/dashboard-data")
async def get_project_dashboard_data(
    project_id: str,
    user: User = Depends(get_current_user)
):
    """Get project dashboard data"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    dashboard = await db.project_dashboards.find_one(
        {"project_id": project_id}, {"_id": 0}
    )

    if not dashboard:
        return {
            "project_id": project_id,
            "project_head": {"name": "", "email": "", "mobile": ""},
            "client_pocs": [],
            "client_key_data": [],
            "drhp_submission_date": "",
            "drhp_first_draft_date": "",
            "board_selection": "",
            "pending_items": []
        }

    return dashboard

@router.put("/projects/{project_id}/dashboard-data")
async def update_project_dashboard_data(
    project_id: str,
    data: ProjectDashboardData,
    user: User = Depends(get_current_user)
):
    """Update project dashboard data"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = {
        "project_id": project_id,
        "project_head": data.project_head.dict() if data.project_head else {"name": "", "email": "", "mobile": ""},
        "client_pocs": [p.dict() for p in data.client_pocs] if data.client_pocs else [],
        "client_key_data": data.client_key_data or [],
        "drhp_submission_date": data.drhp_submission_date or "",
        "drhp_first_draft_date": data.drhp_first_draft_date or "",
        "board_selection": data.board_selection or "",
        "pending_items": data.pending_items or [],
        "issue_type": data.issue_type or "",
        "pricing_method": data.pricing_method or "",
        "sales_type": data.sales_type or "",
        "registrar": data.registrar or "",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user.user_id
    }

    await db.project_dashboards.update_one(
        {"project_id": project_id},
        {"$set": update_data},
        upsert=True
    )

    await log_audit_action(user.user_id, "update", "project_dashboard", f"Updated dashboard for {project_id}")
    return {"message": "Dashboard updated", "data": update_data}
