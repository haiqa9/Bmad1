import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Check if prisma CLI is available in the app container
stdin, stdout, stderr = ssh.exec_command('docker exec itam-app-prod which npx 2>/dev/null; docker exec itam-app-prod npx prisma --version 2>/dev/null || echo "prisma not available"')
print('Prisma in container:')
print(stdout.read().decode())

# Check next.config.ts
stdin, stdout, stderr = ssh.exec_command('cat /opt/itam/next.config.ts')
print('next.config.ts:')
print(stdout.read().decode())

# Check if node_modules exists in the app container
stdin, stdout, stderr = ssh.exec_command('docker exec itam-app-prod ls -la /app/node_modules 2>/dev/null | head -5 || echo "no node_modules"')
print('node_modules in container:')
print(stdout.read().decode())

# Check if we can run node in the container
stdin, stdout, stderr = ssh.exec_command('docker exec itam-app-prod node --version')
print('Node version in container:')
print(stdout.read().decode())

ssh.close()
