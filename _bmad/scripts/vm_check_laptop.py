import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Check LaptopRecord count
stdin, stdout, stderr = ssh.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"SELECT COUNT(*) FROM \\\"LaptopRecord\\\";\""
)
print('LaptopRecord count:', stdout.read().decode().strip())

# Check isIssued breakdown
stdin, stdout, stderr = ssh.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"SELECT isIssued, COUNT(*) FROM \\\"LaptopRecord\\\" GROUP BY isIssued;\""
)
print('isIssued breakdown:', stdout.read().decode().strip())

# Check if isIssued column exists
stdin, stdout, stderr = ssh.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"SELECT column_name FROM information_schema.columns WHERE table_name = 'LaptopRecord' AND column_name = 'isIssued';\""
)
print('isIssued column:', stdout.read().decode().strip())

# Check sample data
stdin, stdout, stderr = ssh.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"SELECT \\\"employeeName\\\", \\\"serialNumber\\\", isIssued FROM \\\"LaptopRecord\\\" LIMIT 5;\""
)
print('Sample:', stdout.read().decode().strip())

ssh.close()
