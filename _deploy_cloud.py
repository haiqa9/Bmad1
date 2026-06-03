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
    (r"D:\Bmad\import_cloud.sql", "/opt/itam/import_cloud.sql"),
]

for local, remote in files:
    sftp.put(local, remote)
    print(f"Uploaded {local}")

sftp.close()

# Drop column from DB
cmd = 'docker exec itam-postgres-prod psql -U itam -d itam -c "ALTER TABLE \\\"CloudVm\\\" DROP COLUMN IF EXISTS \\\"ownerUserTeam\\\";"'
stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
out = stdout.read().decode("utf-8", errors="replace")
err = stderr.read().decode("utf-8", errors="replace")
print("DB drop:", out)
if err:
    print("STDERR:", err)

# Import data
stdin, stdout, stderr = client.exec_command('docker cp /opt/itam/import_cloud.sql itam-postgres-prod:/tmp/import_cloud.sql', timeout=30)
out = stdout.read().decode("utf-8", errors="replace")
err = stderr.read().decode("utf-8", errors="replace")
if out: print(out)
if err: print("STDERR:", err)

stdin, stdout, stderr = client.exec_command('docker exec -i itam-postgres-prod psql -U itam -d itam -f /tmp/import_cloud.sql', timeout=120)
out = stdout.read().decode("utf-8", errors="replace")
err = stderr.read().decode("utf-8", errors="replace")
print("SQL OUTPUT:")
print(out)
if err:
    print("STDERR:", err)

# Verify count
stdin, stdout, stderr = client.exec_command('docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT COUNT(*) FROM \\\"CloudVm\\\";"', timeout=30)
out = stdout.read().decode("utf-8", errors="replace")
print("COUNT:")
print(out)

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
