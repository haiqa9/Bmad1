import paramiko
import sys

sys.stdout = open('final_verify.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Check build log for success
stdin1, stdout1, stderr1 = client.exec_command("tail -n 30 /tmp/docker-build3.log")
print("=== BUILD LOG TAIL ===")
print(stdout1.read().decode('utf-8', errors='replace'))

# Check containers
stdin2, stdout2, stderr2 = client.exec_command("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")
print("\n=== DOCKER PS ===")
print(stdout2.read().decode('utf-8', errors='replace'))

# Quick health check on app
stdin3, stdout3, stderr3 = client.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health || echo 'health check failed'")
print("\n=== HEALTH CHECK ===")
print(stdout3.read().decode('utf-8', errors='replace'))

client.close()
