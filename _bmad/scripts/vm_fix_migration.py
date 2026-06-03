import paramiko
import os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)
sftp = ssh.open_sftp()

# Copy the missing migration
local_dir = "D:/Bmad/ITAM/prisma/migrations/20260522090000_rename_saq_to_sr"
remote_dir = "/opt/itam/prisma/migrations/20260522090000_rename_saq_to_sr"
try:
    sftp.mkdir(remote_dir)
except:
    pass
for f in os.listdir(local_dir):
    local = os.path.join(local_dir, f)
    remote = f"{remote_dir}/{f}"
    if os.path.isfile(local):
        sftp.put(local, remote)
        print(f"Copied migration/{f}")

sftp.close()

# Apply migration
print("\nApplying migration...")
stdin, stdout, stderr = ssh.exec_command(
    'cd /opt/itam && docker run --rm --network itam_default '
    '-v /opt/itam:/app '
    '-e DATABASE_URL=postgresql://itam:itam_secure_pass@db:5432/itam?schema=public '
    '-w /app node:20-alpine '
    'sh -c "apk add --no-cache libc6-compat && npm ci && npx prisma migrate deploy" 2>&1',
    timeout=300
)
out = stdout.read().decode('utf-8', errors='replace')
print("Migrate:", out[-1500:])

# Re-seed
print("\nSeeding data...")
stdin, stdout, stderr = ssh.exec_command(
    'cd /opt/itam && docker run --rm --network itam_default '
    '-v /opt/itam:/app '
    '-e DATABASE_URL=postgresql://itam:itam_secure_pass@db:5432/itam?schema=public '
    '-w /app node:20-alpine '
    'sh -c "npm install pg && node prisma/seed-raw.js" 2>&1',
    timeout=300
)
out = stdout.read().decode('utf-8', errors='replace')
print("Seed:", out[-1500:])

# Verify
print("\nVerifying...")
stdin, stdout, stderr = ssh.exec_command(
    'docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT COUNT(*) FROM \\\"LaptopRecord\\\";"'
)
print("Count:", stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command(
    'docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT \\\"isIssued\\\", COUNT(*) FROM \\\"LaptopRecord\\\" GROUP BY \\\"isIssued\\\";"'
)
print("isIssued:", stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/sheets/laptop-record?page=1&limit=1"')
print("API:", stdout.read().decode().strip())

ssh.close()
print("\n=== FIXED ===")
