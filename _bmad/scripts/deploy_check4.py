import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

stdin, stdout, stderr = ssh.exec_command('cat /opt/itam/prisma.config.js')
print('prisma.config.js:')
print(stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command('ls /opt/itam/node_modules 2>/dev/null | head -5 || echo "no node_modules"')
print('node_modules:')
print(stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command('cat /opt/itam/package.json')
print('package.json:')
print(stdout.read().decode())

ssh.close()
