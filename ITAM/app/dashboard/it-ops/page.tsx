import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Package, CheckCircle, Wrench, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function ItOpsDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "IT_OPS") redirect("/dashboard");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#212427]">
          Welcome back, {user.name}
        </h1>
        <p className="text-gray-500">IT Operations Dashboard</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Link
          href="/dashboard/assets"
          className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A50A3]/10">
              <Package className="h-6 w-6 text-[#1A50A3]" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-300 transition-all group-hover:text-gray-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-[#212427]">Assets</h3>
            <p className="mt-1 text-sm text-gray-500">Manage the asset inventory</p>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-[#1A50A3] opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>

        <Link
          href="/dashboard/approvals/it"
          className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00BD82]/10">
              <CheckCircle className="h-6 w-6 text-[#00BD82]" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-300 transition-all group-hover:text-gray-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-[#212427]">IT Approvals</h3>
            <p className="mt-1 text-sm text-gray-500">Final approval for asset requests</p>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-[#00BD82] opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>

        <Link
          href="/dashboard/maintenance"
          className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8B5CF6]/10">
              <Wrench className="h-6 w-6 text-[#8B5CF6]" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-300 transition-all group-hover:text-gray-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-[#212427]">Maintenance</h3>
            <p className="mt-1 text-sm text-gray-500">Assets under maintenance</p>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-[#8B5CF6] opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      </div>
    </div>
  );
}
