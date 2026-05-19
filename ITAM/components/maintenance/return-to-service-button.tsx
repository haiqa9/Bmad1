"use client";

import { AlertCircle } from "lucide-react";

export function ReturnToServiceButton({ assetId }: { assetId: string }) {
  async function handleReturn() {
    await fetch(`/api/assets/${assetId}/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "return_to_service" }),
    });
    window.location.reload();
  }

  return (
    <button
      onClick={handleReturn}
      className="inline-flex items-center gap-1 rounded-md bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
    >
      <AlertCircle className="h-3 w-3" />
      Return to Service
    </button>
  );
}
