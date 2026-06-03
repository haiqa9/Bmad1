#!/usr/bin/env python3
"""Deploy ITAM updates to VM 192.168.1.38"""
import paramiko
import os
import zipfile
import io

VM_HOST = "192.168.1.38"
VM_USER = "root"
VM_PASS = "ExpertFlow123"
VM_PATH = "/opt/itam"

LOCAL_PATH = "D:/Bmad/ITAM"

# Files to copy (relative to ITAM root)
FILES_TO_COPY = [
    "prisma/schema.prisma",
    "prisma/seed.ts",
    "prisma/seed-data.json",
    "prisma/extract_excel.py",
    "prisma.config.js",
    "lib/sheets.ts",
    "app/api/sheets/[sheet]/route.ts",
    "components/sheets/sheet-table.tsx",
    "app/dashboard/sheets/[sheet]/page.tsx",
    "app/dashboard/layout.tsx",
    "app/login/page.tsx",
    "package.json",
    "next.config.ts",
    "tsconfig.json",
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VM_HOST, username=VM_USER, password=VM_PASS, timeout=10)
sftp = ssh.open_sftp()

def run(cmd, timeout=30):
    print(f"\n$ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out:
        print(out[:2000])
    if err:
        print(f"STDERR: {err[:1000]}")
    return out, err

print("=== 1. Checking VM state ===")
run("docker ps --format '{{.Names}}'")

print("\n=== 2. Copying files ===")
for rel_path in FILES_TO_COPY:
    local = os.path.join(LOCAL_PATH, rel_path.replace("/", "\\"))
    remote = f"{VM_PATH}/{rel_path}"
    remote_dir = os.path.dirname(remote)
    
    if not os.path.exists(local):
        print(f"  SKIP (not found): {rel_path}")
        continue
    
    # Ensure remote directory exists
    run(f"mkdir -p '{remote_dir}'")
    
    try:
        sftp.put(local, remote)
        print(f"  OK: {rel_path}")
    except Exception as e:
        print(f"  FAIL: {rel_path} -> {e}")

# Also copy the migration SQL
migration_dir = os.path.join(LOCAL_PATH, "prisma", "migrations")
if os.path.exists(migration_dir):
    for item in os.listdir(migration_dir):
        local_item = os.path.join(migration_dir, item)
        remote_item = f"{VM_PATH}/prisma/migrations/{item}"
        if os.path.isdir(local_item):
            run(f"mkdir -p '{remote_item}'")
            for sub in os.listdir(local_item):
                local_sub = os.path.join(local_item, sub)
                remote_sub = f"{remote_item}/{sub}"
                if os.path.isfile(local_sub):
                    try:
                        sftp.put(local_sub, remote_sub)
                        print(f"  OK: prisma/migrations/{item}/{sub}")
                    except Exception as e:
                        print(f"  FAIL: {item}/{sub} -> {e}")

print("\n=== 3. Stopping containers ===")
run(f"cd {VM_PATH} && docker compose down", timeout=60)

print("\n=== 4. Rebuilding app ===")
run(f"cd {VM_PATH} && docker compose build --no-cache app", timeout=300)

print("\n=== 5. Starting containers ===")
run(f"cd {VM_PATH} && docker compose up -d", timeout=60)

print("\n=== 6. Waiting for DB ===")
run(f"cd {VM_PATH} && docker compose exec -T db pg_isready -U itam -d itam", timeout=30)

print("\n=== 7. Running migrations ===")
# Run prisma migrate deploy using a temporary node container with the app code mounted
run(
    f"cd {VM_PATH} && docker run --rm --network itam_default "
    f"-v {VM_PATH}/prisma:/app/prisma "
    f"-v {VM_PATH}/prisma.config.js:/app/prisma.config.js "
    f"-v {VM_PATH}/package.json:/app/package.json "
    f"-v {VM_PATH}/package-lock.json:/app/package-lock.json "
    f"-v {VM_PATH}/node_modules:/app/node_modules "
    f"-e DATABASE_URL=postgresql://itam:itam_secure_pass@db:5432/itam?schema=public "
    f"-w /app node:20-alpine sh -c 'npm ci && npx prisma migrate deploy'",
    timeout=300
)

print("\n=== 8. Seeding data ===")
run(
    f"cd {VM_PATH} && docker run --rm --network itam_default "
    f"-v {VM_PATH}:/app "
    f"-e DATABASE_URL=postgresql://itam:itam_secure_pass@db:5432/itam?schema=public "
    f"-w /app node:20-alpine sh -c 'npm ci && npx tsx prisma/seed.ts'",
    timeout=300
)

print("\n=== 9. Verifying ===")
run("docker ps --format '{{.Names}}'")
run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health || echo ' health check failed'")

sftp.close()
ssh.close()
print("\n=== DEPLOYMENT COMPLETE ===")
