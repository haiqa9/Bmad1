import paramiko
import sys

sys.stdout = open('fix_port2.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Update docker-compose.yml: change port 8080:80 to 8081:80
stdin, stdout, stderr = client.exec_command("sed -i 's/\"8080:80\"/\"8081:80\"/g' /opt/itam/docker-compose.yml")
err = stderr.read().decode('utf-8', errors='replace')
print("=== SED RESULT ===")
if err:
    print("STDERR:", err)
else:
    print("OK")

# Verify
stdin2, stdout2, stderr2 = client.exec_command("grep -n '8081:80' /opt/itam/docker-compose.yml")
out2 = stdout2.read().decode('utf-8', errors='replace')
print("\n=== VERIFY PORT MAPPING ===")
print(out2)

# Remove the old failed container so it can be recreated with new port
stdin3, stdout3, stderr3 = client.exec_command("docker rm -f itam-nginx 2>/dev/null; cd /opt/itam && docker compose up -d nginx")
out3 = stdout3.read().decode('utf-8', errors='replace')
err3 = stderr3.read().decode('utf-8', errors='replace')
print("\n=== DOCKER COMPOSE UP NGINX ===")
print(out3)
if err3:
    print("STDERR:", err3)

# Check containers
stdin4, stdout4, stderr4 = client.exec_command("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")
out4 = stdout4.read().decode('utf-8', errors='replace')
print("\n=== DOCKER PS ===")
print(out4)

client.close()
