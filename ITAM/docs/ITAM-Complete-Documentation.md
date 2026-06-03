# Expertflow ITAM — Complete Application Documentation

> **Version:** 2.0
> **Last Updated:** 2026-06-03
> **Author:** AI Development Agent

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [API Reference](#6-api-reference)
7. [Frontend Documentation](#7-frontend-documentation)
8. [Feature Documentation](#8-feature-documentation)
9. [Setup & Installation](#9-setup--installation)
10. [Deployment Guide](#10-deployment-guide)
11. [File Structure](#11-file-structure)
12. [Security & Pentest](#12-security--pentest)
13. [Changelog](#13-changelog)

---

## 1. Project Overview

**Expertflow ITAM** (IT Asset Management) is a full-stack web application built to manage the lifecycle of internal IT assets — Hardware, Software, Cloud resources, and Peripherals — at Expertflow.

### Core Purpose
- Centralized inventory (CMDB) for all IT assets
- Employee request portal with multi-stage approval workflows
- Role-based access for IT Asset Managers, IT Ops, Department Heads, and Employees
- Compliance dashboard with license tracking, aging reports, and visual analytics
- Lifecycle state management from request through retirement
- **Excel/Sheet data import and management** for legacy inventory records
- **User management** for administrators

### Brand Identity
The application follows the **Expertflow** corporate brand:
- **Primary:** `#1A50A3` (Dark Blue)
- **Success:** `#00BD82` (Green)
- **Accent:** `#F47C22` (Orange)
- **Info:** `#2491E5` (Light Blue)
- **Alert:** `#F6BF2C` (Yellow)
- **Font:** Inter (Google Fonts)

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.2.6 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **UI Components** | shadcn/ui | 4.7.0 |
| **Auth** | NextAuth.js | 4.24.14 |
| **Database** | PostgreSQL | 17 (Docker) |
| **ORM** | Prisma | 7.8.0 |
| **Forms** | React Hook Form | 7.76.0 |
| **Validation** | Zod | 4.4.3 |
| **Tables** | TanStack Table | 8.21.3 |
| **Charts** | Recharts | 3.8.1 |
| **Icons** | Lucide React | 1.16.0 |
| **Password Hashing** | bcryptjs | 3.0.3 |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         nginx (reverse proxy)               │
│              Port 80 → 3000, rate limiting, headers         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 (standalone)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Server    │  │   Server    │  │      Client         │  │
│  │  Components │  │    API      │  │    Components       │  │
│  │  (RSC)      │  │   Routes    │  │    (RCC)            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Prisma ORM + Adapter                     │
│              (@prisma/adapter-pg + pg pool)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL 17 (Docker Container)               │
│                      Port: 5432                              │
│                   Database: itam                             │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Decisions
- **App Router** with Server Components for data fetching (dashboards, tables)
- **Client Components** for interactive elements (forms, modals, charts)
- **Singleton Prisma Client** via module pattern to prevent connection exhaustion
- **Prisma 7 Config** using `prisma.config.ts` instead of inline `datasource url`
- **JWT Session Strategy** with custom claims for role-based access
- **Standalone Output** for Docker deployment (`output: "standalone"` in `next.config.ts`)
- **Security Headers** injected at Next.js layer + nginx

---

## 4. Database Schema

### Core Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│    User     │       │   AssetRequest  │       │    Asset    │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)         │◄──────┤ id (PK)     │
│ email       │       │ assetId (FK)    │  0..1 │ tag (UNQ)   │
│ name        │       │ requestedBy     │       │ title       │
│ password    │       │ department      │       │ type        │
│ role        │       │ justification   │       │ status      │
│ department  │       │ status          │       │ costCenter  │
└─────────────┘       │ urgency         │       │ department  │
        │             │ createdAt       │       │ assignedTo  │
        │             └─────────────────┘       │ purchaseDate│
        │                      │                │ warrantyExp │
        ▼                      │                │ retiredAt   │
┌─────────────┐                │                └─────────────┘
│ ApprovalLog │                │                       │
├─────────────┤                │                ┌─────────────┐
│ id (PK)     │                │                │SoftwareDetail│
│ requestId   │────────────────┘                ├─────────────┤
│ approverId  │       ┌─────────────────────────┤ id (PK)     │
│ stage       │       │                         │ assetId(FK) │
│ decision    │       │                         │ licenseType │
│ notes       │       │                         │ licenseKey  │
│ createdAt   │       │                         │ seatsTotal  │
└─────────────┘       │                         │ seatsUsed   │
                      │                         │ renewalDate │
                      │                         │ vendor      │
                      │                         └─────────────┘
                      ▼
               ┌─────────────┐
               │AssetHistory │
               ├─────────────┤
               │ id (PK)     │
               │ assetId(FK) │
               │ fromStatus  │
               │ toStatus    │
               │ changedBy   │
               │ changedAt   │
               │ notes       │
               │ type        │
               └─────────────┘
```

### Sheet Data Models (Excel Import)

The following models store legacy Excel sheet data imported into the system:

| Model | Purpose |
|-------|---------|
| **LaptopRecord** | Employee laptop assignments and specs |
| **ServerDevice** | Lab server hardware inventory |
| **Device** | General device inventory (model, serial, IP, battery, status) |
| **IloIdrac** | Server iLO/iDRAC IP and switch port mappings |
| **CloudVm** | Cloud VM inventory (IP, FQDN, SSL status, specs) |
| **LabVm** | Lab VM inventory (host, memory, DNS, SSL) |
| **PublicFqdn** | Public FQDN mappings and middleware proxies |
| **GatePass** | Asset gate pass records (issue/receive tracking) |
| **ReceivedItem** | Inventory receipt log |
| **PortDetail** | Network switch port assignments |
| **FreeVm** | Decommissioned / free VM tracking |
| **Sheet38** | Backup policy and IT policy tracking |

### Prisma Models (Core)

```prisma
enum AssetType {
  HARDWARE
  SOFTWARE
  CLOUD
  PERIPHERAL
}

enum LifecycleState {
  REQUESTED
  PROCURED
  REGISTERED
  DEPLOYED
  MAINTENANCE
  RETIRED
}

enum UserRole {
  EMPLOYEE
  DEPT_HEAD
  IT_OPS
  IT_ASSET_MANAGER
}

enum RequestStatus {
  PENDING_MANAGER
  PENDING_IT
  APPROVED
  REJECTED
}

enum Urgency {
  LOW
  MEDIUM
  HIGH
}

enum HistoryType {
  STATUS_CHANGE
  REASSIGNED
  MAINTENANCE
  OTHER
}

model User {
  id         String   @id @default(cuid())
  email      String   @unique
  name       String
  password   String?
  role       UserRole
  department String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  approvals  ApprovalLog[]
}

model Asset {
  id             String         @id @default(cuid())
  tag            String         @unique
  title          String
  type           AssetType
  status         LifecycleState @default(REGISTERED)
  costCenter     String
  department     String
  assignedTo     String?
  purchaseDate   DateTime?
  warrantyExpiry DateTime?
  retiredAt      DateTime?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  softwareDetail SoftwareDetail?
  request        AssetRequest?
  history        AssetHistory[]
}

model SoftwareDetail {
  id          String    @id @default(cuid())
  assetId     String    @unique
  asset       Asset     @relation(fields: [assetId], references: [id], onDelete: Cascade)
  licenseType String
  licenseKey  String?
  seatsTotal  Int       @default(0)
  seatsUsed   Int       @default(0)
  renewalDate DateTime?
  vendor      String
}

model AssetRequest {
  id            String        @id @default(cuid())
  assetId       String?       @unique
  asset         Asset?        @relation(fields: [assetId], references: [id], onDelete: SetNull)
  requestedBy   String
  requestedByName String?
  department    String
  justification String
  status        RequestStatus @default(PENDING_MANAGER)
  urgency       Urgency       @default(MEDIUM)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  approvals     ApprovalLog[]
}

model ApprovalLog {
  id         String       @id @default(cuid())
  requestId  String
  request    AssetRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  approverId String
  approver   User         @relation(fields: [approverId], references: [id], onDelete: Cascade)
  stage      String       // MANAGER or IT
  decision   String       // APPROVED or REJECTED
  notes      String?
  createdAt  DateTime     @default(now())
}

model AssetHistory {
  id         String         @id @default(cuid())
  assetId    String
  asset      Asset          @relation(fields: [assetId], references: [id], onDelete: Cascade)
  fromStatus LifecycleState?
  toStatus   LifecycleState
  changedBy  String
  changedAt  DateTime       @default(now())
  notes      String?
  type       HistoryType    @default(STATUS_CHANGE)
}
```

---

## 5. Authentication & Authorization

### NextAuth Configuration
- **Providers:**
  - **Credentials** (email + password) — primary
  - **Google OAuth** — auto-enabled when real `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are configured
  - **Microsoft Azure AD OAuth** — auto-enabled when real `AZURE_AD_CLIENT_ID` / `AZURE_AD_CLIENT_SECRET` are configured
- **Session Strategy:** JWT
- **Password Hashing:** bcryptjs with 10 salt rounds
- **Custom Claims:** `id`, `email`, `name`, `role`, `department`

### OAuth Security
- Domain restriction: only `@expertflow.com` emails allowed
- Google hosted domain verification (`hd` claim)
- Azure AD user allowlist support via `AZURE_AD_ALLOWED_USERS` env var
- Auto-user creation for OAuth logins with default `EMPLOYEE` role and `General` department
- Dummy/placeholder credentials are automatically detected and the provider is disabled

### Login Rate Limiting
- In-memory rate limiter per email address
- Window: 60 seconds
- Max attempts: 5 per window
- After threshold: `"Too many login attempts. Try again in X seconds."`

### Role-Based Access Control

| Role | Permissions |
|------|------------|
| **EMPLOYEE** | Submit asset requests, view own requests |
| **DEPT_HEAD** | Approve/reject requests from their department, view own requests |
| **IT_OPS** | Full asset CRUD, IT final approvals, maintenance management, sheet data management |
| **IT_ASSET_MANAGER** | Full system access: CMDB, compliance, all approvals, maintenance, user management, sheet data |

### Route Protection
- Middleware guards all `/dashboard/*` routes with JWT session check
- `/dashboard/admin` restricted to `IT_ASSET_MANAGER` only
- API layer enforces auth independently via `lib/api-auth.ts` helpers

---

## 6. API Reference

### Assets

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/assets` | GET | Any authenticated | List with pagination, filters, search |
| `/api/assets` | POST | IT Ops / Asset Mgr | Create asset + optional software detail |
| `/api/assets/:id` | GET | Any authenticated | Single asset with history |
| `/api/assets/:id` | PATCH | IT Ops / Asset Mgr | Update asset, tracks status changes |
| `/api/assets/:id` | DELETE | IT Ops / Asset Mgr | Soft delete (mark RETIRED) |

**Query Parameters (GET /api/assets):**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `type` (HARDWARE/SOFTWARE/CLOUD/PERIPHERAL)
- `status` (LifecycleState)
- `department` (string)
- `costCenter` (string)
- `q` (search across tag, title, assignedTo)

### Asset Lifecycle

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/assets/:id/maintenance` | POST | IT Ops / Asset Mgr | Set MAINTENANCE or return to DEPLOYED |
| `/api/assets/:id/reassign` | POST | IT Ops / Asset Mgr | Reassign to employee/department/cost center |

### Requests

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/requests` | GET | Any authenticated | List requests (filter by `user` email) |
| `/api/requests` | POST | Any authenticated | Create request + placeholder asset |

### Approvals

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/approvals` | GET | Any authenticated | List pending by `stage` (MANAGER/IT) |
| `/api/approvals` | POST | Any authenticated | Submit approval decision |

**Approval Body:**
```json
{
  "requestId": "string",
  "decision": "APPROVED" | "REJECTED",
  "approverId": "string",
  "stage": "MANAGER" | "IT",
  "notes": "string (optional)"
}
```

### Compliance

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/compliance` | GET | Any authenticated | KPI metrics + chart data |
| `/api/compliance/licenses` | GET | Any authenticated | License compliance table |
| `/api/compliance/aging?minAge=N` | GET | Any authenticated | Hardware aging report |

### Sheets (Excel Data Management)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/sheets/:sheet` | GET | Any authenticated | List entries for a sheet with pagination, search |
| `/api/sheets/:sheet` | POST | IT Ops / Asset Mgr | Create new entry |
| `/api/sheets/:sheet/:id` | PATCH | IT Ops / Asset Mgr | Update entry |
| `/api/sheets/:sheet/:id` | DELETE | IT Ops / Asset Mgr | Delete entry |

**Available Sheet Slugs:**
- `laptop-record` — Laptop Record
- `servers-devices` — Lab Servers
- `devices` — Devices
- `iloidrac` — iLO/iDRAC
- `cloud-vm-list` — Cloud VM List
- `lab-vm-list` — Lab VM List
- `public-fqdn` — Public FQDN
- `gatepass` — GatePass
- `received-items` — Received Items
- `ports-detail` — Ports Detail
- `free-vms` — Free VMs

**Query Parameters (GET /api/sheets/:sheet):**
- `page` (number, default: 1)
- `limit` (number, default: 25, max: 100)
- `q` (search across all string fields)

### Users

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/users` | GET | IT Asset Manager | List all users |
| `/api/users` | POST | IT Asset Manager | Create new user |
| `/api/users/:id` | PATCH | IT Asset Manager | Update user |
| `/api/users/:id` | DELETE | IT Asset Manager | Delete user |

### Health

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | Public | Database connectivity check |

---

## 7. Frontend Documentation

### Component Hierarchy

```
app/
├── layout.tsx                 # Root layout (Inter font, metadata)
├── page.tsx                   # Landing page (branded hero)
├── login/
│   └── page.tsx               # Sign-in form (credentials + OAuth)
├── dashboard/
│   ├── layout.tsx             # Sidebar shell with RBAC navigation
│   ├── page.tsx               # Role-based redirect
│   ├── employee/page.tsx      # Employee dashboard
│   ├── dept-head/page.tsx     # Dept head dashboard
│   ├── it-ops/page.tsx        # IT ops dashboard
│   ├── admin/page.tsx         # Asset manager dashboard
│   ├── assets/page.tsx        # CMDB inventory
│   ├── assets/new/page.tsx    # Create asset form
│   ├── requests/page.tsx      # My/All requests
│   ├── requests/new/page.tsx  # Submit request form
│   ├── approvals/page.tsx     # Approvals overview
│   ├── approvals/manager/page.tsx  # Manager approvals
│   ├── approvals/it/page.tsx       # IT approvals
│   ├── compliance/page.tsx         # Dashboard + charts
│   ├── compliance/licenses/page.tsx # License table
│   ├── compliance/aging/page.tsx    # Aging report
│   ├── maintenance/page.tsx         # Maintenance list
│   └── sheets/[sheet]/page.tsx      # Dynamic sheet viewer
```

### Reusable Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AssetTable` | `components/assets/asset-table.tsx` | Paginated, filterable asset list |
| `AssetDetail` | `components/assets/asset-detail.tsx` | Detail modal with history, lifecycle, maintenance, reassign |
| `AssetForm` | `components/assets/asset-form.tsx` | Create/edit asset with conditional software fields |
| `StatusTransition` | `components/assets/status-transition.tsx` | Lifecycle state dropdown with validation |
| `RequestForm` | `components/requests/request-form.tsx` | Submit new asset request |
| `RequestList` | `components/requests/request-list.tsx` | Requests table with approval actions |
| `KpiCard` | `components/compliance/kpi-card.tsx` | Metric cards with icons |
| `ComplianceCharts` | `components/compliance/charts.tsx` | Recharts pie/bar charts |
| `LicenseTable` | `components/compliance/license-table.tsx` | License compliance with health colors |
| `AgingTable` | `components/compliance/aging-table.tsx` | Hardware aging with warranty alerts |
| `MaintenanceModal` | `components/maintenance/maintenance-modal.tsx` | Set maintenance reason + completion date |
| `ReassignModal` | `components/maintenance/reassign-modal.tsx` | Reassign asset form |
| `SheetTable` | `components/sheets/sheet-table.tsx` | Generic paginated table for any sheet |
| `AddEntryModal` | `components/sheets/add-entry-modal.tsx` | Create new sheet entry |
| `EditEntryModal` | `components/sheets/edit-entry-modal.tsx` | Edit existing sheet entry |
| `UserManagementModal` | `components/users/user-management-modal.tsx` | Admin user CRUD |
| `LogoutButton` | `components/logout-button.tsx` | Sign out button |

### shadcn/ui Components Used

- Button, Input, Label, Textarea
- Table, Badge, Dialog, Card, Separator
- Select (dropdown)

---

## 8. Feature Documentation

### Epic 1: Foundation

#### Story 1.1 — Project Setup
- Next.js scaffolded with TypeScript, Tailwind, shadcn/ui
- Prisma ORM configured with PostgreSQL (Docker)
- Full database schema with enums and relations
- Health check API at `/api/health`

#### Story 1.2 — Authentication
- NextAuth.js with credentials provider + conditional Google/Azure AD OAuth
- 4 seeded demo users with bcrypt passwords
- JWT sessions with custom role/department claims
- Type-safe session via `types/next-auth.d.ts`
- Login rate limiting (5 attempts / 60 sec per email)

#### Story 1.3 — Role-Based Navigation
- Dashboard layout with persistent sidebar
- Conditional menu items per role
- Role-specific landing pages
- IT_OPS and IT_ASSET_MANAGER see dynamic Sheet menu items

### Epic 2: Asset Management (CMDB)

#### Story 2.1 — Asset CRUD API
- Full REST API with pagination, filtering, search
- Zod validation for create/update payloads
- Auto-history tracking on creation

#### Story 2.2 — Asset Inventory UI
- TanStack Table with 7 columns
- Global search + type/status dropdown filters
- Server-side pagination
- Click row → detail modal

#### Story 2.3 — Add/Edit Asset Form
- React Hook Form + Zod validation
- Conditional software detail fields (SOFTWARE/CLOUD)
- Role-gated access (IT Ops + Asset Manager only)

#### Story 2.4 — Lifecycle State Transitions
- Valid transitions enforced in UI:
  - `REQUESTED → PROCURED → REGISTERED → DEPLOYED → MAINTENANCE → RETIRED`
- Invalid transitions disabled
- Each transition writes AssetHistory record

### Epic 3: Request Portal

#### Story 3.1 — Submit Asset Request
- Form: Title, Type, Urgency, Cost Center, Justification
- Auto-creates placeholder Asset (REQUESTED) + AssetRequest (PENDING_MANAGER)

#### Story 3.2 — My Requests
- Employee sees own requests
- Asset Manager sees all requests
- Status badges: Pending (yellow), Approved (green), Rejected (red)

#### Story 3.3 — Manager Approval
- Dept Heads see pending requests from their department only
- Approve → status becomes PENDING_IT
- Reject → status becomes REJECTED

#### Story 3.4 — IT Approval
- IT Ops sees PENDING_IT requests
- Approve → status becomes APPROVED, asset becomes PROCURED
- Reject → status becomes REJECTED, asset becomes RETIRED

### Epic 4: Compliance Dashboard

#### Story 4.1 — KPI Cards
- Active Assets (excluding RETIRED)
- Pending Approvals (all stages)
- License Compliance % (seats used / total)
- Expiring Soon (warranty + licenses within 30 days)

#### Story 4.2 — Charts
- Pie: Assets by Type
- Donut: Assets by Status
- Bar: Assets by Department
- Bar: Asset Count by Cost Center

#### Story 4.3 — License Compliance
- Table: Asset, Vendor, License Type, Seats, Utilization %, Renewal Date
- Color coding: Red (>100% or ≤7 days), Yellow (>85% or ≤30 days), Green
- Sortable by utilization and renewal date
- Export to CSV

#### Story 4.4 — Asset Aging Report
- Table: Tag, Title, Department, Purchase Date, Age, Warranty Expiry, Status
- Adjustable minimum age filter (default 3 years)
- Red highlight for expired warranty

### Epic 5: Maintenance & Operations

#### Story 5.1 — Maintenance Mode
- Set asset to MAINTENANCE with reason + expected completion date
- Maintenance page lists all assets in maintenance
- "Return to Service" button changes status to DEPLOYED
- History tracked with type MAINTENANCE

#### Story 5.2 — Asset Reassignment
- Transfer asset to new employee, department, or cost center
- Transfer date + notes recorded
- History tracked with type REASSIGNED
- Audit trail visible in asset detail

### Epic 6: Sheet Data Management

#### Story 6.1 — Dynamic Sheet Viewer
- 11 Excel sheets imported into PostgreSQL via seed script
- Generic table component auto-renders any sheet's columns
- Pagination, search across all string fields
- Role-gated add/edit/delete (IT Ops + Asset Manager)

#### Story 6.2 — Sheet Configuration
- `lib/sheets.ts` defines slug → Prisma model → headers → fields mapping
- Sheets: Laptop Record, Lab Servers, Devices, iLO/iDRAC, Cloud VMs, Lab VMs, Public FQDN, GatePass, Received Items, Ports Detail, Free VMs

### Epic 7: User Management

#### Story 7.1 — Admin User CRUD
- IT Asset Manager can view all users
- Create new users with email, name, password, role, department
- Edit existing user details
- Delete users
- Accessible from Admin Dashboard via User Management modal

---

## 9. Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- Docker Desktop (for PostgreSQL)
- Windows PowerShell

### Step 1: Clone/Navigate to Project
```bash
cd D:\Bmad\ITAM
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start PostgreSQL (Docker)
```bash
docker run -d --name itam-postgres `
  -e POSTGRES_USER=itam `
  -e POSTGRES_PASSWORD=itam_dev `
  -e POSTGRES_DB=itam `
  -p 5432:5432 `
  postgres:17-alpine
```

### Step 4: Configure Environment
Create `.env`:
```env
DATABASE_URL=postgresql://itam:itam_dev@localhost:5432/itam?schema=public
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<your-random-32-char-hex>
```

Generate secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Optional OAuth (only needed for Google/Azure login):**
```env
GOOGLE_CLIENT_ID=your-real-client-id
GOOGLE_CLIENT_SECRET=your-real-client-secret
AZURE_AD_CLIENT_ID=your-real-client-id
AZURE_AD_CLIENT_SECRET=your-real-client-secret
AZURE_AD_TENANT_ID=common
AZURE_AD_ALLOWED_USERS=user1@expertflow.com,user2@expertflow.com
```

### Step 5: Database Setup
```bash
npx prisma migrate dev --name init
npx prisma generate
npm run seed
```

### Step 6: Start Development Server
```bash
npm run dev
```

### Step 7: Access Application
- **App:** http://localhost:3000
- **Health:** http://localhost:3000/api/health

---

## 10. Deployment Guide

### Build for Production
```bash
npm run build
```

### Production Environment Variables
```env
DATABASE_URL=postgresql://user:pass@prod-db:5432/itam?schema=public
NEXTAUTH_URL=https://itam.expertflow.com
NEXTAUTH_SECRET=<strong-random-secret>
NODE_ENV=production
```

### Docker Production
A `docker-compose.yml` and `nginx/nginx.conf` are provided for production deployment:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://itam:itam_dev@db:5432/itam
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - db
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: itam
      POSTGRES_PASSWORD: itam_dev
      POSTGRES_DB: itam
    volumes:
      - postgres_data:/var/lib/postgresql/data
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
volumes:
  postgres_data:
```

**Key Production Settings:**
- `output: "standalone"` in `next.config.ts` for optimized Docker image
- `poweredByHeader: false` to hide Next.js version
- Security headers injected by Next.js + nginx
- Rate limiting configured in nginx

---

## 11. File Structure

```
ITAM/
├── app/
│   ├── api/
│   │   ├── assets/
│   │   │   ├── route.ts              # GET/POST assets
│   │   │   └── [id]/
│   │   │       ├── route.ts          # GET/PATCH/DELETE single asset
│   │   │       ├── maintenance/
│   │   │       │   └── route.ts      # POST maintenance actions
│   │   │       └── reassign/
│   │   │           └── route.ts      # POST reassign asset
│   │   ├── requests/
│   │   │   └── route.ts              # GET/POST requests
│   │   ├── approvals/
│   │   │   └── route.ts              # GET/POST approvals
│   │   ├── compliance/
│   │   │   ├── route.ts              # GET dashboard metrics
│   │   │   ├── licenses/
│   │   │   │   └── route.ts          # GET license table
│   │   │   └── aging/
│   │   │       └── route.ts          # GET aging report
│   │   ├── sheets/
│   │   │   ├── [sheet]/
│   │   │   │   ├── route.ts          # GET/POST sheet entries
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # PATCH/DELETE entry
│   │   ├── users/
│   │   │   ├── route.ts              # GET/POST users
│   │   │   └── [id]/
│   │   │       └── route.ts          # PATCH/DELETE user
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts          # NextAuth handler
│   │   └── health/
│   │       └── route.ts              # Health check
│   ├── dashboard/
│   │   ├── layout.tsx                # Sidebar shell with RBAC
│   │   ├── page.tsx                  # Role redirect
│   │   ├── employee/page.tsx         # Employee dashboard
│   │   ├── dept-head/page.tsx        # Dept head dashboard
│   │   ├── it-ops/page.tsx           # IT ops dashboard
│   │   ├── admin/page.tsx            # Asset manager dashboard
│   │   ├── assets/page.tsx           # CMDB inventory
│   │   ├── assets/new/page.tsx       # Create asset
│   │   ├── requests/page.tsx         # Request list
│   │   ├── requests/new/page.tsx     # Submit request
│   │   ├── approvals/page.tsx        # Approvals overview
│   │   ├── approvals/manager/page.tsx # Manager approvals
│   │   ├── approvals/it/page.tsx     # IT approvals
│   │   ├── compliance/page.tsx       # Compliance dashboard
│   │   ├── compliance/licenses/page.tsx
│   │   ├── compliance/aging/page.tsx
│   │   ├── maintenance/page.tsx      # Maintenance list
│   │   └── sheets/[sheet]/page.tsx   # Dynamic sheet viewer
│   ├── login/page.tsx                # Sign-in page
│   ├── page.tsx                      # Landing page
│   ├── layout.tsx                    # Root layout (Inter font)
│   └── globals.css                   # Tailwind config + brand colors
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── assets/
│   │   ├── asset-table.tsx
│   │   ├── asset-detail.tsx
│   │   ├── asset-form.tsx
│   │   └── status-transition.tsx
│   ├── requests/
│   │   ├── request-form.tsx
│   │   └── request-list.tsx
│   ├── compliance/
│   │   ├── kpi-card.tsx
│   │   ├── charts.tsx
│   │   ├── license-table.tsx
│   │   └── aging-table.tsx
│   ├── maintenance/
│   │   ├── maintenance-modal.tsx
│   │   ├── reassign-modal.tsx
│   │   └── return-to-service-button.tsx
│   ├── sheets/
│   │   ├── sheet-table.tsx
│   │   ├── add-entry-modal.tsx
│   │   └── edit-entry-modal.tsx
│   ├── users/
│   │   └── user-management-modal.tsx
│   └── logout-button.tsx
├── lib/
│   ├── prisma.ts                     # Singleton Prisma client
│   ├── auth.ts                       # NextAuth config + rate limiter + OAuth
│   ├── api-auth.ts                   # API auth helpers (requireAuth, requireManager)
│   ├── session.ts                    # Server session helpers
│   ├── sheets.ts                     # Sheet configuration mapping
│   └── validations/
│       └── asset.ts                  # Zod schemas
├── prisma/
│   ├── schema.prisma                 # Full DB schema
│   ├── prisma.config.ts              # Prisma 7 config
│   ├── seed.ts                       # Demo users + sheet data seeder
│   ├── seed-data.json                # Excel sheet seed data
│   └── migrations/                   # Migration files
├── types/
│   └── next-auth.d.ts                # Session type extensions
├── nginx/
│   └── nginx.conf                    # Production nginx config
├── docs/
│   ├── ITAM-Complete-Documentation.md # This file
│   ├── Epics-and-Stories.md          # Product requirements
│   ├── Expertflow ITAM Project Specification.md
│   └── PENTEST-REPORT-2026-05-22.md  # Security audit report
├── .env                              # Environment variables
├── package.json
├── tsconfig.json
├── next.config.ts                    # Standalone output + security headers
├── middleware.ts                     # Route protection + RBAC guards
└── postcss.config.mjs
```

---

## 12. Security & Pentest

A mild penetration test was conducted on 2026-05-22 against `http://192.168.1.38:3000`. The full report is available at `docs/PENTEST-REPORT-2026-05-22.md`.

### Remediated Findings

| Severity | Finding | Status |
|----------|---------|--------|
| **HIGH** | Unauthenticated API Access | **Fixed** — All `/api/*` endpoints now require session validation via `lib/api-auth.ts` |
| **HIGH** | Missing Rate Limiting on Login | **Fixed** — In-memory rate limiter: 5 attempts / 60 sec per email |
| **HIGH** | API Lacks RBAC | **Fixed** — `requireManager()` helper restricts mutations to IT_OPS / IT_ASSET_MANAGER |
| **MEDIUM** | Missing HTTP Security Headers | **Fixed** — `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` |
| **MEDIUM** | Pagination Limit Abuse | **Fixed** — All paginated APIs cap `limit` at 100 |
| **LOW** | Server Technology Disclosure | **Fixed** — `poweredByHeader: false` in `next.config.ts` |
| **INFO** | Placeholder OAuth Credentials | **Fixed** — Dummy credentials auto-detect and disable provider |

### Positive Security Observations
- **SQL Injection:** Mitigated by Prisma ORM (parameterized queries)
- **XSS:** Mitigated by React JSX auto-escaping (no `dangerouslySetInnerHTML` with untrusted data)
- **Information Disclosure:** `.env`, source maps, Prisma schema not exposed via HTTP
- **Infrastructure:** Docker daemon socket not mounted; only port 80 exposed externally

### Current Risk Rating: LOW-MEDIUM

---

## 13. Changelog

### v2.0 — 2026-06-03
- **Added:** Excel/Sheet data management (11 sheets, generic CRUD API + UI)
- **Added:** User management module (admin-only user CRUD)
- **Added:** Google OAuth and Microsoft Azure AD OAuth support
- **Added:** Login rate limiting (5 attempts / 60 sec)
- **Added:** API authentication helpers (`lib/api-auth.ts`)
- **Added:** Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`)
- **Added:** Standalone output mode for Docker deployment
- **Added:** nginx production configuration with rate limiting
- **Fixed:** All API endpoints now require authentication
- **Fixed:** API mutations restricted to IT_OPS / IT_ASSET_MANAGER roles
- **Fixed:** Pagination capped at 100 rows across all endpoints
- **Fixed:** `X-Powered-By` header removed

### v1.0 — 2026-05-19
- Initial release with core ITAM features
- Asset management (CMDB), request portal, approval workflow, compliance dashboard
- NextAuth.js credentials authentication
- Role-based navigation and access control

---

## Appendix A: Approval Workflow

```
Employee submits request
        │
        ▼
┌─────────────────┐
│ PENDING_MANAGER │ ◄── Dept Head reviews
└─────────────────┘     (approve / reject)
        │
   approve
        │
        ▼
┌─────────────────┐
│   PENDING_IT    │ ◄── IT Ops reviews
└─────────────────┘     (approve / reject)
        │
   approve
        │
        ▼
┌─────────────────┐
│    APPROVED     │ ◄── Asset status: PROCURED
└─────────────────┘
```

## Appendix B: Asset Lifecycle

```
REQUESTED → PROCURED → REGISTERED → DEPLOYED → MAINTENANCE → RETIRED
    │           │           │            │            │           │
    └───────────┴───────────┴────────────┴────────────┴───────────┘
                        (can transition to RETIRED from any state)
```

## Appendix C: Demo Accounts

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| `employee@expertflow.com` | `password123` | Employee | Submit requests, view own requests |
| `depthead@expertflow.com` | `password123` | Dept Head | Approve dept requests, view own requests |
| `itops@expertflow.com` | `password123` | IT Ops | Asset CRUD, IT approvals, maintenance, sheets |
| `assetmgr@expertflow.com` | `password123` | IT Asset Manager | Full system access + user management |

---

*End of Documentation*
