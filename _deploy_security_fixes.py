import paramiko
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

LOCAL_ROOT = r"D:\Bmad\ITAM"
REMOTE_ROOT = "/opt/itam"

FILES_TO_SYNC = [
    "next.config.ts",
    "lib/auth.ts",
    "lib/api-auth.ts",
    "app/api/sheets/[sheet]/route.ts",
    "app/api/assets/route.ts",
    "app/api/assets/[id]/route.ts",
    "app/api/assets/[id]/maintenance/route.ts",
    "app/api/assets/[id]/reassign/route.ts",
    "app/api/requests/route.ts",
    "app/api/approvals/route.ts",
    "app/api/compliance/route.ts",
    "app/api/compliance/aging/route.ts",
    "app/api/compliance/licenses/route.ts",
    "app/api/health/route.ts",
    "nginx/nginx.conf",
]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)
sftp = client.open_sftp()

def run(cmd, timeout=300):
    print(f"\n=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out[:2000])
    if err:
        print("ERR:", err[:2000])
    return out, err

print("Syncing files to VM...")
for rel in FILES_TO_SYNC:
    local = os.path.join(LOCAL_ROOT, rel)
    remote = f"{REMOTE_ROOT}/{rel}"
    # Ensure remote dir exists
    remote_dir = os.path.dirname(remote).replace("\\", "/")
    run(f"mkdir -p '{remote_dir}'")
    print(f"  {rel}")
    sftp.put(local, remote)

sftp.close()

print("\nRebuilding and restarting containers...")
run("cd /opt/itam && docker compose down", timeout=120)
run("cd /opt/itam && docker compose up -d --build", timeout=300)

print("\nWaiting for app to start...")
run("sleep 15 && docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'")

print("\nApp logs (last 20 lines):")
run("docker logs itam-app-prod --tail 20", timeout=30)

# Verify nginx config
print("\nNginx validation:")
run("docker exec itam-nginx nginx -t")
run("docker exec itam-nginx nginx -s reload")

print("\n✅ DEPLOYMENT COMPLETE")
client.close()
