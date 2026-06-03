import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { SheetTable } from "@/components/sheets/sheet-table";
import { getSheetConfig } from "@/lib/sheets";

export default async function SheetPage({
  params,
}: {
  params: Promise<{ sheet: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { sheet } = await params;
  const config = getSheetConfig(sheet);

  if (!config) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#212427]">{config.name}</h1>
      </div>
      <SheetTable sheetSlug={sheet} />
    </div>
  );
}
