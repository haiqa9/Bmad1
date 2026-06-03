import paramiko

HOST = "192.168.1.38"
USER = "root"
PASS = "ExpertFlow123"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=30)
sftp = client.open_sftp()

sftp.put(r"D:\Bmad\import_cloud.sql", "/opt/itam/import_cloud.sql")
print("Uploaded import_cloud.sql")

sftp.close()

# Import data
stdin, stdout, stderr = client.exec_command('docker cp /opt/itam/import_cloud.sql itam-postgres-prod:/tmp/import_cloud.sql', timeout=30)
out = stdout.read().decode("utf-8", errors="replace")
err = stderr.read().decode("utf-8", errors="replace")
if out: print(out)
if err: print("STDERR:", err)

stdin, stdout, stderr = client.exec_command('docker exec -i itam-postgres-prod psql -U itam -d itam -f /tmp/import_cloud.sql', timeout=120)
out = stdout.read().decode("utf-8", errors="replace")
err = stderr.read().decode("utf-8", errors="replace")
print("SQL OUTPUT:")
print(out)
if err:
    print("STDERR:", err)

# Verify count
stdin, stdout, stderr = client.exec_command('docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT \\\"no\\\", \\\"cloudVmUsageDescription\\\", \\\"ipAddress\\\" FROM \\\"CloudVm\\\" ORDER BY \\\"no\\\"::int LIMIT 5;"', timeout=30)
out = stdout.read().decode("utf-8", errors="replace")
print("First 5:")
print(out)

stdin, stdout, stderr = client.exec_command('docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT \\\"no\\\", \\\"cloudVmUsageDescription\\\", \\\"ipAddress\\\" FROM \\\"CloudVm\\\" ORDER BY \\\"no\\\"::int DESC LIMIT 5;"', timeout=30)
out = stdout.read().decode("utf-8", errors="replace")
print("Last 5:")
print(out)

client.close()
