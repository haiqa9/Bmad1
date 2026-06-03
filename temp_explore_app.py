import paramiko
import sys

sys.stdout = open('explore_app.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Explore app structure
stdin1, stdout1, stderr1 = client.exec_command("find /opt/itam/app -type f | sort")
app_files = stdout1.read().decode('utf-8', errors='replace')
print("=== APP FILES ===")
print(app_files)

# Check prisma schema
stdin2, stdout2, stderr2 = client.exec_command("cat /opt/itam/prisma/schema.prisma")
schema = stdout2.read().decode('utf-8', errors='replace')
print("\n=== PRISMA SCHEMA ===")
print(schema)

# Check existing API routes
stdin3, stdout3, stderr3 = client.exec_command("find /opt/itam/app/api -type f | sort")
api_files = stdout3.read().decode('utf-8', errors='replace')
print("\n=== API FILES ===")
print(api_files)

# Check types
stdin4, stdout4, stderr4 = client.exec_command("find /opt/itam/types -type f 2>/dev/null; cat /opt/itam/types/*.ts 2>/dev/null")
types_files = stdout4.read().decode('utf-8', errors='replace')
print("\n=== TYPES ===")
print(types_files)

client.close()
