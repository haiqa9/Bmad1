import paramiko
import sys

sys.stdout = open('debug_assets.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Check app logs for errors when accessing assets page
stdin, stdout, stderr = client.exec_command("docker logs itam-app-prod --tail 80 2>&1")
print("=== APP LOGS (last 80 lines) ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Read the assets page
stdin2, stdout2, stderr2 = client.exec_command("cat /opt/itam/app/dashboard/assets/page.tsx")
print("\n=== ASSETS PAGE ===")
print(stdout2.read().decode('utf-8', errors='replace'))

client.close()
