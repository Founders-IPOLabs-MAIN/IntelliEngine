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
    sources: List[str] = ["chittorgarh", "sebi", "amfi"]  # bse optional, slower
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
        "data_sources": ["Chittorgarh", "SEBI Public Issues", "AMFI", "BSE"],
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
