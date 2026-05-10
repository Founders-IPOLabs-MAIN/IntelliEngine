"""
Razorpay Payments + GST Invoice Module
Handles: order creation, payment verification, transaction storage, PDF invoice generation.
"""
import os
import uuid
import hmac
import hashlib
import base64
from datetime import datetime, timezone
from io import BytesIO
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends, Response
from pydantic import BaseModel, Field, EmailStr
import razorpay
from weasyprint import HTML

from shared import db, logger, get_current_user, User, is_central_admin, admin_aware_user_filter, audit_admin_cross_access

router = APIRouter(prefix="/payments", tags=["payments"])

# ============ CONFIG ============

RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")

if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
    logger.warning("Razorpay keys not configured. Payments will not work.")
    rzp_client = None
else:
    rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

GST_RATE = 0.18  # 18 % GST

COMPANY_DETAILS = {
    "legal_name": "IPO Labs AI Private Limited",
    "trade_name": "IPO Labs",
    "gstin": "27AAICI7059Q1ZO",
    "address": "Mumbai, Maharashtra, India",
    "email": "founders.ipolabs@gmail.com",
    "website": "https://ipolabs.com",
    "state_code": "27",
    "state_name": "Maharashtra",
}

# Predefined plans (base price in INR — GST is added at checkout)
PLANS = [
    {
        "plan_id": "drhp_starter",
        "name": "DRHP Builder — Starter",
        "description": "Build your DRHP collaboratively with SEBI-compliant templates.",
        "price": 49000,
        "highlight": False,
        "features": [
            "Full DRHP Builder access",
            "5 Team members",
            "10 GB Document storage",
            "Email support",
        ],
    },
    {
        "plan_id": "drhp_professional",
        "name": "DRHP Builder — Professional",
        "description": "Most popular for SMEs preparing for IPO filing.",
        "price": 99000,
        "highlight": True,
        "features": [
            "Everything in Starter",
            "AI-powered drafting & gap analysis",
            "Unlimited projects + 20 team members",
            "Priority support",
        ],
    },
    {
        "plan_id": "matchmaker_premium",
        "name": "Match-Making Premium",
        "description": "Get featured & directly contact verified IPO experts.",
        "price": 14999,
        "highlight": False,
        "features": [
            "Featured Expert listing for 12 months",
            "Direct messaging with leads",
            "Priority profile verification",
        ],
    },
    {
        "plan_id": "assessment_premium",
        "name": "IPO Readiness — Premium Report",
        "description": "Detailed gap-analysis with expert-reviewed remediation plan.",
        "price": 9999,
        "highlight": False,
        "features": [
            "Full IPO Readiness Test",
            "Expert-reviewed gap analysis",
            "30-day advisory follow-up",
        ],
    },
]


# ============ MODELS ============

class CustomerInfo(BaseModel):
    name: str
    email: EmailStr
    phone: str
    address_line1: str
    city: str
    state: str
    state_code: str  # GST state code (2-digit)
    pincode: str
    gstin: Optional[str] = None  # Customer GST (optional)
    company_name: Optional[str] = None


class CreateOrderRequest(BaseModel):
    plan_id: Optional[str] = None  # If predefined plan
    custom_amount: Optional[float] = None  # Custom amount in INR (base, before GST)
    customer: CustomerInfo


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# ============ HELPERS ============

def _resolve_amount(req: CreateOrderRequest):
    """Returns (plan_id, plan_name, base_amount_inr)."""
    if req.plan_id:
        plan = next((p for p in PLANS if p["plan_id"] == req.plan_id), None)
        if not plan:
            raise HTTPException(status_code=400, detail=f"Unknown plan: {req.plan_id}")
        return plan["plan_id"], plan["name"], float(plan["price"])
    if req.custom_amount is not None:
        if req.custom_amount < 1 or req.custom_amount > 10_00_000:
            raise HTTPException(status_code=400, detail="Custom amount must be between ₹1 and ₹10,00,000")
        return "custom", "Custom Payment", float(req.custom_amount)
    raise HTTPException(status_code=400, detail="Either plan_id or custom_amount is required")


