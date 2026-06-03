import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

stdin, stdout, stderr = ssh.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c '\\\\d \\\"LaptopRecord\\\"'"
)
print('Table desc:')
print(stdout.read().decode())
print('Err:', stderr.read().decode()[:200])

ssh.close()
