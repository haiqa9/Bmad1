import paramiko

HOST = "192.168.1.38"
USER = "root"
PASS = "ExpertFlow123"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=30)
sftp = client.open_sftp()

sftp.put(r"D:\Bmad\import_laptops.sql", "/opt/itam/import_laptops.sql")
print("Uploaded import_laptops.sql")
sftp.close()

cmd = 'docker exec -i itam-postgres-prod psql -U itam -d itam -f /tmp/import_laptops.sql'
# First copy file into container
stdin, stdout, stderr = client.exec_command('docker cp /opt/itam/import_laptops.sql itam-postgres-prod:/tmp/import_laptops.sql', timeout=30)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
if out: print(out)
if err: print("STDERR:", err)

# Run the SQL
stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print("SQL OUTPUT:")
print(out)
if err:
    print("STDERR:", err)

# Verify count
stdin, stdout, stderr = client.exec_command('docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT COUNT(*) FROM \\\"LaptopRecord\\\";"', timeout=30)
out = stdout.read().decode('utf-8', errors='replace')
print("COUNT:")
print(out)

client.close()
