import paramiko
import os

HOST = "192.168.1.38"
USER = "root"
PASS = "ExpertFlow123"
REMOTE_BASE = "/opt/itam"

local_files = [
    "lib/sheets.ts",
    "components/sheets/sheet-table.tsx",
    "components/sheets/edit-entry-modal.tsx",
    "app/api/sheets/[sheet]/[id]/route.ts",
    "app/api/sheets/[sheet]/route.ts",
    "prisma/schema.prisma",
    "prisma/seed.ts",
    "prisma/seed-raw.js",
]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=30)
sftp = client.open_sftp()

for rel_path in local_files:
    local_path = os.path.join(r"D:\Bmad\ITAM", rel_path)
    remote_path = f"{REMOTE_BASE}/{rel_path.replace(chr(92), '/')}"
    remote_dir = os.path.dirname(remote_path)

    try:
        sftp.mkdir(remote_dir)
    except IOError:
        pass

    print(f"Uploading {rel_path} ...")
    sftp.put(local_path, remote_path)

sftp.close()

cmds = [
    # Drop the isIssued column from LaptopRecord if it exists
    'docker exec itam-postgres-prod psql -U itam -d itam -c \'ALTER TABLE "LaptopRecord" DROP COLUMN IF EXISTS "isIssued";\'',
    f"cd {REMOTE_BASE} && docker compose down",
    f"cd {REMOTE_BASE} && docker compose up -d --build",
    "sleep 20 && docker ps && docker logs itam-app-prod --tail 30",
]

for cmd in cmds:
    print(f"\n=== RUNNING: {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=300)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out:
        print(out)
    if err:
        print(f"STDERR: {err}")

client.close()
print("\nDeployment complete.")
