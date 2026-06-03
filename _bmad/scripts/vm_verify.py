import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Check row counts
stdin, stdout, stderr = ssh.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"SELECT 'LaptopRecord' as t, COUNT(*) as c FROM \\\"LaptopRecord\\\" UNION ALL SELECT 'ServerDevice', COUNT(*) FROM \\\"ServerDevice\\\" UNION ALL SELECT 'CloudVm', COUNT(*) FROM \\\"CloudVm\\\" UNION ALL SELECT 'LabVm', COUNT(*) FROM \\\"LabVm\\\" UNION ALL SELECT 'GatePass', COUNT(*) FROM \\\"GatePass\\\" UNION ALL SELECT 'FreeVm', COUNT(*) FROM \\\"FreeVm\\\";\""
)
print('Row counts:')
print(stdout.read().decode())

# Check API
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/sheets/laptop-record?page=1\&limit=1')
print('API laptop-record:', stdout.read().decode().strip())

stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/sheets/cloud-vm-list?page=1\&limit=1')
print('API cloud-vm-list:', stdout.read().decode().strip())

stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/sheets/ports-detail?page=1\&limit=1')
print('API ports-detail:', stdout.read().decode().strip())

# Check main site
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/')
print('Main site:', stdout.read().decode().strip())

ssh.close()
