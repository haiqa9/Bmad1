"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { AssetDetail } from "./asset-detail";

interface AssetItem {
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
  softwareDetail: {
    licenseType: string;
    licenseKey: string | null;
    seatsTotal: number;
    seatsUsed: number;
    renewalDate: string | null;
    vendor: string;
  } | null;
  history: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    changedBy: string;
    changedAt: string;
    notes: string;
  }[];
}

interface AssetResponse {
  data: AssetItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

const columns: ColumnDef<AssetItem>[] = [
  {
    accessorKey: "tag",
    header: "Tag",
    cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("tag")}</span>,
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge className={typeColors[row.getValue("type") as string] || ""}>
        {row.getValue("type")}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={statusColors[row.getValue("status") as string] || ""}>
        {row.getValue("status")}
      </Badge>
    ),
  },
  {
    accessorKey: "department",
    header: "Department",
  },
  {
    accessorKey: "costCenter",
    header: "Cost Center",
  },
  {
    accessorKey: "assignedTo",
    header: "Assigned To",
    cell: ({ row }) => row.getValue("assignedTo") || "—",
  },
];

export function AssetTable() {
  const [data, setData] = useState<AssetItem[]>([]);
  const [meta, setMeta] = useState<AssetResponse["meta"]>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(meta.page));
    params.set("limit", String(meta.limit));
    if (search) params.set("q", search);
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);

    try {
      const res = await fetch(`/api/assets?${params.toString()}`);
      const json: AssetResponse = await res.json();
      setData(json.data);
      setMeta(json.meta);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: meta.totalPages,
  });

  async function handleRowClick(asset: AssetItem) {
    try {
      const res = await fetch(`/api/assets/${asset.id}`);
      const detail = await res.json();
      setSelectedAsset(detail);
      setDetailOpen(true);
    } catch (error) {
      console.error("Failed to fetch asset detail:", error);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search by tag, title, or assigned to..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setMeta((m) => ({ ...m, page: 1 }));
            }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setMeta((m) => ({ ...m, page: 1 }));
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Types</SelectItem>
              <SelectItem value="HARDWARE">Hardware</SelectItem>
              <SelectItem value="SOFTWARE">Software</SelectItem>
              <SelectItem value="CLOUD">Cloud</SelectItem>
              <SelectItem value="PERIPHERAL">Peripheral</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setMeta((m) => ({ ...m, page: 1 }));
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Statuses</SelectItem>
              <SelectItem value="REQUESTED">Requested</SelectItem>
              <SelectItem value="PROCURED">Procured</SelectItem>
              <SelectItem value="REGISTERED">Registered</SelectItem>
              <SelectItem value="DEPLOYED">Deployed</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="RETIRED">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-zinc-500">
                  No assets found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Showing {data.length} of {meta.total} assets
        </p>
        <div className="flex items-center gap-2">
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
      </div>

      {/* Detail Modal */}
      <AssetDetail
        asset={selectedAsset}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
