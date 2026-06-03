import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Read current page
stdin, stdout, stderr = client.exec_command("cat /opt/itam/app/dashboard/admin/users/page.tsx")
content = stdout.read().decode('utf-8', errors='replace')

# Fix onValueChange null type issues - wrap with null check
content = content.replace(
    'onValueChange={(v) => setForm({ ...form, role: v })}',
    'onValueChange={(v) => v && setForm({ ...form, role: v })}'
)

sftp = client.open_sftp()
with sftp.file('/opt/itam/app/dashboard/admin/users/page.tsx', 'w') as f:
    f.write(content)
sftp.close()

# Verify
stdin2, stdout2, stderr2 = client.exec_command("grep -n 'onValueChange' /opt/itam/app/dashboard/admin/users/page.tsx")
print(stdout2.read().decode('utf-8', errors='replace'))

client.close()
