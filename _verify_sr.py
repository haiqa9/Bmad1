import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

cmd = 'docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT \\\"sr\\\", \\\"employeeName\\\", \\\"department\\\" FROM \\\"LaptopRecord\\\" ORDER BY \\\"sr\\\"::int LIMIT 5;"'
stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print("First 5 rows:")
print(out)
if err:
    print("STDERR:", err)

cmd2 = 'docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT \\\"sr\\\", \\\"employeeName\\\" FROM \\\"LaptopRecord\\\" ORDER BY \\\"sr\\\"::int DESC LIMIT 5;"'
stdin, stdout, stderr = client.exec_command(cmd2, timeout=30)
out = stdout.read().decode('utf-8', errors='replace')
print("Last 5 rows:")
print(out)

client.close()
