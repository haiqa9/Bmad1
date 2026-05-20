import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

cmds = [
    # Pull latest code
    "cd /opt/itam && git pull origin main",
    # Check current .env
    "cat /opt/itam/.env",
    # Update .env to add Google OAuth placeholders if missing
    "cd /opt/itam && grep -q GOOGLE_CLIENT_ID .env || echo 'GOOGLE_CLIENT_ID=your-google-client-id' >> .env",
    "cd /opt/itam && grep -q GOOGLE_CLIENT_SECRET .env || echo 'GOOGLE_CLIENT_SECRET=your-google-client-secret' >> .env",
    # Show updated .env (hiding secrets)
    "cd /opt/itam && cat .env | sed 's/SECRET=.*/SECRET=***/g' | sed 's/PASSWORD=.*/PASSWORD=***/g'",
]

for cmd in cmds:
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    print(f"=== {cmd} ===")
    if out:
        print(out)
    if err:
        print(f"STDERR: {err}")
    print()

client.close()
