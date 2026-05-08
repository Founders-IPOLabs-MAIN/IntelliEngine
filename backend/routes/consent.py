"""
Cookie + Terms consent ledger.
Endpoints:
  POST /api/consent       — log a user's accept/decline (server-side audit trail)
  GET  /api/consent/status — check if the current visitor (by IP + optional user) has already accepted
"""
from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel
from typing import Optional
from shared import db, logger, datetime, timezone, uuid, get_optional_user

router = APIRouter()

CLAUSE_VERSION = 2


class ConsentPayload(BaseModel):
    choice: str                              # "all" | "essential"
    accepted_terms: bool = False
    accepted_indemnity: bool = False
    accepted_liability_cap: bool = False
    accepted_as_is: bool = False


def _client_ip(req: Request) -> str:
    # Prefer the first hop in X-Forwarded-For (Cloudflare / proxy aware)
    fwd = req.headers.get("x-forwarded-for") or req.headers.get("cf-connecting-ip")
    if fwd:
        return fwd.split(",")[0].strip()
    return (req.client.host if req.client else "0.0.0.0")


@router.post("/consent")
async def log_consent(
    payload: ConsentPayload,
    request: Request,
    user=Depends(get_optional_user),
):
    """Persist a user's consent decision. Called from the cookie banner."""
    ip = _client_ip(request)
    ua = request.headers.get("user-agent", "")[:512]
    user_id = (user or {}).get("user_id") if isinstance(user, dict) else getattr(user, "user_id", None)
    user_email = (user or {}).get("email") if isinstance(user, dict) else getattr(user, "email", None)

    record = {
        "consent_id": str(uuid.uuid4()),
        "choice": payload.choice,
        "accepted_terms": payload.accepted_terms,
        "accepted_indemnity": payload.accepted_indemnity,
        "accepted_liability_cap": payload.accepted_liability_cap,
        "accepted_as_is": payload.accepted_as_is,
        "ip": ip,
        "user_agent": ua,
        "user_id": user_id,
        "user_email": user_email,
        "version": CLAUSE_VERSION,
        "ts": datetime.now(timezone.utc),
    }
    await db.cookie_consents.insert_one(record)

    # If user accepted all, mark a "skip-banner" flag for future visits
    # Treat as skip iff there's at least one identifier (ip OR user_id).
    if payload.choice == "all":
        for key in [
            {"kind": "ip", "value": ip},
            *([{"kind": "user", "value": user_id}] if user_id else []),
        ]:
            await db.cookie_consent_skip.update_one(
                key,
                {"$set": {**key, "version": CLAUSE_VERSION, "last_ts": record["ts"]}},
                upsert=True,
            )

    return {"ok": True, "consent_id": record["consent_id"], "ip": ip, "version": CLAUSE_VERSION}


@router.get("/consent/status")
async def consent_status(
    request: Request,
    user=Depends(get_optional_user),
):
    """
    Returns whether the cookie banner should be shown for this visitor.
    Skip if:
      • The current IP has previously accepted at the current clause version, OR
      • The currently logged-in user has previously accepted at the current clause version.

    Anyone who chose 'Essential only' is NOT recorded as 'skip' — so they will
    keep seeing the banner on every login (per requirement).
    """
    ip = _client_ip(request)
    user_id = (user or {}).get("user_id") if isinstance(user, dict) else getattr(user, "user_id", None)

    or_clauses = [{"kind": "ip", "value": ip, "version": CLAUSE_VERSION}]
    if user_id:
        or_clauses.append({"kind": "user", "value": user_id, "version": CLAUSE_VERSION})

    found = await db.cookie_consent_skip.find_one({"$or": or_clauses}, {"_id": 0})
    return {
        "should_show": found is None,
        "version": CLAUSE_VERSION,
        "ip": ip,
        "user_recognised": bool(user_id),
        "matched_on": found.get("kind") if found else None,
    }
