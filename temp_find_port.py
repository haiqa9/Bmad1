import paramiko
import sys

sys.stdout = open('find_port.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Check common ports
for port in [8081, 8082, 8083, 3001, 9000, 9001]:
    stdin, stdout, stderr = client.exec_command(f"ss -tln | grep ':{port} ' || echo 'FREE'")
    out = stdout.read().decode('utf-8', errors='replace').strip()
    print(f"Port {port}: {out}")

client.close()
