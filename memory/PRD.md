# SETU - IPO Readiness Platform PRD

## Project Overview
**Product Name:** SETU  
**Company:** IPO Labs  
**Platform Type:** Cloud-hosted & secure IPO-readiness platform  
**Target Market:** Indian market  
**Date Started:** Feb 17, 2026
**Last Updated:** Apr 21, 2026

### Changelog — Apr 21, 2026
- AboutPage.jsx: swapped section order — **Meet the Founders now sits above Origin Story**
- Rewrote Origin Story narrative ("A Tech Founder and a financial whiz…")
- Global font scale bumped +2 across About page; Founders section scaled +4 total (names `text-2xl`, bios `text-base`)
- Tightened vertical whitespace (section `py-10/12` → `py-8`)
- **Contact Sales & Contact Support buttons** on LandingPage now open a unified lead-gen dialog
- New component `ContactLeadDialog.jsx` — Full Name / Mobile / Email (required) + 5-module dropdown (optional: Free IPO Assessment, DRHP Builder, IPO Funding, Match-Making Platform, Business Valuation) + query textarea
- New backend endpoint `POST /api/contact/lead` — stores to `contact_leads` collection with `recipient: founders@ipo-labs.com`; ready to dispatch via Resend once API key is set (currently MOCKED, leads still captured)
- New admin endpoint `GET /api/contact/leads` for listing submissions
- **New "Contact Leads" tab in AdminCenter** — filters by type (sales/support) and status (new/contacted/closed), search by name/email/mobile, per-row status dropdown, view dialog, delete, stats strip
- New admin endpoints: `PATCH /api/contact/leads/{lead_id}` (status update) and `DELETE /api/contact/leads/{lead_id}`
- **DRHP Builder access for admins**: Sidebar & Dashboard now route admins directly to `/drhp` (real builder) instead of `/drhp1` (Coming Soon). Non-admin users still see Coming Soon. Verified with ronraj2312@gmail.com — 3 existing projects load successfully.

## Original Problem Statement
Build a complete IPO-readiness platform with:
- Google OAuth authentication (Emergent-managed)
- Dashboard with sidebar navigation
- DRHP Builder module with 13 sub-modules
- Document upload/download with OCR scanning
- Version controlled, collaborative platform
- Match Maker module for connecting with IPO professionals
- Legal and Disclaimer module for compliance
- Business Valuation module with AI-powered analysis
- Role-Based Access Control (RBAC) with Admin Panel

## Tech Stack
- **Frontend:** React 19, Tailwind CSS, ShadCN UI, Lucide Icons
- **Backend:** FastAPI, Python 3.11
- **Database:** MongoDB with GridFS
- **Authentication:** Emergent-managed Google OAuth + Email/Password (bcrypt)
- **OCR:** Gemini 2.5 Flash via Emergent LLM Key
- **AI:** GPT-5.2 via Emergent LLM Key

## Core Architecture
```
/app
├── backend/
│   ├── server.py              # Monolith (>7000 lines) - Auth, API, Admin, Routing
│   ├── valuation_engine.py    # DCF, DDM, NAV calculation engines
│   ├── drhp_import.py         # SEBI DRHP document parser
│   └── drhp_export.py         # Word/PDF export with SEBI formatting
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── AdminCenter.jsx      # RBAC Module Access + Operations + Roles + Users + Audit
│       │   ├── AdminLogin.jsx       # Dedicated admin login gate
│       │   ├── AccessDenied.jsx     # Permission denied page
│       │   ├── Dashboard.jsx        # Main dashboard with module cards
│       │   ├── ValuationModule.jsx  # Business valuation
│       │   └── Login.jsx            # Manual + Google Auth
│       ├── components/
│       │   └── Sidebar.jsx          # Navigation with RBAC visibility
│       └── App.js                   # Routing with ModuleRoute enforcement
├── memory/
│   ├── PRD.md
│   └── test_credentials.md
```

