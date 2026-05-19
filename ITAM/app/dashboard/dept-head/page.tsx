import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { CheckCircle, FileText, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function DeptHeadDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "DEPT_HEAD") redirect("/dashboard");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#212427]">
          Welcome back, {user.name}
        </h1>
        <p className="text-gray-500">Department Head Dashboard</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Link
          href="/dashboard/approvals/manager"
          className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00BD82]/10">
              <CheckCircle className="h-6 w-6 text-[#00BD82]" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-300 transition-all group-hover:text-gray-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-[#212427]">Pending Approvals</h3>
            <p className="mt-1 text-sm text-gray-500">Review and approve asset requests from your department</p>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-[#00BD82] opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>

        <Link
          href="/dashboard/requests"
          className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F47C22]/10">
              <FileText className="h-6 w-6 text-[#F47C22]" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-300 transition-all group-hover:text-gray-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-[#212427]">My Requests</h3>
            <p className="mt-1 text-sm text-gray-500">View your own asset request history</p>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-[#F47C22] opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      </div>
    </div>
  );
}
