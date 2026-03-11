# IntelliEngine - IPO Readiness Platform PRD

## Project Overview
**Product Name:** IntelliEngine  
**Company:** IPO Labs  
**Platform Type:** Cloud-hosted & secure IPO-readiness platform  
**Target Market:** Indian market  
**Date Started:** Feb 17, 2026
**Last Updated:** Feb 28, 2026

## Original Problem Statement
Build a complete IPO-readiness platform with:
- Google OAuth authentication (Emergent-managed)
- Dashboard with sidebar navigation
- DRHP Builder module with 13 sub-modules
- Document upload/download with OCR scanning
- Version controlled, collaborative platform
- Match Maker module for connecting with IPO professionals
- Legal and Disclaimer module for compliance

## User Personas
1. **CFOs** - Need to manage IPO documentation and financial reporting
2. **Company Secretaries** - Handle compliance and regulatory matters
3. **Investment Bankers** - Track IPO progress and due diligence
4. **Founders/Promoters** - Monitor overall IPO readiness
5. **IPO Professionals** - CAs, CSs, CFOs, Legal experts registering on the platform

## Core Requirements (Static)
- [x] User authentication with Google OAuth
- [x] Multi-tenant architecture
- [x] Session management with secure cookies
- [x] Project (IPO) management
- [x] DRHP Builder with 13 sections
- [x] Document upload to GridFS
- [x] Document download
- [x] OCR processing with AI (GPT-5.2 Vision)
- [x] Section content editing
- [x] Status tracking (Draft/Review/Final)
- [x] Progress tracking
- [x] Match Maker module with AI recommendations
- [x] Legal Disclaimer and Terms of Use pages
- [x] Click-wrap agreement for professional registration
- [x] Command Center Dashboard
- [x] Data Capture Modules (Company Data, Promoter, KMP, Pre-IPO Tracker)

## Tech Stack
- **Frontend:** React 19, Tailwind CSS, ShadCN UI, Lucide Icons
- **Backend:** FastAPI, Python 3.11
- **Database:** MongoDB with GridFS
- **Authentication:** Emergent-managed Google OAuth
- **OCR:** Gemini 2.5 Flash via Emergent LLM Key

### Phase 3 - Legal and Disclaimer Module (Feb 18, 2026) ✅
1. **Legal Disclaimer Page** (`/legal-disclaimer`)
   - General Nature of the Platform section
   - No Investment or Financial Advice section
   - Professional Matchmaking section
   - AI & Technology Limitations section
   - Privacy & Data Security section

2. **Terms of Use Page** (`/terms-of-use`)
   - Representation of Professional Standing section
   - Strict Prohibition of Illegal Solicitation section
   - Integrity of AI-Human Interaction section
   - Confidentiality & Data Protection section
   - Indemnity & Limitation of Liability section

3. **Global Footer Component**
   - Appears on all protected/authenticated pages
   - Links to Legal Disclaimer and Terms of Use
   - IntelliEngine branding with copyright

4. **Dashboard Legal Links**
   - Dedicated legal links section with icons
   - Links to Legal Disclaimer and Terms of Use

5. **Click-Wrap Agreement**
   - Added to Professional Registration Step 3
   - Mandatory checkbox for Terms of Use acceptance
   - Links open in new tabs
   - Submit button disabled until terms accepted

### Phase 4 - IPO Funding Module (Feb 18, 2026) ✅
1. **Funding Landing Page** (`/funding`)
   - Disclaimer popup on first visit (DPDP Act 2023 compliant)
   - 4 pillar cards: Pre-IPO Funding, Post-IPO Funding, Our Funding Partners, Funding Eligibility Quiz
   - "Human + AI Powered Funding Engine" branding
   - Stats bar and How It Works section

2. **Pre-IPO Funding Page** (`/funding/pre-ipo`)
   - 6 funding options: Angel & Seed, VC, PE, Bridge Financing, Mezzanine, Pre-IPO Placement
   - Interactive cards with jargon-free explanations
   - AI Funding Fitment Calculator (3-question quick assessment)
   - Expert Consultation booking with MOCKED calendar

3. **Post-IPO Funding Page** (`/funding/post-ipo`)
   - 5 funding options: FPO, Rights Issue, QIP, Preferential Allotment, NCDs
   - Same interaction pattern as Pre-IPO
   - AI Fitment and Expert Consultation features

