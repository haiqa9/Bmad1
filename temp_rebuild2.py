import paramiko
import sys

sys.stdout = open('rebuild2.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Rebuild and restart
stdin, stdout, stderr = client.exec_command("cd /opt/itam && docker compose up -d --build > /tmp/docker-build3.log 2>&1; echo EXIT_CODE=$?")

import time
start = time.time()
while not stdout.channel.exit_status_ready():
    if time.time() - start > 300:
        print("TIMEOUT")
        break
    time.sleep(2)

exit_code = stdout.channel.recv_exit_status()
print(f"EXIT CODE: {exit_code}")

# Get last 80 lines of log
stdin2, stdout2, stderr2 = client.exec_command("tail -n 80 /tmp/docker-build3.log")
log = stdout2.read().decode('utf-8', errors='replace')
print("\n=== BUILD LOG TAIL ===")
print(log)

client.close()
