#!/usr/bin/env python3
"""
Market Analytics — Master dataset builder.

Orchestrates the offline-first scrape pipeline. Runs inside the Emergent
container, triggered by an admin button in the app.

Sources used (all FREE, public, official):
  • Chittorgarh.com — aggregated IPO + anchor allocation tables
  • SEBI public-issues portal — DRHP filings index (main + SME)
  • AMFI — fund-family master (static seed for v1, can scrape monthly later)

Writes to Mongo collections:
  • ma_issuers
  • ma_investors
  • ma_anchor_participations
  • ma_fund_families
  • ma_refresh_runs (audit, updated by parent FastAPI process)

Usage:
  python build_master_dataset.py --run-id run_20260502 --coverage-years 7 --sources chittorgarh,sebi,amfi
"""
import argparse
import asyncio
import os
import sys
import re
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from rapidfuzz import fuzz, process
from motor.motor_asyncio import AsyncIOMotorClient

# ─── Mongo bootstrap ─────────────────────────────────────────────────────────
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "test_database")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

UA = "Mozilla/5.0 (Linux) IPOLabs-MarketAnalytics/1.0 (research; contact founders.ipolabs@gmail.com)"
SESS = requests.Session()
SESS.headers.update({"User-Agent": UA, "Accept": "text/html,application/xhtml+xml"})


# ─── Static fund-family seed (top 50 Indian AMCs, AAUM tier from AMFI Dec-2024) ─
# Tier scale: Mega (>₹4 Lc Cr) | Large (1-4 Lc Cr) | Mid (25K-1L Cr) | Small (<25K Cr)
FUND_FAMILY_SEED = [
    ("SBI Mutual Fund",           "Mega",   ["sbi mf", "sbi mutual"]),
    ("ICICI Prudential",          "Mega",   ["icici pru", "icici prudential mf"]),
    ("HDFC Mutual Fund",          "Mega",   ["hdfc mf", "hdfc mutual"]),
    ("Nippon India",              "Mega",   ["nippon", "reliance mf", "reliance mutual"]),
    ("Aditya Birla Sun Life",     "Mega",   ["aditya birla", "absl", "birla sun life"]),
    ("Kotak Mahindra",            "Mega",   ["kotak mf", "kotak mutual"]),
    ("Axis Mutual Fund",          "Mega",   ["axis mf", "axis mutual"]),
    ("UTI Mutual Fund",           "Mega",   ["uti mf", "uti mutual"]),
    ("DSP Mutual Fund",           "Large",  ["dsp mf", "dsp blackrock"]),
    ("Mirae Asset",               "Large",  ["mirae"]),
    ("Tata Mutual Fund",          "Large",  ["tata mf", "tata mutual"]),
    ("Franklin Templeton",        "Large",  ["franklin", "templeton"]),
    ("Bandhan Mutual Fund",       "Large",  ["bandhan", "idfc mf", "idfc mutual"]),
    ("Edelweiss Mutual Fund",     "Large",  ["edelweiss"]),
    ("Invesco India",             "Large",  ["invesco"]),
    ("Sundaram Mutual Fund",      "Mid",    ["sundaram"]),
    ("L&T Mutual Fund",           "Mid",    ["l&t", "lnt"]),
    ("Canara Robeco",             "Mid",    ["canara robeco"]),
    ("PGIM India",                "Mid",    ["pgim", "dhfl pramerica"]),
    ("Baroda BNP Paribas",        "Mid",    ["baroda bnp", "bnp paribas mf"]),
    ("Motilal Oswal",             "Mid",    ["motilal oswal"]),
    ("HSBC Mutual Fund",          "Mid",    ["hsbc"]),
    ("Quant Mutual Fund",         "Mid",    ["quant"]),
    ("PPFAS Mutual Fund",         "Mid",    ["ppfas", "parag parikh"]),
    ("Mahindra Manulife",         "Small",  ["mahindra manulife", "mahindra mf"]),
    ("ITI Mutual Fund",           "Small",  ["iti mf"]),
    ("Quantum Mutual Fund",       "Small",  ["quantum"]),
    ("Whiteoak Capital",          "Small",  ["whiteoak", "yes mf"]),
    ("LIC Mutual Fund",           "Small",  ["lic mf", "lic mutual"]),
    ("Union Mutual Fund",         "Small",  ["union mf"]),
    # Insurance + sovereign anchors (treated as "fund families" for tier purposes)
    ("Life Insurance Corporation","Mega",   ["lic", "life insurance corp"]),
    ("HDFC Life",                 "Large",  ["hdfc life"]),
    ("SBI Life",                  "Large",  ["sbi life"]),
    ("ICICI Prudential Life",     "Large",  ["icici prudential life"]),
    ("Max Life",                  "Mid",    ["max life"]),
    ("Bajaj Allianz",             "Mid",    ["bajaj allianz"]),
    # Top FPIs
    ("BlackRock",                 "Mega",   ["blackrock"]),
    ("Vanguard",                  "Mega",   ["vanguard"]),
    ("Norges Bank",               "Mega",   ["norges", "norway pension"]),
    ("Government of Singapore",   "Mega",   ["gic", "government of singapore"]),
    ("Abu Dhabi Investment",      "Mega",   ["adia", "abu dhabi investment"]),
    ("Goldman Sachs",             "Mega",   ["goldman sachs"]),
    ("Morgan Stanley",            "Mega",   ["morgan stanley"]),
    ("Fidelity",                  "Mega",   ["fidelity"]),
    ("T Rowe Price",              "Large",  ["t rowe", "t. rowe price"]),
    ("Schroder",                  "Large",  ["schroder"]),
]


