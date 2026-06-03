import paramiko
import sys

sys.stdout = open('verify_deploy.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Check containers
stdin1, stdout1, stderr1 = client.exec_command("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")
print("=== DOCKER PS ===")
print(stdout1.read().decode('utf-8', errors='replace'))

# Check build log tail
stdin2, stdout2, stderr2 = client.exec_command("tail -n 50 /tmp/docker-build2.log")
print("\n=== BUILD LOG TAIL ===")
print(stdout2.read().decode('utf-8', errors='replace'))

# Verify files exist
stdin3, stdout3, stderr3 = client.exec_command(
    "ls -la /opt/itam/app/api/users/route.ts /opt/itam/app/api/users/'[id]'/route.ts /opt/itam/app/dashboard/admin/users/page.tsx /opt/itam/lib/validations/user.ts"
)
print("\n=== FILES CHECK ===")
print(stdout3.read().decode('utf-8', errors='replace'))

client.close()
