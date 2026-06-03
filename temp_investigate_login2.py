import paramiko
import sys

sys.stdout = open('investigate_login2.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Check database tables (no -it)
stdin1, stdout1, stderr1 = client.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"\\dt\" 2>&1"
)
tables = stdout1.read().decode('utf-8', errors='replace')
print("=== DATABASE TABLES ===")
print(tables)

# Check if users exist in the DB (no -it)
stdin2, stdout2, stderr2 = client.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"SELECT email, name, role FROM \\\"User\\\";\" 2>&1"
)
users = stdout2.read().decode('utf-8', errors='replace')
print("\n=== USERS IN DATABASE ===")
print(users)

# Check migration status
stdin3, stdout3, stderr3 = client.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"SELECT * FROM \\\"_prisma_migrations\\\";\" 2>&1"
)
migrations = stdout3.read().decode('utf-8', errors='replace')
print("\n=== PRISMA MIGRATIONS ===")
print(migrations)

# Read seed.ts to understand what it creates
stdin4, stdout4, stderr4 = client.exec_command("cat /opt/itam/prisma/seed.ts")
seed_content = stdout4.read().decode('utf-8', errors='replace')
print("\n=== SEED.TS CONTENT ===")
print(seed_content[:3000] if len(seed_content) > 3000 else seed_content)

client.close()
