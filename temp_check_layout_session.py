import paramiko
import sys

sys.stdout = open('check_layout_session.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Check root layout for SessionProvider
stdin1, stdout1, stderr1 = client.exec_command("cat /opt/itam/app/layout.tsx")
print("=== ROOT LAYOUT ===")
print(stdout1.read().decode('utf-8', errors='replace'))

# Check package.json for next-auth version
stdin2, stdout2, stderr2 = client.exec_command("cat /opt/itam/package.json | grep next-auth")
print("\n=== NEXT-AUTH VERSION ===")
print(stdout2.read().decode('utf-8', errors='replace'))

# Check asset-detail.tsx
stdin3, stdout3, stderr3 = client.exec_command("cat /opt/itam/components/assets/asset-detail.tsx")
print("\n=== ASSET DETAIL ===")
print(stdout3.read().decode('utf-8', errors='replace'))

client.close()
