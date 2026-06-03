import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Check deployment
stdin, stdout, stderr = ssh.exec_command('ls -la /opt/ 2>/dev/null || ls -la /root/ 2>/dev/null || ls -la /home/ 2>/dev/null')
print('VM root dirs:')
print(stdout.read().decode())
print(stderr.read().decode())

# Check docker
stdin, stdout, stderr = ssh.exec_command('docker ps --format "{{.Names}}"')
print('Docker containers:')
print(stdout.read().decode())

# Check if ITAM code exists
stdin, stdout, stderr = ssh.exec_command('find / -maxdepth 4 -name "package.json" -path "*/ITAM/*" 2>/dev/null')
print('ITAM locations:')
print(stdout.read().decode())

ssh.close()
