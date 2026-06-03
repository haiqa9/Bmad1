import paramiko
import sys

sys.stdout = open('debug_create_asset.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Read the new asset page
stdin1, stdout1, stderr1 = client.exec_command("cat /opt/itam/app/dashboard/assets/new/page.tsx")
print("=== NEW ASSET PAGE ===")
print(stdout1.read().decode('utf-8', errors='replace'))

# Read the asset form component
stdin2, stdout2, stderr2 = client.exec_command("cat /opt/itam/components/assets/asset-form.tsx")
print("\n=== ASSET FORM ===")
print(stdout2.read().decode('utf-8', errors='replace'))

# Read assets page - check the Add Asset link
stdin3, stdout3, stderr3 = client.exec_command("cat /opt/itam/app/dashboard/assets/page.tsx")
print("\n=== ASSETS PAGE ===")
print(stdout3.read().decode('utf-8', errors='replace'))

client.close()
