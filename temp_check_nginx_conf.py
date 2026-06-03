import paramiko
import sys

sys.stdout = open('check_nginx.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Check nginx config
stdin1, stdout1, stderr1 = client.exec_command("cat /opt/itam/nginx/nginx.conf")
nginx_conf = stdout1.read().decode('utf-8', errors='replace')
print("=== NGINX CONF ===")
print(nginx_conf)

# Check if Google credentials files exist anywhere
stdin2, stdout2, stderr2 = client.exec_command("find /opt/itam -type f | xargs grep -l 'google-client-id\|GOOGLE_CLIENT_ID' 2>/dev/null")
google_env_files = stdout2.read().decode('utf-8', errors='replace')
print("\n=== FILES WITH GOOGLE CLIENT ID ===")
print(google_env_files)

# Check what URL the user is actually hitting when they get 400
# Check app logs for the 400 error
stdin3, stdout3, stderr3 = client.exec_command("docker logs itam-app-prod --tail 30 2>&1")
app_logs = stdout3.read().decode('utf-8', errors='replace')
print("\n=== APP LOGS ===")
print(app_logs)

client.close()
