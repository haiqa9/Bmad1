import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=5)

# Check docker processes
stdin, stdout, stderr = ssh.exec_command('ps aux | grep docker | grep -v grep')
print('Docker processes:')
print(stdout.read().decode()[:500])

# Check if buildkit is running
stdin, stdout, stderr = ssh.exec_command('docker ps -a --format "{{.Names}} {{.Status}}" | grep -i build || true')
print('Build containers:')
print(stdout.read().decode())

ssh.close()
