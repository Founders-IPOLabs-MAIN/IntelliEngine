# SETU Test Credentials

## Admin Accounts
- **Platform Admin**: admin@ipolabs.com / admin@123
- **Master Admin (Ronak)**: ronraj2312@gmail.com / Admin123
- **Founders Admin**: founders.ipolabs@gmail.com / Admin1234

## Central Admin Emails (auto-promoted to master_admin on login → unrestricted cross-user access)
- ronraj2312@gmail.com
- founders.ipolabs@gmail.com
- cajagrutisahu@gmail.com
- neeraj@emergent.sh  (added Feb 2026 — Google OAuth, auto-promoted on first login)

## Cross-User Admin Endpoints (Central admins only)
- `GET /api/projects`                                          → returns ALL users' projects
- `GET /api/projects/{project_id}`                             → ANY user's project
- `GET /api/projects/deleted/list`                             → ALL users' archived projects
- `GET /api/projects/{project_id}/document-repository`         → ANY user's repository
- `GET /api/admin/users/{target_user_id}/drhp-onboarding`      → fetch any user's onboarding profile
- `GET /api/admin/users/{target_user_id}/projects`             → list a specific user's projects
- `GET /api/admin/audit/cross-user-access`                     → audit trail of every admin cross-user action
- `GET /api/payments/transactions`                             → ALL users' transactions
- `GET /api/valuation/projects`                                → ALL users' valuation projects
- `GET /api/assessment/history`                                → ALL users' assessments

## Test Users Created by Testing Agent
- (none currently)
