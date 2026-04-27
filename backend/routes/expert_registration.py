"""
Expert Registration, Premium Upgrade, Verification, and Browse endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from shared import (
    db, fs_bucket, logger, User, get_current_user,
    datetime, timezone, uuid, io, os, ObjectId
)
from pydantic import BaseModel
from typing import List, Optional
import json

router = APIRouter()

EXPERTISE_AREAS = [
    {"id": "ca_auditor", "label": "Chartered Accountant (CA) / Statutory Auditor"},
    {"id": "peer_review_auditor", "label": "Peer Review Auditor"},
    {"id": "tax_advisor", "label": "Tax Advisors"},
    {"id": "cfo", "label": "CFO (Chief Financial Officer)"},
    {"id": "company_secretary", "label": "Company Secretary (CS)"},
    {"id": "legal_advisor", "label": "Legal Advisors (Indian Counsel)"},
    {"id": "independent_director", "label": "Independent Directors"},
    {"id": "valuation_expert", "label": "Registered Valuation Expert (RV)"},
    {"id": "merchant_banker", "label": "Merchant Banker / BRLM"},
    {"id": "underwriter", "label": "Underwriters"},
    {"id": "rta", "label": "Registrar & Transfer Agent (RTA)"},
    {"id": "credit_rating", "label": "Credit Rating Agency (CRA) / Monitoring Agency"},
    {"id": "banker_to_issue", "label": "Bankers to the Issue"},
    {"id": "advertising_agency", "label": "Advertising Agency"},
    {"id": "market_maker", "label": "Market Maker (SME IPOs only)"},
]

VERIFICATION_FIELDS = {
    "ca_auditor": {
        "regulator": "ICAI | Chartered Accountants Act, 1949",
        "primary": [
            {"key": "icai_membership_no", "label": "ICAI Membership No.", "hint": "6-digit unique number"},
            {"key": "udin", "label": "UDIN", "hint": "18-character code"},
            {"key": "pan", "label": "PAN", "hint": "10-character alphanumeric"},
        ],
        "secondary": [
            {"key": "firm_frn", "label": "Firm Registration No. (FRN)", "hint": "ICAI firm identifier"},
            {"key": "peer_review_cert", "label": "Peer Review Certificate No.", "hint": "ICAI Peer Review Board"},
            {"key": "gst_no", "label": "GST No. (Firm)", "hint": "15-character GST number"},
        ],
    },
    "peer_review_auditor": {
        "regulator": "ICAI Peer Review Board",
        "primary": [
            {"key": "icai_membership_no", "label": "ICAI Membership No.", "hint": "6-digit unique number"},
            {"key": "re_number", "label": "RE Number (Reviewer Empanelment)", "hint": "PRB-assigned number"},
            {"key": "pan", "label": "PAN", "hint": "10-character alphanumeric"},
        ],
        "secondary": [
            {"key": "udin", "label": "UDIN", "hint": "18-character per document"},
            {"key": "gst_no", "label": "GST No.", "hint": "Reviewer's individual GST"},
        ],
    },
    "tax_advisor": {
        "regulator": "CA / Advocate / CMA — depends on qualification",
        "primary": [
            {"key": "professional_no", "label": "ICAI / ICSI / ICMAI / Bar Council No.", "hint": "Depends on qualification"},
            {"key": "pan", "label": "PAN", "hint": "10-character alphanumeric"},
            {"key": "gstin", "label": "GSTIN", "hint": "15-character GST number"},
        ],
        "secondary": [
            {"key": "firm_frn", "label": "Firm FRN / LLPIN / CIN", "hint": "If part of a firm"},
            {"key": "aadhaar", "label": "Aadhaar", "hint": "12-digit UID"},
        ],
    },
    "cfo": {
        "regulator": "Companies Act 2013 | MCA registered",
        "primary": [
            {"key": "din", "label": "DIN (Director Identification No.)", "hint": "8-digit MCA number"},
            {"key": "pan", "label": "PAN", "hint": "10-character alphanumeric"},
            {"key": "aadhaar", "label": "Aadhaar", "hint": "12-digit UID"},
        ],
        "secondary": [
            {"key": "icai_membership_no", "label": "ICAI Membership No.", "hint": "If CA-qualified"},
            {"key": "ecsin", "label": "eCSIN / KMP Filing Ref.", "hint": "MCA21 filing reference"},
        ],
    },
    "company_secretary": {
        "regulator": "ICSI | Company Secretaries Act, 1980",
        "primary": [
            {"key": "icsi_membership_no", "label": "ICSI Membership No.", "hint": "ACS-XXXXX or FCS-XXXXX"},
            {"key": "cp_no", "label": "Certificate of Practice (CP No.)", "hint": "CP/XXXX/YYYY"},
            {"key": "ecsin", "label": "eCSIN", "hint": "18-character alphanumeric"},
            {"key": "pan", "label": "PAN", "hint": "10-character alphanumeric"},
        ],
        "secondary": [
            {"key": "firm_registration", "label": "Firm Name / Registration", "hint": "ICSI firm registration"},
            {"key": "gst_no", "label": "GST No.", "hint": "15-character GST number"},
        ],
    },
    "legal_advisor": {
        "regulator": "Advocates Act, 1961 | Bar Council of India",
        "primary": [
            {"key": "bar_council_no", "label": "Bar Council Enrolment No.", "hint": "State Bar Council number"},
            {"key": "aibe_cert_no", "label": "AIBE Certificate No.", "hint": "All India Bar Exam"},
            {"key": "pan", "label": "PAN", "hint": "10-character alphanumeric"},
        ],
        "secondary": [
            {"key": "firm_cin", "label": "Law Firm CIN / LLPIN", "hint": "MCA registration"},
            {"key": "gst_no", "label": "GST No.", "hint": "15-character GST number"},
        ],
    },
    "independent_director": {
        "regulator": "Companies Act 2013 | IICA Databank",
        "primary": [
            {"key": "din", "label": "DIN (Director Identification No.)", "hint": "8-digit MCA number"},
            {"key": "iica_databank_id", "label": "IICA Databank ID", "hint": "Independent Director Databank"},
            {"key": "pan", "label": "PAN", "hint": "10-character alphanumeric"},
        ],
        "secondary": [
            {"key": "professional_membership", "label": "Professional Membership No.", "hint": "CA/CS/CMA if applicable"},
            {"key": "aadhaar", "label": "Aadhaar", "hint": "12-digit UID"},
        ],
    },
    "valuation_expert": {
        "regulator": "IBBI | Companies (RV & Valuation) Rules 2017",
        "primary": [
            {"key": "ibbi_reg_no", "label": "IBBI Registration No.", "hint": "IBBI/RV/XX/YYYY/ZZZZZ"},
            {"key": "rvo_membership_no", "label": "RVO Membership No.", "hint": "Registered Valuers Organisation"},
            {"key": "pan", "label": "PAN", "hint": "10-character alphanumeric"},
        ],
        "secondary": [
            {"key": "vrin", "label": "VRIN (Valuation Report ID No.)", "hint": "Per-report identifier"},
            {"key": "firm_cin", "label": "Firm CIN/LLPIN", "hint": "If practising as RVE"},
        ],
    },
    "merchant_banker": {
        "regulator": "SEBI (Merchant Bankers) Regulations 1992",
        "primary": [
            {"key": "sebi_reg_no", "label": "SEBI Registration No.", "hint": "INM000XXXXXX"},
            {"key": "cin", "label": "CIN", "hint": "MCA Corporate ID No."},
            {"key": "pan_entity", "label": "PAN (Entity)", "hint": "10-character alphanumeric"},
        ],
        "secondary": [
            {"key": "gst_no", "label": "GST No.", "hint": "15-character GST number"},
            {"key": "sebi_si_id", "label": "SEBI Intermediary Portal (SI) ID", "hint": "Online SI portal account"},
        ],
    },
    "underwriter": {
        "regulator": "SEBI (Underwriters) Regulations 1993",
        "primary": [
            {"key": "sebi_underwriter_reg", "label": "SEBI Underwriter Reg. No.", "hint": "SEBI-issued certificate"},
            {"key": "cin_pan", "label": "CIN / LLPIN / PAN", "hint": "Entity identifiers"},
        ],
        "secondary": [
            {"key": "sebi_mb_broker_reg", "label": "SEBI MB / Stock Broker Reg.", "hint": "INM... or INZ... format"},
            {"key": "gst_no", "label": "GST No.", "hint": "15-character GST number"},
        ],
    },
    "rta": {
        "regulator": "SEBI (R&I and STA) Regulations 1993",
        "primary": [
            {"key": "sebi_rta_reg", "label": "SEBI RTA Registration No.", "hint": "INR000XXXXXX"},
            {"key": "cin", "label": "CIN", "hint": "MCA Corporate ID No."},
            {"key": "pan_entity", "label": "PAN (Entity)", "hint": "10-character alphanumeric"},
        ],
        "secondary": [
            {"key": "dp_id", "label": "NSDL / CDSL DP ID", "hint": "Depository connectivity ID"},
            {"key": "gst_no", "label": "GST No.", "hint": "15-character GST number"},
        ],
    },
    "credit_rating": {
        "regulator": "SEBI (CRA) Regulations 1999",
        "primary": [
            {"key": "sebi_cra_reg", "label": "SEBI CRA Registration No.", "hint": "SEBI/CRA/XXX/YYYY"},
            {"key": "cin", "label": "CIN", "hint": "MCA Corporate ID No."},
            {"key": "pan_entity", "label": "PAN (Entity)", "hint": "10-character alphanumeric"},
        ],
        "secondary": [
            {"key": "rbi_ecai", "label": "RBI ECAI Accreditation", "hint": "External Credit Assessment Institution"},
            {"key": "gst_no", "label": "GST No.", "hint": "15-character GST number"},
        ],
    },
    "banker_to_issue": {
        "regulator": "SEBI (Bankers to an Issue) Regulations 1994",
        "primary": [
            {"key": "sebi_bti_reg", "label": "SEBI Banker to Issue Reg. No.", "hint": "BTI Regulations 1994 certificate"},
            {"key": "rbi_licence", "label": "RBI Banking Licence No.", "hint": "Banking Regulation Act 1949"},
            {"key": "cin", "label": "CIN", "hint": "MCA Corporate ID No."},
        ],
        "secondary": [
            {"key": "ifsc_code", "label": "IFSC Code (Branch)", "hint": "11-character bank branch code"},
            {"key": "gst_no", "label": "GST No.", "hint": "15-character GST number"},
        ],
    },
    "advertising_agency": {
        "regulator": "No specific SEBI registration | SEBI ICDR 2018",
        "primary": [
            {"key": "pan_entity", "label": "PAN (Entity)", "hint": "10-character alphanumeric"},
            {"key": "gst_no", "label": "GST No.", "hint": "15-character GST number"},
            {"key": "cin_llpin", "label": "CIN / LLPIN", "hint": "MCA registration"},
        ],
        "secondary": [
            {"key": "contact_details", "label": "Mobile / Email (contact)", "hint": "Operational contact details"},
            {"key": "aadhaar", "label": "Aadhaar", "hint": "12-digit UID (if sole proprietor)"},
        ],
    },
    "market_maker": {
        "regulator": "NSE Emerge / BSE SME platform guidelines",
        "primary": [
            {"key": "sebi_broker_reg", "label": "SEBI Stock Broker Reg. No.", "hint": "INZ000XXXXXX"},
            {"key": "exchange_member_code", "label": "NSE Member Code / BSE Clearing Code", "hint": "Exchange membership code"},
            {"key": "cin_pan", "label": "CIN / PAN (Entity)", "hint": "Entity identifiers"},
        ],
        "secondary": [
            {"key": "gst_no", "label": "GST No.", "hint": "15-character GST number"},
            {"key": "exchange_dp_id", "label": "Exchange DP ID", "hint": "NSDL or CDSL DP identifier"},
        ],
    },
}

MAJOR_CITIES = [
    "Ahmedabad", "Bangalore", "Bhopal", "Bhubaneswar", "Chandigarh", "Chennai",
    "Coimbatore", "Delhi", "Goa", "Gurgaon", "Guwahati", "Hyderabad", "Indore",
    "Jaipur", "Kochi", "Kolkata", "Lucknow", "Mumbai", "Nagpur", "Noida",
    "Patna", "Pune", "Surat", "Thiruvananthapuram", "Vadodara", "Visakhapatnam"
]


@router.get("/matchmaker/expert/expertise-areas")
async def get_expertise_areas():
    return {"areas": EXPERTISE_AREAS}


@router.get("/matchmaker/expert/verification-fields/{area_id}")
async def get_verification_fields(area_id: str):
    fields = VERIFICATION_FIELDS.get(area_id)
    if not fields:
        raise HTTPException(status_code=404, detail="Expertise area not found")
    return fields


@router.get("/matchmaker/expert/major-cities")
async def get_major_cities():
    return {"cities": MAJOR_CITIES}


@router.post("/matchmaker/expert/register")
async def register_expert(
    full_name: str = Form(...),
    mobile: str = Form(...),
    email: str = Form(...),
    city: str = Form(...),
    state: str = Form(...),
    address: str = Form(""),
    pincode: str = Form(""),
    ipo_experience: str = Form("no"),
    years_of_experience: int = Form(0),
    expertise_areas: str = Form("[]"),
    profile_picture: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_user),
):
    existing = await db.expert_profiles.find_one({"user_id": user.user_id})
    if existing:
        raise HTTPException(status_code=400, detail="You have already registered as an expert")

    areas = json.loads(expertise_areas) if expertise_areas else []
    if len(areas) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 areas of expertise allowed")

    pic_gridfs_id = None
    if profile_picture:
        content = await profile_picture.read()
        if len(content) > 2 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Profile picture must be under 2MB")
        ext = os.path.splitext(profile_picture.filename)[1].lower()
        if ext not in {".jpg", ".jpeg", ".png"}:
            raise HTTPException(status_code=400, detail="Only JPG/PNG images allowed")
        grid_id = await fs_bucket.upload_from_stream(
            f"expert_pic_{user.user_id}{ext}",
            io.BytesIO(content),
            metadata={"content_type": profile_picture.content_type, "user_id": user.user_id}
        )
        pic_gridfs_id = str(grid_id)

    expert_id = f"exp_{uuid.uuid4().hex[:12]}"
    profile = {
        "expert_id": expert_id,
        "user_id": user.user_id,
        "full_name": full_name.strip(),
        "mobile": mobile.strip(),
        "email": email.strip().lower(),
        "city": city.strip(),
        "state": state.strip(),
        "address": address.strip(),
        "pincode": pincode.strip(),
        "ipo_experience": ipo_experience == "yes",
        "years_of_experience": years_of_experience if ipo_experience == "yes" else 0,
        "expertise_areas": areas,
        "profile_picture_id": pic_gridfs_id,
        "is_premium": False,
        "is_verified": False,
        "verification_data": {},
        "verified_areas": [],
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.expert_profiles.insert_one(profile)
    profile.pop("_id", None)
    return {"message": "Expert registered successfully", "profile": profile}


@router.post("/matchmaker/expert/premium-upgrade")
async def premium_upgrade(user: User = Depends(get_current_user)):
    profile = await db.expert_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Expert profile not found")
    if profile.get("is_premium"):
        raise HTTPException(status_code=400, detail="Already a premium member")

    await db.expert_profiles.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "is_premium": True,
            "premium_activated_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    return {"message": "Premium upgrade successful (MOCKED)", "razorpay_order_id": f"order_{uuid.uuid4().hex[:12]}"}


@router.post("/matchmaker/expert/verify")
async def submit_verification(user: User = Depends(get_current_user)):
    """Submit verification data. Expects JSON body with {area_id: {field_key: value, ...}}"""
    from fastapi import Request
    # We'll handle this differently - accept raw body
    pass


@router.post("/matchmaker/expert/submit-verification")
async def submit_expert_verification(
    user: User = Depends(get_current_user),
):
    """Accept verification data from request body"""
    from starlette.requests import Request
    import json as json_mod

    profile = await db.expert_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Expert profile not found")

    return {"message": "Use the JSON endpoint instead"}


@router.put("/matchmaker/expert/verification-data")
async def update_verification_data(user: User = Depends(get_current_user)):
    """Workaround: reads raw JSON from the request for verification data"""
    from starlette.requests import Request
    return {"message": "Use POST /matchmaker/expert/save-verification"}


class VerificationSubmission(BaseModel):
    verification_data: dict
    

@router.post("/matchmaker/expert/save-verification")
async def save_verification(data: VerificationSubmission, user: User = Depends(get_current_user)):
    profile = await db.expert_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Expert profile not found")

    verification = data.verification_data
    verified_areas = []

    for area_id, fields in verification.items():
        if area_id not in VERIFICATION_FIELDS:
            continue
        spec = VERIFICATION_FIELDS[area_id]
        primary_keys = {f["key"] for f in spec["primary"]}
        filled_primary = sum(1 for k in primary_keys if fields.get(k, "").strip())
        if filled_primary == len(primary_keys):
            verified_areas.append(area_id)

    is_verified = len(verified_areas) >= 1

    await db.expert_profiles.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "verification_data": verification,
            "verified_areas": verified_areas,
            "is_verified": is_verified,
            "verification_submitted_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )

    return {
        "message": "Verification data saved",
        "verified_areas": verified_areas,
        "is_verified": is_verified,
        "total_areas": len(profile.get("expertise_areas", [])),
        "verified_count": len(verified_areas),
    }


@router.get("/matchmaker/expert/my-profile")
async def get_expert_profile(user: User = Depends(get_current_user)):
    profile = await db.expert_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not profile:
        return {"profile": None}
    return {"profile": profile}


@router.get("/matchmaker/expert/profile-picture/{expert_id}")
async def get_expert_picture(expert_id: str):
    profile = await db.expert_profiles.find_one({"expert_id": expert_id}, {"_id": 0, "profile_picture_id": 1})
    if not profile or not profile.get("profile_picture_id"):
        raise HTTPException(status_code=404, detail="No profile picture")

    from fastapi.responses import StreamingResponse
    grid_out = await fs_bucket.open_download_stream(ObjectId(profile["profile_picture_id"]))
    content_type = grid_out.metadata.get("content_type", "image/jpeg") if grid_out.metadata else "image/jpeg"
    return StreamingResponse(grid_out, media_type=content_type)


@router.get("/matchmaker/experts/browse")
async def browse_experts(
    city: Optional[str] = None,
    expertise: Optional[str] = None,
    premium_only: bool = False,
    verified_only: bool = False,
    search: Optional[str] = None,
):
    query = {"status": "active"}
    if city:
        query["city"] = {"$regex": f"^{city}$", "$options": "i"}
    if expertise:
        query["expertise_areas"] = expertise
    if premium_only:
        query["is_premium"] = True
    if verified_only:
        query["is_verified"] = True
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}},
        ]

    experts = await db.expert_profiles.find(query, {"_id": 0, "verification_data": 0}).sort("full_name", 1).to_list(500)

    area_lookup = {a["id"]: a["label"] for a in EXPERTISE_AREAS}
    for e in experts:
        e["expertise_labels"] = [area_lookup.get(a, a) for a in e.get("expertise_areas", [])]

    return {"experts": experts, "total": len(experts)}
