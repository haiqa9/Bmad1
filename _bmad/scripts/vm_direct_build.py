import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Check if docker compose build is running
stdin, stdout, stderr = ssh.exec_command('ps aux | grep -i docker | grep -v grep')
print('Docker processes:')
print(stdout.read().decode())

# Check buildx
stdin, stdout, stderr = ssh.exec_command('docker buildx ls')
print('Buildx:')
print(stdout.read().decode())

# Try to build with more output
stdin, stdout, stderr = ssh.exec_command('cd /opt/itam && docker compose build --no-cache app 2>&1 | tail -50', timeout=600)
print('Build tail:')
print(stdout.read().decode()[-2000:])

ssh.close()
