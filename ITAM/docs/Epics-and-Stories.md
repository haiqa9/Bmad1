# Expertflow ITAM — Epics & User Stories

---

## Epic 1: Project Foundation & Authentication
> **Goal:** Scaffold the Next.js application, configure the database, and implement role-based authentication so all subsequent features have a secure base.

### Story 1.1 — Project Setup
**As a** developer, **I want** a working Next.js 14+ project with Tailwind CSS, shadcn/ui, Prisma, and PostgreSQL configured, **so that** I can begin feature development immediately.

**Acceptance Criteria:**
- [ ] `npx create-next-app@latest` initialized in `ITAM/` with App Router, TypeScript, Tailwind.
- [ ] shadcn/ui initialized with a base color theme.
- [ ] Prisma installed and `prisma/schema.prisma` created with the full ITAM schema (Asset, SoftwareDetail, AssetRequest, AssetHistory, User, ApprovalLog).
- [ ] `.env` file contains `DATABASE_URL` pointing to local PostgreSQL.
- [ ] `npm run dev` starts the app without errors.
- [ ] A health-check API route `GET /api/health` returns `{ status: "ok" }`.

---

### Story 1.2 — Authentication & RBAC
**As a** user, **I want** to log in with my email and password, **so that** I can access the ITAM portal based on my role.

**Acceptance Criteria:**
- [ ] NextAuth.js (or custom JWT) login page at `/login` with email + password form.
- [ ] Users table seeded with at least 4 sample users (1 per role: Employee, Dept Head, IT Ops, IT Asset Manager).
- [ ] Session includes `user.id`, `user.email`, `user.role`, `user.department`.
- [ ] Middleware blocks unauthenticated access to all routes under `/dashboard`, `/assets`, `/requests`, `/compliance`.
- [ ] Logout button clears the session and redirects to `/login`.

---

### Story 1.3 — Role-Based Navigation & Dashboard Shell
**As a** user, **I want** the sidebar/top-bar to show only the menu items relevant to my role, **so that** I don't see features I cannot use.

**Acceptance Criteria:**
- [ ] A persistent sidebar layout component (`app/layout.tsx`) wraps all protected routes.
- [ ] Menu items render conditionally based on `user.role`:
  - **Employee:** Request Portal, My Requests
  - **Dept Head:** Pending Approvals, My Requests
  - **IT Ops:** Pending IT Approvals, Assets, Maintenance
  - **IT Asset Manager:** All menus (Assets, Requests, Compliance, Maintenance)
- [ ] Each role lands on a distinct dashboard page after login.
- [ ] Active menu item is visually highlighted.

---

## Epic 2: Asset Management (CMDB)
> **Goal:** Provide a centralized inventory view where the IT Asset Manager can create, read, update, and track all IT assets through their lifecycle.

### Story 2.1 — Asset CRUD API
**As an** IT Asset Manager, **I want** REST API endpoints for assets, **so that** the frontend can perform full inventory operations.

**Acceptance Criteria:**
- [ ] `GET /api/assets` — list all assets with pagination (`page`, `limit`) and optional filters (`type`, `status`, `department`, `costCenter`).
- [ ] `GET /api/assets/:id` — return single asset with nested `softwareDetail` (if type = SOFTWARE/CLOUD).
- [ ] `POST /api/assets` — create a new asset (validates required fields: `tag`, `title`, `type`, `status`, `costCenter`).
- [ ] `PATCH /api/assets/:id` — update asset fields and write an `AssetHistory` record for status changes.
- [ ] `DELETE /api/assets/:id` — soft-delete (mark status `RETIRED` and set `retiredAt`).
- [ ] All endpoints return proper HTTP status codes and Zod-validated error messages.

---

### Story 2.2 — Asset Inventory UI (CMDB)
**As an** IT Asset Manager, **I want** a searchable, filterable table of all assets, **so that** I can quickly locate and manage inventory.

**Acceptance Criteria:**
- [ ] Route `/assets` displays a data table (TanStack Table) with columns: Tag, Title, Type, Status, Department, Cost Center, Assigned To.
- [ ] Global search box filters across `tag`, `title`, and `assignedTo`.
- [ ] Dropdown filters for `type` and `status`.
- [ ] Pagination controls at the bottom.
- [ ] Clicking a row opens a detail drawer/modal showing full asset info + history timeline.
- [ ] "Add Asset" button opens a form modal (Story 2.3).

---

### Story 2.3 — Add / Edit Asset Form
**As an** IT Asset Manager, **I want** a form to add or edit assets, **so that** I can keep the CMDB accurate.

