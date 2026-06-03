import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Simple psql command
stdin, stdout, stderr = ssh.exec_command('docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT tablename FROM pg_tables WHERE schemaname = \'public\' AND tablename ILIKE \'laptop%\';"')
print('Tables:')
print(stdout.read().decode())
print('Stderr:', stderr.read().decode()[:200])

# Check column names
stdin, stdout, stderr = ssh.exec_command('docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT column_name FROM information_schema.columns WHERE table_name = \'LaptopRecord\' ORDER BY ordinal_position;"')
print('Columns:')
print(stdout.read().decode())
print('Stderr:', stderr.read().decode()[:200])

# Check isIssued specifically
stdin, stdout, stderr = ssh.exec_command('docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT isIssued, COUNT(*) FROM \\\"LaptopRecord\\\" GROUP BY isIssued;"')
print('isIssued counts:')
print(stdout.read().decode())
print('Stderr:', stderr.read().decode()[:200])

ssh.close()
