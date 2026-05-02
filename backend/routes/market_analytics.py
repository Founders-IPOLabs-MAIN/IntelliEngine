"""
Market Analytics — Anchor Investor Targeting & DRHP analytics.

Free, container-managed scraping pipeline:
  • Chittorgarh (IPO + anchor lists)
  • SEBI public-issues portal (DRHP filings list)
  • BSE corporate announcements (anchor allotment PDFs, fallback)
  • AMFI (fund-family + AAUM tier — static seed for v1)

Data lives in Mongo collections prefixed with `ma_`.
Scrapes are kicked off via an admin endpoint and run in a background task.
"""
import asyncio
import os
import sys
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel

from shared import db, logger, get_current_user, User, is_approved_admin, require_admin

router = APIRouter(prefix="/market-analytics", tags=["market-analytics"])

SCRIPTS_DIR = Path("/app/scripts/market_analytics")
COVERAGE_YEARS = 7  # FY19–FY25


# ============ MODELS ============

class RefreshTriggerRequest(BaseModel):
    coverage_years: int = COVERAGE_YEARS
    sources: List[str] = ["chittorgarh", "sebi", "amfi", "ipowatch_sme"]  # bse optional, slower
    run_id: Optional[str] = None


# ============ STATS ============

@router.get("/stats")
async def get_stats(user: User = Depends(get_current_user)):
    """Dataset overview — counts, last refresh, top-line metrics. Visible to all logged-in users."""
    counts = {
        "issuers": await db.ma_issuers.count_documents({}),
        "issuers_main_board": await db.ma_issuers.count_documents({"board": "main"}),
        "issuers_sme": await db.ma_issuers.count_documents({"board": "sme"}),
        "anchor_participations": await db.ma_anchor_participations.count_documents({}),
        "investors": await db.ma_investors.count_documents({}),
        "fund_families": await db.ma_fund_families.count_documents({}),
    }

    last_run = await db.ma_refresh_runs.find_one(
        {"status": "completed"},
        {"_id": 0},
        sort=[("finished_at", -1)],
    )
    current_run = await db.ma_refresh_runs.find_one(
        {"status": {"$in": ["running", "queued"]}},
        {"_id": 0},
        sort=[("started_at", -1)],
    )

    # Year coverage
    years = []
    if counts["issuers"] > 0:
        cursor = db.ma_issuers.aggregate([
            {"$group": {"_id": "$fy"}},
            {"$sort": {"_id": 1}},
        ])
        years = [d["_id"] async for d in cursor if d["_id"]]

    return {
        "counts": counts,
        "last_completed_run": last_run,
        "current_run": current_run,
        "years_covered": years,
        "data_sources": ["Chittorgarh", "SEBI Public Issues", "AMFI", "IPOWatch SME Archive"],
        "is_seeded": counts["issuers"] > 0,
    }


@router.get("/refresh/status")
async def refresh_status(user: User = Depends(get_current_user)):
    """Live status of any active refresh job."""
    run = await db.ma_refresh_runs.find_one(
        {"status": {"$in": ["running", "queued"]}},
        {"_id": 0},
        sort=[("started_at", -1)],
    )
    if not run:
        latest = await db.ma_refresh_runs.find_one(
            {}, {"_id": 0}, sort=[("started_at", -1)]
        )
        return {"active": False, "latest": latest}
    return {"active": True, "run": run}


@router.get("/refresh/history")
async def refresh_history(user: User = Depends(get_current_user), limit: int = 20):
    cursor = db.ma_refresh_runs.find({}, {"_id": 0}).sort("started_at", -1).limit(limit)
    return {"runs": await cursor.to_list(length=limit)}


# ============ FACETS ============

