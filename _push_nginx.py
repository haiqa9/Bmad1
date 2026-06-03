import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Use SFTP to transfer the file
sftp = client.open_sftp()
local_path = r"D:\Bmad\ITAM\nginx\nginx.conf"
remote_path = "/opt/itam/nginx/nginx.conf"

print(f"Transferring {local_path} -> {remote_path}")
sftp.put(local_path, remote_path + ".tmp")
sftp.close()

# Move into place
stdin, stdout, stderr = client.exec_command(f"mv {remote_path}.tmp {remote_path}")
out = stdout.read().decode('utf-8', errors='replace').strip()
err = stderr.read().decode('utf-8', errors='replace').strip()
if err:
    print("mv ERR:", err)
else:
    print("mv OK")

# Verify
stdin, stdout, stderr = client.exec_command("grep -c 'limit_req_zone' /opt/itam/nginx/nginx.conf")
out = stdout.read().decode('utf-8').strip()
print("limit_req_zone count:", out)

# Validate container config
stdin, stdout, stderr = client.exec_command("docker exec itam-nginx nginx -t")
out = stdout.read().decode('utf-8', errors='replace').strip()
err = stderr.read().decode('utf-8', errors='replace').strip()
print("validation OUT:", out)
print("validation ERR:", err)

if "syntax is ok" in (out + err).lower() and "test is successful" in (out + err).lower():
    stdin, stdout, stderr = client.exec_command("docker exec itam-nginx nginx -s reload")
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    print("reload OUT:", out)
    print("reload ERR:", err)
    print("\n✅ NGINX UPDATED AND RELOADED")
else:
    print("\n❌ VALIDATION FAILED")

client.close()
