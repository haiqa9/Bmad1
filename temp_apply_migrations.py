import paramiko
import sys

sys.stdout = open('apply_migrations.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Combine all migrations and seed data into one SQL script
sql_script = """
-- Migration 1: init
CREATE TYPE "AssetType" AS ENUM ('HARDWARE', 'SOFTWARE', 'CLOUD', 'PERIPHERAL');
CREATE TYPE "LifecycleState" AS ENUM ('REQUESTED', 'PROCURED', 'REGISTERED', 'DEPLOYED', 'MAINTENANCE', 'RETIRED');
CREATE TYPE "UserRole" AS ENUM ('EMPLOYEE', 'DEPT_HEAD', 'IT_OPS', 'IT_ASSET_MANAGER');
CREATE TYPE "RequestStatus" AS ENUM ('PENDING_MANAGER', 'PENDING_IT', 'APPROVED', 'REJECTED');
CREATE TYPE "Urgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "HistoryType" AS ENUM ('STATUS_CHANGE', 'REASSIGNED', 'MAINTENANCE', 'OTHER');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "department" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "status" "LifecycleState" NOT NULL DEFAULT 'REGISTERED',
    "costCenter" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "assignedTo" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SoftwareDetail" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "licenseKey" TEXT,
    "seatsTotal" INTEGER NOT NULL DEFAULT 0,
    "seatsUsed" INTEGER NOT NULL DEFAULT 0,
    "renewalDate" TIMESTAMP(3),
    "vendor" TEXT NOT NULL,
    CONSTRAINT "SoftwareDetail_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssetRequest" (
    "id" TEXT NOT NULL,
    "assetId" TEXT,
    "requestedBy" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING_MANAGER',
    "urgency" "Urgency" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AssetRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApprovalLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssetHistory" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "fromStatus" "LifecycleState",
    "toStatus" "LifecycleState" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "type" "HistoryType" NOT NULL DEFAULT 'STATUS_CHANGE',
    CONSTRAINT "AssetHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Asset_tag_key" ON "Asset"("tag");
CREATE UNIQUE INDEX "SoftwareDetail_assetId_key" ON "SoftwareDetail"("assetId");
CREATE UNIQUE INDEX "AssetRequest_assetId_key" ON "AssetRequest"("assetId");

ALTER TABLE "SoftwareDetail" ADD CONSTRAINT "SoftwareDetail_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetRequest" ADD CONSTRAINT "AssetRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApprovalLog" ADD CONSTRAINT "ApprovalLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AssetRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApprovalLog" ADD CONSTRAINT "ApprovalLog_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetHistory" ADD CONSTRAINT "AssetHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migration 2: add_password
ALTER TABLE "User" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';

-- Migration 3: make_password_optional
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- Prisma migration tracking table
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- Seed users
INSERT INTO "User" ("id", "email", "name", "role", "department", "createdAt", "updatedAt", "password")
VALUES
('clz001abc0001', 'employee@expertflow.com', 'Alice Employee', 'EMPLOYEE', 'Engineering', NOW(), NOW(), '$2b$10$ZF5ZvlUkciz.TmOob90tHuofGD5EVTKvYzby.1tFBHwsfSD6OQcxW'),
('clz001abc0002', 'depthead@expertflow.com', 'Bob Dept Head', 'DEPT_HEAD', 'Engineering', NOW(), NOW(), '$2b$10$ZF5ZvlUkciz.TmOob90tHuofGD5EVTKvYzby.1tFBHwsfSD6OQcxW'),
('clz001abc0003', 'itops@expertflow.com', 'Charlie IT Ops', 'IT_OPS', 'IT', NOW(), NOW(), '$2b$10$ZF5ZvlUkciz.TmOob90tHuofGD5EVTKvYzby.1tFBHwsfSD6OQcxW'),
('clz001abc0004', 'assetmgr@expertflow.com', 'Dana Asset Manager', 'IT_ASSET_MANAGER', 'IT', NOW(), NOW(), '$2b$10$ZF5ZvlUkciz.TmOob90tHuofGD5EVTKvYzby.1tFBHwsfSD6OQcxW');

-- Insert fake migration records so Prisma thinks migrations are applied
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
VALUES
('init-migration-001', 'abc123', NOW(), '20260519133524_init', 1),
('add-password-002', 'def456', NOW(), '20260519133925_add_password', 1),
('make-password-optional-003', 'ghi789', NOW(), '20260520133702_make_password_optional', 1);
"""

# Write SQL to temp file on VM
sftp = client.open_sftp()
with sftp.file('/tmp/itam_migrations.sql', 'w') as f:
    f.write(sql_script)
sftp.close()

# Execute SQL via psql
stdin, stdout, stderr = client.exec_command(
    "docker exec -i itam-postgres-prod psql -U itam -d itam < /tmp/itam_migrations.sql 2>&1"
)
result = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print("=== SQL EXECUTION ===")
print(result)
if err:
    print("STDERR:", err)

# Verify users
stdin2, stdout2, stderr2 = client.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"SELECT email, name, role FROM \\\"User\\\";\" 2>&1"
)
users = stdout2.read().decode('utf-8', errors='replace')
print("\n=== USERS ===")
print(users)

# Verify tables
stdin3, stdout3, stderr3 = client.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"\\dt\" 2>&1"
)
tables = stdout3.read().decode('utf-8', errors='replace')
print("\n=== TABLES ===")
print(tables)

client.close()