4. **Funding Partners Directory** (`/funding/partners`)
   - 4 tabs: Investment Banks, HNI Networks, Sovereign Wealth Funds, Banks
   - Real Indian partners data (Kotak Mahindra Capital, ICICI Securities, SBI, Indian Angel Network, ADIA, GIC, etc.)
   - External links to partner websites

5. **AI-Powered Eligibility Quiz** (`/funding/quiz`)
   - Multi-step wizard (max 6 questions)
   - Adapts for Pre-IPO vs Post-IPO funding
   - 3-tier scoring: High Readiness (80-100), Potentially Ready (50-79), Early Stage (<50)
   - AI Profile Summary generation using GPT-5.2
   - Action buttons based on tier (VIP booking, standard call, toolkit download)

6. **Backend APIs**
   - GET /api/funding/pre-ipo-options - 6 Pre-IPO funding options
   - GET /api/funding/post-ipo-options - 5 Post-IPO funding options
   - GET /api/funding/partners - All partner categories
   - GET /api/funding/quiz-questions - Quiz questions by funding type
   - POST /api/funding/quiz-evaluate - AI-powered quiz evaluation
   - POST /api/funding/ai-fitment - Quick 3-question AI assessment
   - POST /api/funding/book-consultation - Expert consultation booking
   - POST /api/funding/disclaimer-consent - Record user consent
   - GET /api/funding/available-slots - MOCKED calendar slots

### Phase 5 - IPO Assessment Module (Feb 18, 2026) ✅
1. **Assessment Landing Page** (`/assessment`)
   - Features overview: 4 calculators, SEBI eligibility, AI analysis, Readiness score
   - How It Works section with 4 steps
   - Calculator previews with descriptions
   - SEBI Mainboard vs SME criteria overview

2. **Assessment Wizard** (`/assessment/start`)
   - 5-step multi-step form with progress bar
   - Step 1: Company Info (Type, Target Board, Reporting Unit)
   - Step 2: P&L Data (3 years: PAT, EBITDA, Revenue with tabs)
   - Step 3: Balance Sheet (Debt, Cash, NTA 3yrs, Net Worth 3yrs, D&A, CapEx, WC Change)
   - Step 4: Projections (Growth Rate, WACC, Terminal Growth)
   - Step 5: Market Data (Industry P/E, Peer P/E, Issue Type, Dilution %)

3. **Assessment Results Page** (`/assessment/results/:id`)
   - Readiness Score with visual circular indicator (0-100)
   - 3-tier status: Ready (75+), Requires 1-2 Years Planning (50-74), Not Eligible (<50)
   - Valuation Summary: Average valuation, Suggested price band, Issue size
   - 4 Calculator Cards:
     - P/E Valuation: PAT × Industry P/E Multiple
     - DCF Valuation: 5-year FCF projections + Gordon Growth terminal value
     - FCFE: PAT + D&A - CapEx - ΔWC
     - Issue Size: Valuation × Dilution %
   - SEBI Eligibility Check with pass/fail for each criterion
   - AI-Powered Gap Analysis using GPT-5.2 (restricted to website services)
   - CTA buttons to Match Maker, DRHP Builder, and Funding modules

4. **Backend APIs**
   - POST /api/assessment/calculate - Run all 4 calculators + AI analysis
   - GET /api/assessment/history - User's assessment history
   - GET /api/assessment/{id} - Specific assessment details

### Phase 7 - Command Center Dashboard (Feb 19, 2026) ✅
1. **Command Center Page** (`/project/:projectId/command-center`)
   - Premium fintech-style dark theme dashboard
   - Launches automatically when any IPO project is opened
   - Replaces direct DRHP Builder navigation

2. **KPI Ribbon (Top Header)**
   - IPO Readiness Score: Radial gauge (0-100%)
   - Days to Filing: Countdown to Dec 31, 2026
   - Active Intermediaries: Avatar indicators for online team members
   - Critical Delays: Pulsing red notification badge
   - Upcoming Meetings: List with dates
   - Upcoming Deadlines: Priority-based list

3. **Module Progress Tracking (Bento Grid)**
   - 13 Chapter Status Cards with mini-progress bars
   - Click-to-edit deep linking to section editor
   - Readiness Heatmap: Compact grid showing Drafting/Review/Final status

