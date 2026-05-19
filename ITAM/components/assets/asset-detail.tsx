"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusTransition } from "./status-transition";
import { MaintenanceModal } from "@/components/maintenance/maintenance-modal";
import { ReassignModal } from "@/components/maintenance/reassign-modal";
import { useSession } from "next-auth/react";
import { Wrench, UserCog } from "lucide-react";

interface SoftwareDetailItem {
  licenseType: string;
  licenseKey: string | null;
  seatsTotal: number;
  seatsUsed: number;
  renewalDate: string | null;
  vendor: string;
}

interface HistoryItem {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  changedAt: string;
  notes: string | null;
}

interface AssetDetailItem {
  id: string;
  tag: string;
  title: string;
  type: string;
  status: string;
  department: string;
  costCenter: string;
  assignedTo: string | null;
  purchaseDate: string | null;
  warrantyExpiry: string | null;
  retiredAt: string | null;
  softwareDetail: SoftwareDetailItem | null;
  history: HistoryItem[];
}

interface AssetDetailProps {
  asset: AssetDetailItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  REQUESTED: "bg-[#F6BF2C]/10 text-[#B8860B]",
  PROCURED: "bg-[#2491E5]/10 text-[#2491E5]",
  REGISTERED: "bg-[#8B5CF6]/10 text-[#8B5CF6]",
  DEPLOYED: "bg-[#00BD82]/10 text-[#00BD82]",
  MAINTENANCE: "bg-[#F47C22]/10 text-[#F47C22]",
  RETIRED: "bg-gray-100 text-gray-600",
};

const typeColors: Record<string, string> = {
  HARDWARE: "bg-[#1A50A3]/10 text-[#1A50A3]",
  SOFTWARE: "bg-[#2491E5]/10 text-[#2491E5]",
  CLOUD: "bg-[#00BD82]/10 text-[#00BD82]",
  PERIPHERAL: "bg-[#8B5CF6]/10 text-[#8B5CF6]",
};

export function AssetDetail({ asset, open, onOpenChange }: AssetDetailProps) {
  const { data: session } = useSession();
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);

  if (!asset) return null;

  const canManage =
    session?.user?.role === "IT_OPS" ||
    session?.user?.role === "IT_ASSET_MANAGER";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{asset.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header badges + actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={typeColors[asset.type] || ""}>{asset.type}</Badge>
              <Badge className={statusColors[asset.status] || ""}>{asset.status}</Badge>
              <Badge variant="outline">{asset.tag}</Badge>
            </div>

            {/* Action buttons */}
            {canManage && asset.status !== "RETIRED" && (
              <div className="flex flex-wrap gap-2">
                {asset.status !== "MAINTENANCE" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMaintenanceOpen(true)}
                  >
                    <Wrench className="mr-1 h-3.5 w-3.5" />
                    Set Maintenance
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReassignOpen(true)}
                >
                  <UserCog className="mr-1 h-3.5 w-3.5" />
                  Reassign
                </Button>
              </div>
            )}

            {/* Status transition */}
            <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
              <p className="text-sm font-medium mb-2">Lifecycle Transition</p>
              <StatusTransition
                assetId={asset.id}
                currentStatus={asset.status}
                onSuccess={() => {
                  onOpenChange(false);
                  window.location.reload();
                }}
              />
            </div>

            {/* Main info grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Department</p>
                <p className="font-medium">{asset.department}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Cost Center</p>
                <p className="font-medium">{asset.costCenter}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Assigned To</p>
                <p className="font-medium">{asset.assignedTo || "—"}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Purchase Date</p>
                <p className="font-medium">
                  {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Warranty Expiry</p>
                <p className="font-medium">
                  {asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : "—"}
                </p>
              </div>
              {asset.retiredAt && (
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Retired At</p>
                  <p className="font-medium text-red-600">
                    {new Date(asset.retiredAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Software details */}
            {asset.softwareDetail && (
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <h3 className="font-semibold mb-3">Software / License Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">License Type</p>
                    <p className="font-medium">{asset.softwareDetail.licenseType}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">Vendor</p>
                    <p className="font-medium">{asset.softwareDetail.vendor}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">Seats</p>
                    <p className="font-medium">
                      {asset.softwareDetail.seatsUsed} / {asset.softwareDetail.seatsTotal}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">Renewal Date</p>
                    <p className="font-medium">
                      {asset.softwareDetail.renewalDate
                        ? new Date(asset.softwareDetail.renewalDate).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  {asset.softwareDetail.licenseKey && (
                    <div className="col-span-2">
                      <p className="text-zinc-500 dark:text-zinc-400">License Key</p>
                      <p className="font-medium font-mono">{asset.softwareDetail.licenseKey}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* History timeline */}
            {asset.history.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">History</h3>
                <div className="space-y-2">
                  {asset.history.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-start gap-3 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800"
                    >
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-zinc-400" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : h.toStatus}
                        </p>
                        <p className="text-zinc-500 dark:text-zinc-400">{h.notes}</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {new Date(h.changedAt).toLocaleString()} by {h.changedBy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <MaintenanceModal
        assetId={asset.id}
        open={maintenanceOpen}
        onOpenChange={setMaintenanceOpen}
      />

      <ReassignModal
        assetId={asset.id}
        currentAssignedTo={asset.assignedTo}
        currentDepartment={asset.department}
        currentCostCenter={asset.costCenter}
        open={reassignOpen}
        onOpenChange={setReassignOpen}
      />
    </>
  );
}
