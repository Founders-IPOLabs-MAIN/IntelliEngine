#!/usr/bin/env python3
"""
SME IPO historical scraper (FY19–FY26, ~1000+ issues).

Source: ipowatch.in public year-archive pages — all free, public, SSR-rendered
tables covering every BSE-SME and NSE-Emerge IPO from 2018 onwards.

  • https://ipowatch.in/sme-ipos-2018/ … 2024
  • https://ipowatch.in/sme-ipo-2025-list/   (new layout)

Two schemas are handled:
  2018-2024:
    Company Name | Open Date | Close Date | Issue Price | Issue Size | Listing Date | Exchange
  2025+:
    Company Name | Open Date | Close Date | IPO Size | Price Band | GMP | Listing Price | Listing Gain

Output: upserts into `ma_issuers` with board='sme' + tags industry via keyword heuristic.

Run standalone:
  python sme_ipo_scraper.py
"""
import asyncio
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from motor.motor_asyncio import AsyncIOMotorClient

# Re-use industry tagger + FY helper from master builder
sys.path.insert(0, str(Path(__file__).parent))
from build_master_dataset import INDUSTRY_KEYWORDS, tag_industry, fy_from_date  # type: ignore  # noqa: E402


MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "test_database")

UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0 Safari/537.36"
)
SESS = requests.Session()
SESS.headers.update({"User-Agent": UA, "Accept": "text/html,application/xhtml+xml"})


YEAR_URLS = {
    2018: "https://ipowatch.in/sme-ipos-2018/",
    2019: "https://ipowatch.in/sme-ipos-2019/",
    2020: "https://ipowatch.in/sme-ipos-2020/",
    2021: "https://ipowatch.in/sme-ipos-2021/",
    2022: "https://ipowatch.in/sme-ipos-2022/",
    2023: "https://ipowatch.in/sme-ipos-2023/",
    2024: "https://ipowatch.in/sme-ipos-2024/",
    2025: "https://ipowatch.in/sme-ipo-2025-list/",
}


# ─── Parsing helpers ─────────────────────────────────────────────────────────

_DATE_FORMATS = (
    "%b %d, %Y", "%d %b %Y", "%b %d %Y", "%d/%m/%Y", "%d-%m-%Y",
    "%d-%b-%Y", "%B %d, %Y",
)


