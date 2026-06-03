import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

def run(cmd):
    print(f"\n=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out)
    if err and "No such file" not in err:
        print("ERR:", err)

run("grep -n 'Math.min(100' /opt/itam/app/api/requests/route.ts")
run("grep -n 'requireAuth\|requireManager' /opt/itam/lib/api-auth.ts | head -5")
run("grep -n 'poweredByHeader' /opt/itam/next.config.ts")
run("grep -n 'requireAuth\|requireManager' /opt/itam/app/api/sheets/\[sheet\]/route.ts")
run("grep -n 'requireAuth\|requireManager' /opt/itam/app/api/assets/route.ts")
run("grep -n 'requireAuth\|requireManager' /opt/itam/app/api/compliance/route.ts")
run("grep -n 'isDummy' /opt/itam/lib/auth.ts")

client.close()
