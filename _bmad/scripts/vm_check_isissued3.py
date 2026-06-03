import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Run a query file
query = """SELECT isIssued, COUNT(*) FROM "LaptopRecord" GROUP BY isIssued ORDER BY isIssued;"""
stdin, stdout, stderr = ssh.exec_command(f"docker exec itam-postgres-prod psql -U itam -d itam -c '{query}'")
print('Count:')
print(stdout.read().decode())
print('Err:', stderr.read().decode()[:200])

query2 = """SELECT "employeeName", "serialNumber", isIssued FROM "LaptopRecord" LIMIT 5;"""
stdin, stdout, stderr = ssh.exec_command(f"docker exec itam-postgres-prod psql -U itam -d itam -c '{query2}'")
print('Sample:')
print(stdout.read().decode())

ssh.close()
