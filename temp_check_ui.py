import paramiko
import sys

sys.stdout = open('check_ui.log', 'w', encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Read key UI components
for file in ['button.tsx', 'dialog.tsx', 'input.tsx', 'select.tsx', 'table.tsx', 'label.tsx']:
    stdin, stdout, stderr = client.exec_command(f"cat /opt/itam/components/ui/{file}")
    content = stdout.read().decode('utf-8', errors='replace')
    print(f"\n=== {file} ===")
    print(content)

client.close()
