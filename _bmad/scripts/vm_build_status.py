import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=5)

# Check image creation time
stdin, stdout, stderr = ssh.exec_command('docker images --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" | grep itam')
print('Images:')
print(stdout.read().decode())

# Check if build failed or succeeded
stdin, stdout, stderr = ssh.exec_command('docker system events --since 30m --filter event=build 2>/dev/null | tail -10 || true')
print('Build events:')
print(stdout.read().decode())

# Try to see if there's a buildkit container
stdin, stdout, stderr = ssh.exec_command('docker ps -a --format "{{.Names}} {{.Status}}" | grep -i build || true')
print('Build containers:')
print(stdout.read().decode())

ssh.close()
