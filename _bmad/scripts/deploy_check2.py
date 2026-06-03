import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Check /opt/itam structure
stdin, stdout, stderr = ssh.exec_command('ls -la /opt/itam/')
print('/opt/itam contents:')
print(stdout.read().decode())

# Check if it has app/, prisma/, etc.
stdin, stdout, stderr = ssh.exec_command('ls /opt/itam/app/ /opt/itam/prisma/ /opt/itam/lib/ 2>/dev/null')
print('Subdirs:')
print(stdout.read().decode())

# Check docker-compose
stdin, stdout, stderr = ssh.exec_command('cat /opt/itam/docker-compose.yml')
print('docker-compose:')
print(stdout.read().decode()[:500])

# Check .env
stdin, stdout, stderr = ssh.exec_command('cat /opt/itam/.env')
print('.env:')
print(stdout.read().decode())

ssh.close()