def _parse_date(raw: str):
    if not raw:
        return None
    raw = raw.replace("\xa0", " ").strip()
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(raw, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


_NUM_RE = re.compile(r"[\d,]+(?:\.\d+)?")


def _parse_money_cr(raw: str):
    """Turn '₹25.25 Cr.' / '₹10.51 Cr.' / '11.24 Cr.' → float Cr."""
    if not raw:
        return None
    cleaned = raw.replace("\xa0", " ").replace(",", "").strip()
    m = _NUM_RE.search(cleaned)
    if not m:
        return None
    try:
        return float(m.group(0).replace(",", ""))
    except ValueError:
        return None


def _parse_price(raw: str):
    """Extract a single numeric price or the upper-band from '₹85 to ₹90'."""
    if not raw:
        return None
    cleaned = raw.replace("\xa0", " ").replace(",", "")
    nums = [float(n) for n in _NUM_RE.findall(cleaned)]
    if not nums:
        return None
    return nums[-1] if len(nums) > 1 else nums[0]


def _normalise_exchange(raw: str) -> str:
    t = (raw or "").upper()
    if "NSE" in t:
        return "NSE Emerge"
    if "BSE" in t:
        return "BSE SME"
    return raw or "SME"


# ─── Fetcher + parser ────────────────────────────────────────────────────────

def _polite_get(url: str, retries: int = 3, delay: float = 2.0):
    for attempt in range(retries):
        try:
            r = SESS.get(url, timeout=30)
            if r.status_code == 200:
                return r
            print(f"[sme] {url} → {r.status_code}, retry {attempt + 1}")
        except Exception as exc:  # noqa: BLE001
            print(f"[sme] {url} exception: {exc}")
        time.sleep(delay * (attempt + 1))
    return None


def _parse_year_page(html: str, year: int) -> list:
    """Return list of dicts shaped for ma_issuers."""
    soup = BeautifulSoup(html, "lxml")
    tables = soup.find_all("table")
    if not tables:
        return []

    # Pick the longest table (the archive table)
    table = max(tables, key=lambda t: len(t.find_all("tr")))
    rows = table.find_all("tr")
    if len(rows) < 2:
        return []

    headers = [h.get_text(strip=True).lower() for h in rows[0].find_all(["th", "td"])]

    idx = {}
    for i, h in enumerate(headers):
        if "company" in h or "name" in h:
            idx.setdefault("name", i)
        elif "open" in h and "date" in h:
            idx.setdefault("open_date", i)
        elif "close" in h and "date" in h:
            idx.setdefault("close_date", i)
        elif "listing" in h and "date" in h:
            idx.setdefault("listing_date", i)
        elif "listing" in h and "price" in h:
            idx.setdefault("listing_price", i)
        elif "listing" in h and "gain" in h:
            idx.setdefault("listing_gain", i)
        elif "issue" in h and "price" in h:
            idx.setdefault("issue_price", i)
        elif ("issue" in h or "ipo" in h) and "size" in h:
            idx.setdefault("issue_size", i)
        elif "price" in h and "band" in h:
            idx.setdefault("price_band", i)
        elif "gmp" in h:
            idx.setdefault("gmp", i)
        elif "exchange" in h or "platform" in h:
            idx.setdefault("exchange", i)

    parsed = []
    for tr in rows[1:]:
        cells = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
        if not cells or len(cells) < 3:
            continue
        name_raw = cells[idx["name"]] if "name" in idx and idx["name"] < len(cells) else cells[0]
        if not name_raw or "no record" in name_raw.lower():
            continue
        # Clean name (remove trailing "Ltd." duplications / asterisks)
        name = re.sub(r"\s+", " ", name_raw).strip()

        open_dt = _parse_date(cells[idx["open_date"]]) if "open_date" in idx and idx["open_date"] < len(cells) else None
        close_dt = _parse_date(cells[idx["close_date"]]) if "close_date" in idx and idx["close_date"] < len(cells) else None
        listing_dt = _parse_date(cells[idx["listing_date"]]) if "listing_date" in idx and idx["listing_date"] < len(cells) else None

        issue_size_cr = _parse_money_cr(cells[idx["issue_size"]]) if "issue_size" in idx and idx["issue_size"] < len(cells) else None
        issue_price = _parse_price(cells[idx["issue_price"]]) if "issue_price" in idx and idx["issue_price"] < len(cells) else None
        if issue_price is None and "price_band" in idx and idx["price_band"] < len(cells):
            issue_price = _parse_price(cells[idx["price_band"]])

        listing_price = _parse_price(cells[idx["listing_price"]]) if "listing_price" in idx and idx["listing_price"] < len(cells) else None
        listing_gain_pct = None
        if "listing_gain" in idx and idx["listing_gain"] < len(cells):
            lg = cells[idx["listing_gain"]].replace("%", "").strip()
            try:
                listing_gain_pct = float(lg)
            except ValueError:
                listing_gain_pct = None
        gmp_raw = cells[idx["gmp"]] if "gmp" in idx and idx["gmp"] < len(cells) else None

        exchange_raw = cells[idx["exchange"]] if "exchange" in idx and idx["exchange"] < len(cells) else "SME"
        exchange = _normalise_exchange(exchange_raw)

        # Anchor date: Open Date is the most reliable "filing"/issue date
        anchor_date = open_dt or listing_dt or close_dt

        parsed.append({
            "name": name,
            "board": "sme",
            "exchange": exchange,
            "filing_date": anchor_date.isoformat() if anchor_date else None,
            "open_date": open_dt.isoformat() if open_dt else None,
            "close_date": close_dt.isoformat() if close_dt else None,
            "listing_date": listing_dt.isoformat() if listing_dt else None,
            "year": anchor_date.year if anchor_date else year,
            "fy": fy_from_date(anchor_date) if anchor_date else None,
            "issue_size_cr": issue_size_cr,
            "issue_price": issue_price,
            "listing_price": listing_price,
            "listing_gain_pct": listing_gain_pct,
            "gmp": gmp_raw,
            "industry": tag_industry(name),
            "source": "ipowatch_sme",
        })
    return parsed


# ─── Main ────────────────────────────────────────────────────────────────────

async def scrape_sme_ipos(db, coverage_years: int = 8):
    """Scrape ipowatch SME year archives and upsert into ma_issuers."""
    start_year = datetime.now(timezone.utc).year - coverage_years + 1
    target_years = [y for y in YEAR_URLS if y >= start_year]
    print(f"[sme] target years: {target_years}")

    total_upserts = 0
    per_year_counts = {}

    for year in sorted(target_years):
        url = YEAR_URLS[year]
        print(f"[sme] fetching {year}: {url}")
        r = _polite_get(url)
        if not r:
            print(f"[sme] {year}: fetch failed")
            per_year_counts[year] = 0
            continue

        issuers = _parse_year_page(r.text, year)
        print(f"[sme] {year}: parsed {len(issuers)} rows")
        per_year_counts[year] = len(issuers)

        for iss in issuers:
            await db.ma_issuers.update_one(
                {"name": iss["name"], "board": "sme"},
                {"$set": {
                    **iss,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }},
                upsert=True,
            )
            total_upserts += 1
        # Polite
        time.sleep(1.5)

    print(f"[sme] total upserts: {total_upserts}")
    print(f"[sme] per-year breakdown: {per_year_counts}")
    return {"total": total_upserts, "per_year": per_year_counts}


async def _main():
    if not MONGO_URL:
        raise RuntimeError("MONGO_URL not set")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    # Ensure indexes (compatible with master builder)
    await db.ma_issuers.create_index([("name", 1), ("board", 1)], unique=True)
    stats = await scrape_sme_ipos(db, coverage_years=8)
    print("[sme] done:", stats)


if __name__ == "__main__":
    asyncio.run(_main())
