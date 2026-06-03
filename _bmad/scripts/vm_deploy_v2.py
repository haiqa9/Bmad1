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

def put_file(local_rel, remote_rel=None):
    local = os.path.join(LOCAL_PATH, local_rel.replace("/", "\\"))
    remote = f"{VM_PATH}/{remote_rel or local_rel}"
    remote_dir = os.path.dirname(remote)
    try:
        sftp.mkdir(remote_dir)
    except:
        pass
    try:
        sftp.put(local, remote)
        print(f"  OK: {local_rel}")
    except Exception as e:
        print(f"  FAIL: {local_rel} -> {e}")

print("=== Copying files ===")
files = [
    "prisma/schema.prisma",
    "prisma/seed-data.json",
    "prisma/seed-raw.js",
    "prisma/seed.ts",
    "prisma.config.js",
    "lib/sheets.ts",
    "app/api/sheets/[sheet]/route.ts",
    "components/sheets/sheet-table.tsx",
    "components/sheets/add-entry-modal.tsx",
    "app/dashboard/layout.tsx",
    "app/login/page.tsx",
    "package.json",
    "next.config.ts",
    "tsconfig.json",
]
for f in files:
    put_file(f)

# Copy migrations
for m in ["20260522080458_add_is_issued_to_laptop", "20260522090000_rename_saq_to_sr"]:
    local_dir = f"{LOCAL_PATH}/prisma/migrations/{m}"
    remote_dir = f"{VM_PATH}/prisma/migrations/{m}"
    try:
        sftp.mkdir(remote_dir)
    except:
        pass
    for f in os.listdir(local_dir):
        local = os.path.join(local_dir, f)
        remote = f"{remote_dir}/{f}"
        if os.path.isfile(local):
            sftp.put(local, remote)
            print(f"  OK: migration/{m}/{f}")

sftp.close()

print("\n=== Stopping containers ===")
stdin, stdout, stderr = ssh.exec_command(f"cd {VM_PATH} && docker compose down", timeout=60)
print(stdout.read().decode()[:300])

print("\n=== Building app ===")
stdin, stdout, stderr = ssh.exec_command(f"cd {VM_PATH} && docker compose build --no-cache app 2>&1", timeout=600)
out = stdout.read().decode('utf-8', errors='replace')
print(f"Build output: {len(out)} chars")
if "error" in out.lower()[-2000:]:
    print("BUILD ERR:", out[-2000:])
else:
    print("Build OK")

print("\n=== Starting containers ===")
stdin, stdout, stderr = ssh.exec_command(f"cd {VM_PATH} && docker compose up -d", timeout=60)
print(stdout.read().decode()[:300])

print("\n=== Waiting for DB ===")
stdin, stdout, stderr = ssh.exec_command(
    f"cd {VM_PATH} && docker compose exec -T db sh -c 'for i in $(seq 1 30); do pg_isready -U itam -d itam && exit 0; sleep 2; done; exit 1'",
    timeout=90
)
print(stdout.read().decode()[:100])

print("\n=== Running migrations ===")
stdin, stdout, stderr = ssh.exec_command(
    f"cd {VM_PATH} && docker run --rm --network itam_default "
    f"-v {VM_PATH}:/app "
    f"-e DATABASE_URL=postgresql://itam:itam_secure_pass@db:5432/itam?schema=public "
    f"-w /app node:20-alpine "
    f"sh -c 'apk add --no-cache libc6-compat && npm ci && npx prisma migrate deploy' 2>&1",
    timeout=300
)
out = stdout.read().decode('utf-8', errors='replace')
print("Migrate:", out[-1500:])

print("\n=== Seeding data ===")
stdin, stdout, stderr = ssh.exec_command(
    f"cd {VM_PATH} && docker run --rm --network itam_default "
    f"-v {VM_PATH}:/app "
    f"-e DATABASE_URL=postgresql://itam:itam_secure_pass@db:5432/itam?schema=public "
    f"-w /app node:20-alpine "
    f"sh -c 'npm install pg && node prisma/seed-raw.js' 2>&1",
    timeout=300
)
out = stdout.read().decode('utf-8', errors='replace')
print("Seed:", out[-1500:])

print("\n=== Verifying ===")
stdin, stdout, stderr = ssh.exec_command(
    'docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT COUNT(*) FROM \\\"LaptopRecord\\\";"'
)
print("LaptopRecord count:", stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command(
    'docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT \\\"isIssued\\\", COUNT(*) FROM \\\"LaptopRecord\\\" GROUP BY \\\"isIssued\\\";"'
)
print("isIssued breakdown:", stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/sheets/laptop-record?page=1&limit=1"')
print("API status:", stdout.read().decode().strip())

ssh.close()
print("\n=== DONE ===")
