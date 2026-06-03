import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

cmd = 'docker exec itam-postgres-prod psql -U itam -d itam -c "\\d \\\"ReceivedItem\\\""'
stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
out = stdout.read().decode('utf-8', errors='replace')
print(out)
client.close()