@router.get("/facets")
async def get_facets(user: User = Depends(get_current_user)):
    """Distinct values for filter dropdowns."""
    industries = sorted([i for i in await db.ma_issuers.distinct("industry") if i])
    cities = sorted([c for c in await db.ma_issuers.distinct("city") if c])
    fys = sorted([f for f in await db.ma_issuers.distinct("fy") if f])
    boards = sorted([b for b in await db.ma_issuers.distinct("board") if b])
    families = await db.ma_fund_families.find({}, {"_id": 0}).to_list(length=200)
    return {
        "industries": industries,
        "cities": cities,
        "fys": fys,
        "boards": boards,
        "fund_families": families,
        "aum_tiers": ["Mega", "Large", "Mid", "Small"],
    }


# ============ SEARCH ============

class SearchRequest(BaseModel):
    q: Optional[str] = None
    industries: Optional[List[str]] = None
    cities: Optional[List[str]] = None
    boards: Optional[List[str]] = None
    fys: Optional[List[str]] = None
    min_size_cr: Optional[float] = None
    max_size_cr: Optional[float] = None
    sort_by: str = "filing_date"  # filing_date | issue_size_cr | name
    sort_dir: int = -1  # -1 desc, 1 asc
    page: int = 1
    page_size: int = 25


@router.post("/search")
async def search_issuers(req: SearchRequest, user: User = Depends(get_current_user)):
    where = {}
    if req.q:
        where["name"] = {"$regex": req.q.strip(), "$options": "i"}
    if req.industries:
        where["industry"] = {"$in": req.industries}
    if req.cities:
        where["city"] = {"$in": req.cities}
    if req.boards:
        where["board"] = {"$in": req.boards}
    if req.fys:
        where["fy"] = {"$in": req.fys}
    if req.min_size_cr is not None or req.max_size_cr is not None:
        rng = {}
        if req.min_size_cr is not None: rng["$gte"] = req.min_size_cr
        if req.max_size_cr is not None: rng["$lte"] = req.max_size_cr
        where["issue_size_cr"] = rng

    total = await db.ma_issuers.count_documents(where)
    skip = max(0, (req.page - 1) * req.page_size)
    sort_field = req.sort_by if req.sort_by in ("filing_date", "issue_size_cr", "name", "year") else "filing_date"
    cursor = db.ma_issuers.find(where, {"_id": 0}).sort(sort_field, req.sort_dir).skip(skip).limit(req.page_size)
    results = await cursor.to_list(length=req.page_size)
    return {"total": total, "page": req.page, "page_size": req.page_size, "results": results}


# ============ SIMILAR ISSUERS ============

class SimilarRequest(BaseModel):
    issuer_name: Optional[str] = None
    industry: Optional[str] = None
    city: Optional[str] = None
    issue_size_cr: Optional[float] = None
    board: Optional[str] = None
    limit: int = 10


@router.post("/find-similar")
async def find_similar(req: SimilarRequest, user: User = Depends(get_current_user)):
    """Returns issuers most similar to a given anchor (industry + size + board + city overlap)."""
    base = None
    if req.issuer_name:
        base = await db.ma_issuers.find_one({"name": req.issuer_name}, {"_id": 0})
        if not base:
            raise HTTPException(status_code=404, detail="Issuer not found")

    industry = req.industry or (base or {}).get("industry") or "Other"
    city = req.city or (base or {}).get("city")
    size = req.issue_size_cr or (base or {}).get("issue_size_cr") or 0
    board = req.board or (base or {}).get("board")
    name = req.issuer_name or ""

    # Pull candidate pool: same industry first, then near sector
    candidates = await db.ma_issuers.find(
        {"name": {"$ne": name}},
        {"_id": 0},
    ).to_list(length=2000)

    def score(c):
        s = 0
        if c.get("industry") == industry: s += 40
        if board and c.get("board") == board: s += 15
        if city and c.get("city") == city: s += 10
        cs = c.get("issue_size_cr") or 0
        if size > 0 and cs > 0:
            ratio = min(cs, size) / max(cs, size)
            s += ratio * 25  # up to +25 for size match
        # recency bonus (more recent = more relevant)
        y = c.get("year") or 2018
        s += min(10, max(0, (y - 2018) * 1.4))
        return s

    scored = sorted(candidates, key=score, reverse=True)[: req.limit]
    return {
        "base_issuer": base,
        "matched_on": {"industry": industry, "city": city, "size_cr": size, "board": board},
        "similar": [{**c, "match_score": round(score(c), 1)} for c in scored],
    }


