import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Read the current asset form
stdin, stdout, stderr = client.exec_command("cat /opt/itam/components/assets/asset-form.tsx")
content = stdout.read().decode('utf-8', errors='replace')

# Fix 1: Add type default value and shouldValidate on setValue
content = content.replace(
    '''    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      status: "REGISTERED",
      ...defaultValues,
    },''',
    '''    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      type: "HARDWARE",
      status: "REGISTERED",
      ...defaultValues,
    },'''
)

# Fix 2: Add shouldValidate to setValue calls for type and status
content = content.replace(
    'onValueChange={(v) => setValue("type", v as any)}',
    'onValueChange={(v) => setValue("type", v as any, { shouldValidate: true })}'
)

content = content.replace(
    'onValueChange={(v) => setValue("status", v as any)}',
    'onValueChange={(v) => setValue("status", v as any, { shouldValidate: true })}'
)

# Fix 3: Add error display for type field
content = content.replace(
    '''            <SelectContent>
              <SelectItem value="HARDWARE">Hardware</SelectItem>
              <SelectItem value="SOFTWARE">Software</SelectItem>
              <SelectItem value="CLOUD">Cloud</SelectItem>
              <SelectItem value="PERIPHERAL">Peripheral</SelectItem>
            </SelectContent>
          </Select>
        </div>''',
    '''            <SelectContent>
              <SelectItem value="HARDWARE">Hardware</SelectItem>
              <SelectItem value="SOFTWARE">Software</SelectItem>
              <SelectItem value="CLOUD">Cloud</SelectItem>
              <SelectItem value="PERIPHERAL">Peripheral</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-xs text-red-500">{String(errors.type.message)}</p>
          )}
        </div>'''
)

# Fix 4: Redirect to /dashboard/assets after successful creation
content = content.replace(
    'router.push("/assets");',
    'router.push("/dashboard/assets");'
)

# Fix 5: Fix cancel link
content = content.replace(
    '<Link href="/assets">',
    '<Link href="/dashboard/assets">'
)

sftp = client.open_sftp()
with sftp.file('/opt/itam/components/assets/asset-form.tsx', 'w') as f:
    f.write(content)
sftp.close()

# Verify
stdin2, stdout2, stderr2 = client.exec_command("grep -n 'type:' /opt/itam/components/assets/asset-form.tsx | head -5")
print("=== TYPE DEFAULT ===")
print(stdout2.read().decode('utf-8', errors='replace'))

stdin3, stdout3, stderr3 = client.exec_command("grep -n 'shouldValidate' /opt/itam/components/assets/asset-form.tsx")
print("\n=== SHOULD VALIDATE ===")
print(stdout3.read().decode('utf-8', errors='replace'))

stdin4, stdout4, stderr4 = client.exec_command("grep -n 'dashboard/assets' /opt/itam/components/assets/asset-form.tsx")
print("\n=== REDIRECT FIX ===")
print(stdout4.read().decode('utf-8', errors='replace'))

client.close()
