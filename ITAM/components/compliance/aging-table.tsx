"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AgingItem {
  id: string;
  tag: string;
  title: string;
  purchaseDate: string | null;
  age: number;
  warrantyExpiry: string | null;
  warrantyExpired: boolean;
  status: string;
  department: string;
}

export function AgingTable() {
  const [data, setData] = useState<AgingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [minAge, setMinAge] = useState(3);

  useEffect(() => {
    fetch(`/api/compliance/aging?minAge=${minAge}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [minAge]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Asset Aging Report</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-500">Min age (years):</label>
          <Input
            type="number"
            min={1}
            max={20}
            value={minAge}
            onChange={(e) => setMinAge(Number(e.target.value))}
            className="w-20"
          />
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Age (Years)</TableHead>
              <TableHead>Warranty Expiry</TableHead>
              <TableHead>Status</TableHead>
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
                <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                  No aging hardware assets found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow
                  key={item.id}
                  className={
                    item.warrantyExpired
                      ? "bg-red-50/50 dark:bg-red-900/10"
                      : undefined
                  }
                >
                  <TableCell className="font-mono text-sm">{item.tag}</TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.department}</TableCell>
                  <TableCell>
                    {item.purchaseDate
                      ? new Date(item.purchaseDate).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>{item.age}</TableCell>
                  <TableCell>
                    {item.warrantyExpiry ? (
                      <span
                        className={
                          item.warrantyExpired
                            ? "text-red-600 font-medium"
                            : ""
                        }
                      >
                        {new Date(item.warrantyExpiry).toLocaleDateString()}
                        {item.warrantyExpired && " (Expired)"}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{item.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
