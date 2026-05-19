"use client";

import { useCallback } from "react";
import { RequestList } from "@/components/requests/request-list";
import { getSession } from "next-auth/react";

export default function ITApprovalsPage() {
  const handleApprove = useCallback(async (requestId: string) => {
    const session = await getSession();
    if (!session?.user?.id) return;

    await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        decision: "APPROVED",
        approverId: session.user.id,
        stage: "IT",
      }),
    });
    window.location.reload();
  }, []);

  const handleReject = useCallback(async (requestId: string) => {
    const session = await getSession();
    if (!session?.user?.id) return;

    await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        decision: "REJECTED",
        approverId: session.user.id,
        stage: "IT",
      }),
    });
    window.location.reload();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Pending IT Approvals
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Final approval for manager-approved asset requests
        </p>
      </div>

      <RequestList
        stage="IT"
        showActions
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
