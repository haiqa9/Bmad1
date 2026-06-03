import paramiko

HOST = "192.168.1.38"
USER = "root"
PASS = "ExpertFlow123"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=30)
sftp = client.open_sftp()

files = [
    (r"D:\Bmad\ITAM\lib\sheets.ts", "/opt/itam/lib/sheets.ts"),
    (r"D:\Bmad\ITAM\prisma\schema.prisma", "/opt/itam/prisma/schema.prisma"),
]

for local, remote in files:
    sftp.put(local, remote)
    print(f"Uploaded {local}")

sftp.close()

# Drop column from DB
cmd = 'docker exec itam-postgres-prod psql -U itam -d itam -c "ALTER TABLE \\\"LabVm\\\" DROP COLUMN IF EXISTS \\\"department\\\";"'
stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
out = stdout.read().decode("utf-8", errors="replace")
err = stderr.read().decode("utf-8", errors="replace")
print("DB:", out)
if err:
    print("STDERR:", err)

# Rebuild
cmds = [
    "cd /opt/itam && docker compose down",
    "cd /opt/itam && docker compose up -d --build",
]
for cmd in cmds:
    print(f"\n=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=300)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out:
        print(out[:1500])
    if err:
        print("STDERR:", err[:300])

client.close()