4. **Compliance Status Hub**
   - Overall Progress bar
   - Gap Analysis: Missing SEBI disclosures count
   - Delayed Modules: Red flag indicators with AI-generated tooltips (GPT-5.2)

5. **Version Control & Audit Trail ("Pulse" Feed)**
   - Version History Panel: 5 recent saves with Compare button
   - Immutable Audit Trail: Vertical timeline with timestamps

6. **Communication Layer**
   - Team Directory: Searchable member list with status indicators
   - Quick Schedule: Modal for scheduling calls (Topic, Date, Time)
   - MOCKED Google Meet links

7. **Interactive Features**
   - Hover Intelligence: AI-generated delay explanations
   - "Generate DRHP Draft" button: Pulsing animation at 90%+ readiness
   - Fixed bottom "Open DRHP Builder" button

8. **Backend APIs**
   - GET /api/projects/{id}/command-center - Full dashboard data
   - POST /api/projects/{id}/schedule-meeting - Schedule meeting (MOCKED Meet link)
   - GET /api/projects/{id}/meetings - List project meetings
   - POST /api/projects/{id}/ai-delay-explanation - AI-powered delay analysis

### Phase 6 - Admin Center & Account Details (Feb 18, 2026) ✅
1. **Admin Center** (`/admin`)
   - **Roles Tab**: 4 default roles (Super Admin max 3, Admin, Editor, Viewer) with descriptions
   - **Permissions Tab**: Permission matrix (8 features × 4 roles) with R/W/D indicators
   - **Users Tab**: User list with role badges, search, and role assignment
   - **Audit Log Tab**: Action history with filters (action type, module)
   - **Assign Role Dialog**: Email-based user search and role assignment

2. **Account Details** (`/account`)
   - **Profile Tab**: Edit name, phone, address, company name, designation
   - **Profile Picture**: Upload with GridFS storage (max 5MB), camera icon button
   - **Security Tab**: Google OAuth status, password change disabled for OAuth users
   - **Billing Tab** (MOCKED with Razorpay placeholders):
     - Current plan display (Free, Starter, Professional, Enterprise)
     - Upgrade/Cancel subscription buttons
     - Transaction history with invoice download
     - MOCKED notice about Razorpay integration

3. **Backend APIs**
   - GET /api/admin/roles - All roles with permissions
   - GET /api/admin/features - 8 platform features
   - GET /api/admin/permission-matrix - Full permission matrix
   - GET /api/admin/users - User list with role details
   - POST /api/admin/users/assign-role - Assign role to user
   - GET /api/admin/audit-logs - Audit logs with filters
   - GET /api/account/profile - User profile
   - PUT /api/account/profile - Update profile
   - POST /api/account/profile-picture - Upload picture (GridFS)
   - GET /api/account/subscription - Current subscription
   - GET /api/account/subscription/plans - Available plans
   - POST /api/account/subscription/upgrade - MOCKED upgrade
   - POST /api/account/subscription/cancel - MOCKED cancel
   - GET /api/account/billing/transactions - MOCKED transactions

### Phase 2 - Match Maker Module (Feb 17, 2026)
1. **Match Maker Landing Page (Practo-style)**
   - **AI-Powered Match Making Engine** branding
   - 11 professional categories with icons and descriptions
   - Hero section with "Get AI Recommendations" CTA
   - Stats bar (500+ Experts, 11 Categories, 100+ Cities, 200+ IPOs)
   - "Register as Professional" CTA
   - How It Works section (AI-powered)

2. **AI-Powered Matching System** ⭐ NEW
   - AI recommendation dialog with comprehensive form:
     - Company Name & Sector
     - Current Stage (Pre-IPO/Assessment/Drafting/Filing)
     - Target Exchange (SME/Mainboard)
     - Estimated Issue Size & Timeline
     - Specific Services Needed (multi-select tags)
     - Preferred Cities (multi-select)
     - Additional Context
   - Gemini AI analysis via Emergent LLM key
   - Returns:
     - AI Analysis Summary with matching strategy
     - Top 5 recommended professionals with match scores (0-100)
     - Detailed match reasoning for each professional
     - Key strengths and recommended services
     - Additional AI advice

