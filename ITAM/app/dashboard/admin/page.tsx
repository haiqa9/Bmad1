import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Package, FileText, CheckCircle, BarChart3, Wrench, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "IT_ASSET_MANAGER") redirect("/dashboard");

  const cards = [
    {
      label: "Asset Inventory",
      desc: "Full CMDB view and management",
      href: "/dashboard/assets",
      icon: Package,
      color: "bg-[#1A50A3]",
      lightColor: "bg-[#1A50A3]/10",
      textColor: "text-[#1A50A3]",
    },
    {
      label: "All Requests",
      desc: "Oversee the request pipeline",
      href: "/dashboard/requests",
      icon: FileText,
      color: "bg-[#00BD82]",
      lightColor: "bg-[#00BD82]/10",
      textColor: "text-[#00BD82]",
    },
    {
      label: "Approvals",
      desc: "Managerial and IT approvals",
      href: "/dashboard/approvals",
      icon: CheckCircle,
      color: "bg-[#F47C22]",
      lightColor: "bg-[#F47C22]/10",
      textColor: "text-[#F47C22]",
    },
    {
      label: "Compliance",
      desc: "License compliance & aging reports",
      href: "/dashboard/compliance",
      icon: BarChart3,
      color: "bg-[#2491E5]",
      lightColor: "bg-[#2491E5]/10",
      textColor: "text-[#2491E5]",
    },
    {
      label: "Maintenance",
      desc: "Assets in maintenance mode",
      href: "/dashboard/maintenance",
      icon: Wrench,
      color: "bg-[#8B5CF6]",
      lightColor: "bg-[#8B5CF6]/10",
      textColor: "text-[#8B5CF6]",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#212427]">
          Welcome back, {user.name}
        </h1>
        <p className="text-gray-500">IT Asset Manager Dashboard</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.lightColor}`}
                >
                  <Icon className={`h-6 w-6 ${card.textColor}`} />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-300 transition-all group-hover:text-gray-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-[#212427]">
                  {card.label}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{card.desc}</p>
              </div>
              <div
                className={`absolute bottom-0 left-0 h-1 w-full ${card.color} opacity-0 transition-opacity group-hover:opacity-100`}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
