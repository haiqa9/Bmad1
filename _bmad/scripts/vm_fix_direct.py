import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Run the rename directly via psql in the postgres container
print("=== Renaming column saq -> sr ===")
stdin, stdout, stderr = ssh.exec_command(
    'docker exec itam-postgres-prod psql -U itam -d itam -c \'ALTER TABLE "LaptopRecord" RENAME COLUMN "saq" TO "sr";\''
)
print(stdout.read().decode())
print("Err:", stderr.read().decode()[:200])

# Update _prisma_migrations to mark the migration as applied
print("\n=== Marking migration as applied ===")
stdin, stdout, stderr = ssh.exec_command(
    'docker exec itam-postgres-prod psql -U itam -d itam -c "INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES (gen_random_uuid(), \'\', NOW(), \'20260522090000_rename_saq_to_sr\', \'\', NULL, NOW(), 1) ON CONFLICT DO NOTHING;"'
)
print(stdout.read().decode())

# Clear and re-seed
print("\n=== Clearing and seeding ===")
stdin, stdout, stderr = ssh.exec_command(
    'docker exec itam-postgres-prod psql -U itam -d itam -c \'DELETE FROM "LaptopRecord";\''
)
print("Cleared:", stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command(
    'cd /opt/itam && docker run --rm --network itam_default '
    '-v /opt/itam:/app '
    '-e DATABASE_URL=postgresql://itam:itam_secure_pass@db:5432/itam?schema=public '
    '-w /app node:20-alpine '
    'sh -c "npm install pg && node prisma/seed-raw.js" 2>&1',
    timeout=300
)
out = stdout.read().decode('utf-8', errors='replace')
print("Seed output:", out[-2000:])

# Verify
print("\n=== Verifying ===")
stdin, stdout, stderr = ssh.exec_command(
    'docker exec itam-postgres-prod psql -U itam -d itam -c \'SELECT COUNT(*) FROM "LaptopRecord";\''
)
print("Count:", stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command(
    'docker exec itam-postgres-prod psql -U itam -d itam -c \'SELECT "isIssued", COUNT(*) FROM "LaptopRecord" GROUP BY "isIssued";\''
)
print("isIssued:", stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command(
    'docker exec itam-postgres-prod psql -U itam -d itam -c \'SELECT "sr", "employeeName", "serialNumber", "isIssued" FROM "LaptopRecord" LIMIT 5;\''
)
print("Sample:", stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/sheets/laptop-record?page=1&limit=1"')
print("API:", stdout.read().decode().strip())

# Test search
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/sheets/laptop-record?page=1&limit=10&q=Asjad"')
print("Search API:", stdout.read().decode().strip())

ssh.close()
print("\n=== DONE ===")
