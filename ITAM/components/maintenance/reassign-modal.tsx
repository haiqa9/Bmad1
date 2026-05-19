"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface ReassignModalProps {
  assetId: string;
  currentAssignedTo: string | null;
  currentDepartment: string;
  currentCostCenter: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReassignModal({
  assetId,
  currentAssignedTo,
  currentDepartment,
  currentCostCenter,
  open,
  onOpenChange,
}: ReassignModalProps) {
  const [assignedTo, setAssignedTo] = useState(currentAssignedTo || "");
  const [department, setDepartment] = useState(currentDepartment);
  const [costCenter, setCostCenter] = useState(currentCostCenter);
  const [transferDate, setTransferDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/assets/${assetId}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedTo: assignedTo || null,
          department,
          costCenter,
          transferDate,
          notes,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to reassign asset");
        return;
      }

      onOpenChange(false);
      window.location.reload();
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reassign Asset</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="assignedTo">New Assigned To</Label>
            <Input
              id="assignedTo"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="department">New Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costCenter">New Cost Center</Label>
              <Input
                id="costCenter"
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transferDate">Transfer Date</Label>
            <Input
              id="transferDate"
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Transfer Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Transfer due to team restructuring..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reassign Asset
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
