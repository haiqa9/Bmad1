import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

stdin, stdout, stderr = ssh.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c 'SELECT column_name FROM information_schema.columns WHERE table_name = \\'LaptopRecord\\' ORDER BY ordinal_position;'"
)
print('Columns:')
print(stdout.read().decode())

ssh.close()
