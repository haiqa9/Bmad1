#!/usr/bin/env python3
"""Deploy ITAM updates to VM 192.168.1.38"""
import paramiko
import os

VM_HOST = "192.168.1.38"
VM_USER = "root"
VM_PASS = "ExpertFlow123"
VM_PATH = "/opt/itam"
LOCAL_PATH = "D:/Bmad/ITAM"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VM_HOST, username=VM_USER, password=VM_PASS, timeout=10)
sftp = ssh.open_sftp()

def run(cmd, timeout=60):
    print(f"\n$ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out:
        print(out[:3000])
    if err:
        print(f"STDERR: {err[:2000]}")
    return out, err

def put_file(local_rel, remote_rel=None):
    local = os.path.join(LOCAL_PATH, local_rel.replace("/", "\\"))
    remote = f"{VM_PATH}/{remote_rel or local_rel}"
    remote_dir = os.path.dirname(remote)
    run(f"mkdir -p '{remote_dir}'")
    try:
        sftp.put(local, remote)
        print(f"  OK: {local_rel}")
        return True
    except Exception as e:
        print(f"  FAIL: {local_rel} -> {e}")
        return False

def put_dir(local_rel, remote_rel=None):
    local = os.path.join(LOCAL_PATH, local_rel.replace("/", "\\"))
    remote = f"{VM_PATH}/{remote_rel or local_rel}"
    run(f"mkdir -p '{remote}'")
    for root, dirs, files in os.walk(local):
        rel_root = os.path.relpath(root, local)
        for d in dirs:
            remote_dir = f"{remote}/{rel_root}/{d}".replace("\\", "/")
            run(f"mkdir -p '{remote_dir}'")
        for f in files:
            local_file = os.path.join(root, f)
            remote_file = f"{remote}/{rel_root}/{f}".replace("\\", "/")
            try:
                sftp.put(local_file, remote_file)
            except Exception as e:
                print(f"  FAIL: {remote_file} -> {e}")
    print(f"  OK: {local_rel}")

print("=== STEP 1: Copying source files ===")

files = [
    "prisma/schema.prisma",
    "prisma/seed.ts",
    "prisma/seed-data.json",
    "prisma.config.js",
    "lib/sheets.ts",
    "app/api/sheets/[sheet]/route.ts",
    "components/sheets/sheet-table.tsx",
    "app/dashboard/sheets/[sheet]/page.tsx",
    "app/dashboard/layout.tsx",
    "app/login/page.tsx",
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "tsconfig.json",
]

for f in files:
    put_file(f)

# Copy new migration
put_dir("prisma/migrations/20260522063527_add_excel_sheets", "prisma/migrations/20260522063527_add_excel_sheets")

print("\n=== STEP 2: Stopping containers ===")
run(f"cd {VM_PATH} && docker compose down", timeout=60)

print("\n=== STEP 3: Building app image ===")
out, err = run(f"cd {VM_PATH} && docker compose build --no-cache app", timeout=600)
if "error" in err.lower() and "error" in out.lower():
    print("Build may have failed, checking...")

print("\n=== STEP 4: Starting all containers ===")
run(f"cd {VM_PATH} && docker compose up -d", timeout=60)

print("\n=== STEP 5: Waiting for DB to be ready ===")
run(f"cd {VM_PATH} && docker compose exec -T db sh -c 'for i in $(seq 1 30); do pg_isready -U itam -d itam && exit 0; sleep 2; done; exit 1'", timeout=90)

print("\n=== STEP 6: Running Prisma migrations ===")
run(
    f"cd {VM_PATH} && docker run --rm --network itam_default "
    f"-v {VM_PATH}:/app "
    f"-e DATABASE_URL=postgresql://itam:itam_secure_pass@db:5432/itam?schema=public "
    f"-w /app node:20-alpine "
    f"sh -c 'apk add --no-cache libc6-compat && npm ci && npx prisma migrate deploy'",
    timeout=300
)

print("\n=== STEP 7: Seeding data ===")
run(
    f"cd {VM_PATH} && docker run --rm --network itam_default "
    f"-v {VM_PATH}:/app "
    f"-e DATABASE_URL=postgresql://itam:itam_secure_pass@db:5432/itam?schema=public "
    f"-w /app node:20-alpine "
    f"sh -c 'apk add --no-cache libc6-compat && npm ci && npx tsx prisma/seed.ts'",
    timeout=300
)

print("\n=== STEP 8: Verifying deployment ===")
run("docker ps --format '{{.Names}} {{.Status}}'")
run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health || echo ' HEALTH CHECK FAILED'")
run("curl -s 'http://localhost:3000/api/sheets/laptop-record?page=1&limit=1' | head -c 200")

sftp.close()
ssh.close()
print("\n=== DEPLOYMENT COMPLETE ===")
