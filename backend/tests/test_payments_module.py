"""
Razorpay Payments & GST Invoice module tests.
Covers /api/payments/{plans,config,create-order,verify,transactions,invoice}.
"""
import os
import uuid
import requests
import pytest
from pymongo import MongoClient
from datetime import datetime, timezone

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ipo-analytics-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

ADMIN_EMAIL = "admin@ipolabs.com"
ADMIN_PASSWORD = "admin@123"


# -------- Fixtures --------
@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth_client(api_client):
    r = api_client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("session_token") or data.get("token")
    assert token, f"No session token in: {data}"
    auth = requests.Session()
    auth.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    # Also set cookie for compatibility
    auth.cookies.set("session_token", token)
    auth.user_id = data.get("user", {}).get("user_id") or data.get("user_id")
    return auth


@pytest.fixture(scope="session")
def mongo_db():
    c = MongoClient(MONGO_URL)
    yield c[DB_NAME]
    c.close()


def _customer(state_code="27", state="Maharashtra"):
    return {
        "name": "TEST Customer",
        "email": "testuser@example.com",
        "phone": "9876543210",
        "address_line1": "123 Test Street",
        "city": "Mumbai",
        "state": state,
        "state_code": state_code,
        "pincode": "400001",
        "gstin": None,
        "company_name": "TEST Co",
    }


# -------- Public endpoints --------
class TestPublicEndpoints:
    def test_plans(self, api_client):
        r = api_client.get(f"{API}/payments/plans")
        assert r.status_code == 200
        d = r.json()
        assert "plans" in d and isinstance(d["plans"], list)
        assert len(d["plans"]) >= 5
        assert d.get("gst_rate") == 0.18
        pids = {p["plan_id"] for p in d["plans"]}
        assert "drhp_starter" in pids
        starter = next(p for p in d["plans"] if p["plan_id"] == "drhp_starter")
        assert starter["price"] == 49000

    def test_config(self, api_client):
        r = api_client.get(f"{API}/payments/config")
        assert r.status_code == 200
        d = r.json()
        assert d.get("razorpay_key_id", "").startswith("rzp_")


# -------- Auth enforcement --------
class TestAuthEnforcement:
    def test_create_order_requires_auth(self, api_client):
        r = api_client.post(f"{API}/payments/create-order", json={"plan_id": "drhp_starter", "customer": _customer()})
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"

    def test_transactions_requires_auth(self, api_client):
        r = api_client.get(f"{API}/payments/transactions")
        assert r.status_code in (401, 403)

    def test_invoice_requires_auth(self, api_client):
        r = api_client.get(f"{API}/payments/invoice/txn_nonexistent")
        assert r.status_code in (401, 403)


# -------- Create order (intra + inter state) --------
class TestCreateOrder:
    def test_create_order_intra_state_maharashtra(self, auth_client):
        r = auth_client.post(f"{API}/payments/create-order",
                             json={"plan_id": "drhp_starter", "customer": _customer("27", "Maharashtra")})
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        d = r.json()
        assert d["order_id"].startswith("order_")
        assert d["currency"] == "INR"
        assert d["amount_paise"] == 5782000  # 57820 * 100
        bd = d["breakdown"]
        assert bd["subtotal"] == 49000
        assert bd["cgst"] == 4410
        assert bd["sgst"] == 4410
        assert bd["igst"] == 0
        assert bd["total"] == 57820
        assert "transaction_id" in d

    def test_create_order_custom_amount_inter_state_karnataka(self, auth_client):
        r = auth_client.post(f"{API}/payments/create-order",
                             json={"custom_amount": 5000, "customer": _customer("29", "Karnataka")})
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        bd = r.json()["breakdown"]
        assert bd["subtotal"] == 5000
        assert bd["cgst"] == 0
        assert bd["sgst"] == 0
        assert bd["igst"] == 900
        assert bd["total"] == 5900

    def test_invalid_plan_id(self, auth_client):
        r = auth_client.post(f"{API}/payments/create-order",
                             json={"plan_id": "nonexistent_plan", "customer": _customer()})
        assert r.status_code == 400

    def test_custom_amount_too_low(self, auth_client):
        r = auth_client.post(f"{API}/payments/create-order",
                             json={"custom_amount": 0.5, "customer": _customer()})
        assert r.status_code == 400

    def test_custom_amount_too_high(self, auth_client):
        r = auth_client.post(f"{API}/payments/create-order",
                             json={"custom_amount": 2000000, "customer": _customer()})
        assert r.status_code == 400

    def test_no_plan_or_amount(self, auth_client):
        r = auth_client.post(f"{API}/payments/create-order",
                             json={"customer": _customer()})
        assert r.status_code == 400


