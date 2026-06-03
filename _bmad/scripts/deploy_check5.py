import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

stdin, stdout, stderr = ssh.exec_command('which node && node --version || echo "no node"')
print('Node on host:')
print(stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command('which npm && npm --version || echo "no npm"')
print('NPM on host:')
print(stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command('docker network ls')
print('Docker networks:')
print(stdout.read().decode())

ssh.close()