3. **Professional Search & Discovery**
   - City selection dialog
   - Advanced filtering sidebar:
     - Category filter
     - Years of Experience (1-5, 5-10, 10+)
     - IPO Experience (5+ IPOs, SME Specialist, Mainboard Specialist)
     - Subject Matter Expertise tags
     - Verified Only filter
   - Profile cards with name, agency, rating, expertise, experience, locations
   - Action buttons: View Profile, Book Call, Send Enquiry
   - Pagination support

3. **Professional Profile Page**
   - Detailed profile header with photo, rating, verification badge
   - Services Offered with pricing
   - IPO Track Record
   - Contact Information
   - Certifications (SEBI, CA/CS memberships)
   - Reviews section with Write Review functionality
   - Book Consultation dialog (video/audio/in-person)
   - Send Enquiry dialog

4. **Professional Registration (3-step wizard)**
   - Step 1: Basic Info (category, name, agency, email, mobile)
   - Step 2: Professional Details (locations, experience, summary, expertise tags, certifications)
   - Step 3: Services & Consent (DPDP Act 2023 compliance)

5. **Backend APIs**
   - GET /api/matchmaker/categories - 11 professional categories
   - GET /api/matchmaker/cities - 24 Indian cities
   - GET /api/matchmaker/expertise-tags - 16 expertise tags
   - GET /api/matchmaker/professionals - Search with filters
   - POST /api/matchmaker/professionals - Register as professional
   - PUT /api/matchmaker/professionals/:id - Update profile
   - POST /api/matchmaker/enquiry - Send enquiry
   - POST /api/matchmaker/consultation - Book consultation
   - POST /api/matchmaker/professionals/:id/review - Add review

## What's Been Implemented ✅

### Phase 1 MVP (Feb 17, 2026)
1. **Authentication System**
   - Google OAuth integration via Emergent Auth
   - Session management with httpOnly cookies
   - Protected routes with auth verification
   - User profile display

2. **Dashboard**
   - Welcome banner with IntelliEngine branding
   - Platform modules grid (5 modules - DRHP Builder active)
   - IPO Projects listing with progress
   - Create new project dialog

3. **DRHP Builder**
   - All 13 SEBI-compliant sections with descriptions:
     - Cover Page: Basic issuer info, company name, logo, contacts, lead managers, registrar
     - Definitions and Abbreviations: Technical terms used throughout DRHP
     - Risk Factors: Internal, external, business, regulatory, legal, financial risks
     - Introduction and Summary: Offer overview, issue type, business & industry summary
     - Capital Structure: Authorized/paid-up capital, pre/post-IPO shareholding
     - Objects of the Issue: Fund utilization - debt, capex, working capital
     - Basis for Issue Price: Qualitative/quantitative factors, peer comparison
     - Industry Overview: Market size, growth trends, competitive landscape
     - Business Overview: Business model, operations, products, strategies
     - Management & Promoter Group: Directors, KMPs, promoter details
     - Financial Information: Restated financials, balance sheet, P&L, cash flow
     - Legal and Regulatory Matters: Litigation, tax disputes, regulatory actions
     - Other Information/Disclosures: Material contracts, approvals, disclosures
   - Progress tracking per project
   - Status badges (Draft/Review/Final)
   - Document upload and download capabilities per section

4. **Section Editor (Task 4 - Enhanced)**
   - **Structured Form Fields** specific to each section type:
     - Cover Page: Company name, logo URL, addresses, contacts, lead managers, registrar
     - Risk Factors: 6 risk categories (internal, external, business, regulatory, legal, financial)
     - Capital Structure: Authorized capital, paid-up capital, shareholding patterns
     - Objects of Issue: Fund utilization breakdown with amounts
     - Financial Info: Revenue trends, profit trends, key ratios, MD&A
     - And more for all 13 sections
   - **Tabs UI**: Structured Form tab + Notes & OCR tab
   - Document upload via drag & drop or click
   - Document list with file info
   - OCR processing trigger
   - Document download
   - Document delete
   - Status change dropdown
   - Save functionality

5. **Sidebar Navigation**
   - IntelliEngine branding
   - Navigation items with icons
   - User profile section
   - Logout functionality

## Database Schema

### Users Collection
```json
{
  "user_id": "user_xxx",
  "email": "string",
  "name": "string",
  "picture": "string",
  "role": "Editor|Admin|Viewer",
  "company_id": "string|null",
  "created_at": "datetime"
}
```

