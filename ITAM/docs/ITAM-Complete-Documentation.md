# Expertflow ITAM — Complete Application Documentation

> **Version:** 1.0  
> **Last Updated:** 2026-05-19  
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
12. [Changelog](#12-changelog)

---

## 1. Project Overview

**Expertflow ITAM** (IT Asset Management) is a full-stack web application built to manage the lifecycle of internal IT assets — Hardware, Software, Cloud resources, and Peripherals — at Expertflow.

### Core Purpose
- Centralized inventory (CMDB) for all IT assets
- Employee request portal with multi-stage approval workflows
- Role-based access for IT Asset Managers, IT Ops, Department Heads, and Employees
- Compliance dashboard with license tracking, aging reports, and visual analytics
- Lifecycle state management from request through retirement

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
│                    Next.js 16 App Router                    │
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

---

## 4. Database Schema

### Entity Relationship Diagram

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
├─────────────┤                │                       │
│ id (PK)     │                │                ┌─────────────┐
│ requestId   │────────────────┘                │SoftwareDetail│
│ approverId  │       ┌─────────────────────────├─────────────┤
│ stage       │       │                         │ id (PK)     │
│ decision    │       │                         │ assetId(FK) │
│ notes       │       │                         │ licenseType │
│ createdAt   │       │                         │ licenseKey  │
└─────────────┘       │                         │ seatsTotal  │
                      │                         │ seatsUsed   │
                      │                         │ renewalDate │
                      │                         │ vendor      │
                      │                         └─────────────┘
                      │
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

### Prisma Models

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
  password   String
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
- **Provider:** Credentials (email + password)
- **Session Strategy:** JWT
- **Password Hashing:** bcryptjs with 10 salt rounds
- **Custom Claims:** `id`, `email`, `name`, `role`, `department`

### Role-Based Access Control

| Role | Permissions |
|------|------------|
| **EMPLOYEE** | Submit asset requests, view own requests |
| **DEPT_HEAD** | Approve/reject requests from their department, view own requests |
| **IT_OPS** | Full asset CRUD, IT final approvals, maintenance management |
| **IT_ASSET_MANAGER** | Full system access: CMDB, compliance, all approvals, maintenance |

### Route Protection
Middleware guards all `/dashboard/*` routes. Unauthenticated users redirect to `/login`.

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
- `limit` (number, default: 20)
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
│   └── page.tsx               # Sign-in form
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
│   └── maintenance/page.tsx         # Maintenance list
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
- NextAuth.js with credentials provider
- 4 seeded demo users with bcrypt passwords
- JWT sessions with custom role/department claims
- Type-safe session via `types/next-auth.d.ts`

#### Story 1.3 — Role-Based Navigation
- Dashboard layout with persistent sidebar
- Conditional menu items per role
- Role-specific landing pages

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
docker run -d --name itam-postgres \
  -e POSTGRES_USER=itam \
  -e POSTGRES_PASSWORD=itam_dev \
  -e POSTGRES_DB=itam \
  -p 5432:5432 \
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

### Docker Production (Optional)
Create a `docker-compose.yml`:
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
volumes:
  postgres_data:
```

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
│   │   └── maintenance/page.tsx      # Maintenance list
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
│   └── logout-button.tsx
├── lib/
│   ├── prisma.ts                     # Singleton Prisma client
│   ├── auth.ts                       # NextAuth config
│   ├── session.ts                    # Server session helpers
│   └── validations/
│       └── asset.ts                  # Zod schemas
├── prisma/
│   ├── schema.prisma                 # Full DB schema
│   ├── prisma.config.ts              # Prisma 7 config
│   ├── seed.ts                       # Demo users seeder
│   └── migrations/                   # Migration files
├── types/
│   └── next-auth.d.ts                # Session type extensions
├── docs/
│   ├── ITAM-Complete-Documentation.md # This file
│   ├── Epics-and-Stories.md          # Product requirements
│   └── Expertflow ITAM Project Specification.md
├── .env                              # Environment variables
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── postcss.config.mjs
```

---

## 12. Demo Accounts

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| `employee@expertflow.com` | `password123` | Employee | Submit requests, view own requests |
| `depthead@expertflow.com` | `password123` | Dept Head | Approve dept requests, view own requests |
| `itops@expertflow.com` | `password123` | IT Ops | Asset CRUD, IT approvals, maintenance |
| `assetmgr@expertflow.com` | `password123` | IT Asset Manager | Full system access |

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

---

*End of Documentation*
