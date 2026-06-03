import paramiko
import sys

sys.stdout = open('read_asset_table.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Read the asset table component
stdin, stdout, stderr = client.exec_command("cat /opt/itam/components/assets/asset-table.tsx")
print("=== ASSET TABLE ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Check if there are other components using useSession
stdin2, stdout2, stderr2 = client.exec_command("grep -rn 'useSession' /opt/itam/components/ /opt/itam/app/ 2>/dev/null")
print("\n=== useSession USAGE ===")
print(stdout2.read().decode('utf-8', errors='replace'))

client.close()
