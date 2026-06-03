import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Read current page
stdin, stdout, stderr = client.exec_command("cat /opt/itam/app/dashboard/admin/users/page.tsx")
content = stdout.read().decode('utf-8', errors='replace')

# Fix DialogTrigger asChild - replace with simple onClick pattern
content = content.replace(
    '''        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1A50A3] text-white hover:bg-[#153d80]">
              <Plus className="h-4 w-4 mr-1" />
              Add User
            </Button>
          </DialogTrigger>''',
    '''        <Button
          className="bg-[#1A50A3] text-white hover:bg-[#153d80]"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add User
        </Button>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>'''
)

# Also need to remove DialogTrigger import since we don't use it anymore
# Actually, let's check if DialogTrigger is used elsewhere - it's only in the create dialog
content = content.replace(
    '  DialogTrigger,\n',
    ''
)

sftp = client.open_sftp()
with sftp.file('/opt/itam/app/dashboard/admin/users/page.tsx', 'w') as f:
    f.write(content)
sftp.close()

# Verify
stdin2, stdout2, stderr2 = client.exec_command("grep -n 'DialogTrigger' /opt/itam/app/dashboard/admin/users/page.tsx || echo 'No DialogTrigger found'")
print(stdout2.read().decode('utf-8', errors='replace'))

client.close()
