import paramiko
import os

HOST = "192.168.1.38"
USER = "root"
PASS = "ExpertFlow123"
REMOTE_BASE = "/opt/itam"

local_files = [
    "prisma/schema.prisma",
    "app/api/requests/route.ts",
    "app/api/approvals/route.ts",
    "components/requests/request-form.tsx",
    "components/requests/request-list.tsx",
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

# Apply DB migration via docker exec
cmds = [
    # Apply migration directly via psql
    'docker exec itam-postgres-prod psql -U itam -d itam -c \'ALTER TABLE "AssetRequest" ADD COLUMN IF NOT EXISTS "requestedByName" TEXT;\'',
    # Regenerate Prisma client inside builder context (handled by docker build)
    f"cd {REMOTE_BASE} && docker compose down",
    f"cd {REMOTE_BASE} && docker compose up -d --build",
    "sleep 20 && docker ps && docker logs itam-app-prod --tail 20",
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
