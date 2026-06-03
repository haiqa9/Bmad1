import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Quote isIssued properly
stdin, stdout, stderr = ssh.exec_command('docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT \\\"isIssued\\\", COUNT(*) FROM \\\"LaptopRecord\\\" GROUP BY \\\"isIssued\\\" ORDER BY \\\"isIssued\\\";"')
print('isIssued counts:')
print(stdout.read().decode())
print('Err:', stderr.read().decode()[:200])

# Sample data
stdin, stdout, stderr = ssh.exec_command('docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT \\\"employeeName\\\", \\\"serialNumber\\\", \\\"isIssued\\\" FROM \\\"LaptopRecord\\\" LIMIT 5;"')
print('Sample:')
print(stdout.read().decode())

ssh.close()
