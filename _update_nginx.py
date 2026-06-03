import paramiko
import sys
import base64

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

def run(cmd, timeout=30):
    print(f"=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print("OUT:", out.strip())
    if err.strip():
        print("ERR:", err.strip())
    return out, err

# Read local config
with open(r"D:\Bmad\ITAM\nginx\nginx.conf", "r", encoding="utf-8") as f:
    config = f.read()

# Write to VM temp file via base64
b64 = base64.b64encode(config.encode("utf-8")).decode("ascii")
run(f"echo {b64} | base64 -d > /opt/itam/nginx/nginx.conf.new")

# Check containers are running
run("docker ps --format '{{.Names}}'")

# Copy into nginx container
run("docker cp /opt/itam/nginx/nginx.conf.new itam-nginx:/etc/nginx/nginx.conf")

# Validate
out, err = run("docker exec itam-nginx nginx -t")
validation = (out + err).lower()

if "syntax is ok" in validation and "test is successful" in validation:
    run("docker exec itam-nginx nginx -s reload")
    print("\n✅ NGINX CONFIG UPDATED AND RELOADED SUCCESSFULLY")
else:
    print("\n❌ NGINX VALIDATION FAILED - REVERTING")
    # Revert to original if available
    run("docker cp /opt/itam/nginx/nginx.conf itam-nginx:/etc/nginx/nginx.conf 2>/dev/null || echo 'no backup'")

client.close()
