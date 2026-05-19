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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface MaintenanceModalProps {
  assetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaintenanceModal({ assetId, open, onOpenChange }: MaintenanceModalProps) {
  const [reason, setReason] = useState("");
  const [expectedCompletion, setExpectedCompletion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!reason.trim()) {
      setError("Please provide a maintenance reason");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/assets/${assetId}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_maintenance",
          reason,
          expectedCompletion,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to set maintenance");
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
          <DialogTitle>Set Asset to Maintenance</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Maintenance Reason *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Hard drive failure, needs replacement..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedCompletion">Expected Completion Date</Label>
            <Input
              id="expectedCompletion"
              type="date"
              value={expectedCompletion}
              onChange={(e) => setExpectedCompletion(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set Maintenance
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
