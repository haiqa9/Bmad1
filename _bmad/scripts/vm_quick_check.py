import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=5)
stdin, stdout, stderr = ssh.exec_command('docker ps --format "{{.Names}}" 2>/dev/null')
print('Containers:', stdout.read().decode().strip() or 'none')
stdin, stdout, stderr = ssh.exec_command('docker images --format "{{.Repository}}:{{.Tag}}" | grep itam || true')
print('Images:', stdout.read().decode().strip() or 'none')
ssh.close()
