import paramiko
import sys

sys.stdout = open('port_check.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Check what's using port 80
stdin, stdout, stderr = client.exec_command("ss -tlnp | grep ':80 '; lsof -i :80 2>/dev/null; netstat -tlnp 2>/dev/null | grep ':80 ' || true")
out = stdout.read().decode('utf-8', errors='replace')
print("=== WHAT IS USING PORT 80 ===")
print(out)

# Check if there's a system nginx or apache running
stdin2, stdout2, stderr2 = client.exec_command("systemctl status nginx 2>/dev/null || service nginx status 2>/dev/null || echo 'nginx service not found'; systemctl status apache2 2>/dev/null || service apache2 status 2>/dev/null || echo 'apache2 service not found'")
out2 = stdout2.read().decode('utf-8', errors='replace')
print("\n=== SYSTEM WEB SERVERS ===")
print(out2)

# Check docker compose file for port mapping
stdin3, stdout3, stderr3 = client.exec_command("cat /opt/itam/docker-compose.yml")
out3 = stdout3.read().decode('utf-8', errors='replace')
print("\n=== DOCKER COMPOSE ===")
print(out3)

client.close()
