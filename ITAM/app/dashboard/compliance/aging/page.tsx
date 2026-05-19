import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { AgingTable } from "@/components/compliance/aging-table";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AgingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/compliance"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Asset Aging Report
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Identify hardware assets past their useful life
        </p>
      </div>

      <AgingTable />
    </div>
  );
}
