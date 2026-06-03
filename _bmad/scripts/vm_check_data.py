import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Check row counts in new tables
stdin, stdout, stderr = ssh.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"SELECT 'LaptopRecord' as t, COUNT(*) as c FROM LaptopRecord UNION ALL SELECT 'ServerDevice', COUNT(*) FROM ServerDevice UNION ALL SELECT 'CloudVm', COUNT(*) FROM CloudVm UNION ALL SELECT 'LabVm', COUNT(*) FROM LabVm UNION ALL SELECT 'GatePass', COUNT(*) FROM GatePass UNION ALL SELECT 'FreeVm', COUNT(*) FROM FreeVm;\""
)
print('Row counts:')
print(stdout.read().decode())

# Check migrations table
stdin, stdout, stderr = ssh.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;\""
)
print('Recent migrations:')
print(stdout.read().decode())

ssh.close()