**Acceptance Criteria:**
- [ ] Form fields: Tag, Title, Type (dropdown), Status (dropdown), Cost Center, Department, Assigned To (optional), Purchase Date, Warranty Expiry.
- [ ] When Type = SOFTWARE or CLOUD, additional section appears: License Type, License Key, Seats Total, Seats Used, Renewal Date, Vendor.
- [ ] Form uses React Hook Form + Zod for client-side validation.
- [ ] On submit, calls `POST /api/assets` or `PATCH /api/assets/:id`.
- [ ] Success toast notification; error toast on failure.
- [ ] Form pre-populates when editing.

---

### Story 2.4 — Lifecycle State Transitions
**As an** IT Asset Manager, **I want** to change an asset's lifecycle status via a dropdown, **so that** I can track where each asset is in its lifecycle.

**Acceptance Criteria:**
- [ ] Status dropdown in asset detail view shows allowed next states:
  - REQUESTED → PROCURED
  - PROCURED → REGISTERED
  - REGISTERED → DEPLOYED
  - DEPLOYED → MAINTENANCE
  - MAINTENANCE → DEPLOYED or RETIRED
  - (Any) → RETIRED
- [ ] Invalid transitions are disabled in the UI.
- [ ] Each transition writes an `AssetHistory` record: `assetId`, `fromStatus`, `toStatus`, `changedBy`, `changedAt`, `notes`.
- [ ] History timeline is visible in the asset detail drawer.

---

## Epic 3: Asset Request Portal
> **Goal:** Allow employees to request new IT assets and route those requests through a two-stage approval workflow.

### Story 3.1 — Submit Asset Request
**As an** Employee, **I want** to submit a request for a new asset (hardware, software, cloud), **so that** my department can procure it.

