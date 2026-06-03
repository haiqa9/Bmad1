import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Fix validation schema - allow empty string for optional password
stdin, stdout, stderr = client.exec_command("cat /opt/itam/lib/validations/user.ts")
content = stdout.read().decode('utf-8', errors='replace')

content = content.replace(
    'password: z.string().min(6, "Password must be at least 6 characters").optional(),',
    'password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),'
)

sftp = client.open_sftp()
with sftp.file('/opt/itam/lib/validations/user.ts', 'w') as f:
    f.write(content)
sftp.close()

# Also improve API error logging to see what's actually failing
stdin2, stdout2, stderr2 = client.exec_command("cat /opt/itam/app/api/users/route.ts")
api_content = stdout2.read().decode('utf-8', errors='replace')

# Replace the error handler to log the actual validation errors
api_content = api_content.replace(
    '''  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }''',
    '''  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      console.error("Validation errors:", JSON.stringify(zodError.errors, null, 2));
      return NextResponse.json(
        { error: "Validation failed", details: zodError.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }'''
)

sftp = client.open_sftp()
with sftp.file('/opt/itam/app/api/users/route.ts', 'w') as f:
    f.write(api_content)
sftp.close()

# Verify
stdin3, stdout3, stderr3 = client.exec_command("cat /opt/itam/lib/validations/user.ts")
print("=== FIXED VALIDATION ===")
print(stdout3.read().decode('utf-8', errors='replace'))

client.close()
