"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";

interface RequestItem {
  id: string;
  asset: {
    title: string;
    type: string;
  };
  requestedBy: string;
  department: string;
  justification: string;
  status: string;
  urgency: string;
  createdAt: string;
  approvals: {
    stage: string;
    decision: string;
    notes: string | null;
    approver: { name: string };
  }[];
}

interface RequestListProps {
  userEmail?: string;
  stage?: string;
  department?: string;
  showActions?: boolean;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
}

const statusColors: Record<string, string> = {
  PENDING_MANAGER: "bg-[#F6BF2C]/10 text-[#B8860B]",
  PENDING_IT: "bg-[#2491E5]/10 text-[#2491E5]",
  APPROVED: "bg-[#00BD82]/10 text-[#00BD82]",
  REJECTED: "bg-red-50 text-red-600",
};

const urgencyColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-[#F6BF2C]/10 text-[#B8860B]",
  HIGH: "bg-red-50 text-red-600",
};

export function RequestList({
  userEmail,
  stage,
  department,
  showActions = false,
  onApprove,
  onReject,
}: RequestListProps) {
  const [data, setData] = useState<RequestItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(meta.page));
    params.set("limit", String(meta.limit));
    if (userEmail) params.set("user", userEmail);

    try {
      // For approval views, use the approvals API
      let url: string;
      if (stage) {
        const approvalParams = new URLSearchParams();
        approvalParams.set("stage", stage);
        if (department) approvalParams.set("department", department);
        url = `/api/approvals?${approvalParams.toString()}`;
      } else {
        url = `/api/requests?${params.toString()}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      setData(json.data || []);
      if (json.meta) setMeta(json.meta);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, userEmail, stage, department]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="space-y-4">
      {selectedRequest ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Request Details</h2>
            <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>
              Back to List
            </Button>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge className={statusColors[selectedRequest.status] || ""}>
                {selectedRequest.status}
              </Badge>
              <Badge className={urgencyColors[selectedRequest.urgency] || ""}>
                {selectedRequest.urgency}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Asset</p>
                <p className="font-medium">{selectedRequest.asset.title}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Type</p>
                <p className="font-medium">{selectedRequest.asset.type}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Requested By</p>
                <p className="font-medium">{selectedRequest.requestedBy}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Department</p>
                <p className="font-medium">{selectedRequest.department}</p>
              </div>
            </div>

            <div>
              <p className="text-zinc-500 dark:text-zinc-400">Justification</p>
              <p className="mt-1 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                {selectedRequest.justification}
              </p>
            </div>

            {selectedRequest.approvals.length > 0 && (
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Approval History</p>
                <div className="mt-2 space-y-2">
                  {selectedRequest.approvals.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800"
                    >
                      <Badge
                        className={
                          a.decision === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {a.decision}
                      </Badge>
                      <div>
                        <p className="font-medium">
                          {a.approver.name} ({a.stage})
                        </p>
                        {a.notes && <p className="text-zinc-500">{a.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showActions &&
              (selectedRequest.status === "PENDING_MANAGER" ||
                selectedRequest.status === "PENDING_IT") && (
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => {
                      onApprove?.(selectedRequest.id);
                      setSelectedRequest(null);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      onReject?.(selectedRequest.id);
                      setSelectedRequest(null);
                    }}
                    variant="destructive"
                  >
                    Reject
                  </Button>
                </div>
              )}
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[80px]">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-zinc-500"
                    >
                      No requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.asset.title}
                      </TableCell>
                      <TableCell>{request.asset.type}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[request.status] || ""}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={urgencyColors[request.urgency] || ""}
                        >
                          {request.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.department}</TableCell>
                      <TableCell>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!stage && meta.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))}
                disabled={meta.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))}
                disabled={meta.page >= meta.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
