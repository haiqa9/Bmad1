import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAssetSchema, assetQuerySchema } from "@/lib/validations/asset";

// GET /api/assets - List assets with pagination, filters, and search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = assetQuerySchema.parse(Object.fromEntries(searchParams));

    const where: any = {};

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.department) where.department = query.department;
    if (query.costCenter) where.costCenter = query.costCenter;

    if (query.q) {
      where.OR = [
        { tag: { contains: query.q, mode: "insensitive" } },
        { title: { contains: query.q, mode: "insensitive" } },
        { assignedTo: { contains: query.q, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        include: {
          softwareDetail: true,
        },
      }),
      prisma.asset.count({ where }),
    ]);

    return NextResponse.json({
      data: assets,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }
    console.error("GET /api/assets error:", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

// POST /api/assets - Create a new asset
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createAssetSchema.parse(body);

    const existing = await prisma.asset.findUnique({
      where: { tag: parsed.tag },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An asset with this tag already exists" },
        { status: 409 }
      );
    }

    const { softwareDetail, ...assetData } = parsed;

    const asset = await prisma.asset.create({
      data: {
        ...assetData,
        assignedTo: assetData.assignedTo || null,
        purchaseDate: assetData.purchaseDate ? new Date(assetData.purchaseDate) : null,
        warrantyExpiry: assetData.warrantyExpiry ? new Date(assetData.warrantyExpiry) : null,
        softwareDetail:
          parsed.type === "SOFTWARE" || parsed.type === "CLOUD"
            ? softwareDetail
              ? {
                  create: {
                    ...softwareDetail,
                    renewalDate: softwareDetail.renewalDate ? new Date(softwareDetail.renewalDate) : null,
                  },
                }
              : undefined
            : undefined,
        history: {
          create: {
            toStatus: assetData.status || "REGISTERED",
            changedBy: "system",
            notes: "Asset created",
          },
        },
      },
      include: {
        softwareDetail: true,
        history: true,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }
    console.error("POST /api/assets error:", error);
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
  }
}
