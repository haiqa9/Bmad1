"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface RequestFormProps {
  userEmail: string;
  userDepartment: string;
}

export function RequestForm({ userEmail, userDepartment }: RequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState<string | null>("HARDWARE");
  const [urgency, setUrgency] = useState<string | null>("MEDIUM");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      type: type || "HARDWARE",
      justification: formData.get("justification") as string,
      urgency: urgency || "MEDIUM",
      requestedBy: userEmail,
      department: userDepartment,
      costCenter: formData.get("costCenter") as string,
    };

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to submit request");
        return;
      }

      router.push("/dashboard/requests");
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/requests"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Requests
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Request New Asset
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Submit a request for a new IT asset
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Asset Title *</Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. Dell XPS 15 Laptop"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Asset Type *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HARDWARE">Hardware</SelectItem>
              <SelectItem value="SOFTWARE">Software</SelectItem>
              <SelectItem value="CLOUD">Cloud</SelectItem>
              <SelectItem value="PERIPHERAL">Peripheral</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Urgency *</Label>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="costCenter">Preferred Cost Center</Label>
          <Input
            id="costCenter"
            name="costCenter"
            defaultValue={`${userDepartment.toUpperCase().replace(/\s/g, "-")}-001`}
            placeholder="e.g. ENG-001"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="justification">Justification *</Label>
          <Textarea
            id="justification"
            name="justification"
            placeholder="Explain why this asset is needed..."
            rows={4}
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Request
        </Button>
        <Link href="/dashboard/requests">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
