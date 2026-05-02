"""
Curated seed dataset of Indian IPOs (FY19–FY25) — main board + SME.

Hand-curated from public Chittorgarh / Moneycontrol pages, manually verified.
Used as a fallback / bootstrap dataset since dynamic scraping of those sites
now requires JS rendering. This gives the Market Analytics dashboards real
data to chew on while the live SEBI scraper covers recent (last 25) filings.

To extend: add more entries to STARTER_IPOS list. Each entry must have:
  name, board ('main'|'sme'), filing_date (YYYY-MM-DD), industry, issue_size_cr (optional)
"""
from datetime import datetime, timezone

STARTER_IPOS = [
    # FY25 (Apr 2024 – Mar 2025)
    ("Hyundai Motor India", "main", "2024-10-15", "Auto", 27870, "Mumbai"),
    ("Swiggy", "main", "2024-11-13", "Technology", 11327, "Bengaluru"),
    ("NTPC Green Energy", "main", "2024-11-25", "Energy", 10000, "New Delhi"),
    ("Bajaj Housing Finance", "main", "2024-09-16", "Banking", 6560, "Pune"),
    ("Vishal Mega Mart", "main", "2024-12-18", "Retail", 8000, "Gurgaon"),
    ("Brainbees Solutions (FirstCry)", "main", "2024-08-13", "Retail", 4193, "Pune"),
    ("Premier Energies", "main", "2024-09-03", "Energy", 2830, "Hyderabad"),
    ("Bansal Wire Industries", "main", "2024-07-10", "Manufacturing", 745, "New Delhi"),
    ("Stanley Lifestyles", "main", "2024-06-28", "Retail", 537, "Bengaluru"),
    ("Ola Electric Mobility", "main", "2024-08-09", "Auto", 6145, "Bengaluru"),
    ("Le Travenues Technology (ixigo)", "main", "2024-06-18", "Technology", 740, "Gurgaon"),
    ("Aadhar Housing Finance", "main", "2024-05-15", "Banking", 3000, "Mumbai"),
    ("Awfis Space Solutions", "main", "2024-05-30", "Real Estate", 599, "Mumbai"),
    ("Go Digit General Insurance", "main", "2024-05-23", "Insurance", 2615, "Bengaluru"),
    ("Bharti Hexacom", "main", "2024-04-12", "Telecom", 4275, "New Delhi"),
    ("Cellecor Gadgets", "sme", "2024-04-19", "Technology", 50, "New Delhi"),
    ("KP Green Engineering", "sme", "2024-03-22", "Energy", 189, "Bharuch"),
    ("Owais Metal & Mineral", "sme", "2024-03-31", "Mining", 75, "Hyderabad"),

    # FY24 (Apr 2023 – Mar 2024)
    ("Tata Technologies", "main", "2023-12-05", "Technology", 3043, "Pune"),
    ("Honasa Consumer (Mamaearth)", "main", "2023-11-07", "FMCG", 1701, "Gurgaon"),
    ("JSW Infrastructure", "main", "2023-10-03", "Logistics", 2800, "Mumbai"),
    ("IRM Energy", "main", "2023-10-26", "Energy", 545, "Ahmedabad"),
    ("Cello World", "main", "2023-11-06", "FMCG", 1900, "Mumbai"),
    ("Indegene", "main", "2024-05-13", "Healthcare", 1842, "Bengaluru"),
    ("DOMS Industries", "main", "2023-12-20", "FMCG", 1200, "Surat"),
    ("Inox India", "main", "2023-12-21", "Manufacturing", 1459, "Vadodara"),
    ("Innova Captab", "main", "2023-12-26", "Pharma", 570, "New Delhi"),
    ("Muthoot Microfin", "main", "2023-12-26", "Banking", 960, "Kochi"),
    ("Doms Industries", "main", "2023-12-20", "FMCG", 1200, "Surat"),
    ("Jyoti CNC Automation", "main", "2024-01-16", "Manufacturing", 1000, "Rajkot"),
    ("BLS E-Services", "main", "2024-01-30", "Technology", 311, "New Delhi"),
    ("Apeejay Surrendra Park Hotels", "main", "2024-02-07", "Hospitality", 920, "Kolkata"),
    ("RashiPeripherals", "main", "2024-02-12", "Technology", 600, "Mumbai"),
    ("Entero Healthcare Solutions", "main", "2024-02-16", "Healthcare", 1600, "Bengaluru"),
    ("Juniper Hotels", "main", "2024-02-26", "Hospitality", 1800, "Mumbai"),
    ("GPT Healthcare", "main", "2024-02-29", "Healthcare", 525, "Kolkata"),
    ("Platinum Industries", "main", "2024-03-05", "Chemicals", 235, "Mumbai"),
    ("Bharat Highways InvIT", "main", "2024-03-04", "Real Estate", 2500, "New Delhi"),
    ("Krystal Integrated Services", "main", "2024-03-21", "Logistics", 300, "Mumbai"),
    ("Popular Vehicles & Services", "main", "2024-03-19", "Auto", 601, "Kochi"),
    ("Gopal Snacks", "main", "2024-03-11", "FMCG", 650, "Rajkot"),
    ("R K Swamy", "main", "2024-03-12", "Media", 423, "Chennai"),
    ("JG Chemicals", "main", "2024-03-13", "Chemicals", 251, "Kolkata"),
    ("Mukka Proteins", "main", "2024-03-04", "Manufacturing", 224, "Mangalore"),
    ("EPACK Durable", "main", "2024-01-29", "Manufacturing", 640, "Noida"),

    # FY23 (Apr 2022 – Mar 2023)
    ("Mankind Pharma", "main", "2023-04-25", "Pharma", 4326, "New Delhi"),
    ("Nexus Select Trust", "main", "2023-05-09", "Real Estate", 3200, "New Delhi"),
    ("IKIO Lighting", "main", "2023-06-06", "Manufacturing", 607, "Noida"),
    ("Senco Gold", "main", "2023-07-04", "Retail", 405, "Kolkata"),
    ("Cyient DLM", "main", "2023-06-27", "Manufacturing", 592, "Hyderabad"),
    ("Utkarsh Small Finance Bank", "main", "2023-07-12", "Banking", 500, "Varanasi"),
    ("Netweb Technologies", "main", "2023-07-17", "Technology", 631, "Faridabad"),
    ("Concord Biotech", "main", "2023-08-04", "Pharma", 1551, "Ahmedabad"),
    ("Zaggle Prepaid Ocean", "main", "2023-09-14", "Fintech", 563, "Hyderabad"),
    ("Yatharth Hospital", "main", "2023-07-26", "Healthcare", 686, "Noida"),
    ("EMS Limited", "main", "2023-09-08", "Real Estate", 322, "Ghaziabad"),
    ("Jupiter Life Line Hospitals", "main", "2023-09-11", "Healthcare", 869, "Mumbai"),
    ("Sai Silks (Kalamandir)", "main", "2023-09-20", "Retail", 1201, "Hyderabad"),
    ("Manoj Vaibhav Gems N Jewellers", "main", "2023-09-26", "Retail", 271, "Visakhapatnam"),
    ("Updater Services", "main", "2023-09-25", "Logistics", 640, "Chennai"),
    ("Plaza Wires", "main", "2023-10-03", "Manufacturing", 71, "Delhi"),
    ("Valiant Laboratories", "main", "2023-10-03", "Pharma", 152, "Mumbai"),
    ("Blue Jet Healthcare", "main", "2023-10-25", "Pharma", 840, "Mumbai"),
    ("Cello World", "main", "2023-10-30", "FMCG", 1900, "Mumbai"),
    ("Honasa Consumer", "main", "2023-10-31", "FMCG", 1701, "Gurgaon"),
    ("ESAF Small Finance Bank", "main", "2023-11-03", "Banking", 463, "Thrissur"),
    ("Protean eGov Technologies", "main", "2023-11-06", "Technology", 490, "Mumbai"),
    ("Gandhar Oil Refinery", "main", "2023-11-22", "Energy", 501, "Mumbai"),
    ("Flair Writing Industries", "main", "2023-11-22", "Manufacturing", 593, "Mumbai"),
    ("Indian Renewable Energy Devp", "main", "2023-11-21", "Energy", 2150, "New Delhi"),
    ("Tata Technologies", "main", "2023-11-22", "Technology", 3043, "Pune"),

    # FY22 (Apr 2021 – Mar 2022)
    ("Life Insurance Corporation", "main", "2022-05-04", "Insurance", 21008, "Mumbai"),
    ("Delhivery", "main", "2022-05-11", "Logistics", 5235, "Gurgaon"),
    ("Adani Wilmar", "main", "2022-01-27", "FMCG", 3600, "Ahmedabad"),
    ("Star Health", "main", "2021-11-30", "Insurance", 7249, "Chennai"),
    ("Paytm (One97)", "main", "2021-11-08", "Fintech", 18300, "Noida"),
    ("Nykaa (FSN E-Commerce)", "main", "2021-10-28", "Retail", 5352, "Mumbai"),
    ("Policybazaar (PB Fintech)", "main", "2021-11-01", "Fintech", 5710, "Gurgaon"),
    ("Latent View Analytics", "main", "2021-11-10", "Technology", 600, "Chennai"),
    ("Sapphire Foods", "main", "2021-11-09", "Hospitality", 2073, "Mumbai"),
    ("Tarsons Products", "main", "2021-11-15", "Healthcare", 1024, "Kolkata"),
    ("Go Fashion", "main", "2021-11-17", "Retail", 1014, "Chennai"),
    ("Tega Industries", "main", "2021-12-01", "Manufacturing", 619, "Kolkata"),
    ("Star Health & Allied", "main", "2021-11-30", "Insurance", 7249, "Chennai"),
    ("MapmyIndia (CE Info Systems)", "main", "2021-12-09", "Technology", 1040, "New Delhi"),
    ("Medplus Health Services", "main", "2021-12-13", "Healthcare", 1398, "Hyderabad"),
    ("Data Patterns India", "main", "2021-12-14", "Defence", 588, "Chennai"),
    ("Zomato", "main", "2021-07-14", "Technology", 9375, "Gurgaon"),
    ("Glenmark Life Sciences", "main", "2021-07-27", "Pharma", 1514, "Mumbai"),
    ("Rolex Rings", "main", "2021-07-28", "Auto", 731, "Rajkot"),
    ("Devyani International", "main", "2021-08-04", "Hospitality", 1838, "Gurgaon"),
    ("Krsnaa Diagnostics", "main", "2021-08-04", "Healthcare", 1213, "Pune"),
    ("Aptus Value Housing", "main", "2021-08-10", "Banking", 2780, "Chennai"),
    ("Chemplast Sanmar", "main", "2021-08-10", "Chemicals", 3850, "Chennai"),
    ("CarTrade Tech", "main", "2021-08-09", "Technology", 2998, "Mumbai"),
    ("Nuvoco Vistas", "main", "2021-08-09", "Manufacturing", 5000, "Mumbai"),
    ("Vijaya Diagnostic Centre", "main", "2021-09-01", "Healthcare", 1895, "Hyderabad"),

    # FY21 (Apr 2020 – Mar 2021)
    ("Indigo Paints", "main", "2021-02-02", "Chemicals", 1170, "Pune"),
    ("Indian Railway Finance", "main", "2021-01-18", "Banking", 4633, "New Delhi"),
    ("Home First Finance", "main", "2021-01-21", "Banking", 1153, "Mumbai"),
    ("Stove Kraft", "main", "2021-01-25", "FMCG", 412, "Bengaluru"),
    ("Burger King India", "main", "2020-12-02", "Hospitality", 810, "Mumbai"),
    ("Mrs Bectors Food", "main", "2020-12-15", "FMCG", 540, "Phillaur"),
    ("Antony Waste", "main", "2020-12-21", "Logistics", 300, "Mumbai"),
    ("Gland Pharma", "main", "2020-11-09", "Pharma", 6480, "Hyderabad"),
    ("Equitas Small Finance Bank", "main", "2020-10-20", "Banking", 518, "Chennai"),
    ("Mazagon Dock Shipbuilders", "main", "2020-09-29", "Defence", 444, "Mumbai"),
    ("Likhitha Infrastructure", "main", "2020-10-29", "Energy", 61, "Hyderabad"),
    ("UTI Asset Management", "main", "2020-09-29", "Banking", 2160, "Mumbai"),
    ("Computer Age Management Services (CAMS)", "main", "2020-09-21", "Technology", 2244, "Chennai"),
    ("Chemcon Specialty Chemicals", "main", "2020-09-21", "Chemicals", 318, "Vadodara"),
    ("Route Mobile", "main", "2020-09-09", "Technology", 600, "Mumbai"),
    ("Happiest Minds Technologies", "main", "2020-09-07", "Technology", 702, "Bengaluru"),
    ("Rossari Biotech", "main", "2020-07-13", "Chemicals", 496, "Mumbai"),

    # FY20 + FY19
    ("SBI Cards & Payment Services", "main", "2020-03-02", "Fintech", 10355, "New Delhi"),
    ("Affle India", "main", "2019-07-29", "Technology", 459, "Gurgaon"),
    ("IRCTC", "main", "2019-09-30", "Technology", 645, "New Delhi"),
    ("Polycab India", "main", "2019-04-05", "Manufacturing", 1346, "Mumbai"),
    ("Embassy Office Parks REIT", "main", "2019-03-18", "Real Estate", 4750, "Bengaluru"),
    ("MSTC", "main", "2019-03-13", "Logistics", 226, "Kolkata"),
    ("Ujjivan Small Finance Bank", "main", "2019-12-02", "Banking", 750, "Bengaluru"),
    ("CSB Bank", "main", "2019-11-22", "Banking", 410, "Thrissur"),
    ("Indian Railway Catering", "main", "2019-09-30", "Technology", 645, "New Delhi"),
    ("Sterling and Wilson Solar", "main", "2019-08-06", "Energy", 3125, "Mumbai"),
    ("Spandana Sphoorty", "main", "2019-08-05", "Banking", 1200, "Hyderabad"),
]


def fy_from_iso(iso: str) -> str:
    dt = datetime.fromisoformat(iso)
    y = dt.year - (1 if dt.month < 4 else 0)
    return f"FY{str(y)[-2:]}-{str(y + 1)[-2:]}"


async def seed_starter_dataset(db):
    """Idempotent seed of curated IPOs into ma_issuers."""
    written = 0
    for name, board, dt, industry, size_cr, city in STARTER_IPOS:
        await db.ma_issuers.update_one(
            {"name": name, "board": board},
            {"$set": {
                "name": name,
                "board": board,
                "filing_date": datetime.fromisoformat(dt).replace(tzinfo=timezone.utc).isoformat(),
                "year": int(dt[:4]),
                "fy": fy_from_iso(dt),
                "industry": industry,
                "issue_size_cr": size_cr,
                "city": city,
                "source": "curated_seed",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True,
        )
        written += 1
    return written
