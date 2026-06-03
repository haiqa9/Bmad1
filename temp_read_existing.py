import paramiko
import sys

sys.stdout = open('read_existing.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Read dashboard layout
stdin1, stdout1, stderr1 = client.exec_command("cat /opt/itam/app/dashboard/layout.tsx")
layout = stdout1.read().decode('utf-8', errors='replace')
print("=== DASHBOARD LAYOUT ===")
print(layout)

# Read admin page
stdin2, stdout2, stderr2 = client.exec_command("cat /opt/itam/app/dashboard/admin/page.tsx")
admin = stdout2.read().decode('utf-8', errors='replace')
print("\n=== ADMIN PAGE ===")
print(admin)

# Read an existing API route for pattern
stdin3, stdout3, stderr3 = client.exec_command("cat /opt/itam/app/api/assets/route.ts")
api = stdout3.read().decode('utf-8', errors='replace')
print("\n=== ASSETS API ===")
print(api)

# Read lib/prisma
stdin4, stdout4, stderr4 = client.exec_command("cat /opt/itam/lib/prisma.ts")
prisma = stdout4.read().decode('utf-8', errors='replace')
print("\n=== PRISMA LIB ===")
print(prisma)

client.close()
