"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";

interface LicenseItem {
  id: string;
  title: string;
  type: string;
  vendor: string;
  licenseType: string;
  seatsTotal: number;
  seatsUsed: number;
  utilization: number;
  renewalDate: string | null;
  health: string;
}

export function LicenseTable() {
  const [data, setData] = useState<LicenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof LicenseItem>("renewalDate");
  const [sortDesc, setSortDesc] = useState(false);

  useEffect(() => {
    fetch("/api/compliance/licenses")
      .then((res) => res.json())
      .then((json) => {
        setData(json.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  function toggleSort(field: keyof LicenseItem) {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(false);
    }
  }

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal === null || aVal === undefined) return sortDesc ? -1 : 1;
    if (bVal === null || bVal === undefined) return sortDesc ? 1 : -1;
    if (aVal < bVal) return sortDesc ? 1 : -1;
    if (aVal > bVal) return sortDesc ? -1 : 1;
    return 0;
  });

  function exportCSV() {
    const headers = ["Title", "Type", "Vendor", "License Type", "Seats Total", "Seats Used", "Utilization %", "Renewal Date"];
    const rows = data.map((d) => [
      d.title,
      d.type,
      d.vendor,
      d.licenseType,
      d.seatsTotal,
      d.seatsUsed,
      `${d.utilization}%`,
      d.renewalDate ? new Date(d.renewalDate).toLocaleDateString() : "—",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "license-compliance.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">License Compliance</h2>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          Export CSV
        </Button>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>License Type</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("utilization")}
              >
                <span className="flex items-center gap-1">
                  Utilization <ArrowUpDown className="h-3 w-3" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("renewalDate")}
              >
                <span className="flex items-center gap-1">
                  Renewal Date <ArrowUpDown className="h-3 w-3" />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                  No software/cloud assets found.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((item) => (
                <TableRow
                  key={item.id}
                  className={
                    item.health === "red"
                      ? "bg-red-50/50 dark:bg-red-900/10"
                      : item.health === "yellow"
                      ? "bg-amber-50/50 dark:bg-amber-900/10"
                      : undefined
                  }
                >
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.vendor}</TableCell>
                  <TableCell>{item.licenseType}</TableCell>
                  <TableCell>
                    {item.seatsUsed} / {item.seatsTotal}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <div
                          className={`h-full rounded-full ${
                            item.utilization > 100
                              ? "bg-red-500"
                              : item.utilization > 85
                              ? "bg-amber-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(item.utilization, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs">{item.utilization}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.renewalDate ? (
                      <span
                        className={
                          item.health === "red"
                            ? "text-red-600 font-medium"
                            : item.health === "yellow"
                            ? "text-amber-600"
                            : ""
                        }
                      >
                        {new Date(item.renewalDate).toLocaleDateString()}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
