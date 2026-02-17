# IntelliEngine - IPO Readiness Platform PRD

## Project Overview
**Product Name:** IntelliEngine  
**Company:** IPO Labs  
**Platform Type:** Cloud-hosted & secure IPO-readiness platform  
**Target Market:** Indian market  
**Date Started:** Feb 17, 2026

## Original Problem Statement
Build a complete IPO-readiness platform with:
- Google OAuth authentication (Emergent-managed)
- Dashboard with sidebar navigation
- DRHP Builder module with 13 sub-modules
- Document upload/download with OCR scanning
- Version controlled, collaborative platform

## User Personas
1. **CFOs** - Need to manage IPO documentation and financial reporting
2. **Company Secretaries** - Handle compliance and regulatory matters
3. **Investment Bankers** - Track IPO progress and due diligence
4. **Founders/Promoters** - Monitor overall IPO readiness

## Core Requirements (Static)
- [x] User authentication with Google OAuth
- [x] Multi-tenant architecture
- [x] Session management with secure cookies
- [x] Project (IPO) management
- [x] DRHP Builder with 13 sections
- [x] Document upload to GridFS
- [x] Document download
- [x] OCR processing with AI (Gemini)
- [x] Section content editing
- [x] Status tracking (Draft/Review/Final)
- [x] Progress tracking

## Tech Stack
- **Frontend:** React 19, Tailwind CSS, ShadCN UI, Lucide Icons
- **Backend:** FastAPI, Python 3.11
- **Database:** MongoDB with GridFS
- **Authentication:** Emergent-managed Google OAuth
- **OCR:** Gemini 2.5 Flash via Emergent LLM Key

### Phase 2 - Match Maker Module (Feb 17, 2026)
1. **Match Maker Landing Page (Practo-style)**
   - 11 professional categories with icons and descriptions
   - Hero section with search bar
   - Stats bar (500+ Experts, 11 Categories, 100+ Cities, 200+ IPOs)
   - "Register as Professional" CTA
   - How It Works section

2. **Professional Search & Discovery**
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
- ✅ Frontend integration tests passed (95%)
- ✅ Authentication flow tested
- ✅ CRUD operations tested
- ✅ Document upload/download tested
- ✅ OCR processing tested

## Next Tasks
1. Add rich text editor for DRHP sections
2. Implement version history
3. Add document preview
4. Build PDF export functionality
5. Implement email/password auth
