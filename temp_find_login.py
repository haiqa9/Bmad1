import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Find files with useSearchParams
stdin, stdout, stderr = client.exec_command('find /opt/itam -type f \\( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \\) | xargs grep -l "useSearchParams" 2>/dev/null')
out = stdout.read().decode().strip()
err = stderr.read().decode().strip()
print("FILES WITH useSearchParams:")
print(out)
if err:
    print("STDERR:", err)

# Also find files with login in path
stdin, stdout, stderr = client.exec_command('find /opt/itam -type f | grep -i login')
out2 = stdout.read().decode().strip()
print("\nFILES WITH login IN PATH:")
print(out2)

client.close()
