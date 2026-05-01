# SETU - IPO Readiness Platform PRD

## Project Overview
**Product Name:** SETU  
**Company:** IPO Labs  
**Platform Type:** Cloud-hosted & secure IPO-readiness platform  
**Target Market:** Indian market  
**Date Started:** Feb 17, 2026
**Last Updated:** May 1, 2026

### Changelog — May 1, 2026
- **Razorpay Payments + GST Tax-Invoice Module (Live Test mode)**:
  - New "Payments" tab in landing-page navigation (next to Pricing) → routes to `/payments` (login-required)
  - New `/app/backend/routes/payments.py` exposing: `GET /api/payments/plans`, `GET /api/payments/config`, `POST /api/payments/create-order`, `POST /api/payments/verify`, `GET /api/payments/transactions`, `GET /api/payments/invoice/{transaction_id}`
  - 5 predefined plans (DRHP Starter ₹49 K / Professional ₹99 K, Valuation Pro ₹24 999, Match-Making Premium ₹14 999, Assessment Premium ₹9 999) + custom amount support
  - Full India GST handling: 18 % auto-applied; CGST 9 % + SGST 9 % for intra-state, IGST 18 % for inter-state (driven by customer state code)
  - All Razorpay payment methods enabled: UPI, Cards, Net-banking, Wallets, EMI, PayLater
  - Payment-signature HMAC-SHA256 verification on backend before marking paid
  - Confirmation dialog with full breakdown shown BEFORE Razorpay opens (Pay button disabled until confirm)
  - Processing overlay spinner; explicit success state with green checkmark + downloadable PDF invoice
  - Tax-Invoice PDF generated with WeasyPrint: SETU/IPO Labs logo, "IPO Labs AI Private Limited", GSTIN 27AAICI7059Q1ZO, sequential `INV/<FY>/NNNNN` numbering, customer KYC + GSTIN, full GST split, paid badge
  - Razorpay test keys configured in `/app/backend/.env`
  - Test suite: `/app/backend/tests/test_payments_module.py` (16/16 tests pass; 100 % FE checks)

### Changelog — Apr 28, 2026
- **Assessment Landing Page Redesigned**: Unified to match DRHP Builder & IPO Funding dark theme layout. Black background, sticky header, features bar, hero section, 2/3 module cards grid (Pre-IPO, IPO Valuation, Post-IPO, Custom) + 1/3 right sidebar (How It Works, Quick Start, Disclaimer). All 4 public module landing pages now share the same visual system.
- **Match-Making Landing Page Redesigned**: Removed footer, added features bar, How It Works, Quick Start, and Disclaimer right sidebar. Realigned to 2/3 + 1/3 grid matching Funding page layout. Updated hero text to "Connect with IPO Companies & Subject-Matter Experts."

### Changelog — Apr 24, 2026
- **Major Backend Refactoring Complete**: Monolithic `server.py` (8,328 lines) split into 16 modular route files under `/app/backend/routes/`. Zero behavior changes — all endpoints identical.
- New `shared.py` (586 lines) containing all shared DB connections, models, auth helpers, config constants
- New slim `server.py` (153 lines) as thin orchestrator using `include_router()`
- Regression test suite created: `/app/backend/tests/test_refactor_endpoints.py` (34 tests, 100% pass)
- **Admin Access Restriction**: Hard rule enforced — only 4 approved emails (founders.ipolabs@gmail.com, ronraj2312@gmail.com, neeraj@emergent.sh, cajagrutisahu@gmail.com) can login as Admin, access Admin Center, and Account Details
  - Backend: `is_approved_admin()` function checks user_type=internal OR admin role OR CENTRAL_ADMIN_EMAILS
  - Login response now includes `is_admin` flag
  - Frontend `/account` route restricted to admin users
  - Sidebar hides Admin Center / Account Details for non-admins
  - Test suite: `/app/backend/tests/test_admin_access_restriction.py` (8 tests, 100% pass)
- **Syncfusion .NET Service Deployed**: Self-hosted .NET 8 service at port 8090 for .docx → SFDT conversion. Managed via supervisor.
  - Pre-converts documents on upload (stored in GridFS for instant loading)
  - Proxy endpoint at `/api/doceditor/Import` routes through FastAPI backend
  - Max upload size increased to 10MB across the platform
  - All DRHP Output pages default to Syncfusion Document Editor mode with full MS Word features
- **Expert Registration System (Full Feature)**:
  - Expert Registration form: Full Name, Profile Pic (JPG/PNG, 2MB), Mobile, Email, City, State, Address, Pincode, IPO Experience (Yes/No with years dropdown), Area of Expertise (15 SEBI-aligned roles, max 3 selections)
  - Free Submit → auto-populates Experts browse page
  - Premium Option → Mocked Razorpay payment popup → Advanced Verification page
  - Advanced Verification: Per-expertise primary/secondary identifiers from SEBI regulatory framework. At least 1 fully verified profile = Verified badge
  - Premium badge for paid users, both Premium + Verified for verified users
  - Experts Browse Page redesigned: Rectangular scrollable cards, search filters (City, Expertise, Premium, Verified), "Contact Me" per expert, no AI matchmaking references

