import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

stdin, stdout, stderr = client.exec_command('cat /opt/itam/app/login/page.tsx')
out = stdout.read().decode()
err = stderr.read().decode().strip()
print(out)
if err:
    print("STDERR:", err)

client.close()
