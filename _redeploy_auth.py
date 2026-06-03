import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)
sftp = client.open_sftp()

print("Syncing auth.ts...")
sftp.put(r"D:\Bmad\ITAM\lib\auth.ts", "/opt/itam/lib/auth.ts")
sftp.close()

stdin, stdout, stderr = client.exec_command("cd /opt/itam && docker compose build app && docker compose up -d app")
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print("BUILD OUT:", out[-1000:] if len(out) > 1000 else out)
print("BUILD ERR:", err[-1000:] if len(err) > 1000 else err)

# Wait for restart
import time
time.sleep(10)

stdin, stdout, stderr = client.exec_command("docker logs itam-app-prod --tail 10")
print("LOGS:", stdout.read().decode('utf-8', errors='replace'))

client.close()
print("\n✅ REDEPLOYED")
