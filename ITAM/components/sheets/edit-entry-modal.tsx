"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { getSheetConfig } from "@/lib/sheets";

interface SheetRow {
  id: string;
  [key: string]: string | boolean | null | undefined;
}

interface EditEntryModalProps {
  sheetSlug: string;
  row: SheetRow;
  onUpdated: () => void;
}

export function EditEntryModal({ sheetSlug, row, onUpdated }: EditEntryModalProps) {
  const config = getSheetConfig(sheetSlug);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && row) {
      const initial: Record<string, string> = {};
      config?.fields.forEach((field) => {
        const val = row[field];
        initial[field] = val != null ? String(val) : "";
      });
      setFormData(initial);
    }
  }, [open, row, config]);

  if (!config) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setLoading(true);
    setError("");

    try {
      const payload: Record<string, any> = {};
      for (const field of config.fields) {
        payload[field] = formData[field] || "";
      }

      const res = await fetch(`/api/sheets/${sheetSlug}/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to update entry");
      }

      setOpen(false);
      onUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="icon-sm" variant="ghost" className="text-gray-500 hover:text-[#1A50A3]">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent className="max-h-[80vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Entry — {config.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {config.fields.map((field, idx) => {
            const label = config.headers[idx] || field;
            if (!label || field === "id" || field === "createdAt" || field === "updatedAt") return null;

            return (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={field}>{label}</Label>
                <Input
                  id={field}
                  value={formData[field] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                  placeholder={`Enter ${label}`}
                />
              </div>
            );
          })}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#1A50A3] hover:bg-[#153d80]"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
