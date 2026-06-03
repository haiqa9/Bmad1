import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Wait for DB
stdin, stdout, stderr = ssh.exec_command('cd /opt/itam && docker compose exec -T db pg_isready -U itam -d itam', timeout=30)
print('DB:')
print(stdout.read().decode())

# Run migrations
stdin, stdout, stderr = ssh.exec_command(
    'cd /opt/itam && docker run --rm --network itam_default '
    '-v /opt/itam:/app '
    '-e DATABASE_URL=postgresql://itam:itam_secure_pass@db:5432/itam?schema=public '
    '-w /app node:20-alpine '
    'sh -c "apk add --no-cache libc6-compat && npm ci && npx prisma migrate deploy" 2>&1',
    timeout=300
)
out = stdout.read().decode()
err = stderr.read().decode()
print('MIGRATE OUT:')
print(out[:5000])
print('MIGRATE ERR:')
print(err[:2000])

ssh.close()