**Acceptance Criteria:**
- [ ] Route `/requests/new` shows a request form with fields:
  - Asset Type (Hardware / Software / Cloud / Peripheral)
  - Title / Description
  - Justification (textarea)
  - Preferred Cost Center (auto-filled from user's department)
  - Urgency (Low / Medium / High)
- [ ] On submit, creates an `AssetRequest` with status `PENDING_MANAGER`.
- [ ] Also creates a placeholder `Asset` record with status `REQUESTED`.
- [ ] Employee sees a confirmation message and request ID.
- [ ] Request appears in the Employee's "My Requests" list.

---

### Story 3.2 — My Requests (Employee View)
**As an** Employee, **I want** to see all requests I have submitted and their current approval status, **so that** I can track progress.

**Acceptance Criteria:**
- [ ] Route `/requests` shows a table of the current user's requests.
- [ ] Columns: Request ID, Asset Type, Title, Status, Submitted Date.
- [ ] Status badge colors: Pending = yellow, Approved = green, Rejected = red.
- [ ] Clicking a row opens detail view with full justification, approval notes, and current stage.

---

### Story 3.3 — Manager Approval (Dept Head)
**As a** Department Head, **I want** to review and approve/reject asset requests from my department, **so that** spending is controlled.

**Acceptance Criteria:**
- [ ] Route `/approvals/manager` shows a table of pending requests filtered to the Dept Head's `department`.
- [ ] Columns: Request ID, Requested By, Asset Type, Title, Justification, Urgency.
- [ ] Action buttons: **Approve** / **Reject** with a notes field.
- [ ] On Approve → `AssetRequest.status` becomes `PENDING_IT`, `managerApproval` record created.
- [ ] On Reject → `AssetRequest.status` becomes `REJECTED`, `managerApproval` record created with rejection reason.
- [ ] Employee receives notification (in-app toast on next load) of the decision.

---

### Story 3.4 — IT Approval (IT Ops / IT Asset Manager)
**As an** IT Ops user, **I want** to review manager-approved requests and give final IT approval, **so that** procurement can proceed.

**Acceptance Criteria:**
- [ ] Route `/approvals/it` shows pending IT approvals (`status = PENDING_IT`).
- [ ] Table columns: Request ID, Department, Asset Type, Title, Manager Approval Notes, Urgency.
- [ ] Action buttons: **Approve** / **Reject** with IT notes field.
- [ ] On Approve → `AssetRequest.status` becomes `APPROVED`, `itApproval` record created.
- [ ] On Reject → `AssetRequest.status` becomes `REJECTED`, `itApproval` record created.
- [ ] Approved request triggers automatic status change on linked `Asset` from `REQUESTED` → `PROCURED`.
- [ ] Rejected request changes linked `Asset` status to `RETIRED`.

---

## Epic 4: Compliance Dashboard
> **Goal:** Provide visual insights into asset compliance, license usage, and aging to support decision-making.

### Story 4.1 — Dashboard Overview Cards
**As an** IT Asset Manager, **I want** at-a-glance metric cards on the dashboard, **so that** I can quickly assess inventory health.

**Acceptance Criteria:**
- [ ] Route `/compliance` displays 4 KPI cards at the top:
  1. Total Active Assets (excluding RETIRED)
  2. Pending Approvals (all stages)
  3. License Compliance % (seatsUsed / seatsTotal across all software assets)
  4. Assets Expiring Soon (warranty or license renewal within 30 days)
- [ ] Cards update automatically when data changes.
- [ ] Each card links to the relevant filtered view.

---

### Story 4.2 — Asset Distribution Charts
**As an** IT Asset Manager, **I want** visual charts showing asset breakdowns, **so that** I can understand portfolio composition.

**Acceptance Criteria:**
- [ ] Pie chart: Assets by Type (Hardware, Software, Cloud, Peripheral).
- [ ] Bar chart: Assets by Department.
- [ ] Donut chart: Assets by Lifecycle Status.
- [ ] Stacked bar chart: Cost by Department (uses `costCenter`).
- [ ] Charts use Recharts or Tremor; responsive layout.
- [ ] Date range filter (Last 30 days / Last 90 days / All time) updates charts.

---

### Story 4.3 — License Compliance & Renewal Alerts
**As an** IT Asset Manager, **I want** a dedicated view for software/cloud assets, **so that** I can prevent compliance violations and lapses.

**Acceptance Criteria:**
- [ ] Route `/compliance/licenses` shows a table of all SOFTWARE/CLOUD assets.
- [ ] Columns: Asset Title, Vendor, License Type, Seats Total, Seats Used, Utilization %, Renewal Date.
- [ ] Color-coded rows:
  - Red: Utilization > 100% (over-allocated) or renewal within 7 days.
  - Yellow: Utilization > 85% or renewal within 30 days.
  - Green: Healthy.
- [ ] Sortable by Renewal Date and Utilization %.
- [ ] Export to CSV button.

---

### Story 4.4 — Asset Aging Report
**As an** IT Asset Manager, **I want** to see which hardware assets are aging past their useful life, **so that** I can plan replacements.

**Acceptance Criteria:**
- [ ] Route `/compliance/aging` shows a table of HARDWARE assets.
- [ ] Columns: Tag, Title, Purchase Date, Age (years), Warranty Expiry, Status.
- [ ] Filter: Age > N years (default 3).
- [ ] Red highlight for assets with expired warranty.
- [ ] Summary stat: "Total replacement cost estimate" (requires manual cost field or placeholder).

---

## Epic 5: Maintenance & Operations
> **Goal:** Support IT Ops in managing asset maintenance and keeping the CMDB healthy.

### Story 5.1 — Maintenance Mode
**As an** IT Ops user, **I want** to put an asset into Maintenance status and record notes, **so that** others know it is temporarily unavailable.

**Acceptance Criteria:**
- [ ] In asset detail view, "Set Maintenance" button available to IT Ops and IT Asset Manager roles.
- [ ] Opens a modal asking for maintenance reason and expected completion date.
- [ ] Updates asset status to `MAINTENANCE` and writes `AssetHistory` record.
- [ ] Asset appears in `/maintenance` list while in Maintenance status.
- [ ] "Return to Service" button updates status back to `DEPLOYED`.

---

### Story 5.2 — Asset Reassignment
**As an** IT Asset Manager, **I want** to reassign a deployed asset to a different employee or department, **so that** inventory stays accurate during transfers.

**Acceptance Criteria:**
- [ ] In asset detail view, "Reassign" button opens a form: New Assigned To, New Department, Transfer Date, Notes.
- [ ] Updates asset `assignedTo`, `department`, and `costCenter` fields.
- [ ] Writes `AssetHistory` record with type `REASSIGNED`.
- [ ] Audit trail visible in asset history.

---

## Epic 6: Sheet Data Management
> **Goal:** Import and manage legacy Excel sheet data within the ITAM portal for IT Ops and Asset Managers.

### Story 6.1 — Dynamic Sheet Viewer
**As an** IT Ops user, **I want** to view imported Excel sheet data in a tabular format, **so that** I can reference legacy inventory records without opening Excel files.

**Acceptance Criteria:**
- [ ] 11 sheets available: Laptop Record, Lab Servers, Devices, iLO/iDRAC, Cloud VMs, Lab VMs, Public FQDN, GatePass, Received Items, Ports Detail, Free VMs.
- [ ] Generic table component renders columns based on sheet configuration.
- [ ] Pagination (default 25 rows) and global search across all string fields.
- [ ] Sheet navigation appears in sidebar for IT_OPS and IT_ASSET_MANAGER roles.
- [ ] Routes: `/dashboard/sheets/:sheetSlug`.

### Story 6.2 — Sheet Entry CRUD
**As an** IT Asset Manager, **I want** to add, edit, and delete entries in any sheet, **so that** legacy records stay current.

**Acceptance Criteria:**
- [ ] "Add Entry" modal with fields matching the sheet schema.
- [ ] "Edit" action on each row opens pre-populated modal.
- [ ] "Delete" action with confirmation dialog.
- [ ] API endpoints: `POST /api/sheets/:sheet`, `PATCH /api/sheets/:sheet/:id`, `DELETE /api/sheets/:sheet/:id`.
- [ ] Only IT_OPS and IT_ASSET_MANAGER can mutate sheet data.

### Story 6.3 — Sheet Data Seeding
**As a** developer, **I want** to seed all Excel sheet data from JSON on setup, **so that** the system is pre-populated with existing records.

**Acceptance Criteria:**
- [ ] `prisma/seed.ts` reads `prisma/seed-data.json`.
- [ ] Maps JSON rows to Prisma models via field mapping configuration.
- [ ] Chunked inserts (500 rows at a time) for performance.
- [ ] Clears existing data before seeding to prevent duplicates.

---

## Epic 7: User Management
> **Goal:** Allow IT Asset Managers to create and manage user accounts without direct database access.

### Story 7.1 — Admin User Management
**As an** IT Asset Manager, **I want** to view, create, edit, and delete users from the admin dashboard, **so that** I can manage access without SQL.

**Acceptance Criteria:**
- [ ] Admin dashboard (`/dashboard/admin`) shows quick-link cards + User Management modal.
- [ ] User list displays: name, email, role, department.
- [ ] "Add User" form: email, name, password, role (dropdown), department.
- [ ] "Edit User" updates name, role, department.
- [ ] "Delete User" with confirmation.
- [ ] API endpoints: `GET/POST /api/users`, `PATCH/DELETE /api/users/:id`.
- [ ] Only IT_ASSET_MANAGER can access user management APIs and UI.
- [ ] Duplicate email prevention.

---

## Story Map & Priority

| Priority | Epic | Story | Complexity |
|----------|------|-------|------------|
| P0 | Epic 1 | 1.1 Project Setup | Medium |
| P0 | Epic 1 | 1.2 Authentication & RBAC | Medium |
| P0 | Epic 1 | 1.3 Role-Based Navigation | Low |
| P0 | Epic 2 | 2.1 Asset CRUD API | Medium |
| P0 | Epic 2 | 2.2 Asset Inventory UI | Medium |
| P0 | Epic 2 | 2.3 Add / Edit Asset Form | Medium |
| P1 | Epic 3 | 3.1 Submit Asset Request | Medium |
| P1 | Epic 3 | 3.2 My Requests | Low |
| P1 | Epic 3 | 3.3 Manager Approval | Medium |
| P1 | Epic 3 | 3.4 IT Approval | Medium |
| P1 | Epic 2 | 2.4 Lifecycle State Transitions | Low |
| P2 | Epic 4 | 4.1 Dashboard Overview Cards | Low |
| P2 | Epic 4 | 4.2 Asset Distribution Charts | Medium |
| P2 | Epic 4 | 4.3 License Compliance & Renewal Alerts | Medium |
| P2 | Epic 4 | 4.4 Asset Aging Report | Low |
| P3 | Epic 5 | 5.1 Maintenance Mode | Low |
| P3 | Epic 5 | 5.2 Asset Reassignment | Low |
| P2 | Epic 6 | 6.1 Dynamic Sheet Viewer | Medium |
| P2 | Epic 6 | 6.2 Sheet Entry CRUD | Medium |
| P2 | Epic 6 | 6.3 Sheet Data Seeding | Low |
| P2 | Epic 7 | 7.1 Admin User Management | Medium |

---

## Database Quick Reference

```
User              → id, email, name, role, department
Asset             → id, tag, title, type, status, costCenter, department, assignedTo, purchaseDate, warrantyExpiry
SoftwareDetail    → id, assetId, licenseType, licenseKey, seatsTotal, seatsUsed, renewalDate, vendor
AssetRequest      → id, assetId, requestedBy, department, justification, status, urgency, createdAt
ApprovalLog       → id, requestId, approverId, stage, decision, notes, createdAt
AssetHistory      → id, assetId, fromStatus, toStatus, changedBy, changedAt, notes, type
```

---

*Generated for Expertflow ITAM. Next step: pick a story to implement, or create a PRD/Architecture document.*