# ============ FIND ANCHORS (heuristic, anchor-data-aware) ============

# Industry preferences by investor type — empirically observed in Indian markets
INDUSTRY_AFFINITY = {
    "Mutual Fund": {  # MFs play everything but skew growth + financials
        "Technology": 1.4, "Banking": 1.3, "Pharma": 1.3, "FMCG": 1.2,
        "Auto": 1.2, "Healthcare": 1.2, "Manufacturing": 1.1, "Fintech": 1.3,
    },
    "Insurance": {  # Insurers prefer steady cash-flow sectors
        "Banking": 1.5, "Insurance": 1.4, "FMCG": 1.4, "Energy": 1.3,
        "Real Estate": 1.3, "Telecom": 1.2, "Auto": 1.1,
    },
    "FPI": {  # FPIs hunt growth + global comparables
        "Technology": 1.5, "Pharma": 1.4, "Fintech": 1.4, "Healthcare": 1.3,
        "Auto": 1.2, "FMCG": 1.2, "Banking": 1.2,
    },
    "Pension": {
        "Banking": 1.4, "FMCG": 1.3, "Energy": 1.3, "Telecom": 1.2, "Real Estate": 1.2,
    },
}

TIER_WEIGHT = {"Mega": 5.0, "Large": 4.0, "Mid": 3.0, "Small": 2.0, "Unknown": 1.5}


def _classify_family_type(name: str) -> str:
    n = (name or "").lower()
    if "insurance" in n or "life " in n: return "Insurance"
    if "pension" in n: return "Pension"
    foreign_kw = ["blackrock", "vanguard", "norges", "gic", "abu dhabi", "goldman", "morgan stanley", "fidelity", "schroder", "t rowe"]
    if any(k in n for k in foreign_kw): return "FPI"
    return "Mutual Fund"


class FindAnchorsRequest(BaseModel):
    issuer_name: Optional[str] = None
    industry: Optional[str] = None
    issue_size_cr: Optional[float] = None
    board: Optional[str] = None
    limit: int = 25


