"""
Seed test expert profiles for all major cities + migrate old professional profiles.
Run once: python seed_experts.py
"""
import asyncio
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os, random

load_dotenv('/app/backend/.env')
client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

CITIES = [
    "Ahmedabad", "Bangalore", "Bhopal", "Bhubaneswar", "Chandigarh", "Chennai",
    "Coimbatore", "Delhi", "Goa", "Gurgaon", "Guwahati", "Hyderabad", "Indore",
    "Jaipur", "Kochi", "Kolkata", "Lucknow", "Mumbai", "Nagpur", "Noida",
    "Patna", "Pune", "Surat", "Thiruvananthapuram", "Vadodara", "Visakhapatnam"
]

STATES = {
    "Ahmedabad": "Gujarat", "Bangalore": "Karnataka", "Bhopal": "Madhya Pradesh",
    "Bhubaneswar": "Odisha", "Chandigarh": "Chandigarh", "Chennai": "Tamil Nadu",
    "Coimbatore": "Tamil Nadu", "Delhi": "Delhi", "Goa": "Goa", "Gurgaon": "Haryana",
    "Guwahati": "Assam", "Hyderabad": "Telangana", "Indore": "Madhya Pradesh",
    "Jaipur": "Rajasthan", "Kochi": "Kerala", "Kolkata": "West Bengal",
    "Lucknow": "Uttar Pradesh", "Mumbai": "Maharashtra", "Nagpur": "Maharashtra",
    "Noida": "Uttar Pradesh", "Patna": "Bihar", "Pune": "Maharashtra",
    "Surat": "Gujarat", "Thiruvananthapuram": "Kerala", "Vadodara": "Gujarat",
    "Visakhapatnam": "Andhra Pradesh"
}

EXPERTISE_IDS = [
    "ca_auditor", "peer_review_auditor", "tax_advisor", "cfo", "company_secretary",
    "legal_advisor", "independent_director", "valuation_expert", "merchant_banker",
    "underwriter", "rta", "credit_rating", "banker_to_issue", "advertising_agency", "market_maker"
]

# Real Indian names for each city
NAMES = [
    "Amit Patel", "Kavitha Rao", "Suresh Iyer", "Deepak Mohanty", "Harpreet Singh",
    "Lakshmi Narayanan", "Meera Krishnan", "Rajiv Khanna", "Sunita Deshmukh", "Vikram Malhotra",
    "Arun Borah", "Neha Reddy", "Manoj Joshi", "Pooja Nair", "Sanjay Mehta",
    "Ritu Agarwal", "Ashish Tiwari", "Divya Iyer", "Prakash Jain", "Anita Yadav",
    "Gaurav Mishra", "Sneha Kulkarni", "Rohit Shah", "Praveena Menon", "Kiran Bhatt",
    "Sridhar Murthy",
]

# Old category → new expertise mapping
CATEGORY_MAP = {
    "chartered_accountants": ["ca_auditor"],
    "company_secretaries": ["company_secretary"],
    "legal_tax": ["legal_advisor", "tax_advisor"],
    "merchant_bankers": ["merchant_banker"],
    "underwriters": ["underwriter"],
    "independent_directors": ["independent_director"],
    "valuers": ["valuation_expert"],
    "rta": ["rta"],
    "credit_rating": ["credit_rating"],
    "cfo": ["cfo"],
    "advertising": ["advertising_agency"],
    "market_maker": ["market_maker"],
    "bankers_to_issue": ["banker_to_issue"],
}


async def seed():
    # 1. Create test profiles for all 26 major cities
    created = 0
    for i, city in enumerate(CITIES):
        name = NAMES[i]
        email = f"{name.lower().replace(' ', '.')}@example.com"

        existing = await db.expert_profiles.find_one({"email": email})
        if existing:
            continue

        # Each profile gets 1-3 expertise areas, rotating through the list
        areas = []
        for j in range(random.randint(1, 3)):
            areas.append(EXPERTISE_IDS[(i * 3 + j) % len(EXPERTISE_IDS)])
        areas = list(set(areas))[:3]

        years = random.choice([2, 3, 5, 7, 8, 10, 12, 15, 20])

        profile = {
            "expert_id": f"exp_{uuid.uuid4().hex[:12]}",
            "user_id": f"seed_{uuid.uuid4().hex[:8]}",
            "full_name": name,
            "mobile": f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}",
            "email": email,
            "city": city,
            "state": STATES.get(city, ""),
            "address": "",
            "pincode": "",
            "ipo_experience": True,
            "years_of_experience": years,
            "expertise_areas": areas,
            "profile_picture_id": None,
            "is_premium": random.random() > 0.6,
            "is_verified": random.random() > 0.5,
            "verification_data": {},
            "verified_areas": areas[:1] if random.random() > 0.5 else [],
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.expert_profiles.insert_one(profile)
        created += 1

    print(f"Seeded {created} test expert profiles across {len(CITIES)} cities")

    # 2. Migrate old professional profiles to new expert_profiles format
    old_pros = await db.professionals.find({"status": "active"}).to_list(500)
    migrated = 0

    for p in old_pros:
        email = (p.get("email") or "").strip().lower()
        if not email:
            continue

        # Check if already migrated
        existing = await db.expert_profiles.find_one({"email": email})
        if existing:
            continue

        # Map category to new expertise areas
        cat = p.get("category_id", "")
        areas = CATEGORY_MAP.get(cat, [])
        if not areas and p.get("expertise_tags"):
            areas = ["ca_auditor"]  # fallback

        city = ""
        if p.get("locations") and len(p["locations"]) > 0:
            city = p["locations"][0]

        profile = {
            "expert_id": f"exp_{uuid.uuid4().hex[:12]}",
            "user_id": p.get("user_id") or f"migrated_{uuid.uuid4().hex[:8]}",
            "full_name": p.get("name", "Unknown"),
            "mobile": p.get("mobile", ""),
            "email": email,
            "city": city,
            "state": STATES.get(city, ""),
            "address": "",
            "pincode": "",
            "ipo_experience": (p.get("years_experience") or 0) > 0,
            "years_of_experience": p.get("years_experience") or 0,
            "expertise_areas": areas[:3],
            "profile_picture_id": None,
            "is_premium": False,
            "is_verified": p.get("is_verified", False),
            "verification_data": p.get("registration_numbers", {}),
            "verified_areas": areas[:1] if p.get("is_verified") else [],
            "status": "active",
            "migrated_from": p.get("professional_id"),
            "professional_summary": p.get("professional_summary", ""),
            "agency_name": p.get("agency_name", ""),
            "created_at": p.get("created_at", datetime.now(timezone.utc).isoformat()),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.expert_profiles.insert_one(profile)
        migrated += 1

    print(f"Migrated {migrated} old professional profiles")

    # Final count
    total = await db.expert_profiles.count_documents({"status": "active"})
    print(f"Total expert profiles: {total}")


asyncio.run(seed())
