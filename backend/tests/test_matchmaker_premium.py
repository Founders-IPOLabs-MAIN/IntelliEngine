"""
Backend tests for the new MatchMaker Premium flow.

Covers:
- Pricing endpoint math (1999 + 18% GST = 2358.82)
- Expertise catalog (15 areas with primary/secondary specs)
- Mock Razorpay: initiate-order, verify-payment, duplicate prevention
- save-advanced-data validation (missing primary, confidentiality required)
- File upload (PDF/JPG/PNG) + size & extension rejection
- Soft-delete (sets is_deleted, scheduled_purge_at, archives)
- my-data + audit-log read endpoints
- Auth enforcement (401 on unauthenticated requests)
"""
import io
import os
import time
import uuid
import pytest
import requests

_default_backend = None
try:
    with open("/app/frontend/.env") as _f:
        for _ln in _f:
            if _ln.startswith("REACT_APP_BACKEND_URL="):
                _default_backend = _ln.split("=", 1)[1].strip()
                break
except Exception:
    pass
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _default_backend).rstrip("/")
API = f"{BASE_URL}/api"


# ---------------- Helpers / Fixtures ----------------

@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    return s


@pytest.fixture(scope="module")
def fresh_user(session):
    """Create a brand-new test user via /api/auth/register and authenticate."""
    suffix = uuid.uuid4().hex[:10]
    email = f"TEST_premium_{suffix}@example.com"
    password = "TestPass@123"
    r = session.post(f"{API}/auth/register",
                     json={"email": email, "password": password, "name": "TEST Premium User"})
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    data = r.json()
    token = data["session_token"]
    user_id = data["user"]["user_id"]
    return {"email": email, "password": password, "token": token, "user_id": user_id}


@pytest.fixture(scope="module")
def auth_headers(fresh_user):
    return {"Authorization": f"Bearer {fresh_user['token']}"}


@pytest.fixture(scope="module")
def registered_expert(session, auth_headers, fresh_user):
    """Register the user as an expert (multipart form, no profile picture)."""
    files = {
        "full_name": (None, "TEST Premium Expert"),
        "mobile":    (None, "9876543210"),
        "email":     (None, fresh_user["email"]),
        "city":      (None, "Mumbai"),
        "state":     (None, "Maharashtra"),
        "address":   (None, "Test Address"),
        "pincode":   (None, "400001"),
        "ipo_experience": (None, "yes"),
        "years_of_experience": (None, "5"),
        "expertise_areas": (None, '["ca_auditor"]'),
    }
    r = session.post(f"{API}/matchmaker/expert/register",
                     files=files, headers=auth_headers)
    assert r.status_code == 200, f"expert register failed: {r.status_code} {r.text}"
    return r.json()["profile"]


# Cleanup at end of module
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data(fresh_user):
    yield
    try:
        from pymongo import MongoClient
        mclient = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
        dbn = os.environ.get("DB_NAME", "test_database")
        mdb = mclient[dbn]
        uid = fresh_user["user_id"]
        for coll in ["users", "user_sessions", "expert_profiles",
                     "matchmaker_premium_profiles", "matchmaker_audit_log",
                     "matchmaker_payment_orders", "matchmaker_identifier_files",
                     "matchmaker_deleted_archive"]:
            mdb[coll].delete_many({"user_id": uid})
        mclient.close()
    except Exception as e:
        print(f"cleanup warning: {e}")


# ---------------- Pricing ----------------

class TestPricing:
    def test_pricing_math(self, session):
        r = session.get(f"{API}/matchmaker/expert/premium/pricing")
        assert r.status_code == 200
        d = r.json()
        assert d["base_price"] == 1999.00
        assert d["gst_percent"] == 18
        assert d["gst_amount"] == 359.82
        assert d["total_amount"] == 2358.82
        assert d["currency"] == "INR"
        assert d["validity_days"] == 365


# ---------------- Expertise Catalog ----------------

class TestExpertiseCatalog:
    def test_catalog_has_15_areas(self, session):
        r = session.get(f"{API}/matchmaker/expert/premium/expertise-catalog")
        assert r.status_code == 200
        areas = r.json()["areas"]
        assert isinstance(areas, list)
        assert len(areas) == 15
        # Each area has the expected shape
        for a in areas:
            assert "id" in a and "label" in a
            assert "primary" in a and isinstance(a["primary"], list)
            assert "secondary" in a and isinstance(a["secondary"], list)
        # Spot-check ca_auditor
        ca = next(a for a in areas if a["id"] == "ca_auditor")
        keys = {f["key"] for f in ca["primary"]}
        assert {"icai_membership_no", "udin", "pan"}.issubset(keys)


# ---------------- Auth enforcement ----------------

class TestAuth:
    def test_initiate_order_requires_auth(self):
        r = requests.post(f"{API}/matchmaker/expert/premium/initiate-order")
        assert r.status_code == 401

    def test_my_data_requires_auth(self):
        r = requests.get(f"{API}/matchmaker/expert/premium/my-data")
        assert r.status_code == 401


