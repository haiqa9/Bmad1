import paramiko
import sys

sys.stdout = open('read_migrations.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Read all migration SQL files
for migration in ['20260519133524_init', '20260519133925_add_password', '20260520133702_make_password_optional']:
    stdin, stdout, stderr = client.exec_command(f"cat /opt/itam/prisma/migrations/{migration}/migration.sql")
    sql = stdout.read().decode('utf-8', errors='replace')
    print(f"\n=== {migration} ===")
    print(sql)

client.close()