@router.post("/find-anchors")
async def find_anchors(req: FindAnchorsRequest, user: User = Depends(get_current_user)):
    """Ranked likely-anchor list.

    Strategy:
      1. If we have real anchor_participations data → empirical ranking by similar-IPO backing.
      2. Otherwise, heuristic: fund-family AUM tier × industry affinity → still actionable.
    """
    # Resolve target
    base = None
    if req.issuer_name:
        base = await db.ma_issuers.find_one({"name": req.issuer_name}, {"_id": 0})
    industry = req.industry or (base or {}).get("industry") or "Other"
    size = req.issue_size_cr or (base or {}).get("issue_size_cr") or 0
    board = req.board or (base or {}).get("board") or "main"

    # If we have empirical anchor data, use it
    n_participations = await db.ma_anchor_participations.count_documents({})
    use_empirical = n_participations > 0

    if use_empirical:
        # Aggregate anchor history for issuers in same industry
        pipe = [
            {"$match": {"issuer_industry": industry}},
            {"$group": {
                "_id": "$investor_raw",
                "n_similar": {"$sum": 1},
                "total_alloc_inr": {"$sum": "$allocation_inr"},
                "issuers": {"$addToSet": "$issuer_name"},
            }},
            {"$sort": {"n_similar": -1}},
            {"$limit": req.limit * 2},
        ]
        rows = await db.ma_anchor_participations.aggregate(pipe).to_list(length=req.limit * 2)

        # Enrich with investor metadata
        enriched = []
        for r in rows:
            inv = await db.ma_investors.find_one({"name": r["_id"]}, {"_id": 0})
            family = (inv or {}).get("fund_family", "Unknown")
            tier = (inv or {}).get("aum_tier", "Unknown")
            enriched.append({
                "investor": r["_id"],
                "fund_family": family,
                "aum_tier": tier,
                "n_similar_backings": r["n_similar"],
                "issuers_backed": list(r.get("issuers", []))[:5],
                "score": r["n_similar"] * 10 + TIER_WEIGHT.get(tier, 1.5),
                "rationale": f"{r['_id']} has anchored {r['n_similar']} {industry}-sector IPOs · last seen {(inv or {}).get('last_seen','—')}",
            })
        enriched.sort(key=lambda x: x["score"], reverse=True)
        return {
            "mode": "empirical",
            "base_issuer": base,
            "matched_on": {"industry": industry, "size_cr": size, "board": board},
            "anchors": enriched[: req.limit],
        }

    # Heuristic fallback: rank fund families by industry affinity × AUM tier
    families = await db.ma_fund_families.find({}, {"_id": 0}).to_list(length=200)
    ranked = []
    for f in families:
        ftype = _classify_family_type(f["name"])
        affinity = INDUSTRY_AFFINITY.get(ftype, {}).get(industry, 1.0)
        tier_score = TIER_WEIGHT.get(f.get("aum_tier", "Unknown"), 1.5)
        score = round(tier_score * affinity, 2)
        rationale = (
            f"{f['name']} is a {f.get('aum_tier','—')}-tier {ftype} with "
            f"{'strong' if affinity > 1.2 else 'moderate' if affinity > 1.0 else 'baseline'} "
            f"affinity for {industry} sector issues."
        )
        ranked.append({
            "investor": f["name"],
            "fund_family": f["name"],
            "aum_tier": f.get("aum_tier"),
            "investor_type": ftype,
            "score": score,
            "industry_affinity": affinity,
            "rationale": rationale,
            "n_similar_backings": None,
        })
    ranked.sort(key=lambda x: x["score"], reverse=True)
    return {
        "mode": "heuristic",
        "base_issuer": base,
        "matched_on": {"industry": industry, "size_cr": size, "board": board},
        "anchors": ranked[: req.limit],
        "note": "Empirical anchor data not yet ingested. Showing heuristic ranking based on AUM tier × industry affinity. Will switch to empirical mode once participations data is loaded.",
    }


# ============ DASHBOARDS (aggregations for charts) ============

@router.get("/dashboards/yearly-trends")
async def dash_yearly_trends(user: User = Depends(get_current_user)):
    pipe = [
        {"$match": {"fy": {"$ne": None}}},
        {"$group": {
            "_id": "$fy",
            "count": {"$sum": 1},
            "total_size_cr": {"$sum": {"$ifNull": ["$issue_size_cr", 0]}},
            "main": {"$sum": {"$cond": [{"$eq": ["$board", "main"]}, 1, 0]}},
            "sme":  {"$sum": {"$cond": [{"$eq": ["$board", "sme"]}, 1, 0]}},
        }},
        {"$sort": {"_id": 1}},
    ]
    rows = await db.ma_issuers.aggregate(pipe).to_list(length=20)
    return {"data": [{"fy": r["_id"], "count": r["count"], "total_size_cr": round(r["total_size_cr"]),
                       "main": r["main"], "sme": r["sme"]} for r in rows]}


@router.get("/dashboards/industry-by-year")
async def dash_industry_by_year(user: User = Depends(get_current_user)):
    """Sector heatmap data — industry × FY counts."""
    pipe = [
        {"$match": {"industry": {"$ne": None}, "fy": {"$ne": None}}},
        {"$group": {"_id": {"industry": "$industry", "fy": "$fy"}, "count": {"$sum": 1}}},
    ]
    rows = await db.ma_issuers.aggregate(pipe).to_list(length=2000)
    return {"data": [{"industry": r["_id"]["industry"], "fy": r["_id"]["fy"], "count": r["count"]} for r in rows]}