## Key DB Schema
- `users`: user_id, email, name, role, module_permissions, password_hash, auth_type
- `user_sessions`: session_id, user_id, session_token, expires_at
- `module_permissions`: {assessment: bool, matchmaker: bool, drhp: bool, funding: bool, valuation: bool}
- Default permissions: assessment=true, matchmaker=true, drhp=false, funding=false, valuation=false

## Completed Features

### Role-Based Access Control (RBAC) - Apr 16, 2026 ✅
- [x] Admin Login gate at /admin with dedicated admin credentials
- [x] AdminCenter "Module Access" tab with per-user toggle switches for 5 modules
- [x] ModuleRoute component enforces permissions at route level
- [x] Users without module access see "Access Denied" page
- [x] Admin Center hidden from non-admin users in sidebar and dropdown
- [x] Dashboard module cards use real paths (/drhp, /funding, etc.)
- [x] Backend: PUT /api/admin/users/{user_id}/permissions updates RBAC rules
- [x] Backend: GET /api/auth/me returns is_admin and module_permissions
- [x] Admin seed: admin@ipolabs.com with all permissions
- [x] 16/16 backend tests + 14/14 frontend tests passed (iteration_23.json)

### Email/Password Authentication - Apr 16, 2026 ✅
- [x] POST /api/auth/register (bcrypt, unique email, 6+ char password)
- [x] POST /api/auth/login (bcrypt, brute force protection)
- [x] Session tokens in user_sessions collection

### Business Valuation Module - Apr 15, 2026 ✅
- [x] 4-step wizard: Company Profile → Financial Data → Valuation Config → Run
- [x] DCF, NAV, Comparable, DDM calculation engines
- [x] GPT-5.2 AI analysis + risk assessment
- [x] Excel/CSV upload with AI financial data extraction
- [x] On-screen results dashboard

### Governance Assessment - Apr 6, 2026 ✅
- [x] 55 SEBI governance questions in Step 5 of Assessment Wizard
- [x] Governance score blended into IPO Readiness Score

### DRHP Output Module - Mar 21, 2026 ✅
- [x] TipTap rich-text editor with Word-like toolbar
- [x] SEBI-specific DRHP import/export pipeline
- [x] Word and PDF export with SEBI formatting
- [x] Document import with formatting preservation

### Previous Phases (Feb-Mar 2026) ✅
- Google OAuth + manual auth
- Dashboard, DRHP Builder, Command Center
- Match Maker with AI recommendations
- IPO Assessment with 4 calculators
- IPO Funding module (Pre-IPO, Post-IPO, Partners, Quiz)
- Admin Center (Operations, Roles, Permissions, Users, Audit)
- Account Details with profile management
- Legal Disclaimer and Terms of Use
- Security hardening, file upload validation, rate limiting
- Email notifications via Resend API

## Prioritized Backlog

### P0 - Critical
- [ ] Map imported Word Document to structured chapter modules
- [ ] Enforce 100% MS Word UI/UX in TipTap Editor
- [ ] DRHP Data Synchronization (Corporate Repository → DRHP Chapters)

### P1 - High Priority
- [ ] Refactor server.py monolith (7000+ lines → APIRouter modules)
- [ ] Populate remaining ~30 DRHP sub-modules with SEBI content
- [ ] Remove internal Board toggles inside DRHP modules

### P2 - Medium Priority
- [ ] Professional Registration "Next" button bug (RTA category) - recurring 4x
- [ ] Version history for sections
- [ ] Document preview in-app
- [ ] Collaborative editing

### P3 - Future
- [ ] Professional Verification API (Protean) - MOCKED
- [ ] Razorpay billing integration - MOCKED
- [ ] Real calendar API for consultation scheduling - MOCKED
- [ ] Market Analytics module
- [ ] AI-powered content suggestions

## Testing Status
- ✅ RBAC Admin Module: 16/16 backend + 14/14 frontend (iteration_23.json)
- ✅ Governance Assessment: 13/13 (iteration_20.json)
- ✅ Valuation Module: 18/18 (iteration_21.json)
- ✅ Document Upload + AI Extraction: 16/16 (iteration_22.json)
- ✅ All previous modules tested and passing
