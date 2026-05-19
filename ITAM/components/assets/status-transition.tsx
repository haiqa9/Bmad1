"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const allowedTransitions: Record<string, string[]> = {
  REQUESTED: ["PROCURED", "RETIRED"],
  PROCURED: ["REGISTERED", "RETIRED"],
  REGISTERED: ["DEPLOYED", "RETIRED"],
  DEPLOYED: ["MAINTENANCE", "RETIRED"],
  MAINTENANCE: ["DEPLOYED", "RETIRED"],
  RETIRED: [],
};

interface StatusTransitionProps {
  assetId: string;
  currentStatus: string;
  onSuccess?: () => void;
}

export function StatusTransition({ assetId, currentStatus, onSuccess }: StatusTransitionProps) {
  const router = useRouter();
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allowed = allowedTransitions[currentStatus] || [];

  async function handleTransition() {
    if (!newStatus) return;
    const status = newStatus;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to update status");
        return;
      }

      setNewStatus("");
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (allowed.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No transitions available for retired assets.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={newStatus} onValueChange={setNewStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Change status..." />
          </SelectTrigger>
          <SelectContent>
            {allowed.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleTransition}
          disabled={!newStatus || loading}
          size="sm"
        >
          {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          Update
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
