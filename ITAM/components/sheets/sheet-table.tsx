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
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { getSheetConfig } from "@/lib/sheets";
import { AddEntryModal } from "./add-entry-modal";
import { EditEntryModal } from "./edit-entry-modal";

interface SheetRow {
  id: string;
  [key: string]: string | null | undefined;
}

interface SheetResponse {
  data: SheetRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function SheetTable({ sheetSlug }: { sheetSlug: string }) {
  const config = getSheetConfig(sheetSlug);
  const [data, setData] = useState<SheetRow[]>([]);
  const [meta, setMeta] = useState<SheetResponse["meta"]>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(meta.page));
    params.set("limit", String(meta.limit));
    if (search) params.set("q", search);

    try {
      const res = await fetch(`/api/sheets/${sheetSlug}?${params.toString()}`);
      const json: SheetResponse = await res.json();
      setData(json.data);
      setMeta(json.meta);
    } catch (error) {
      console.error("Failed to fetch sheet data:", error);
    } finally {
      setLoading(false);
    }
  }, [sheetSlug, config, meta.page, meta.limit, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnDef<SheetRow>[] =
    config?.fields.map((field, idx) => ({
      accessorKey: field,
      header: config.headers[idx] || field,
      cell: ({ row }) => {
        const value = row.getValue(field) as string;
        return value || "—";
      },
    })) || [];

  // Add actions column
  const allColumns: ColumnDef<SheetRow>[] = [
    ...columns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <EditEntryModal
          sheetSlug={sheetSlug}
          row={row.original}
          onUpdated={fetchData}
        />
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: meta.totalPages,
  });

  if (!config) {
    return <div className="text-red-500">Sheet configuration not found.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setMeta((m) => ({ ...m, page: 1 }));
            }}
            className="pl-9"
          />
        </div>
        <AddEntryModal sheetSlug={sheetSlug} onAdded={fetchData} />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
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
                  No data found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap max-w-[300px] truncate">
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
          Showing {data.length} of {meta.total} rows
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
    </div>
  );
}
