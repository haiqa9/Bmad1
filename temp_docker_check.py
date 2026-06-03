import paramiko
import sys

# Redirect stdout to file to avoid cp1252 encoding issues on Windows
sys.stdout = open('docker_check.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Check if build log exists and its tail
stdin, stdout, stderr = client.exec_command('tail -n 100 /tmp/docker-build.log')
log_tail = stdout.read().decode('utf-8', errors='replace')
print("=== DOCKER BUILD LOG TAIL ===")
print(log_tail)

# Check exit code explicitly
stdin2, stdout2, stderr2 = client.exec_command('cat /tmp/docker-build.log | grep -E "^(EXIT_CODE=|#[0-9]+ DONE|#[0-9]+ ERROR|failed|error:)" | tail -20')
status = stdout2.read().decode('utf-8', errors='replace')
print("\n=== STATUS LINES ===")
print(status)

# Check if containers are running
stdin3, stdout3, stderr3 = client.exec_command('docker ps')
ps = stdout3.read().decode('utf-8', errors='replace')
print("\n=== DOCKER PS ===")
print(ps)

client.close()
