import { z } from "zod";
import { AssetType, LifecycleState } from "@prisma/client";

export const assetTypeEnum = z.enum(["HARDWARE", "SOFTWARE", "CLOUD", "PERIPHERAL"]);
export const lifecycleStateEnum = z.enum([
  "REQUESTED",
  "PROCURED",
  "REGISTERED",
  "DEPLOYED",
  "MAINTENANCE",
  "RETIRED",
]);

export const softwareDetailSchema = z.object({
  licenseType: z.string().min(1, "License type is required"),
  licenseKey: z.string().optional(),
  seatsTotal: z.union([z.string(), z.number()]).transform((v) => (v === "" ? 0 : Number(v))).pipe(z.number().int().min(0)),
  seatsUsed: z.union([z.string(), z.number()]).transform((v) => (v === "" ? 0 : Number(v))).pipe(z.number().int().min(0)).default(0),
  renewalDate: z.string().optional().nullable(),
  vendor: z.string().min(1, "Vendor is required"),
});

export const createAssetSchema = z.object({
  tag: z.string().min(1, "Asset tag is required"),
  title: z.string().min(1, "Title is required"),
  type: assetTypeEnum,
  status: lifecycleStateEnum.optional(),
  costCenter: z.string().min(1, "Cost center is required"),
  department: z.string().min(1, "Department is required"),
  assignedTo: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  warrantyExpiry: z.string().optional().nullable(),
  softwareDetail: softwareDetailSchema.optional(),
});

export const updateAssetSchema = createAssetSchema.partial();

// Form-specific schema that accepts strings for number inputs
export const assetFormSchema = z.object({
  tag: z.string().min(1, "Asset tag is required"),
  title: z.string().min(1, "Title is required"),
  type: assetTypeEnum,
  status: lifecycleStateEnum.optional(),
  costCenter: z.string().min(1, "Cost center is required"),
  department: z.string().min(1, "Department is required"),
  assignedTo: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  warrantyExpiry: z.string().optional().nullable(),
  softwareDetail: z.object({
    licenseType: z.string().min(1, "License type is required"),
    licenseKey: z.string().optional(),
    seatsTotal: z.string().optional().nullable(),
    seatsUsed: z.string().optional().nullable(),
    renewalDate: z.string().optional().nullable(),
    vendor: z.string().min(1, "Vendor is required"),
  }).optional(),
});

export const assetQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.string().optional(),
  status: z.string().optional(),
  department: z.string().optional(),
  costCenter: z.string().optional(),
  q: z.string().optional(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
