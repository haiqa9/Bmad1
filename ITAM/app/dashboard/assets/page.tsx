import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { AssetTable } from "@/components/assets/asset-table";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function AssetsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const canManage = user.role === "IT_ASSET_MANAGER" || user.role === "IT_OPS";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#212427]">Asset Inventory</h1>
          <p className="text-gray-500">Centralized CMDB view of all IT assets</p>
        </div>
        {canManage && (
          <Link
            href="/dashboard/assets/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1A50A3] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1A50A3]/25 transition-all hover:bg-[#153d80] hover:shadow-xl"
          >
            <Plus className="h-4 w-4" />
            Add Asset
          </Link>
        )}
      </div>

      <AssetTable />
    </div>
  );
}