### Projects Collection
```json
{
  "project_id": "proj_xxx",
  "user_id": "user_xxx",
  "company_name": "string",
  "sector": "string",
  "current_stage": "Assessment|Drafting|Filed",
  "progress_percentage": 0-100,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### DRHP Sections Collection
```json
{
  "section_id": "sec_xxx",
  "project_id": "proj_xxx",
  "section_name": "string",
  "content": {},
  "last_edited_by": "user_id",
  "status": "Draft|Review|Final",
  "documents": ["doc_id1", "doc_id2"],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Documents Collection
```json
{
  "document_id": "doc_xxx",
  "user_id": "user_xxx",
  "project_id": "proj_xxx",
  "section_id": "sec_xxx",
  "filename": "string",
  "content_type": "string",
  "gridfs_id": "ObjectId string",
  "ocr_text": "string|null",
  "ocr_status": "pending|processing|completed|failed",
  "file_size": "int",
  "created_at": "datetime"
}
```

## API Endpoints

### Authentication
- `POST /api/auth/session` - Process OAuth session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project

### DRHP Sections
- `GET /api/projects/{id}/sections` - List sections
- `GET /api/projects/{id}/sections/{sec_id}` - Get section
- `PUT /api/projects/{id}/sections/{sec_id}` - Update section

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List documents
- `GET /api/documents/{id}/download` - Download document
- `DELETE /api/documents/{id}` - Delete document
- `POST /api/documents/{id}/ocr` - Process OCR

## Prioritized Backlog

### P0 - Critical (Next)
- [ ] Rich text editor for section content (Quill/TipTap)
- [ ] Auto-save functionality
- [ ] Email/Password authentication
- [ ] Password reset flow

### P1 - High Priority
- [ ] Version history for sections
- [ ] Document preview in-app
- [ ] Export DRHP as PDF
- [ ] Collaborative editing (real-time)
- [ ] Comments/annotations on sections

### P2 - Medium Priority
- [ ] Free IPO Assessment module
- [ ] IPO Funding module
- [ ] IPO Match Maker module
- [ ] Market Analytics module
- [ ] Company profile management
- [ ] Team member management

### P3 - Future Enhancements
- [ ] AI-powered content suggestions
- [ ] SEBI compliance checker
- [ ] Automated financial data import
- [ ] Investor roadshow module
- [ ] Integration with stock exchanges

## Design System
- **Primary Color:** Twitter Blue (#1DA1F2)
- **Background:** Minimalist White (#FFFFFF)
- **Typography:** Inter font family
- **Style:** Sophisticated Minimalist, Engineering-focused
- **Layout:** Bento Grid, Card-based

## Testing Status
- ✅ Backend API tests passed (100%)
- ✅ Frontend integration tests passed (100%)
- ✅ Authentication flow tested
- ✅ CRUD operations tested
- ✅ Document upload/download tested
- ✅ OCR processing tested
- ✅ Match Maker module tested
- ✅ Legal and Disclaimer module tested (iteration_5.json - 20/20 tests passed)
- ✅ IPO Funding module tested (iteration_6.json - 51/51 tests passed)
- ✅ IPO Assessment module tested (iteration_7.json - 32/32 tests passed)
- ✅ Admin Center & Account Details tested (iteration_8.json - 40/40 tests passed)

## Bug Fixes

### Mar 9, 2026 - Professional Registration & Browse All Fixes
**Issue 1:** "Browse All Professionals" button/API returning 404 error
**Root Cause:** FastAPI route ordering bug - `/{professional_id}` route was defined before `/all` route, so "all" was being matched as a professional_id
**Fix Applied:** Moved `/matchmaker/professionals/all` route definition BEFORE `/{professional_id}` route in server.py
**Files Modified:** `/app/backend/server.py`

**Issue 2:** Browse All Professionals page crashing with SelectItem empty value error
**Root Cause:** shadcn/ui Select component does not allow empty string as value for SelectItem
**Fix Applied:** Changed `value=""` to `value="all"` for category and city filters, added transformation in onValueChange
**Files Modified:** `/app/frontend/src/pages/BrowseAllProfessionals.jsx`

**Issue 3:** Sonner Toast component failing due to next-themes dependency
**Root Cause:** The sonner.jsx component imported `useTheme` from `next-themes` which doesn't work in standard React apps
**Fix Applied:** Removed next-themes import, hardcoded theme to "light"
**Files Modified:** `/app/frontend/src/components/ui/sonner.jsx`

### Feb 19, 2026 - Navigation Bug Fix
**Issue:** Admin Center and Account Settings navigation links not working after clicking.
**Root Cause:** In `/app/frontend/src/components/Sidebar.jsx`:
  1. `DropdownMenuItem` components were using `onClick` instead of `onSelect` (Radix UI's preferred handler)
  2. Navigation buttons were missing explicit `type="button"` attribute
**Fix Applied:**
  - Changed `onClick` to `onSelect` for all `DropdownMenuItem` components (Account Details, Admin Center, Logout)
  - Added `type="button"` to all sidebar navigation buttons
  - Made onClick handler more explicit with proper conditional check
**Files Modified:** `/app/frontend/src/components/Sidebar.jsx`

## Next Tasks
1. Implement Market & DRHP Analytics module
2. Add rich text editor for DRHP sections
3. Implement version history
4. Add document preview
5. Build PDF export functionality
6. Integrate Razorpay for real billing (currently MOCKED)
7. Integrate real calendar API for consultation scheduling (currently MOCKED)

## Completed in Latest Session (Feb 18, 2026)
- ✅ Legal Disclaimer page and Terms of Use pages
- ✅ Global footer with legal links
- ✅ Click-wrap agreement on Professional Registration
- ✅ IPO Funding module (4 pillars: Pre-IPO, Post-IPO, Partners, Quiz)
- ✅ IPO Assessment module (4 calculators, SEBI eligibility, AI gap analysis)
- ✅ Admin Center (Roles, Permissions, Users, Audit Log)
- ✅ Account Details (Profile, Security, Billing with MOCKED Razorpay)
- ✅ All tests passed (100%)

## Completed in Latest Session (Mar 9, 2026)
- ✅ Fixed "Browse All Professionals" button - route ordering bug in backend
- ✅ Fixed SelectItem empty value error in BrowseAllProfessionals.jsx
- ✅ Fixed Sonner toast component (removed broken next-themes dependency)
- ✅ Master Admin approval workflow verified working (Approve/Reject/Re-apply)
- ✅ Professional Registration form "Next" button verified working across all 5 steps
- ✅ RTA category registration flow verified working
- ✅ All 21 tests passed (iteration_9.json)
- ✅ **NEW: Email Notifications for Professional Registration**
  - Automatic email sent to professional on approval/rejection/re-apply
  - Copy sent to Master Admin (ronraj2312@gmail.com)
  - Manual "Send Email" button in Admin Center for each registration
  - Email configuration status indicator in Admin Center
  - Uses Resend API for transactional emails
  - HTML-formatted professional emails with IntelliEngine branding
- ✅ **NEW: State-wise Professional View in MatchMaker**
  - "Skip for now" button shows ALL professionals grouped by state (alphabetically)
  - City selection dialog now groups cities by state
  - Collapsible/expandable state sections
  - View toggle: "City View" vs "All States"
  - Clicking specific city filters to only that city's professionals
  - All 10 UI tests passed (iteration_10.json)
- ✅ **Removed Emergent Branding**
  - Removed "Made with Emergent" badge from bottom-right corner
  - Updated page title to "IntelliEngine | IPO Readiness Platform"
  - Updated meta description
- ✅ **NEW: Centralised Corporate Repository & Document Upload with OCR**
  - Added "Centralised Corporate Repository" header in Command Center
  - Added document upload box with OCR in all 5 checklist modules:
    - Company Data (blue theme)
    - Promoter Checklist (purple theme)
    - KMP Checklist (green theme)
    - Pre-IPO Tracker (orange theme)
    - Non-DRHP Tracker (indigo theme)
  - Supports PDF, Word, Excel, JPEG, PNG formats (max 10MB)
  - Auto-extracts data using Gemini AI OCR
  - Data syncs automatically to all relevant DRHP modules
  - New backend endpoints: `/upload-document-ocr`, `/corporate-repository`

## Testing Status
- ✅ Backend API tests passed (100%)
- ✅ Frontend integration tests passed (100%)
- ✅ Professional Registration form (all 5 steps) - PASS
- ✅ Browse All Professionals page - PASS (after fix)
- ✅ Master Admin Approval workflow - PASS
- ✅ Toast notifications - PASS (after sonner fix)
