import paramiko
import sys

sys.stdout = open('investigate_login.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Check app logs for sign-in errors
stdin, stdout, stderr = client.exec_command("docker logs itam-app-prod --tail 50 2>&1")
logs = stdout.read().decode('utf-8', errors='replace')
print("=== APP LOGS (last 50 lines) ===")
print(logs)

# Check if users exist in the DB
stdin2, stdout2, stderr2 = client.exec_command(
    "docker exec -it itam-postgres-prod psql -U itam -d itam -c \"SELECT email, name, role FROM \\\"User\\\";\" 2>&1"
)
users = stdout2.read().decode('utf-8', errors='replace')
print("\n=== USERS IN DATABASE ===")
print(users)

# Check database tables
stdin3, stdout3, stderr3 = client.exec_command(
    "docker exec -it itam-postgres-prod psql -U itam -d itam -c \"\\dt\" 2>&1"
)
tables = stdout3.read().decode('utf-8', errors='replace')
print("\n=== DATABASE TABLES ===")
print(tables)

# Check .env for NEXTAUTH_SECRET
stdin4, stdout4, stderr4 = client.exec_command("cat /opt/itam/.env | grep -E 'NEXTAUTH_SECRET|NEXTAUTH_URL|GOOGLE' | sed 's/SECRET=.*/SECRET=***/g'")
env = stdout4.read().decode('utf-8', errors='replace')
print("\n=== ENV CHECK ===")
print(env)

# Check if there's a seed script
stdin5, stdout5, stderr5 = client.exec_command("ls /opt/itam/prisma/seed* 2>/dev/null; cat /opt/itam/package.json | grep -i seed 2>/dev/null")
seed = stdout5.read().decode('utf-8', errors='replace')
print("\n=== SEED INFO ===")
print(seed)

client.close()
