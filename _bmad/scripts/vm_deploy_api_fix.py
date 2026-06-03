import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)
sftp = ssh.open_sftp()

# Copy the fixed API route
sftp.put('D:/Bmad/ITAM/app/api/sheets/[sheet]/route.ts', '/opt/itam/app/api/sheets/[sheet]/route.ts')
print('Copied API route')

# Copy updated components
sftp.put('D:/Bmad/ITAM/components/sheets/sheet-table.tsx', '/opt/itam/components/sheets/sheet-table.tsx')
print('Copied sheet-table')

sftp.put('D:/Bmad/ITAM/components/sheets/add-entry-modal.tsx', '/opt/itam/components/sheets/add-entry-modal.tsx')
print('Copied add-entry-modal')

# Copy updated lib
sftp.put('D:/Bmad/ITAM/lib/sheets.ts', '/opt/itam/lib/sheets.ts')
print('Copied sheets.ts')

sftp.close()

# Rebuild and restart
print("\nRebuilding app...")
stdin, stdout, stderr = ssh.exec_command('cd /opt/itam && docker compose build --no-cache app 2>&1', timeout=600)
out = stdout.read().decode('utf-8', errors='replace')
print(f"Build: {len(out)} chars")

print("\nRestarting...")
stdin, stdout, stderr = ssh.exec_command('cd /opt/itam && docker compose up -d', timeout=60)
print(stdout.read().decode()[:300])

# Verify search works
print("\nVerifying search...")
stdin, stdout, stderr = ssh.exec_command('curl -s "http://localhost:3000/api/sheets/laptop-record?page=1&limit=5&q=Asjad" | head -c 300')
print("Search result:", stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/sheets/laptop-record?page=1&limit=5&q=Asjad"')
print("Search status:", stdout.read().decode().strip())

ssh.close()
print("\n=== DONE ===")
