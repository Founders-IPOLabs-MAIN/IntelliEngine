from fastapi import APIRouter, HTTPException, Depends
from shared import (db, logger, User, get_current_user, log_audit_action,
    datetime, timezone, uuid)

router = APIRouter()

# Pre-IPO Tracker
PRE_IPO_SECTIONS = {
    "corporate_governance": {
        "name": "Corporate Structure & Governance",
        "items": [
            {"id": "public_ltd", "label": "Company incorporated as Public Limited Company"},
            {"id": "aoa_amended", "label": "Articles of Association amended for IPO compliance"},
            {"id": "board_constituted", "label": "Board properly constituted"},
            {"id": "independent_directors", "label": "Minimum number of Independent Directors appointed"},
            {"id": "woman_director", "label": "Woman Director appointed"},
            {"id": "audit_committee", "label": "Audit Committee constituted"},
            {"id": "nomination_committee", "label": "Nomination & Remuneration Committee constituted"},
            {"id": "stakeholders_committee", "label": "Stakeholders Relationship Committee constituted"},
            {"id": "csr_committee", "label": "CSR Committee constituted (if applicable)"},
            {"id": "insider_trading", "label": "Insider Trading Policy implemented"},
            {"id": "code_of_conduct", "label": "Code of Conduct adopted"},
            {"id": "rpt_policy", "label": "Related Party Transaction Policy adopted"}
        ]
    },
    "capital_readiness": {
        "name": "Capital Structure Readiness",
        "items": [
            {"id": "authorized_capital", "label": "Authorized capital adequate for IPO"},
            {"id": "dematerialization", "label": "Dematerialization of 100% share capital"},
            {"id": "isin", "label": "ISIN obtained"},
            {"id": "share_reconciled", "label": "Share certificates reconciled"},
            {"id": "no_pending_transfers", "label": "No pending share transfers"},
            {"id": "esop_compliant", "label": "ESOP scheme compliant"},
            {"id": "convertible_disclosures", "label": "Convertible securities disclosures prepared"},
            {"id": "promoter_shareholding", "label": "Promoter shareholding verified"},
            {"id": "promoter_lockin", "label": "Promoter lock-in calculation completed"},
            {"id": "cap_table", "label": "Cap table finalized (Pre-IPO)"}
        ]
    },
    "financial_readiness": {
        "name": "Financial Readiness",
        "items": [
            {"id": "restated_financials", "label": "Restated financial statements (3 years) completed"},
            {"id": "audit_qualifications", "label": "Audit qualifications resolved"},
            {"id": "internal_controls", "label": "Internal Financial Controls documented"},
            {"id": "rpt_reconciled", "label": "Related party transactions reconciled"},
            {"id": "loans_guarantees", "label": "Outstanding loans & guarantees disclosed"},
            {"id": "working_capital", "label": "Working capital assessment completed"},
            {"id": "debt_agreements", "label": "Debt agreements reviewed for IPO restrictions"},
            {"id": "contingent_liabilities", "label": "Contingent liabilities quantified"},
            {"id": "tax_litigations", "label": "Tax litigations reconciled"},
            {"id": "mda_draft", "label": "MD&A draft prepared"}
        ]
    },
    "legal_regulatory": {
        "name": "Legal & Regulatory",
        "items": [
            {"id": "material_contracts", "label": "All material contracts compiled"},
            {"id": "litigation_tracker", "label": "Litigation tracker prepared"},
            {"id": "regulatory_approvals", "label": "Regulatory approvals list prepared"},
            {"id": "ip_verified", "label": "Intellectual property verified"},
            {"id": "title_documents", "label": "Title documents for properties verified"},
            {"id": "environmental_compliance", "label": "Environmental compliance review done"},
            {"id": "labour_compliance", "label": "Labour law compliance verified"},
            {"id": "no_wilful_defaulter", "label": "No wilful defaulter declaration"},
            {"id": "no_sebi_debarment", "label": "No SEBI debarment confirmations"},
            {"id": "roc_filings", "label": "ROC filings up to date"}
        ]
    },
    "promoter_disclosures": {
        "name": "Promoter & Management Disclosures",
        "items": [
            {"id": "promoter_kyc", "label": "Promoter PAN & KYC collected"},
            {"id": "din_verification", "label": "DIN verification completed"},
            {"id": "director_disclosures", "label": "Director disclosures under Companies Act collected"},
            {"id": "litigation_affidavits", "label": "Litigation affidavits obtained"},
            {"id": "networth_certificates", "label": "Net worth certificates (Promoters) obtained"},
            {"id": "remuneration_disclosures", "label": "Remuneration disclosures compiled"},
            {"id": "employment_agreements", "label": "Employment agreements reviewed"},
            {"id": "directorship_crosscheck", "label": "Directorship cross-check completed"}
        ]
    },
    "business_operational": {
        "name": "Business & Operational Readiness",
        "items": [
            {"id": "industry_report", "label": "Industry report commissioned"},
            {"id": "business_model", "label": "Business model documented"},
            {"id": "top_customers_suppliers", "label": "Top 10 customers & suppliers identified"},
            {"id": "revenue_concentration", "label": "Revenue concentration analysis completed"},
            {"id": "operational_kpis", "label": "Operational KPIs defined"},
            {"id": "risk_factor_workshop", "label": "Risk factor workshop conducted"},
            {"id": "esg_disclosures", "label": "ESG & sustainability disclosures prepared"},
            {"id": "cybersecurity_audit", "label": "Data protection & cybersecurity audit completed"}
        ]
    },
    "ipo_intermediaries": {
        "name": "IPO Structure & Intermediaries",
        "items": [
            {"id": "lead_manager", "label": "Lead Manager appointed"},
            {"id": "legal_counsel", "label": "Legal Counsel appointed"},
            {"id": "registrar", "label": "Registrar to the Issue appointed"},
            {"id": "bankers", "label": "Bankers to the Issue appointed"},
            {"id": "peer_review_auditor", "label": "Peer Review Auditor appointed"},
            {"id": "objects_of_issue", "label": "Draft Objects of Issue finalized"},
            {"id": "capital_structure_approved", "label": "Draft capital structure approved by Board"},
            {"id": "listing_application", "label": "In-principle listing application prepared"}
        ]
    },
    "drhp_drafting": {
        "name": "DRHP Drafting Status",
        "items": [
            {"id": "risk_factors", "label": "Risk Factors"},
            {"id": "capital_structure", "label": "Capital Structure"},
            {"id": "business_overview", "label": "Business Overview"},
            {"id": "financial_info", "label": "Financial Information"},
            {"id": "management", "label": "Management"},
            {"id": "promoter_details", "label": "Promoter Details"},
            {"id": "litigation", "label": "Litigation"},
            {"id": "objects_of_issue_section", "label": "Objects of Issue"}
        ]
    },
    "pre_filing": {
        "name": "Final Pre-Filing Confirmation",
        "items": [
            {"id": "disclosures_verified", "label": "All disclosures verified by Promoters"},
            {"id": "legal_dd", "label": "Legal Due Diligence completed"},
            {"id": "financial_dd", "label": "Financial Due Diligence completed"},
            {"id": "board_approved", "label": "DRHP internally approved by Board"},
            {"id": "annexures", "label": "Annexures to DRHP"},
            {"id": "sebi_version", "label": "SEBI filing version finalized"},
            {"id": "stock_exchange_consultation", "label": "Stock exchange pre-consultation done"}
        ]
    }
}





