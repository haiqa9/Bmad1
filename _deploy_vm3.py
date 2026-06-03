import paramiko
import sys

# Force UTF-8 stdout
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

def run(cmd, timeout=300):
    print(f"=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out:
        print(out)
    if err:
        print(f"STDERR: {err}")
    print()
    return out, err

# Step 1: docker compose down
run("cd /opt/itam && docker compose down", timeout=120)

# Step 2: rebuild and start
run("cd /opt/itam && docker compose up -d --build", timeout=300)

# Step 3: wait and verify
run("sleep 20 && docker ps && docker logs itam-app-prod --tail 30", timeout=60)

# Step 4: check postgres
run("docker logs itam-postgres-prod --tail 10", timeout=30)

client.close()
