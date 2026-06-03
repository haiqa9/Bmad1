import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

cmd = 'docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT \\\"no\\\", \\\"cloudVmUsageDescription\\\", \\\"ipAddress\\\", \\\"cloud\\\", \\\"sslStatus\\\" FROM \\\"CloudVm\\\" ORDER BY \\\"no\\\" LIMIT 10;"'
stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
out = stdout.read().decode('utf-8', errors='replace')
print(out)

cmd2 = 'docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT COUNT(*) FROM \\\"CloudVm\\\";"'
stdin, stdout, stderr = client.exec_command(cmd2, timeout=30)
out = stdout.read().decode('utf-8', errors='replace')
print("COUNT:")
print(out)

client.close()
