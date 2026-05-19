# Expertflow ITAM

Internal IT Asset Management Portal built with Next.js, PostgreSQL, and Prisma.

## Quick Start

```bash
# 1. Start PostgreSQL
docker run -d --name itam-postgres -e POSTGRES_USER=itam -e POSTGRES_PASSWORD=itam_dev -e POSTGRES_DB=itam -p 5432:5432 postgres:17-alpine

# 2. Install dependencies
npm install

# 3. Setup database
npx prisma migrate dev --name init
npx prisma generate
npm run seed

# 4. Start dev server
npm run dev

# 5. Open http://localhost:3000
```

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| employee@expertflow.com | password123 | Employee |
| depthead@expertflow.com | password123 | Dept Head |
| itops@expertflow.com | password123 | IT Ops |
| assetmgr@expertflow.com | password123 | IT Asset Manager |

## Documentation

See [`docs/ITAM-Complete-Documentation.md`](docs/ITAM-Complete-Documentation.md) for full documentation.

## Tech Stack

- Next.js 16 + TypeScript
- Tailwind CSS + shadcn/ui
- NextAuth.js
- PostgreSQL + Prisma ORM
- Recharts + TanStack Table
