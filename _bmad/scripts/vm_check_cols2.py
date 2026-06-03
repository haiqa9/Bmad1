import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.38', username='root', password='ExpertFlow123', timeout=10)

# Check with lowercase table name
ssh.exec_command("cat > /tmp/check.sql << 'EOF'\nSELECT column_name, data_type FROM information_schema.columns WHERE table_name ILIKE 'laptoprecord' ORDER BY ordinal_position;\nEOF")

stdin, stdout, stderr = ssh.exec_command("docker exec itam-postgres-prod psql -U itam -d itam -f /tmp/check.sql")
print('Columns:')
print(stdout.read().decode())

# Also check all tables
ssh.exec_command("cat > /tmp/check2.sql << 'EOF'\nSELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename ILIKE 'laptop%';\nEOF")
stdin, stdout, stderr = ssh.exec_command("docker exec itam-postgres-prod psql -U itam -d itam -f /tmp/check2.sql")
print('Tables:')
print(stdout.read().decode())

ssh.close()
