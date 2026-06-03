import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

sftp = client.open_sftp()

# 1. Create a client-side SessionProvider wrapper component
session_provider = '''"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
'''

with sftp.file('/opt/itam/components/auth-provider.tsx', 'w') as f:
    f.write(session_provider)

# 2. Update root layout to wrap with AuthProvider
stdin, stdout, stderr = client.exec_command("cat /opt/itam/app/layout.tsx")
layout = stdout.read().decode('utf-8', errors='replace')

layout = layout.replace(
    'import type { Metadata } from "next";\nimport { Inter } from "next/font/google";\nimport "./globals.css";',
    'import type { Metadata } from "next";\nimport { Inter } from "next/font/google";\nimport "./globals.css";\nimport { AuthProvider } from "@/components/auth-provider";'
)

layout = layout.replace(
    '      <body className="min-h-full flex flex-col font-sans">{children}</body>',
    '      <body className="min-h-full flex flex-col font-sans">\n        <AuthProvider>{children}</AuthProvider>\n      </body>'
)

with sftp.file('/opt/itam/app/layout.tsx', 'w') as f:
    f.write(layout)

sftp.close()

# Verify
stdin2, stdout2, stderr2 = client.exec_command("cat /opt/itam/app/layout.tsx")
print("=== UPDATED LAYOUT ===")
print(stdout2.read().decode('utf-8', errors='replace'))

stdin3, stdout3, stderr3 = client.exec_command("cat /opt/itam/components/auth-provider.tsx")
print("\n=== AUTH PROVIDER ===")
print(stdout3.read().decode('utf-8', errors='replace'))

client.close()
