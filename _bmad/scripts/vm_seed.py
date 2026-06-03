import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

stdin, stdout, stderr = ssh.exec_command(
    'cd /opt/itam && docker run --rm --network itam_default '
    '-v /opt/itam:/app '
    '-e DATABASE_URL=postgresql://itam:itam_secure_pass@db:5432/itam?schema=public '
    '-w /app node:20-alpine '
    'sh -c "apk add --no-cache libc6-compat && npm ci && npx tsx prisma/seed.ts" 2>&1',
    timeout=300
)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print('SEED OUT:')
print(out[:5000])
print('SEED ERR:')
print(err[:2000])
ssh.close()
