import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";
import Link from "next/link";
import { ReturnToServiceButton } from "@/components/maintenance/return-to-service-button";

export default async function MaintenancePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const canManage = user.role === "IT_ASSET_MANAGER" || user.role === "IT_OPS";

  if (!canManage) {
    redirect("/dashboard");
  }

  const assets = await prisma.asset.findMany({
    where: { status: "MAINTENANCE" },
    include: {
      softwareDetail: true,
      history: {
        where: { type: "MAINTENANCE" },
        orderBy: { changedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Maintenance
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Assets currently under maintenance
        </p>
      </div>

      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm dark:bg-zinc-900">
          <Wrench className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">
            No assets are currently in maintenance.
          </p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
            Set an asset to maintenance from the asset detail view.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Last Maintenance Note</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-mono text-sm">{asset.tag}</TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/assets`}
                      className="hover:underline"
                    >
                      {asset.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{asset.type}</Badge>
                  </TableCell>
                  <TableCell>{asset.department}</TableCell>
                  <TableCell>{asset.assignedTo || "—"}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-zinc-500">
                    {asset.history[0]?.notes || "—"}
                  </TableCell>
                  <TableCell>
                    <ReturnToServiceButton assetId={asset.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

