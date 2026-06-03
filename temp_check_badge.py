import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

stdin, stdout, stderr = client.exec_command("cat /opt/itam/components/ui/badge.tsx")
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
