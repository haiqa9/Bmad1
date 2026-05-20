import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

commands = [
    "whoami",
    "hostname",
    "cat /etc/os-release | head -5",
    "docker --version 2>/dev/null || echo 'docker not found'",
    "docker compose version 2>/dev/null || docker-compose --version 2>/dev/null || echo 'docker-compose not found'",
    "which docker 2>/dev/null || echo 'docker not in PATH'",
    "which docker-compose 2>/dev/null || echo 'docker-compose not in PATH'",
    "psql --version 2>/dev/null || echo 'psql not found'",
    "docker ps 2>/dev/null || echo 'docker ps failed'",
    "systemctl status postgresql 2>/dev/null || service postgresql status 2>/dev/null || echo 'postgresql service not found'",
    "ls -la /var/lib/postgresql 2>/dev/null || echo 'no postgresql data dir'",
    "ls -la /home/ 2>/dev/null",
    "pwd",
    "ls -la /opt/ 2>/dev/null || echo 'no /opt'",
]

for cmd in commands:
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    print(f"=== {cmd} ===")
    if out:
        print(out)
    if err:
        print(f"STDERR: {err}")
    print()

client.close()
