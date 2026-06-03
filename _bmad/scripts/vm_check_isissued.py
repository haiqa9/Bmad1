import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Check distinct isIssued values
stdin, stdout, stderr = ssh.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"SELECT DISTINCT isIssued FROM \\\"LaptopRecord\\\";\""
)
print('Distinct isIssued:')
print(stdout.read().decode())

# Check count by isIssued
stdin, stdout, stderr = ssh.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"SELECT isIssued, COUNT(*) FROM \\\"LaptopRecord\\\" GROUP BY isIssued ORDER BY isIssued;\""
)
print('Count by isIssued:')
print(stdout.read().decode())

# Check sample
stdin, stdout, stderr = ssh.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"SELECT \\\"employeeName\\\", \\\"serialNumber\\\", isIssued FROM \\\"LaptopRecord\\\" LIMIT 10;\""
)
print('Sample:')
print(stdout.read().decode())

ssh.close()
