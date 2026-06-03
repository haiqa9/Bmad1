import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=5)
stdin, stdout, stderr = ssh.exec_command(
    "docker exec itam-postgres-prod psql -U itam -d itam -c \"SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;\""
)
print('Tables:')
print(stdout.read().decode())
ssh.close()
