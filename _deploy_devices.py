import paramiko
import os

HOST = "192.168.1.38"
USER = "root"
PASS = "ExpertFlow123"
REMOTE_BASE = "/opt/itam"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=30)
sftp = client.open_sftp()

files_to_upload = [
    (r"D:\Bmad\ITAM\prisma\schema.prisma", "/opt/itam/prisma/schema.prisma"),
    (r"D:\Bmad\ITAM\lib\sheets.ts", "/opt/itam/lib/sheets.ts"),
    (r"D:\Bmad\ITAM\app\api\sheets\[sheet]\route.ts", "/opt/itam/app/api/sheets/[sheet]/route.ts"),
    (r"D:\Bmad\ITAM\app\api\sheets\[sheet]\[id]\route.ts", "/opt/itam/app/api/sheets/[sheet]/[id]/route.ts"),
    (r"D:\Bmad\import_devices.sql", "/opt/itam/import_devices.sql"),
]

for local_path, remote_path in files_to_upload:
    print(f"Uploading {os.path.basename(local_path)} ...")
    sftp.put(local_path, remote_path)

sftp.close()

# Run SQL migration
stdin, stdout, stderr = client.exec_command('docker cp /opt/itam/import_devices.sql itam-postgres-prod:/tmp/import_devices.sql', timeout=30)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
if out: print(out)
if err: print("STDERR:", err)

stdin, stdout, stderr = client.exec_command('docker exec -i itam-postgres-prod psql -U itam -d itam -f /tmp/import_devices.sql', timeout=120)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print("SQL OUTPUT:")
print(out)
if err:
    print("STDERR:", err)

# Verify count
stdin, stdout, stderr = client.exec_command('docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT COUNT(*) FROM \\\"Device\\\";"', timeout=30)
out = stdout.read().decode('utf-8', errors='replace')
print("COUNT:")
print(out)

# Rebuild and restart app
cmds = [
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
        print(out[:2000])
    if err:
        print(f"STDERR: {err[:500]}")

client.close()
print("\nDeployment complete.")
