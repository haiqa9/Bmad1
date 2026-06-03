import paramiko
import sys, json

sys.stdout.reconfigure(encoding='utf-8')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

def run(cmd):
    print(f"\n=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out)
    if err:
        print("ERR:", err)

run("cat /opt/itam/docker-compose.yml")
run("docker inspect itam-nginx --format='{{json .Mounts}}'")
run("docker exec itam-nginx cat /etc/nginx/nginx.conf | head -35")
run("docker exec itam-nginx ps aux | grep nginx")

client.close()
