import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

const roleDashboards: Record<string, string> = {
  EMPLOYEE: "/dashboard/employee",
  DEPT_HEAD: "/dashboard/dept-head",
  IT_OPS: "/dashboard/it-ops",
  IT_ASSET_MANAGER: "/dashboard/admin",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const target = roleDashboards[user.role] || "/dashboard/employee";
  redirect(target);
}