# ---------------- Mock Razorpay flow ----------------

class TestPaymentFlow:
    def test_initiate_order_requires_expert_profile(self, session, auth_headers):
        # Before registering as expert, should 404
        r = session.post(f"{API}/matchmaker/expert/premium/initiate-order",
                         headers=auth_headers)
        assert r.status_code == 404

    def test_initiate_order_after_expert_registered(self, session, auth_headers,
                                                     registered_expert):
        r = session.post(f"{API}/matchmaker/expert/premium/initiate-order",
                         headers=auth_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["amount"] == 2358.82
        assert d["currency"] == "INR"
        assert d["is_mock"] is True
        assert d["order_id"].startswith("order_mock_")
        # stash for next test
        pytest.shared_order_id = d["order_id"]

    def test_verify_payment_marks_premium(self, session, auth_headers):
        order_id = pytest.shared_order_id
        r = session.post(f"{API}/matchmaker/expert/premium/verify-payment",
                         headers=auth_headers,
                         json={"order_id": order_id,
                               "razorpay_payment_id": "pay_mock_test",
                               "razorpay_signature": "sig_mock"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert "premium_expires_at" in d
        # Confirm via my-data
        my = session.get(f"{API}/matchmaker/expert/premium/my-data",
                         headers=auth_headers).json()
        assert my["is_premium"] is True
        assert my["premium_expires_at"] is not None

    def test_initiate_order_rejects_already_premium(self, session, auth_headers):
        r = session.post(f"{API}/matchmaker/expert/premium/initiate-order",
                         headers=auth_headers)
        assert r.status_code == 400
        assert "already" in r.json().get("detail", "").lower()

    def test_verify_payment_idempotent_rejects_duplicate(self, session, auth_headers):
        order_id = pytest.shared_order_id
        r = session.post(f"{API}/matchmaker/expert/premium/verify-payment",
                         headers=auth_headers,
                         json={"order_id": order_id})
        assert r.status_code == 400


# ---------------- Save advanced data ----------------

class TestSaveAdvancedData:
    def test_missing_confidentiality_rejected(self, session, auth_headers):
        r = session.post(f"{API}/matchmaker/expert/premium/save-advanced-data",
                         headers=auth_headers,
                         json={
                             "firm_name": "TEST Firm",
                             "primary_area": "ca_auditor",
                             "primary_identifiers": {
                                 "icai_membership_no": "123456",
                                 "udin": "12345678901234567A",
                                 "pan": "ABCDE1234F",
                             },
                             "secondary_identifiers": {},
                             "confidentiality_accepted": False,
                         })
        assert r.status_code == 400
        assert "confidentiality" in r.json()["detail"].lower()

    def test_missing_primary_identifier_rejected(self, session, auth_headers):
        r = session.post(f"{API}/matchmaker/expert/premium/save-advanced-data",
                         headers=auth_headers,
                         json={
                             "firm_name": "",
                             "primary_area": "ca_auditor",
                             "primary_identifiers": {"icai_membership_no": "123456"},
                             "secondary_identifiers": {},
                             "confidentiality_accepted": True,
                         })
        assert r.status_code == 400
        assert "missing" in r.json()["detail"].lower() or "mandatory" in r.json()["detail"].lower()

    def test_invalid_primary_area_rejected(self, session, auth_headers):
        r = session.post(f"{API}/matchmaker/expert/premium/save-advanced-data",
                         headers=auth_headers,
                         json={
                             "firm_name": "",
                             "primary_area": "not_a_real_area",
                             "primary_identifiers": {},
                             "secondary_identifiers": {},
                             "confidentiality_accepted": True,
                         })
        assert r.status_code == 400

    def test_save_advanced_data_success_and_persists(self, session, auth_headers,
                                                     fresh_user):
        payload = {
            "firm_name": "TEST CA Firm LLP",
            "primary_area": "ca_auditor",
            "primary_identifiers": {
                "icai_membership_no": "123456",
                "udin": "12345678901234567A",
                "pan": "ABCDE1234F",
            },
            "secondary_identifiers": {
                "firm_frn": "FRN9999",
            },
            "confidentiality_accepted": True,
        }
        r = session.post(f"{API}/matchmaker/expert/premium/save-advanced-data",
                         headers=auth_headers, json=payload)
        assert r.status_code == 200, r.text
        d = r.json()["data"]
        assert d["firm_name"] == "TEST CA Firm LLP"
        assert d["primary_area"] == "ca_auditor"
        assert d["primary_identifiers"]["pan"] == "ABCDE1234F"

        # GET to verify persistence
        my = session.get(f"{API}/matchmaker/expert/premium/my-data",
                         headers=auth_headers).json()
        assert my["premium_data"] is not None
        assert my["premium_data"]["firm_name"] == "TEST CA Firm LLP"
        assert my["premium_data"]["primary_identifiers"]["udin"] == "12345678901234567A"


# ---------------- File upload / delete ----------------

class TestFileUpload:

    def test_reject_invalid_extension(self, session, auth_headers):
        r = session.post(
            f"{API}/matchmaker/expert/premium/upload-file",
            headers=auth_headers,
            data={"identifier_key": "pan", "identifier_type": "primary",
                  "primary_area": "ca_auditor"},
            files={"file": ("evil.zip", b"PK\x03\x04zipdata", "application/zip")},
        )
        assert r.status_code == 400
        assert "type" in r.json()["detail"].lower() or "allowed" in r.json()["detail"].lower()

    def test_reject_oversized_file(self, session, auth_headers):
        big = b"A" * (5 * 1024 * 1024 + 100)  # 5 MB + 100 bytes
        r = session.post(
            f"{API}/matchmaker/expert/premium/upload-file",
            headers=auth_headers,
            data={"identifier_key": "pan", "identifier_type": "primary",
                  "primary_area": "ca_auditor"},
            files={"file": ("big.pdf", big, "application/pdf")},
        )
        assert r.status_code == 400
        assert "5" in r.json()["detail"] or "size" in r.json()["detail"].lower()

    def test_upload_pdf_success(self, session, auth_headers):
        pdf_bytes = b"%PDF-1.4\n%TestPDF\n" + b"0" * 200
        r = session.post(
            f"{API}/matchmaker/expert/premium/upload-file",
            headers=auth_headers,
            data={"identifier_key": "pan", "identifier_type": "primary",
                  "primary_area": "ca_auditor"},
            files={"file": ("pan_card.pdf", pdf_bytes, "application/pdf")},
        )
        assert r.status_code == 200, r.text
        rec = r.json()["file"]
        assert rec["file_id"].startswith("mmf_")
        assert rec["filename"] == "pan_card.pdf"
        assert rec["identifier_type"] == "primary"
        assert rec["is_deleted"] is False
        pytest.shared_file_id = rec["file_id"]
        pytest.shared_gridfs_id = rec["gridfs_id"]

    def test_uploaded_file_in_my_data(self, session, auth_headers):
        my = session.get(f"{API}/matchmaker/expert/premium/my-data",
                         headers=auth_headers).json()
        files = my["files"]
        assert any(f["file_id"] == pytest.shared_file_id for f in files)

    def test_gridfs_bucket_segregation(self, fresh_user):
        """Verify the file is in matchmaker_uploads bucket, not fs.files."""
        from pymongo import MongoClient
        mclient = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
        mdb = mclient[os.environ.get("DB_NAME", "test_database")]
        # Should be in matchmaker_uploads.files
        from bson import ObjectId
        gid = ObjectId(pytest.shared_gridfs_id)
        in_mm = mdb["matchmaker_uploads.files"].find_one({"_id": gid})
        in_default = mdb["fs.files"].find_one({"_id": gid})
        mclient.close()
        assert in_mm is not None, "File should live in matchmaker_uploads bucket"
        assert in_default is None, "File should NOT be in default fs.files bucket"
        assert in_mm["metadata"]["user_id"] == fresh_user["user_id"]
        assert in_mm["metadata"]["identifier_key"] == "pan"

    def test_soft_delete_file(self, session, auth_headers):
        fid = pytest.shared_file_id
        r = session.delete(f"{API}/matchmaker/expert/premium/file/{fid}",
                           headers=auth_headers)
        assert r.status_code == 200, r.text
        assert "scheduled_purge_at" in r.json()

        # File should no longer show up in active files list
        my = session.get(f"{API}/matchmaker/expert/premium/my-data",
                         headers=auth_headers).json()
        assert not any(f["file_id"] == fid for f in my["files"])

    def test_archive_collection_has_record(self, fresh_user):
        from pymongo import MongoClient
        mclient = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
        mdb = mclient[os.environ.get("DB_NAME", "test_database")]
        rec = mdb["matchmaker_deleted_archive"].find_one(
            {"file_id": pytest.shared_file_id}
        )
        mclient.close()
        assert rec is not None
        assert rec.get("is_deleted") is True
        assert rec.get("scheduled_purge_at") is not None

    def test_delete_again_rejected(self, session, auth_headers):
        r = session.delete(
            f"{API}/matchmaker/expert/premium/file/{pytest.shared_file_id}",
            headers=auth_headers)
        assert r.status_code == 400


# ---------------- Audit log ----------------

class TestAuditLog:
    def test_audit_log_has_entries(self, session, auth_headers):
        r = session.get(f"{API}/matchmaker/expert/premium/audit-log",
                        headers=auth_headers)
        assert r.status_code == 200
        logs = r.json()["logs"]
        actions = {log["action"] for log in logs}
        # We've done order, verify, save, upload, delete in this run
        assert "premium_order_initiated" in actions
        assert "premium_payment_verified" in actions
        assert "advanced_data_created" in actions
        assert "identifier_file_uploaded" in actions
        assert "identifier_file_deleted" in actions
