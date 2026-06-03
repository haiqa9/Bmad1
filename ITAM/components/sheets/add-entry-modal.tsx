"use client";

import { useState } from "react";
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
import { Plus } from "lucide-react";
import { getSheetConfig } from "@/lib/sheets";

interface AddEntryModalProps {
  sheetSlug: string;
  onAdded: () => void;
}

export function AddEntryModal({ sheetSlug, onAdded }: AddEntryModalProps) {
  const config = getSheetConfig(sheetSlug);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});

  if (!config) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/sheets/${sheetSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to add entry");
      }

      setFormData({});
      setOpen(false);
      onAdded();
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
          <Button className="gap-2 bg-[#1A50A3] hover:bg-[#153d80]">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        }
      />
      <DialogContent className="max-h-[80vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Entry — {config.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {config.fields.map((field, idx) => {
            const label = config.headers[idx] || field;
            if (!label) return null;
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
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
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
              {loading ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
