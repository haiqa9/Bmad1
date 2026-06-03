import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

def run(cmd, timeout=30):
    print(f"=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print("OUT:", out)
    if err:
        print("ERR:", err)
    return out, err

# Verify host file
run("grep -c 'limit_req_zone' /opt/itam/nginx/nginx.conf")
# Verify container sees it (bind mount)
run("docker exec itam-nginx grep -c 'limit_req_zone' /etc/nginx/nginx.conf")
# Validate
run("docker exec itam-nginx nginx -t")
# Reload
run("docker exec itam-nginx nginx -s reload")

client.close()
