import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { LogoutButton } from "@/components/logout-button";
import {
  LayoutDashboard,
  Package,
  FileText,
  BarChart3,
  CheckCircle,
  Wrench,
} from "lucide-react";

const menuConfig: Record<
  string,
  { label: string; href: string; icon: React.ElementType }[]
> = {
  EMPLOYEE: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Request Asset", href: "/dashboard/requests/new", icon: FileText },
    { label: "My Requests", href: "/dashboard/requests", icon: FileText },
  ],
  DEPT_HEAD: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Pending Approvals", href: "/dashboard/approvals/manager", icon: CheckCircle },
    { label: "My Requests", href: "/dashboard/requests", icon: FileText },
  ],
  IT_OPS: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Assets", href: "/dashboard/assets", icon: Package },
    { label: "IT Approvals", href: "/dashboard/approvals/it", icon: CheckCircle },
    { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  ],
  IT_ASSET_MANAGER: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Assets", href: "/dashboard/assets", icon: Package },
    { label: "Requests", href: "/dashboard/requests", icon: FileText },
    { label: "Approvals", href: "/dashboard/approvals", icon: CheckCircle },
    { label: "Compliance", href: "/dashboard/compliance", icon: BarChart3 },
    { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  ],
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const menuItems = menuConfig[user.role] || menuConfig.EMPLOYEE;

  return (
    <div className="flex min-h-full">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-[#E8E8E8] bg-white">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-[#E8E8E8]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A50A3]">
            <span className="text-sm font-bold text-white">EF</span>
          </div>
          <div>
            <span className="text-base font-bold text-[#212427] leading-tight block">
              Expertflow
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1A50A3]">
              ITAM Portal
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="px-4 py-4">
          <div className="rounded-xl bg-[#F5F6F9] px-4 py-3">
            <p className="text-xs text-gray-500 mb-0.5">Signed in as</p>
            <p className="text-sm font-semibold text-[#212427] truncate">
              {user.name}
            </p>
            <span className="inline-flex mt-1.5 items-center rounded-full bg-[#1A50A3]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1A50A3]">
              {user.role.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-[#1A50A3]/5 hover:text-[#1A50A3]"
              >
                <Icon className="h-[18px] w-[18px] text-gray-400 transition-colors group-hover:text-[#1A50A3]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[#E8E8E8] p-3">
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-[#F5F6F9]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
