import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

stdin, stdout, stderr = ssh.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"SELECT 'IloIdrac' as t, COUNT(*) as c FROM \\\"IloIdrac\\\" UNION ALL SELECT 'PublicFqdn', COUNT(*) FROM \\\"PublicFqdn\\\" UNION ALL SELECT 'ReceivedItem', COUNT(*) FROM \\\"ReceivedItem\\\" UNION ALL SELECT 'PortDetail', COUNT(*) FROM \\\"PortDetail\\\" UNION ALL SELECT 'Sheet38', COUNT(*) FROM \\\"Sheet38\\\";\""
)
print('Row counts (remaining):')
print(stdout.read().decode())

# Check all API endpoints
sheets = ['laptop-record', 'servers-devices', 'iloidrac', 'cloud-vm-list', 'lab-vm-list', 'public-fqdn', 'gatepass', 'received-items', 'ports-detail', 'free-vms', 'sheet38']
for s in sheets:
    stdin, stdout, stderr = ssh.exec_command(f'curl -s -o /dev/null -w "%{{http_code}}" "http://localhost:3000/api/sheets/{s}?page=1&limit=1"')
    code = stdout.read().decode().strip()
    print(f'API {s}: {code}')

ssh.close()
