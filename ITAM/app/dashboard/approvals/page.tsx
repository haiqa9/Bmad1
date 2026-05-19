import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default async function ApprovalsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "IT_ASSET_MANAGER") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Approvals Overview
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Monitor all approval stages
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/dashboard/approvals/manager"
          className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-900"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900 dark:text-white">
              Manager Approvals
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              View pending departmental approvals
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/approvals/it"
          className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-900"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900 dark:text-white">
              IT Approvals
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              View pending IT final approvals
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
