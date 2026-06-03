import paramiko
import sys

sys.stdout = open('check_backup_env.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Check .env.backup
stdin1, stdout1, stderr1 = client.exec_command("cat /opt/itam/.env.backup")
backup_env = stdout1.read().decode('utf-8', errors='replace')
print("=== .env.backup ===")
print(backup_env)

# Check if there are any other env files
stdin2, stdout2, stderr2 = client.exec_command("find /opt/itam -name '.env*' -type f")
env_files = stdout2.read().decode('utf-8', errors='replace')
print("\n=== ALL ENV FILES ===")
print(env_files)

client.close()
