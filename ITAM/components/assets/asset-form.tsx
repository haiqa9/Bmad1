"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assetFormSchema, type CreateAssetInput } from "@/lib/validations/asset";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface AssetFormProps {
  mode: "create" | "edit";
  defaultValues?: any;
}

export function AssetForm({ mode, defaultValues }: AssetFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      status: "REGISTERED",
      ...defaultValues,
    },
  });

  const assetType = watch("type");
  const isSoftware = assetType === "SOFTWARE" || assetType === "CLOUD";

  async function onSubmit(data: any) {
    setLoading(true);
    setError("");

    try {
      const url = mode === "edit" && defaultValues?.id
        ? `/api/assets/${defaultValues.id}`
        : "/api/assets";
      const method = mode === "edit" ? "PATCH" : "POST";

      // Convert number strings to actual numbers for software details
      const payload = { ...data };
      if (payload.softwareDetail) {
        payload.softwareDetail = {
          ...payload.softwareDetail,
          seatsTotal: payload.softwareDetail.seatsTotal ? Number(payload.softwareDetail.seatsTotal) : 0,
          seatsUsed: payload.softwareDetail.seatsUsed ? Number(payload.softwareDetail.seatsUsed) : 0,
        };
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Something went wrong");
        return;
      }

      router.push("/assets");
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/assets"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assets
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          {mode === "create" ? "Add New Asset" : "Edit Asset"}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          {mode === "create"
            ? "Register a new asset in the CMDB"
            : "Update asset details"}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tag">Asset Tag *</Label>
          <Input id="tag" {...register("tag")} placeholder="e.g. LAPTOP-001" />
          {errors.tag && (
            <p className="text-xs text-red-500">{String(errors.tag.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" {...register("title")} placeholder="e.g. Dell XPS 15" />
          {errors.title && (
            <p className="text-xs text-red-500">{String(errors.title.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Type *</Label>
          <Select
            value={assetType || "HARDWARE"}
            onValueChange={(v) => setValue("type", v as any)}
          >
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
          <Label>Status *</Label>
          <Select onValueChange={(v) => setValue("status", v as any)} defaultValue="REGISTERED">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="REQUESTED">Requested</SelectItem>
              <SelectItem value="PROCURED">Procured</SelectItem>
              <SelectItem value="REGISTERED">Registered</SelectItem>
              <SelectItem value="DEPLOYED">Deployed</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="RETIRED">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="costCenter">Cost Center *</Label>
          <Input id="costCenter" {...register("costCenter")} placeholder="e.g. IT-001" />
          {errors.costCenter && (
            <p className="text-xs text-red-500">{String(errors.costCenter.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Input id="department" {...register("department")} placeholder="e.g. Engineering" />
          {errors.department && (
            <p className="text-xs text-red-500">{String(errors.department.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignedTo">Assigned To</Label>
          <Input id="assignedTo" {...register("assignedTo")} placeholder="e.g. John Doe" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
          <Input id="warrantyExpiry" type="date" {...register("warrantyExpiry")} />
        </div>
      </div>

      {/* Software details section */}
      {isSoftware && (
        <div className="rounded-lg border border-zinc-200 p-4 space-y-4 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            Software / License Details
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sd-licenseType">License Type *</Label>
              <Input
                id="sd-licenseType"
                {...register("softwareDetail.licenseType")}
                placeholder="e.g. Subscription"
              />
              {(errors.softwareDetail as any)?.licenseType && (
                <p className="text-xs text-red-500">
                  {String((errors.softwareDetail as any).licenseType.message)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sd-vendor">Vendor *</Label>
              <Input
                id="sd-vendor"
                {...register("softwareDetail.vendor")}
                placeholder="e.g. Microsoft"
              />
              {(errors.softwareDetail as any)?.vendor && (
                <p className="text-xs text-red-500">
                  {String((errors.softwareDetail as any).vendor.message)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sd-seatsTotal">Total Seats *</Label>
              <Input
                id="sd-seatsTotal"
                type="number"
                {...register("softwareDetail.seatsTotal")}
                placeholder="0"
              />
              {(errors.softwareDetail as any)?.seatsTotal && (
                <p className="text-xs text-red-500">
                  {String((errors.softwareDetail as any).seatsTotal.message)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sd-seatsUsed">Seats Used</Label>
              <Input
                id="sd-seatsUsed"
                type="number"
                {...register("softwareDetail.seatsUsed")}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sd-licenseKey">License Key</Label>
              <Input
                id="sd-licenseKey"
                {...register("softwareDetail.licenseKey")}
                placeholder="XXXX-XXXX-XXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sd-renewalDate">Renewal Date</Label>
              <Input
                id="sd-renewalDate"
                type="date"
                {...register("softwareDetail.renewalDate")}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Asset" : "Save Changes"}
        </Button>
        <Link href="/assets">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