async def upsert_fund_families():
    print(f"[amfi] seeding {len(FUND_FAMILY_SEED)} fund families")
    for name, tier, aliases in FUND_FAMILY_SEED:
        await db.ma_fund_families.update_one(
            {"name": name},
            {"$set": {
                "name": name,
                "aum_tier": tier,
                "aliases": aliases,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True,
        )


# ─── Industry tagging (free, deterministic) ──────────────────────────────────
INDUSTRY_KEYWORDS = {
    "Pharma": ["pharma", "drug", "biotech", "biological", "vaccine", "API", "formulation", "life sciences", "lifesciences"],
    "Healthcare": ["hospital", "diagnost", "medical", "clinic", "healthcare", "wellness", "life care", "nutrition", "nutraceutical", "ayurvedic", "ayurveda"],
    "Technology": ["software", "tech", "saas", "platform", "digital", "IT services", " it ", " it-", "cloud", "cyber", "robotic", "automation", "analytic", "solve", "solutions", "collaboration", "systems"],
    "Fintech": ["fintech", "payment", "lending", "loan", "credit", "bnpl", "digital lending"],
    "Banking": ["bank", "nbfc", "small finance bank", "cooperative bank", "leasing", " finance ", "finserv", "capital", "microfinance"],
    "Insurance": ["insurance", "assurance"],
    "Manufacturing": ["manufactur", "engineering", "machinery", "industrial", "fabricat", " industries", "industry", "enterprises", "polyplast", "packaging", "packag", "wires", "cables", "valves", "stamping", "fabmat", "gears", "bearings", "robotic"],
    "Auto": ["automobile", "auto component", "ev", "electric vehicle", "two wheeler", " auto ", "auto-"],
    "FMCG": ["fmcg", "consumer goods", " food ", "foods", "beverage", "personal care", "dairy", "snacks", "spices", "tea "],
    "Retail": ["retail", "fashion", "apparel", "jewell", "jewel", "jewels", "footwear", "dress", "garments", "goldorna", "gold ", "mart"],
    "Real Estate": ["real estate", "property", "construction", "infrastructure", "realty", "infrabuild", "infra "],
    "Energy": ["energy", "power", "solar", "wind", "renewable", " oil ", " gas ", "petroleum", "electric ", "electricals"],
    "Chemicals": ["chemical", "petrochem", "agrochem", "specialty chem", "fertilizer", "resin", "paints"],
    "Logistics": ["logistic", "warehous", "shipping", "transport", "supply chain", "cabs", "exports", "overseas", "trading", "trade"],
    "Media": ["media", "entertainment", "broadcast", "publishing", "ott", "films", "film ", "studios", "multiplex", "printing", " print ", "movies", "music"],
    "Hospitality": ["hotel", "restaurant", "hospitality", "tourism", "qsr", "resort", "leisure"],
    "Education": ["education", "edtech", "school", "learning", "training", "tutorials", "educare", "academy"],
    "Telecom": ["telecom", "telecommunication", "5g", "tower"],
    "Agriculture": ["agri", "agricultural", "seed", "irrigation", "agro", " organic", "dairy", "plantation", "horticulture"],
    "Textile": ["textile", "garment", "yarn", "fabric", "spinning", "cotfab", "cotton", "cotspin", "fibromat", "rayons", "denim", "apparel"],
    "Defence": ["defence", "defense", "aerospace"],
    "Mining": ["mining", "mineral", " metal", "steel", "iron ore", " copper", "zinc", "alumi"],
    "Consulting": ["consulting", "consultancy", "advisory", "advisors", "research"],
    "Packaging": ["packaging"],
}


def tag_industry(text: str) -> str:
    if not text:
        return "Other"
    t = text.lower()
    scores = {}
    for ind, kws in INDUSTRY_KEYWORDS.items():
        scores[ind] = sum(1 for k in kws if k in t)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "Other"


def fy_from_date(dt: datetime) -> str:
    """Indian FY: April–March → 'FY24-25' for Apr-2024–Mar-2025."""
    y = dt.year - (1 if dt.month < 4 else 0)
    return f"FY{str(y)[-2:]}-{str(y + 1)[-2:]}"


# ─── SEBI Public Issues filings scraper (official source) ──────────────────
SEBI_BASE = "https://www.sebi.gov.in/sebiweb/home/HomeAction.do"
SEBI_QS = {
    "doPaging": "yes",
    "sid": "3", "ssid": "15", "smid": "10",
    "search": "", "fromDate": "", "toDate": "",
    "deptId": "", "ssidhidden": "15", "smidhidden": "10",
    "sectName": "Filings",
}


def _sebi_classify_board(title: str, href: str) -> str:
    t = (title + " " + (href or "")).lower()
    if " sme" in t or "/sme/" in t or "(sme)" in t:
        return "sme"
    return "main"


async def scrape_sebi_drhp_filings(coverage_years: int):
    """Scrapes SEBI's public-issues filings list (most recent ~25 records).
    SEBI's pagination requires JS so we capture page 1 only — still 25 fresh DRHPs/month."""
    written = 0
    try:
        params = {"doListing": "yes", "sid": "3", "ssid": "15", "smid": "10"}
        r = SESS.get("https://www.sebi.gov.in/sebiweb/home/HomeAction.do", params=params, timeout=30)
        if r.status_code != 200:
            print(f"[sebi] non-200: {r.status_code}")
            return 0
        soup = BeautifulSoup(r.text, "lxml")
        table = soup.find("table")
        if not table:
            print("[sebi] no table on page")
            return 0

        for tr in table.find_all("tr")[1:]:
            cells = tr.find_all(["td", "th"])
            if len(cells) < 2:
                continue
            date_str = cells[0].get_text(strip=True)
            link_cell = cells[1]
            link = link_cell.find("a")
            title = link.get_text(strip=True) if link else link_cell.get_text(strip=True)
            href = link["href"] if link and link.get("href") else None
            if href and href.startswith("/"):
                href = f"https://www.sebi.gov.in{href}"

            issue_date = None
            for fmt in ("%b %d, %Y", "%d %b %Y", "%d-%m-%Y", "%d/%m/%Y"):
                try:
                    issue_date = datetime.strptime(date_str, fmt).replace(tzinfo=timezone.utc)
                    break
                except ValueError:
                    continue

            if not title:
                continue
            board = _sebi_classify_board(title, href or "")

            await db.ma_issuers.update_one(
                {"name": title, "board": board},
                {"$set": {
                    "name": title,
                    "board": board,
                    "filing_date": issue_date.isoformat() if issue_date else None,
                    "year": issue_date.year if issue_date else None,
                    "fy": fy_from_date(issue_date) if issue_date else None,
                    "industry": tag_industry(title),
                    "drhp_pdf_url": href,
                    "source": "sebi_live",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }},
                upsert=True,
            )
            written += 1
        print(f"[sebi] live page-1 captured: {written} most-recent filings")
    except Exception as e:
        print(f"[sebi] error: {e}")
    return written


# ─── Chittorgarh scrapers ────────────────────────────────────────────────────
CHITTORGARH_LIST = "https://www.chittorgarh.com/report/list-of-mainboard-ipo-issues-in-india/93/"
CHITTORGARH_SME_LIST = "https://www.chittorgarh.com/report/list-of-sme-ipo-issues-in-india-bse-sme-nse-emerge/84/"


def _polite_get(url, retries=3, delay=2):
    for attempt in range(retries):
        try:
            r = SESS.get(url, timeout=30)
            if r.status_code == 200:
                return r
            print(f"[get] {url} → {r.status_code}, retry {attempt + 1}")
        except Exception as e:
            print(f"[get] {url} exception: {e}")
        time.sleep(delay * (attempt + 1))
    return None


def _parse_chittorgarh_ipo_list(html: str, board: str) -> list:
    """Parses Chittorgarh's master IPO table → list of issuer dicts."""
    soup = BeautifulSoup(html, "lxml")
    table = soup.find("table")
    if not table:
        return []
    issuers = []
    for tr in table.find_all("tr")[1:]:
        cols = [td.get_text(strip=True) for td in tr.find_all("td")]
        if len(cols) < 4:
            continue
        # Format varies; defensive parsing
        link = tr.find("a")
        href = link["href"] if link and link.get("href") else None
        name = cols[0] if cols else None
        if not name:
            continue
        # Try to extract date from one of the columns
        issue_date = None
        for c in cols:
            try:
                # Common formats: "Dec 12, 2023", "12/12/2023"
                for fmt in ("%b %d, %Y", "%d/%m/%Y", "%d-%b-%Y", "%d %b %Y"):
                    try:
                        issue_date = datetime.strptime(c, fmt)
                        break
                    except ValueError:
                        continue
                if issue_date:
                    break
            except Exception:
                continue
        issuers.append({
            "name": name,
            "board": board,
            "issue_date": issue_date.isoformat() if issue_date else None,
            "fy": fy_from_date(issue_date) if issue_date else None,
            "year": issue_date.year if issue_date else None,
            "chittorgarh_url": f"https://www.chittorgarh.com{href}" if href and href.startswith("/") else href,
            "industry": tag_industry(name),
        })
    return issuers


async def scrape_chittorgarh_issuers(coverage_years: int):
    cutoff = datetime.now(timezone.utc) - timedelta(days=365 * coverage_years)

    all_issuers = []
    for board, url in [("main", CHITTORGARH_LIST), ("sme", CHITTORGARH_SME_LIST)]:
        print(f"[chittorgarh] fetching {board}-board IPO list…")
        r = _polite_get(url)
        if not r:
            print(f"[chittorgarh] {board} list fetch failed; skipping")
            continue
        rows = _parse_chittorgarh_ipo_list(r.text, board)
        # Filter by cutoff
        filtered = [
            i for i in rows
            if not i["issue_date"] or datetime.fromisoformat(i["issue_date"]) >= cutoff
        ]
        print(f"[chittorgarh] {board}: {len(rows)} total → {len(filtered)} within {coverage_years}y window")
        all_issuers.extend(filtered)
        time.sleep(2)

    # Bulk upsert
    written = 0
    for iss in all_issuers:
        key = {"name": iss["name"], "board": iss["board"]}
        await db.ma_issuers.update_one(
            key,
            {"$set": {
                **iss,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True,
        )
        written += 1
    print(f"[chittorgarh] upserted {written} issuers")
    return written


# ─── Anchor allocation scraper (per-IPO detail page) ─────────────────────────
def _parse_anchor_table(html: str) -> list:
    """Return list of {investor_raw, allocation_inr, lock_in_days, shares}."""
    soup = BeautifulSoup(html, "lxml")
    out = []

    # Look for a table that contains 'Anchor' in a heading or caption nearby
    for table in soup.find_all("table"):
        prev_text = ""
        # Look at preceding heading/caption
        prev = table.find_previous(["h2", "h3", "h4", "p", "b", "strong"])
        if prev:
            prev_text = prev.get_text(strip=True).lower()
        if "anchor" not in prev_text:
            continue
        rows = table.find_all("tr")
        if len(rows) < 2:
            continue
        headers = [th.get_text(strip=True).lower() for th in rows[0].find_all(["td", "th"])]
        for tr in rows[1:]:
            cells = [td.get_text(strip=True) for td in tr.find_all("td")]
            if len(cells) < 2:
                continue
            row = dict(zip(headers, cells))
            # Heuristic name column
            name = (
                row.get("anchor investor")
                or row.get("name of the anchor investor")
                or row.get("investor name")
                or row.get("name")
                or cells[0]
            )
            # Allocation
            alloc_raw = (
                row.get("amount allocated (rs.)")
                or row.get("amount in rs.")
                or row.get("amount")
                or row.get("amount (rs.)")
                or ""
            )
            alloc_inr = None
            digits = re.sub(r"[^\d.]", "", alloc_raw)
            if digits:
                try:
                    alloc_inr = float(digits)
                except ValueError:
                    pass
            # Shares
            shares_raw = (
                row.get("no. of shares allocated")
                or row.get("no. of shares")
                or row.get("shares allocated")
                or ""
            )
            shares = None
            sd = re.sub(r"[^\d]", "", shares_raw)
            if sd:
                try:
                    shares = int(sd)
                except ValueError:
                    pass
            out.append({
                "investor_raw": name,
                "allocation_inr": alloc_inr,
                "shares_allocated": shares,
            })
        if out:
            break
    return out


async def scrape_anchor_lists_for_recent_issuers(limit: int = 250):
    """Visit each issuer's Chittorgarh page and pull the anchor allocation table."""
    cursor = db.ma_issuers.find(
        {"chittorgarh_url": {"$ne": None}, "anchor_scraped_at": {"$exists": False}},
        {"_id": 0, "name": 1, "board": 1, "chittorgarh_url": 1, "issue_date": 1, "industry": 1},
    ).sort("issue_date", -1).limit(limit)
    issuers = await cursor.to_list(length=limit)

    print(f"[anchors] scraping anchor lists for {len(issuers)} issuers…")
    total_rows = 0
    for i, iss in enumerate(issuers):
        url = iss["chittorgarh_url"]
        r = _polite_get(url)
        if not r:
            continue
        rows = _parse_anchor_table(r.text)
        for row in rows:
            doc = {
                "issuer_name": iss["name"],
                "issuer_board": iss["board"],
                "issuer_industry": iss.get("industry"),
                "issuer_issue_date": iss.get("issue_date"),
                **row,
                "scraped_at": datetime.now(timezone.utc).isoformat(),
            }
            # Idempotent insert
            await db.ma_anchor_participations.update_one(
                {"issuer_name": iss["name"], "issuer_board": iss["board"], "investor_raw": row["investor_raw"]},
                {"$set": doc},
                upsert=True,
            )
            total_rows += 1
        await db.ma_issuers.update_one(
            {"name": iss["name"], "board": iss["board"]},
            {"$set": {"anchor_scraped_at": datetime.now(timezone.utc).isoformat(), "anchor_count": len(rows)}},
        )
        if (i + 1) % 25 == 0:
            print(f"[anchors] progress: {i + 1}/{len(issuers)}, rows so far={total_rows}")
        time.sleep(1.2)  # polite

    print(f"[anchors] total participation rows: {total_rows}")
    return total_rows


# ─── Investor master + fund-family resolution ────────────────────────────────
async def consolidate_investors():
    """Group raw investor names → canonical investors with fund_family resolution."""
    print("[investors] consolidating investor master…")

    # Load family aliases
    families = await db.ma_fund_families.find({}, {"_id": 0}).to_list(length=500)
    alias_map = []
    for f in families:
        for a in f["aliases"]:
            alias_map.append((a.lower(), f["name"], f["aum_tier"]))
        alias_map.append((f["name"].lower(), f["name"], f["aum_tier"]))

    # Distinct raw names
    raw_names = await db.ma_anchor_participations.distinct("investor_raw")
    print(f"[investors] distinct raw names: {len(raw_names)}")

    written = 0
    for raw in raw_names:
        if not raw:
            continue
        rl = raw.lower()
        family = None
        tier = None
        # Direct alias match
        for alias, fam_name, fam_tier in alias_map:
            if alias and alias in rl:
                family = fam_name
                tier = fam_tier
                break
        # Fuzzy fallback
        if not family:
            best = process.extractOne(rl, [a[0] for a in alias_map], scorer=fuzz.partial_ratio)
            if best and best[1] >= 88:
                matched = next((a for a in alias_map if a[0] == best[0]), None)
                if matched:
                    family = matched[1]
                    tier = matched[2]

        # Stats
        pipeline = [
            {"$match": {"investor_raw": raw}},
            {"$group": {
                "_id": None,
                "n_participations": {"$sum": 1},
                "total_alloc": {"$sum": {"$ifNull": ["$allocation_inr", 0]}},
                "industries": {"$addToSet": "$issuer_industry"},
                "boards": {"$addToSet": "$issuer_board"},
                "first_seen": {"$min": "$issuer_issue_date"},
                "last_seen": {"$max": "$issuer_issue_date"},
            }},
        ]
        agg = await db.ma_anchor_participations.aggregate(pipeline).to_list(length=1)
        s = agg[0] if agg else {}

        await db.ma_investors.update_one(
            {"name": raw},
            {"$set": {
                "name": raw,
                "fund_family": family or "Unknown",
                "aum_tier": tier or "Unknown",
                "investor_type": _classify_investor_type(raw),
                "n_participations": s.get("n_participations", 0),
                "total_alloc_inr": s.get("total_alloc", 0),
                "industries_covered": [i for i in s.get("industries", []) if i],
                "boards_covered": [b for b in s.get("boards", []) if b],
                "first_seen": s.get("first_seen"),
                "last_seen": s.get("last_seen"),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True,
        )
        written += 1
    print(f"[investors] upserted {written} investor master rows")
    return written


def _classify_investor_type(name: str) -> str:
    n = (name or "").lower()
    if any(k in n for k in ["mutual fund", " mf ", "mutual"]):
        return "Mutual Fund"
    if any(k in n for k in ["insurance", "assurance", "life "]):
        return "Insurance"
    if any(k in n for k in ["pension", "retirement"]):
        return "Pension"
    if any(k in n for k in ["bank ", "bank-", "commercial bank"]):
        return "Bank"
    if any(k in n for k in ["fpi", "foreign portfolio", "ltd."]) and "india" not in n:
        return "FPI"
    if any(k in n for k in ["family office", "aif", "alternative investment"]):
        return "AIF/FO"
    if any(k in n for k in ["hni", "high net worth"]):
        return "HNI"
    return "Other"


# ─── Indices ────────────────────────────────────────────────────────────────
async def ensure_indexes():
    await db.ma_issuers.create_index([("name", 1), ("board", 1)], unique=True)
    await db.ma_issuers.create_index("industry")
    await db.ma_issuers.create_index("year")
    await db.ma_issuers.create_index("fy")
    await db.ma_anchor_participations.create_index([("issuer_name", 1), ("issuer_board", 1), ("investor_raw", 1)], unique=True)
    await db.ma_anchor_participations.create_index("investor_raw")
    await db.ma_anchor_participations.create_index("issuer_industry")
    await db.ma_investors.create_index("name", unique=True)
    await db.ma_investors.create_index("fund_family")
    await db.ma_investors.create_index("aum_tier")
    await db.ma_fund_families.create_index("name", unique=True)


# ─── Main ────────────────────────────────────────────────────────────────────
async def main(args):
    print(f"=== Market Analytics build starting ({args.run_id}) ===")
    print(f"coverage: {args.coverage_years} years | sources: {args.sources}")

    await ensure_indexes()
    sources = set(args.sources.split(","))

    if "amfi" in sources:
        await upsert_fund_families()

    # Curated starter dataset — guaranteed real coverage of 7 years
    if "seed" in sources or True:  # always seed — idempotent
        from starter_seed import seed_starter_dataset
        n = await seed_starter_dataset(db)
        print(f"[seed] curated starter dataset: {n} issuers upserted")

    if "sebi" in sources:
        await scrape_sebi_drhp_filings(args.coverage_years)

    if "chittorgarh" in sources:
        await scrape_chittorgarh_issuers(args.coverage_years)
        await scrape_anchor_lists_for_recent_issuers(limit=250)

    if "ipowatch_sme" in sources or "sme" in sources:
        from sme_ipo_scraper import scrape_sme_ipos
        sme_stats = await scrape_sme_ipos(db, coverage_years=args.coverage_years + 1)
        print(f"[sme] upserted {sme_stats['total']} SME issuers across {len(sme_stats['per_year'])} years")

    await consolidate_investors()

    print("=== Build complete ===")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--run-id", default=f"run_{int(time.time())}")
    p.add_argument("--coverage-years", type=int, default=7)
    p.add_argument("--sources", default="chittorgarh,sebi,amfi,ipowatch_sme")
    args = p.parse_args()
    asyncio.run(main(args))
