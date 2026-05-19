"use client";

import { useState, useCallback } from "react";
import { RequestList } from "@/components/requests/request-list";
import { getSession } from "next-auth/react";
import { useEffect } from "react";

export default function ManagerApprovalsPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getSession().then((session) => {
      if (session?.user) setUser(session.user);
    });
  }, []);

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
        stage: "MANAGER",
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
        stage: "MANAGER",
      }),
    });
    window.location.reload();
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Pending Manager Approvals
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Review and approve asset requests from your department
        </p>
      </div>

      <RequestList
        stage="MANAGER"
        department={user.department}
        showActions
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
