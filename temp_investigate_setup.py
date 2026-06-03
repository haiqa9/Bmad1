import paramiko
import sys

sys.stdout = open('investigate_setup.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Check prisma.config.js
stdin1, stdout1, stderr1 = client.exec_command("cat /opt/itam/prisma.config.js")
config = stdout1.read().decode('utf-8', errors='replace')
print("=== PRISMA.CONFIG.JS ===")
print(config)

# Check Dockerfile
stdin2, stdout2, stderr2 = client.exec_command("cat /opt/itam/Dockerfile")
dockerfile = stdout2.read().decode('utf-8', errors='replace')
print("\n=== DOCKERFILE ===")
print(dockerfile)

# Check migration SQL files
stdin3, stdout3, stderr3 = client.exec_command("ls /opt/itam/prisma/migrations/")
migrations = stdout3.read().decode('utf-8', errors='replace')
print("\n=== MIGRATION DIRS ===")
print(migrations)

# Check the first/latest migration SQL
stdin4, stdout4, stderr4 = client.exec_command("find /opt/itam/prisma/migrations -name '*.sql' | sort | tail -5")
sql_files = stdout4.read().decode('utf-8', errors='replace')
print("\n=== SQL FILES ===")
print(sql_files)

client.close()