def _calc_gst(base_inr: float, customer_state_code: str):
    """Returns dict with subtotal, cgst, sgst, igst, total, gst_total (all INR)."""
    gst_total = round(base_inr * GST_RATE, 2)
    same_state = customer_state_code.strip() == COMPANY_DETAILS["state_code"]
    if same_state:
        cgst = round(gst_total / 2, 2)
        sgst = round(gst_total - cgst, 2)
        igst = 0.0
    else:
        cgst = sgst = 0.0
        igst = gst_total
    total = round(base_inr + gst_total, 2)
    return {
        "subtotal": round(base_inr, 2),
        "cgst": cgst,
        "sgst": sgst,
        "igst": igst,
        "gst_total": gst_total,
        "total": total,
        "is_igst": not same_state,
    }


# ============ ROUTES ============

@router.get("/plans")
async def get_plans():
    """Public endpoint listing predefined pricing plans."""
    return {"plans": PLANS, "gst_rate": GST_RATE, "currency": "INR"}


@router.get("/config")
async def get_config():
    """Returns Razorpay public key (safe to expose to frontend)."""
    return {"razorpay_key_id": RAZORPAY_KEY_ID}


@router.post("/create-order")
async def create_order(req: CreateOrderRequest, user: User = Depends(get_current_user)):
    if rzp_client is None:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")

    plan_id, plan_name, base_inr = _resolve_amount(req)
    breakdown = _calc_gst(base_inr, req.customer.state_code)

    # Razorpay needs amount in paise
    amount_paise = int(round(breakdown["total"] * 100))

    receipt_short = f"rcpt_{uuid.uuid4().hex[:16]}"  # ≤ 40 chars
    try:
        rzp_order = await _to_thread(rzp_client.order.create, {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt_short,
            "payment_capture": 1,
            "notes": {
                "plan_id": plan_id,
                "plan_name": plan_name,
                "customer_email": req.customer.email,
                "user_id": user.user_id,
            },
        })
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {e}")
        raise HTTPException(status_code=502, detail=f"Razorpay error: {str(e)}")

    transaction = {
        "transaction_id": f"txn_{uuid.uuid4().hex[:16]}",
        "razorpay_order_id": rzp_order["id"],
        "user_id": user.user_id,
        "plan_id": plan_id,
        "plan_name": plan_name,
        "customer": req.customer.model_dump(),
        "amount_breakdown": breakdown,
        "currency": "INR",
        "amount_paise": amount_paise,
        "status": "created",
        "razorpay_payment_id": None,
        "invoice_number": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payment_transactions.insert_one(transaction)
    transaction.pop("_id", None)

    return {
        "order_id": rzp_order["id"],
        "amount_paise": amount_paise,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
        "transaction_id": transaction["transaction_id"],
        "breakdown": breakdown,
        "plan_name": plan_name,
    }


@router.post("/verify")
async def verify_payment(req: VerifyPaymentRequest, user: User = Depends(get_current_user)):
    if rzp_client is None:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")

    # Verify HMAC signature
    body = f"{req.razorpay_order_id}|{req.razorpay_payment_id}".encode()
    expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, req.razorpay_signature):
        await db.payment_transactions.update_one(
            {"razorpay_order_id": req.razorpay_order_id},
            {"$set": {"status": "signature_invalid", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    txn = await db.payment_transactions.find_one(
        {"razorpay_order_id": req.razorpay_order_id, "user_id": user.user_id},
        {"_id": 0}
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Generate invoice number — sequential per fiscal year
    invoice_number = await _next_invoice_number()

    await db.payment_transactions.update_one(
        {"razorpay_order_id": req.razorpay_order_id},
        {"$set": {
            "status": "paid",
            "razorpay_payment_id": req.razorpay_payment_id,
            "razorpay_signature": req.razorpay_signature,
            "invoice_number": invoice_number,
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )

    return {
        "status": "success",
        "transaction_id": txn["transaction_id"],
        "invoice_number": invoice_number,
        "razorpay_payment_id": req.razorpay_payment_id,
    }


@router.get("/transactions")
async def list_my_transactions(user: User = Depends(get_current_user)):
    """List paid transactions. Central admins receive every user's transactions."""
    cursor = db.payment_transactions.find(
        {**admin_aware_user_filter(user), "status": "paid"},
        {"_id": 0, "razorpay_signature": 0}
    ).sort("created_at", -1)
    txns = await cursor.to_list(length=5000 if is_central_admin(user) else 200)
    if is_central_admin(user):
        await audit_admin_cross_access(
            user, action="list_transactions", resource_type="payment_transactions",
            details={"count": len(txns)},
        )
    return {"transactions": txns}


@router.get("/invoice/{transaction_id}")
async def download_invoice(transaction_id: str, user: User = Depends(get_current_user)):
    txn = await db.payment_transactions.find_one(
        {"transaction_id": transaction_id, **admin_aware_user_filter(user)},
        {"_id": 0}
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if txn.get("status") != "paid":
        raise HTTPException(status_code=400, detail="Invoice available only after successful payment")

    if is_central_admin(user) and txn.get("user_id") != user.user_id:
        await audit_admin_cross_access(
            user, action="download_invoice", resource_type="payment_transaction",
            target_user_id=txn.get("user_id"), resource_id=transaction_id,
            details={"invoice_number": txn.get("invoice_number")},
        )

    pdf_bytes = _render_invoice_pdf(txn)
    filename = f"Invoice_{txn['invoice_number']}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ============ INVOICE PDF ============

async def _next_invoice_number() -> str:
    """Generate sequential invoice number: INV/<FY>/NNNNN."""
    now = datetime.now(timezone.utc)
    # Indian fiscal year starts April 1
    if now.month >= 4:
        fy = f"{now.year}-{str(now.year + 1)[-2:]}"
    else:
        fy = f"{now.year - 1}-{str(now.year)[-2:]}"

    counter = await db.payment_counters.find_one_and_update(
        {"counter_id": f"invoice_{fy}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    seq = counter["seq"] if counter else 1
    return f"INV/{fy}/{seq:05d}"


def _render_invoice_pdf(txn: dict) -> bytes:
    bd = txn["amount_breakdown"]
    cust = txn["customer"]
    paid_at = txn.get("paid_at") or txn.get("created_at")
    paid_dt = datetime.fromisoformat(paid_at.replace("Z", "+00:00")) if paid_at else datetime.now(timezone.utc)

    # Build logo as base64 data URI for portability
    logo_path = "/app/frontend/public/setu-logo.png"
    logo_html = ""
    try:
        with open(logo_path, "rb") as f:
            logo_b64 = base64.b64encode(f.read()).decode()
        logo_html = f'<img src="data:image/png;base64,{logo_b64}" style="height:70px;object-fit:contain;" />'
    except Exception:
        logo_html = '<div style="font-size:28px;font-weight:700;color:#003366;">IPO LABS</div>'

    is_igst = bd.get("is_igst", False)
    tax_rows = ""
    if is_igst:
        tax_rows = f"""
            <tr><td>IGST @ 18%</td><td class="num">₹ {bd['igst']:,.2f}</td></tr>
        """
    else:
        tax_rows = f"""
            <tr><td>CGST @ 9%</td><td class="num">₹ {bd['cgst']:,.2f}</td></tr>
            <tr><td>SGST @ 9%</td><td class="num">₹ {bd['sgst']:,.2f}</td></tr>
        """

    customer_gstin_row = (
        f'<div><strong>Customer GSTIN:</strong> {cust.get("gstin")}</div>'
        if cust.get("gstin") else ""
    )
    customer_company_row = (
        f'<div><strong>{cust.get("company_name")}</strong></div>'
        if cust.get("company_name") else ""
    )

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice {txn['invoice_number']}</title>
<style>
  @page {{ size: A4; margin: 18mm; }}
  body {{ font-family: 'Helvetica', 'Arial', sans-serif; color: #1a1a1a; font-size: 11pt; }}
  .header {{ display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #003366; padding-bottom: 14px; margin-bottom: 24px; }}
  .company-block {{ text-align: right; font-size: 10pt; line-height: 1.45; }}
  .company-block .name {{ font-size: 14pt; font-weight: 700; color: #003366; }}
  h1.invoice-title {{ font-size: 22pt; color: #003366; margin: 0 0 6px 0; letter-spacing: 1px; }}
  .meta-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 22px; }}
  .meta-grid .box {{ border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; }}
  .meta-grid h3 {{ margin: 0 0 8px 0; font-size: 10pt; text-transform: uppercase; letter-spacing: 1.2px; color: #475569; }}
  table.items {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; }}
  table.items th {{ background: #003366; color: white; text-align: left; padding: 10px; font-weight: 600; font-size: 10pt; }}
  table.items td {{ padding: 12px 10px; border-bottom: 1px solid #e2e8f0; }}
  .num {{ text-align: right; font-variant-numeric: tabular-nums; }}
  table.totals {{ width: 50%; margin-left: auto; border-collapse: collapse; }}
  table.totals td {{ padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }}
  table.totals tr.grand td {{ background: #003366; color: white; font-weight: 700; font-size: 12pt; border: none; }}
  .footer {{ margin-top: 36px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #64748b; text-align: center; line-height: 1.5; }}
  .badge-paid {{ display: inline-block; background: #16a34a; color: white; padding: 4px 12px; border-radius: 999px; font-size: 9pt; font-weight: 600; letter-spacing: 0.5px; }}
</style></head>
<body>
  <div class="header">
    <div>
      <h1 class="invoice-title">TAX INVOICE</h1>
      <div><strong>Invoice #:</strong> {txn['invoice_number']}</div>
      <div><strong>Date:</strong> {paid_dt.strftime('%d %b %Y')}</div>
      <div style="margin-top:6px;"><span class="badge-paid">PAID</span></div>
    </div>
    <div class="company-block">
      {logo_html}
      <div class="name">{COMPANY_DETAILS['legal_name']}</div>
      <div>{COMPANY_DETAILS['address']}</div>
      <div><strong>GSTIN:</strong> {COMPANY_DETAILS['gstin']}</div>
      <div>State: {COMPANY_DETAILS['state_name']} ({COMPANY_DETAILS['state_code']})</div>
      <div>{COMPANY_DETAILS['email']}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="box">
      <h3>Bill To</h3>
      {customer_company_row}
      <div><strong>{cust['name']}</strong></div>
      <div>{cust['address_line1']}</div>
      <div>{cust['city']}, {cust['state']} - {cust['pincode']}</div>
      <div>State Code: {cust['state_code']}</div>
      {customer_gstin_row}
      <div style="margin-top:6px;">{cust['email']} · {cust['phone']}</div>
    </div>
    <div class="box">
      <h3>Payment Details</h3>
      <div><strong>Payment ID:</strong> {txn.get('razorpay_payment_id') or '—'}</div>
      <div><strong>Order ID:</strong> {txn.get('razorpay_order_id')}</div>
      <div><strong>Method:</strong> Razorpay</div>
      <div><strong>Currency:</strong> INR</div>
    </div>
  </div>

  <table class="items">
    <thead>
      <tr><th>Description</th><th style="text-align:right;width:25%;">Amount (₹)</th></tr>
    </thead>
    <tbody>
      <tr><td>{txn['plan_name']}</td><td class="num">₹ {bd['subtotal']:,.2f}</td></tr>
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td class="num">₹ {bd['subtotal']:,.2f}</td></tr>
    {tax_rows}
    <tr class="grand"><td>Total Paid</td><td class="num">₹ {bd['total']:,.2f}</td></tr>
  </table>

  <div class="footer">
    This is a computer-generated tax invoice and does not require a signature.<br/>
    {COMPANY_DETAILS['legal_name']} · GSTIN {COMPANY_DETAILS['gstin']} · {COMPANY_DETAILS['email']}
  </div>
</body></html>"""

    pdf_io = BytesIO()
    HTML(string=html).write_pdf(pdf_io)
    return pdf_io.getvalue()


# ============ UTIL ============

async def _to_thread(fn, *args, **kwargs):
    import asyncio
    return await asyncio.to_thread(fn, *args, **kwargs)