# -------- Verify signature --------
class TestVerify:
    def test_bad_signature_rejected(self, auth_client):
        # First create an order
        r = auth_client.post(f"{API}/payments/create-order",
                             json={"plan_id": "drhp_starter", "customer": _customer()})
        assert r.status_code == 200
        oid = r.json()["order_id"]
        v = auth_client.post(f"{API}/payments/verify", json={
            "razorpay_order_id": oid,
            "razorpay_payment_id": "pay_FAKE1234567890",
            "razorpay_signature": "deadbeef" * 8,
        })
        assert v.status_code == 400


# -------- Transactions & Invoice (with seeded paid txn) --------
class TestInvoiceAndTransactions:
    @pytest.fixture(scope="class")
    def paid_transaction(self, auth_client, mongo_db):
        # Seed a fake paid transaction to test invoice PDF generation
        txn_id = f"txn_TEST_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        txn = {
            "transaction_id": txn_id,
            "razorpay_order_id": f"order_TEST_{uuid.uuid4().hex[:12]}",
            "razorpay_payment_id": f"pay_TEST_{uuid.uuid4().hex[:12]}",
            "user_id": auth_client.user_id,
            "plan_id": "drhp_starter",
            "plan_name": "DRHP Builder — Starter",
            "customer": _customer(),
            "amount_breakdown": {
                "subtotal": 49000.0, "cgst": 4410.0, "sgst": 4410.0,
                "igst": 0.0, "gst_total": 8820.0, "total": 57820.0, "is_igst": False,
            },
            "currency": "INR",
            "amount_paise": 5782000,
            "status": "paid",
            "invoice_number": "INV/2025-26/TEST1",
            "created_at": now,
            "paid_at": now,
            "updated_at": now,
        }
        mongo_db.payment_transactions.insert_one(txn)
        yield txn
        mongo_db.payment_transactions.delete_one({"transaction_id": txn_id})

    def test_transactions_list_includes_paid(self, auth_client, paid_transaction):
        r = auth_client.get(f"{API}/payments/transactions")
        assert r.status_code == 200
        d = r.json()
        assert "transactions" in d
        ids = [t["transaction_id"] for t in d["transactions"]]
        assert paid_transaction["transaction_id"] in ids
        # All should be status paid
        for t in d["transactions"]:
            assert t.get("status") == "paid"
            assert "_id" not in t

    def test_invoice_pdf_download(self, auth_client, paid_transaction):
        r = auth_client.get(f"{API}/payments/invoice/{paid_transaction['transaction_id']}")
        assert r.status_code == 200, f"{r.status_code} {r.text[:200]}"
        assert r.headers.get("content-type", "").startswith("application/pdf")
        assert r.content[:4] == b"%PDF"
        assert len(r.content) > 5000  # reasonable size

    def test_invoice_not_found(self, auth_client):
        r = auth_client.get(f"{API}/payments/invoice/txn_DOES_NOT_EXIST")
        assert r.status_code == 404

    def test_invoice_not_paid(self, auth_client, mongo_db):
        # Seed a "created" (unpaid) txn
        txn_id = f"txn_TEST_UNPAID_{uuid.uuid4().hex[:8]}"
        mongo_db.payment_transactions.insert_one({
            "transaction_id": txn_id, "user_id": auth_client.user_id,
            "status": "created", "plan_id": "drhp_starter", "plan_name": "x",
            "customer": _customer(),
            "amount_breakdown": {"subtotal": 100, "cgst": 9, "sgst": 9, "igst": 0,
                                 "gst_total": 18, "total": 118, "is_igst": False},
            "razorpay_order_id": "order_X", "invoice_number": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        try:
            r = auth_client.get(f"{API}/payments/invoice/{txn_id}")
            assert r.status_code == 400
        finally:
            mongo_db.payment_transactions.delete_one({"transaction_id": txn_id})
