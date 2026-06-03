import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

stdin, stdout, stderr = client.exec_command("tail -n 30 /tmp/docker-build6.log")
print("=== BUILD LOG TAIL ===")
print(stdout.read().decode('utf-8', errors='replace'))

stdin2, stdout2, stderr2 = client.exec_command("docker ps --format 'table {{.Names}}\t{{.Status}}'")
print("\n=== CONTAINERS ===")
print(stdout2.read().decode('utf-8', errors='replace'))

client.close()
