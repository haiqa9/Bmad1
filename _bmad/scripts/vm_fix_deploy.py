import sys
import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Check app logs for 500 error
stdin, stdout, stderr = ssh.exec_command('docker logs --tail 30 itam-app-prod 2>&1')
out = stdout.read().decode('utf-8', errors='replace')[:2000]
print('App logs:')
print(out.encode(sys.stdout.encoding, errors='replace').decode(sys.stdout.encoding))

# Check migration status
stdin, stdout, stderr = ssh.exec_command(
    'docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"'
)
print('Migrations:')
print(stdout.read().decode())

# Check LaptopRecord columns
stdin, stdout, stderr = ssh.exec_command(
    'docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT column_name FROM information_schema.columns WHERE table_name = \'LaptopRecord\' ORDER BY ordinal_position;"'
)
print('Columns:')
print(stdout.read().decode())

# Check if data exists
stdin, stdout, stderr = ssh.exec_command(
    'docker exec itam-postgres-prod psql -U itam -d itam -c "SELECT COUNT(*) FROM \\\"LaptopRecord\\\";"'
)
print('Count:')
print(stdout.read().decode())

ssh.close()