@router.get("/projects/{project_id}/pre-ipo-tracker")
async def get_pre_ipo_tracker(
    project_id: str,
    user: User = Depends(get_current_user)
):
    """Get Pre-IPO Tracker for a project"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    tracker = await db.pre_ipo_tracker.find_one(
        {"project_id": project_id},
        {"_id": 0}
    )
    
    total_items = sum(len(s["items"]) for s in PRE_IPO_SECTIONS.values())
    completed_items = 0
    
    if tracker and tracker.get("items"):
        for item_id, item_data in tracker.get("items", {}).items():
            if item_data.get("status") == "Yes":
                completed_items += 1
    
    return {
        "project_id": project_id,
        "sections": PRE_IPO_SECTIONS,
        "items": tracker.get("items", {}) if tracker else {},
        "general_info": tracker.get("general_info", {}) if tracker else {},
        "stats": {
            "total": total_items,
            "completed": completed_items,
            "in_progress": sum(1 for item in (tracker.get("items", {}) if tracker else {}).values() if item.get("status") == "In Progress"),
            "pending": total_items - completed_items
        },
        "last_updated": tracker.get("updated_at") if tracker else None
    }

@router.post("/projects/{project_id}/pre-ipo-tracker")
async def save_pre_ipo_tracker(
    project_id: str,
    data: dict,
    user: User = Depends(get_current_user)
):
    """Save Pre-IPO Tracker"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    total_items = sum(len(s["items"]) for s in PRE_IPO_SECTIONS.values())
    completed_items = 0
    
    for item_data in data.get("items", {}).values():
        if item_data.get("status") == "Yes":
            completed_items += 1
    
    tracker_doc = {
        "project_id": project_id,
        "general_info": data.get("general_info", {}),
        "items": data.get("items", {}),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user.user_id
    }
    
    await db.pre_ipo_tracker.update_one(
        {"project_id": project_id},
        {"$set": tracker_doc},
        upsert=True
    )
    
    # Update checklist status
    await db.checklists.update_one(
        {"project_id": project_id, "type": "pre_ipo"},
        {"$set": {
            "total_items": total_items,
            "completed_items": completed_items,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    await log_audit_action(user.user_id, "update", "pre_ipo_tracker", f"Updated Pre-IPO Tracker for {project_id}")
    
    return {
        "message": "Pre-IPO Tracker saved",
        "stats": {
            "total": total_items,
            "completed": completed_items,
            "pending": total_items - completed_items
        }
    }

# Non-DRHP Tracker
NON_DRHP_SECTIONS = {
    "corporate_restructuring": {
        "name": "Corporate Restructuring & Housekeeping",
        "items": [
            {"id": "demat_shares", "label": "Demat of shares (converting physical share certificates to demat form for all existing shareholders)"},
            {"id": "share_capital_split", "label": "Consolidation or splitting of share capital (face value changes, e.g. splitting ₹10 FV to ₹2 FV)"},
            {"id": "convert_instruments", "label": "Conversion of any outstanding CCDs, OCDs, warrants, or other convertible instruments into equity"},
            {"id": "cancel_esops", "label": "Cancellation or buy-back of any outstanding ESOPs that are underwater or problematic"},
            {"id": "regularize_allotments", "label": "Regularizing any past allotments that were done informally or without proper board/shareholder resolutions"}
        ]
    },
    "legal_compliance": {
        "name": "Legal & Compliance Clean-up",
        "items": [
            {"id": "regulatory_approvals", "label": "Obtaining missing/lapsed regulatory approvals and licenses"},
            {"id": "resolve_litigation", "label": "Resolving pending litigation or disclosing/settling material disputes"},
            {"id": "roc_filings", "label": "Clearing any ROC filing backlogs or rectifying past non-compliances"},
            {"id": "material_contracts", "label": "Getting all material contracts formally executed and stamped"},
            {"id": "trademark_ip", "label": "Trademark and IP registrations (if not already done)"},
            {"id": "subsidiary_compliance", "label": "Ensuring all subsidiary/associate companies are properly incorporated and compliant"}
        ]
    },
    "corporate_governance": {
        "name": "Corporate Governance Upgrades",
        "items": [
            {"id": "reconstitute_board", "label": "Reconstituting the Board — inducting Independent Directors (minimum required under SEBI/Companies Act)"},
            {"id": "form_committees", "label": "Forming mandatory committees: Audit, Nomination & Remuneration, Stakeholder Relationship, Risk Management"},
            {"id": "appoint_cs", "label": "Appointing a qualified Company Secretary (CS) as KMP if not already present"},
            {"id": "appoint_cfo", "label": "Appointing a CFO as KMP (if not already formalized)"},
            {"id": "new_aoa", "label": "Adopting a new Articles of Association aligned with listed company requirements"},
            {"id": "code_of_conduct", "label": "Implementing a Code of Conduct for Directors and senior management"},
            {"id": "insider_trading_policy", "label": "Setting up insider trading prevention policies (SEBI PIT Regulations compliance)"}
        ]
    },
    "financial_accounting": {
        "name": "Financial & Accounting",
        "items": [
            {"id": "restate_financials", "label": "Restating financials if required (change in accounting policies, Ind AS adoption if not done)"},
            {"id": "audited_financials", "label": "Getting audited financials for the required period (typically 3 years) from a SEBI-empanelled auditor"},
            {"id": "rpt_cleanup", "label": "Closing out related-party transactions that won't survive public scrutiny or restructuring them at arm's length"},
            {"id": "credit_ratings", "label": "Obtaining credit ratings (if raising debt alongside equity)"},
            {"id": "internal_controls", "label": "Setting up proper internal financial controls and getting them audited"}
        ]
    },
    "employee_esop": {
        "name": "Employee & ESOP Related",
        "items": [
            {"id": "esop_approval", "label": "Formalizing and getting shareholder approval for ESOP schemes under SEBI SBEB Regulations"},
            {"id": "employment_contracts", "label": "Issuing formal appointment letters, employment contracts, and NDAs to key employees"},
            {"id": "clear_obligations", "label": "Clearing any pending salary, PF, ESIC, gratuity obligations"}
        ]
    },
    "banking_accounts": {
        "name": "Banking & Accounts",
        "items": [
            {"id": "bank_accounts", "label": "Ensuring all bank accounts are in order, dormant accounts closed"},
            {"id": "npa_resolution", "label": "Resolving any NPA classifications or overdraft issues with lenders"},
            {"id": "lender_nocs", "label": "Obtaining NOCs from lenders for change in shareholding/management if required by loan covenants"}
        ]
    },
    "investor_relations": {
        "name": "Investor & Shareholder Relations",
        "items": [
            {"id": "amend_agreements", "label": "Negotiating and amending/terminating investor rights agreements (tag-along, drag-along, anti-dilution clauses) that are incompatible with listing"},
            {"id": "shareholder_approvals", "label": "Getting DRHP-related shareholder approvals via EGM/Postal Ballot (e.g. fresh issue size, ESOP scheme, AoA amendment, conversion of instruments)"},
            {"id": "investor_consent", "label": "Obtaining consent/NOC from major investors for the offer"}
        ]
    },
    "pre_ipo_transactions": {
        "name": "Pre-IPO Transactions (if applicable)",
        "items": [
            {"id": "pre_ipo_placement", "label": "Closing any pre-IPO placement rounds"},
            {"id": "acquisitions_divestments", "label": "Completing any acquisitions or divestments the company wants done before listing"}
        ]
    }
}

@router.get("/projects/{project_id}/non-drhp-tracker")
async def get_non_drhp_tracker(
    project_id: str,
    user: User = Depends(get_current_user)
):
    """Get Non-DRHP Tracker for a project"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    tracker = await db.non_drhp_tracker.find_one(
        {"project_id": project_id},
        {"_id": 0}
    )
    
    total_items = sum(len(s["items"]) for s in NON_DRHP_SECTIONS.values())
    completed_items = 0
    
    if tracker and tracker.get("items"):
        for item_id, item_data in tracker.get("items", {}).items():
            if item_data.get("status") == "Yes":
                completed_items += 1
    
    return {
        "project_id": project_id,
        "sections": NON_DRHP_SECTIONS,
        "items": tracker.get("items", {}) if tracker else {},
        "stats": {
            "total": total_items,
            "completed": completed_items,
            "in_progress": sum(1 for item in (tracker.get("items", {}) if tracker else {}).values() if item.get("status") == "In Progress"),
            "pending": total_items - completed_items
        },
        "last_updated": tracker.get("updated_at") if tracker else None
    }

@router.post("/projects/{project_id}/non-drhp-tracker")
async def save_non_drhp_tracker(
    project_id: str,
    data: dict,
    user: User = Depends(get_current_user)
):
    """Save Non-DRHP Tracker"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    total_items = sum(len(s["items"]) for s in NON_DRHP_SECTIONS.values())
    completed_items = 0
    
    for item_data in data.get("items", {}).values():
        if item_data.get("status") == "Yes":
            completed_items += 1
    
    tracker_doc = {
        "project_id": project_id,
        "items": data.get("items", {}),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user.user_id
    }
    
    await db.non_drhp_tracker.update_one(
        {"project_id": project_id},
        {"$set": tracker_doc},
        upsert=True
    )
    
    # Update checklist status
    await db.checklists.update_one(
        {"project_id": project_id, "type": "non_drhp"},
        {"$set": {
            "total_items": total_items,
            "completed_items": completed_items,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    await log_audit_action(user.user_id, "update", "non_drhp_tracker", f"Updated Non-DRHP Tracker for {project_id}")
    
    return {
        "message": "Non-DRHP Tracker saved",
        "stats": {
            "total": total_items,
            "completed": completed_items,
            "pending": total_items - completed_items
        }
    }
