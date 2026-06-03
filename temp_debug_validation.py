import paramiko
import sys

sys.stdout = open('debug_validation.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Read the validation schema
stdin1, stdout1, stderr1 = client.exec_command("cat /opt/itam/lib/validations/user.ts")
print("=== VALIDATION SCHEMA ===")
print(stdout1.read().decode('utf-8', errors='replace'))

# Read the API route
stdin2, stdout2, stderr2 = client.exec_command("cat /opt/itam/app/api/users/route.ts")
print("\n=== USERS API ===")
print(stdout2.read().decode('utf-8', errors='replace'))

# Read the users page
stdin3, stdout3, stderr3 = client.exec_command("cat /opt/itam/app/dashboard/admin/users/page.tsx")
page = stdout3.read().decode('utf-8', errors='replace')
print("\n=== PAGE - handleCreate function ===")
# Find the handleCreate function
lines = page.split('\n')
for i, line in enumerate(lines):
    if 'handleCreate' in line:
        for j in range(i, min(i+40, len(lines))):
            print(f"{j+1}: {lines[j]}")
        break

print("\n=== PAGE - form state ===")
for i, line in enumerate(lines):
    if 'form, setForm' in line or 'useState({' in line:
        for j in range(i, min(i+15, len(lines))):
            print(f"{j+1}: {lines[j]}")
        break

client.close()
