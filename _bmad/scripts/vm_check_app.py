import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Check app logs for search error
stdin, stdout, stderr = ssh.exec_command('docker logs --tail 20 itam-app-prod 2>&1')
print('App logs:')
print(stdout.read().decode('utf-8', errors='replace')[:2000])

# Check if containers are the new ones
stdin, stdout, stderr = ssh.exec_command('docker ps --format "{{.Names}} {{.Status}} {{.Image}}"')
print('Containers:')
print(stdout.read().decode())

ssh.close()
