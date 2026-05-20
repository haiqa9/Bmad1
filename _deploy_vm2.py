import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

cmds = [
    # Clone fresh repo
    "cd /tmp && rm -rf itam-deploy && git clone https://github.com/haiqa9/Bmad1.git itam-deploy",
    # Backup existing .env
    "cp /opt/itam/.env /opt/itam/.env.backup",
    # Copy new code over existing (preserving .env and any certs)
    "cd /tmp/itam-deploy/ITAM && cp -r . /opt/itam/",
    # Restore .env
    "cp /opt/itam/.env.backup /opt/itam/.env",
    # Add Google OAuth placeholders if missing
    "cd /opt/itam && grep -q GOOGLE_CLIENT_ID .env || echo 'GOOGLE_CLIENT_ID=your-google-client-id' >> .env",
    "cd /opt/itam && grep -q GOOGLE_CLIENT_SECRET .env || echo 'GOOGLE_CLIENT_SECRET=your-google-client-secret' >> .env",
    # Show current docker status
    "docker ps",
    # Rebuild and restart
    "cd /opt/itam && docker compose down && docker compose up -d --build",
    # Wait a bit and check status
    "sleep 15 && docker ps && docker logs itam-app-prod --tail 20",
]

for cmd in cmds:
    print(f"=== RUNNING: {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=300)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out:
        print(out)
    if err:
        print(f"STDERR: {err}")
    print()

client.close()
