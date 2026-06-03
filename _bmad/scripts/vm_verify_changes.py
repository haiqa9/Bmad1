import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Check login page doesn't have demo accounts
stdin, stdout, stderr = ssh.exec_command('curl -s "http://localhost:3000/login" | grep -i "demo\|password123\|employee@\|depthead@\|itops@\|assetmgr@" || echo "NO_DEMO_FOUND"')
print('Demo check:', stdout.read().decode().strip())

# Check laptop API works
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/sheets/laptop-record?page=1&limit=1"')
print('Laptop API:', stdout.read().decode().strip())

# Check sheet38 API returns 404
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/sheets/sheet38?page=1&limit=1"')
print('Sheet38 API:', stdout.read().decode().strip())

ssh.close()
