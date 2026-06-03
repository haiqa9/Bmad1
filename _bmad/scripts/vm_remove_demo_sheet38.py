import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)
sftp = ssh.open_sftp()

# Copy updated files
files = [
    ('D:/Bmad/ITAM/app/login/page.tsx', '/opt/itam/app/login/page.tsx'),
    ('D:/Bmad/ITAM/lib/sheets.ts', '/opt/itam/lib/sheets.ts'),
    ('D:/Bmad/ITAM/app/api/sheets/[sheet]/route.ts', '/opt/itam/app/api/sheets/[sheet]/route.ts'),
]

for local, remote in files:
    try:
        sftp.put(local, remote)
        print(f'OK: {remote}')
    except Exception as e:
        print(f'FAIL: {remote} -> {e}')

sftp.close()

# Rebuild and restart
print('\nRebuilding app...')
stdin, stdout, stderr = ssh.exec_command('cd /opt/itam && docker compose build --no-cache app 2>&1', timeout=600)
out = stdout.read().decode('utf-8', errors='replace')
print(f'Build: {len(out)} chars')
if 'error' in out.lower()[-2000:]:
    print('BUILD ERR:', out[-2000:])
else:
    print('Build OK')

print('\nRestarting...')
stdin, stdout, stderr = ssh.exec_command('cd /opt/itam && docker compose up -d', timeout=60)
print(stdout.read().decode()[:300])

# Verify
print('\nVerifying...')
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/login"')
print('Login page:', stdout.read().decode().strip())

stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/sheets/laptop-record?page=1&limit=1"')
print('Laptop API:', stdout.read().decode().strip())

stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/sheets/sheet38?page=1&limit=1"')
print('Sheet38 API (should be 404):', stdout.read().decode().strip())

ssh.close()
print('\n=== DONE ===')
