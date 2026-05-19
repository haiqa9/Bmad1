import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { AssetForm } from "@/components/assets/asset-form";

export default async function NewAssetPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const canManage = user.role === "IT_ASSET_MANAGER" || user.role === "IT_OPS";

  if (!canManage) {
    redirect("/dashboard/assets");
  }

  return (
    <div className="max-w-4xl mx-auto">
      <AssetForm mode="create" />
    </div>
  );
}
