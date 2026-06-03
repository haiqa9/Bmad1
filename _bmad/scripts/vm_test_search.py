import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Test search
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/sheets/laptop-record?page=1&limit=5&q=Asjad"')
print('Search status:', stdout.read().decode().strip())

# Test search result
stdin, stdout, stderr = ssh.exec_command('curl -s "http://localhost:3000/api/sheets/laptop-record?page=1&limit=5&q=Asjad" | head -c 400')
print('Search data:', stdout.read().decode())

# Test normal API
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/sheets/laptop-record?page=1&limit=1"')
print('Normal API:', stdout.read().decode().strip())

ssh.close()