@router.get("/dashboards/city-leaderboard")
async def dash_city_leaderboard(user: User = Depends(get_current_user), limit: int = 15):
    pipe = [
        {"$match": {"city": {"$ne": None}}},
        {"$group": {
            "_id": "$city",
            "count": {"$sum": 1},
            "total_size_cr": {"$sum": {"$ifNull": ["$issue_size_cr", 0]}},
        }},
        {"$sort": {"count": -1}},
        {"$limit": limit},
    ]
    rows = await db.ma_issuers.aggregate(pipe).to_list(length=limit)
    return {"data": [{"city": r["_id"], "count": r["count"], "total_size_cr": round(r["total_size_cr"])} for r in rows]}


@router.get("/dashboards/board-mix")
async def dash_board_mix(user: User = Depends(get_current_user)):
    pipe = [
        {"$group": {"_id": "$board", "count": {"$sum": 1},
                    "total_size_cr": {"$sum": {"$ifNull": ["$issue_size_cr", 0]}}}},
    ]
    rows = await db.ma_issuers.aggregate(pipe).to_list(length=10)
    return {"data": [{"board": r["_id"], "count": r["count"], "total_size_cr": round(r["total_size_cr"])} for r in rows]}


@router.get("/dashboards/top-investors")
async def dash_top_investors(user: User = Depends(get_current_user), limit: int = 20):
    """Top investors by participation count (empirical) or fund families by AUM tier (heuristic)."""
    n_part = await db.ma_anchor_participations.count_documents({})
    if n_part > 0:
        pipe = [
            {"$group": {"_id": "$investor_raw", "deals": {"$sum": 1},
                        "alloc": {"$sum": "$allocation_inr"}}},
            {"$sort": {"deals": -1}},
            {"$limit": limit},
        ]
        rows = await db.ma_anchor_participations.aggregate(pipe).to_list(length=limit)
        return {"mode": "empirical",
                "data": [{"name": r["_id"], "deals": r["deals"], "alloc_inr": r["alloc"]} for r in rows]}
    # Heuristic — show fund families ordered by tier weight
    families = await db.ma_fund_families.find({}, {"_id": 0}).to_list(length=200)
    weight = {"Mega": 5, "Large": 4, "Mid": 3, "Small": 2}
    ranked = sorted(families, key=lambda f: weight.get(f.get("aum_tier"), 0), reverse=True)[:limit]
    return {"mode": "heuristic",
            "data": [{"name": f["name"], "tier": f.get("aum_tier"), "deals": None} for f in ranked]}


# ============ INVESTOR & ISSUER DETAIL ============

@router.get("/issuers/{issuer_id}")
async def get_issuer(issuer_id: str, user: User = Depends(get_current_user)):
    """Issuer detail by name (URL-encoded)."""
    iss = await db.ma_issuers.find_one({"name": issuer_id}, {"_id": 0})
    if not iss:
        raise HTTPException(status_code=404, detail="Not found")
    anchors = await db.ma_anchor_participations.find(
        {"issuer_name": issuer_id}, {"_id": 0}
    ).to_list(length=100)
    return {"issuer": iss, "anchors": anchors}


# ============ ADMIN: TRIGGER SCRAPE ============

def _is_admin(user: User) -> bool:
    return is_approved_admin(user)


@router.get("/me/is-admin")
async def me_is_admin(user: User = Depends(get_current_user)):
    return {"is_admin": _is_admin(user)}


