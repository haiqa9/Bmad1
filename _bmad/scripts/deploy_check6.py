import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

stdin, stdout, stderr = ssh.exec_command('ls /opt/itam/prisma/migrations/')
print('Existing migrations:')
print(stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command('docker compose version 2>/dev/null || docker-compose version 2>/dev/null || echo "no compose"')
print('Compose:')
print(stdout.read().decode())

ssh.close()
