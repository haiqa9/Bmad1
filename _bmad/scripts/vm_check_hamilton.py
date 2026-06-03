import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=5)
stdin, stdout, stderr = ssh.exec_command('docker logs --tail 20 focused_hamilton 2>/dev/null || echo "no logs"')
print('Hamilton logs:')
print(stdout.read().decode('utf-8', errors='replace')[:2000])
ssh.close()
