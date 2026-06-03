import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=5)

# Check running processes
stdin, stdout, stderr = ssh.exec_command('ps aux | grep -i docker | grep -v grep || true')
print('Docker processes:')
print(stdout.read().decode())

# Check if any build is in progress
stdin, stdout, stderr = ssh.exec_command('docker system events --since 10m --filter event=build 2>/dev/null | tail -3 || true')
print('Build events:')
print(stdout.read().decode())

# Check docker buildx
stdin, stdout, stderr = ssh.exec_command('docker buildx ls 2>/dev/null || true')
print('Buildx:')
print(stdout.read().decode())

ssh.close()