@router.post("/admin/refresh")
async def trigger_refresh(
    req: RefreshTriggerRequest,
    background: BackgroundTasks,
    user: User = Depends(require_admin),
):
    if not req.run_id:
        # Block if a run is already in flight (skip when explicit run-id passed)
        in_flight = await db.ma_refresh_runs.find_one(
            {"status": {"$in": ["running", "queued"]}}
        )
        if in_flight:
            raise HTTPException(status_code=409, detail="A refresh is already running")

    run_id = f"run_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    run = {
        "run_id": run_id,
        "status": "queued",
        "coverage_years": req.coverage_years,
        "sources": req.sources,
        "triggered_by": user.email,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "finished_at": None,
        "phases": [],
        "stats": {},
        "error": None,
    }
    await db.ma_refresh_runs.insert_one(run)

    background.add_task(_run_pipeline, run_id, req.coverage_years, req.sources)
    return {"run_id": run_id, "status": "queued"}


async def _phase_log(run_id: str, phase: str, status: str, detail: dict = None):
    entry = {
        "phase": phase,
        "status": status,
        "ts": datetime.now(timezone.utc).isoformat(),
        "detail": detail or {},
    }
    await db.ma_refresh_runs.update_one(
        {"run_id": run_id},
        {"$push": {"phases": entry}},
    )
    logger.info(f"[MA:{run_id}] {phase} → {status} | {detail}")


async def _run_pipeline(run_id: str, coverage_years: int, sources: List[str]):
    """Background pipeline. Each phase logs to ma_refresh_runs.phases."""
    started = datetime.now(timezone.utc).isoformat()
    await db.ma_refresh_runs.update_one(
        {"run_id": run_id},
        {"$set": {"status": "running", "started_at": started}},
    )

    try:
        # Run the orchestrator script in a subprocess so a single crash doesn't kill the API
        cmd = [
            sys.executable,
            str(SCRIPTS_DIR / "build_master_dataset.py"),
            "--run-id", run_id,
            "--coverage-years", str(coverage_years),
            "--sources", ",".join(sources),
        ]
        await _phase_log(run_id, "orchestrator", "started", {"cmd": " ".join(cmd)})

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            cwd=str(SCRIPTS_DIR),
        )

        # Stream + capture last 8 KB of output for diagnostics
        tail = bytearray()
        while True:
            line = await proc.stdout.readline()
            if not line:
                break
            tail.extend(line)
            if len(tail) > 8192:
                tail = tail[-8192:]

        rc = await proc.wait()
        log_tail = tail.decode("utf-8", errors="replace")

        # Refresh stats from DB after the run
        stats = {
            "issuers": await db.ma_issuers.count_documents({}),
            "issuers_main_board": await db.ma_issuers.count_documents({"board": "main"}),
            "issuers_sme": await db.ma_issuers.count_documents({"board": "sme"}),
            "anchor_participations": await db.ma_anchor_participations.count_documents({}),
            "investors": await db.ma_investors.count_documents({}),
            "fund_families": await db.ma_fund_families.count_documents({}),
        }

        finished = datetime.now(timezone.utc).isoformat()
        if rc == 0:
            await db.ma_refresh_runs.update_one(
                {"run_id": run_id},
                {"$set": {
                    "status": "completed",
                    "finished_at": finished,
                    "stats": stats,
                    "log_tail": log_tail[-4000:],
                }},
            )
            await _phase_log(run_id, "orchestrator", "completed", {"rc": 0, "stats": stats})
        else:
            await db.ma_refresh_runs.update_one(
                {"run_id": run_id},
                {"$set": {
                    "status": "failed",
                    "finished_at": finished,
                    "stats": stats,
                    "error": f"exit code {rc}",
                    "log_tail": log_tail[-4000:],
                }},
            )
            await _phase_log(run_id, "orchestrator", "failed", {"rc": rc})

    except Exception as e:
        logger.exception(f"[MA:{run_id}] pipeline crashed")
        await db.ma_refresh_runs.update_one(
            {"run_id": run_id},
            {"$set": {
                "status": "failed",
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "error": str(e),
            }},
        )
