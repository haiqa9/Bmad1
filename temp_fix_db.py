import paramiko
import sys

sys.stdout = open('fix_db.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Run prisma migrate deploy inside the app container
stdin1, stdout1, stderr1 = client.exec_command(
    "docker exec -e DATABASE_URL=postgresql://itam:itam_secure_pass@itam-postgres-prod:5432/itam?schema=public itam-app-prod npx prisma migrate deploy 2>&1"
)
migrate_out = stdout1.read().decode('utf-8', errors='replace')
migrate_err = stderr1.read().decode('utf-8', errors='replace')
print("=== PRISMA MIGRATE DEPLOY ===")
print(migrate_out)
if migrate_err:
    print("STDERR:", migrate_err)

# Run seed script inside the app container
stdin2, stdout2, stderr2 = client.exec_command(
    "docker exec -e DATABASE_URL=postgresql://itam:itam_secure_pass@itam-postgres-prod:5432/itam?schema=public itam-app-prod npx tsx prisma/seed.ts 2>&1"
)
seed_out = stdout2.read().decode('utf-8', errors='replace')
seed_err = stderr2.read().decode('utf-8', errors='replace')
print("\n=== SEED SCRIPT ===")
print(seed_out)
if seed_err:
    print("STDERR:", seed_err)

# Verify users now exist
stdin3, stdout3, stderr3 = client.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"SELECT email, name, role FROM \\\"User\\\";\" 2>&1"
)
users = stdout3.read().decode('utf-8', errors='replace')
print("\n=== USERS IN DATABASE ===")
print(users)

# Check tables
stdin4, stdout4, stderr4 = client.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"\\dt\" 2>&1"
)
tables = stdout4.read().decode('utf-8', errors='replace')
print("\n=== DATABASE TABLES ===")
print(tables)

client.close()
