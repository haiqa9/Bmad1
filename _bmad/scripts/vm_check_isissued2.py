import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Check isIssued with a simple query
stdin, stdout, stderr = ssh.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c 'SELECT isIssued, COUNT(*) FROM \\\"LaptopRecord\\\" GROUP BY isIssued;'"
)
print('Count by isIssued:')
print(stdout.read().decode())
print('ERR:', stderr.read().decode()[:500])

# Check sample with employee name
stdin, stdout, stderr = ssh.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c 'SELECT employeeName, serialNumber, isIssued FROM \\\"LaptopRecord\\\" LIMIT 5;'"
)
print('Sample:')
print(stdout.read().decode())
print('ERR:', stderr.read().decode()[:500])

ssh.close()
