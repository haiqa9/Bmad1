import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Update dashboard layout - add Users menu for IT_ASSET_MANAGER
layout_old = '''  IT_ASSET_MANAGER: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Assets", href: "/dashboard/assets", icon: Package },
    { label: "Requests", href: "/dashboard/requests", icon: FileText },
    { label: "Approvals", href: "/dashboard/approvals", icon: CheckCircle },
    { label: "Compliance", href: "/dashboard/compliance", icon: BarChart3 },
    { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  ],'''

layout_new = '''  IT_ASSET_MANAGER: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Assets", href: "/dashboard/assets", icon: Package },
    { label: "Requests", href: "/dashboard/requests", icon: FileText },
    { label: "Approvals", href: "/dashboard/approvals", icon: CheckCircle },
    { label: "Compliance", href: "/dashboard/compliance", icon: BarChart3 },
    { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
    { label: "Users", href: "/dashboard/admin/users", icon: Users },
  ],'''

# Read current layout
stdin1, stdout1, stderr1 = client.exec_command("cat /opt/itam/app/dashboard/layout.tsx")
layout_content = stdout1.read().decode('utf-8', errors='replace')

# Also need to add Users import
layout_content = layout_content.replace(
    'import {\n  LayoutDashboard,\n  Package,\n  FileText,\n  BarChart3,\n  CheckCircle,\n  Wrench,\n} from "lucide-react";',
    'import {\n  LayoutDashboard,\n  Package,\n  FileText,\n  BarChart3,\n  CheckCircle,\n  Wrench,\n  Users,\n} from "lucide-react";'
)

layout_content = layout_content.replace(layout_old, layout_new)

sftp = client.open_sftp()
with sftp.file('/opt/itam/app/dashboard/layout.tsx', 'w') as f:
    f.write(layout_content)

# Update admin page - add Users card
admin_old = '''import { Package, FileText, CheckCircle, BarChart3, Wrench, ArrowUpRight } from "lucide-react";'''
admin_new = '''import { Package, FileText, CheckCircle, BarChart3, Wrench, ArrowUpRight, Users } from "lucide-react";'''

stdin2, stdout2, stderr2 = client.exec_command("cat /opt/itam/app/dashboard/admin/page.tsx")
admin_content = stdout2.read().decode('utf-8', errors='replace')

admin_content = admin_content.replace(admin_old, admin_new)

# Add Users card before the closing of cards array
admin_content = admin_content.replace(
    '''    {
      label: "Maintenance",
      desc: "Assets in maintenance mode",
      href: "/dashboard/maintenance",
      icon: Wrench,
      color: "bg-[#8B5CF6]",
      lightColor: "bg-[#8B5CF6]/10",
      textColor: "text-[#8B5CF6]",
    },
  ];''',
    '''    {
      label: "Maintenance",
      desc: "Assets in maintenance mode",
      href: "/dashboard/maintenance",
      icon: Wrench,
      color: "bg-[#8B5CF6]",
      lightColor: "bg-[#8B5CF6]/10",
      textColor: "text-[#8B5CF6]",
    },
    {
      label: "User Management",
      desc: "Manage users and assign roles",
      href: "/dashboard/admin/users",
      icon: Users,
      color: "bg-[#1A50A3]",
      lightColor: "bg-[#1A50A3]/10",
      textColor: "text-[#1A50A3]",
    },
  ];'''
)

with sftp.file('/opt/itam/app/dashboard/admin/page.tsx', 'w') as f:
    f.write(admin_content)

sftp.close()

# Verify
stdin3, stdout3, stderr3 = client.exec_command("grep -n 'Users' /opt/itam/app/dashboard/layout.tsx /opt/itam/app/dashboard/admin/page.tsx")
print(stdout3.read().decode('utf-8', errors='replace'))

client.close()
