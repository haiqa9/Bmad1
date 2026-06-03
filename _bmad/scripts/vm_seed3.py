import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Run seed inside the app container which already has node_modules + prisma client
stdin, stdout, stderr = ssh.exec_command(
    'cd /opt/itam && docker compose exec -T app sh -c "'
    'export DATABASE_URL=postgresql://itam:itam_secure_pass@db:5432/itam?schema=public && '
    'npx tsx prisma/seed.ts" 2>&1',
    timeout=300
)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print('SEED3 OUT:')
print(out[:5000])
print('SEED3 ERR:')
print(err[:2000])
ssh.close()