### Changelog — Apr 21, 2026
- AboutPage.jsx: swapped section order — Meet the Founders now sits above Origin Story
- Rewrote Origin Story narrative
- Contact Sales & Contact Support buttons on LandingPage now open a unified lead-gen dialog
- New component `ContactLeadDialog.jsx`
- New backend endpoint `POST /api/contact/lead`
- New admin endpoint `GET /api/contact/leads`, `PATCH`, `DELETE`
- New "Contact Leads" tab in AdminCenter
- DRHP Builder access for admins (bypassing Coming Soon)
- IPO Funding access for admins (bypassing Coming Soon)
- Document Repository + Project Audit Log in Command Center
- DRHP Profile Selector (Merchant Banker, Company, CA Firm) + board_type schemas
- Restored legacy DRHP projects by backfilling user_login_type
- Updated DRHP Command Center to filter buttons by board_type
- Built SEBI Document Repository with nested sub-items
- Built Project Audit Logs
- Added WaveDotsBackground.jsx to Landing Page
- Landing Page right-column redesign
- Added empty AdvisorsPage.jsx + Nav link
- Fiverr-style redesign of Match-Making Landing Page
- Fixed backend 500 error in `/api/assessment/calculate`

## Code Architecture (Post-Refactor Apr 24, 2026)
```
/app
├── backend/
│   ├── server.py              # Thin orchestrator (153 lines) - App, CORS, startup/shutdown
│   ├── shared.py              # Shared dependencies (586 lines) - DB, models, auth, config
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py            # Auth endpoints (login, register, OAuth, password reset)
│   │   ├── projects.py        # Project CRUD + DRHP sections
│   │   ├── documents.py       # Document upload/download/OCR + corporate repository
│   │   ├── drhp.py            # DRHP content, progress, export, output, images
│   │   ├── matchmaker.py      # All matchmaker endpoints (professionals, wallet, connections)
│   │   ├── funding.py         # IPO Funding (pre/post-IPO, quiz, consultation)
│   │   ├── assessment.py      # IPO Assessment (SEBI eligibility, valuation, governance)
│   │   ├── admin.py           # Admin RBAC (roles, users, permissions, registrations)
│   │   ├── account.py         # Account profile, subscription, billing
│   │   ├── command_center.py  # Command center, meetings, company data, checklists
│   │   ├── trackers.py        # Pre-IPO tracker, Non-DRHP tracker
│   │   ├── market.py          # Market indices
│   │   ├── valuation.py       # Business valuation module
│   │   ├── careers.py         # Career positions, applications
│   │   ├── contact.py         # Contact leads (sales/support)
│   │   └── document_repository.py  # SEBI document repository + audit logs
│   ├── valuation_engine.py    
│   ├── drhp_checklist_seed.py
│   ├── drhp_import.py
│   ├── drhp_export.py
│   └── tests/
│       ├── test_refactor_endpoints.py  # 34 regression tests for refactored routes
│       └── ... (other test files)
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ContactLeadDialog.jsx
│       │   └── WaveDotsBackground.jsx
│       ├── pages/
│       │   ├── AdminCenter.jsx
│       │   ├── LandingPage.jsx
│       │   ├── MatchMakingLanding.jsx
│       │   ├── DRHPUserTypeSelector.jsx
│       │   ├── DRHPLandingPage.jsx
│       │   ├── CommandCenter.jsx
│       │   ├── DocumentRepository.jsx
│       │   ├── ProjectAuditLog.jsx
│       │   └── AdvisorsPage.jsx
│       └── App.js
```

## Completed Features
- IPO Assessment Module (SEBI eligibility, PE/DCF valuation, governance scoring)
- DRHP Builder (profile selector, command center, document repository, sections, content editor)
- Match-Making Platform (professional registration, search, connections, wallet, AI matching)
- IPO Funding Module (pre/post-IPO options, eligibility quiz, AI fitment, consultation booking)
- Business Valuation Module (multi-method: DCF, NAV, comparable, DDM)
- Admin Center (RBAC, user management, audit logs, registration approval, contact leads)
- Account Management (profile, subscription plans - billing mocked via Razorpay)
- Landing Page (animated background, corporate video placeholder, contact dialogs)

## Pending Issues
1. **P2**: RTA Professional Registration "Next" button bug (recurring x4, not started)

## Upcoming Tasks
- **P0**: DRHP Data Synchronization (backend sync Corporate Repository → DRHP Chapters)
- **P1**: Map Imported Word Document to Structured Chapter Modules
- **P1**: Enforce 100% MS Word UI/UX in TipTap Editor
- **P1**: Populate remaining ~30 DRHP sub-modules with editable SEBI standard content

## Future/Backlog
- Implement Professional Verification API (Protean MCA21/GSTN)
- Implement full billing integration with Razorpay
- Populate Pricing Page (needs user data)
- Populate Advisors Page (needs user content direction)

## Key Technical Notes
- **Frontend:** React, Tailwind CSS, Shadcn/UI
- **Backend:** Python, FastAPI (modular routes), Motor (Async MongoDB), GridFS
- **Authentication:** Emergent-managed Google Auth + local bcrypt email/password
- **3rd Party:** Emergent LLM Key, Resend (mocked), Razorpay (mocked)

## Test Credentials
- Admin: admin@ipolabs.com / admin@123
- Master Admin: ronraj2312@gmail.com / Admin123
- Default Admin: founders.ipolabs@gmail.com / Admin1234
