import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Check if build is running
stdin, stdout, stderr = ssh.exec_command('docker ps --format "{{.Names}}"')
print('Containers:')
print(stdout.read().decode())

# Check build logs
stdin, stdout, stderr = ssh.exec_command('docker system events --since 5m --filter event=build 2>/dev/null | tail -5')
print('Recent build events:')
print(stdout.read().decode())

# Check if docker buildx is running
stdin, stdout, stderr = ssh.exec_command('docker ps --all --format "{{.Names}} {{.Status}} {{.Command}}" | grep -i build || echo "no build containers"')
print('Build containers:')
print(stdout.read().decode())

ssh.close()
