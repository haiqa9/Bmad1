import paramiko
import sys

sys.stdout = open('read_more.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Read session lib
stdin1, stdout1, stderr1 = client.exec_command("cat /opt/itam/lib/session.ts")
session = stdout1.read().decode('utf-8', errors='replace')
print("=== SESSION LIB ===")
print(session)

# Check validations folder
stdin2, stdout2, stderr2 = client.exec_command("find /opt/itam/lib/validations -type f 2>/dev/null; cat /opt/itam/lib/validations/*.ts 2>/dev/null | head -100")
validations = stdout2.read().decode('utf-8', errors='replace')
print("\n=== VALIDATIONS ===")
print(validations)

# Check components
stdin3, stdout3, stderr3 = client.exec_command("find /opt/itam/components -type f | sort")
components = stdout3.read().decode('utf-8', errors='replace')
print("\n=== COMPONENTS ===")
print(components)

# Check logout button
stdin4, stdout4, stderr4 = client.exec_command("cat /opt/itam/components/logout-button.tsx")
logout = stdout4.read().decode('utf-8', errors='replace')
print("\n=== LOGOUT BUTTON ===")
print(logout)

client.close()
