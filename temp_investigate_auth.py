import paramiko
import sys

sys.stdout = open('investigate_auth.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Check NextAuth config
stdin1, stdout1, stderr1 = client.exec_command("cat /opt/itam/app/api/auth/\\[...nextauth\\]/route.ts")
auth_config = stdout1.read().decode('utf-8', errors='replace')
print("=== NEXTAUTH ROUTE ===")
print(auth_config)

# Check .env for Google credentials
stdin2, stdout2, stderr2 = client.exec_command("cat /opt/itam/.env")
env = stdout2.read().decode('utf-8', errors='replace')
print("\n=== .env FILE ===")
print(env)

# Check if there's a middleware or auth config
stdin3, stdout3, stderr3 = client.exec_command("find /opt/itam/app -name '*.ts' -o -name '*.tsx' | xargs grep -l 'GoogleProvider\|google' 2>/dev/null")
google_files = stdout3.read().decode('utf-8', errors='replace')
print("\n=== FILES WITH GOOGLE ===")
print(google_files)

# Check auth.ts or similar
stdin4, stdout4, stderr4 = client.exec_command("cat /opt/itam/lib/auth.ts 2>/dev/null || cat /opt/itam/auth.ts 2>/dev/null || echo 'no auth.ts found'")
auth_ts = stdout4.read().decode('utf-8', errors='replace')
print("\n=== AUTH.TS ===")
print(auth_ts)

client.close()
