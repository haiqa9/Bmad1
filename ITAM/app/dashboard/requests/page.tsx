import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { RequestList } from "@/components/requests/request-list";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function RequestsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {user.role === "EMPLOYEE" ? "My Requests" : "All Requests"}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Track and manage asset requests
          </p>
        </div>
        {user.role === "EMPLOYEE" && (
          <Link
            href="/dashboard/requests/new"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black"
          >
            <Plus className="h-4 w-4" />
            New Request
          </Link>
        )}
      </div>

      <RequestList userEmail={user.role === "EMPLOYEE" ? user.email : undefined} />
    </div>
  );
}
