import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateAssetSchema } from "@/lib/validations/asset";
import { LifecycleState } from "@prisma/client";

// GET /api/assets/:id - Get single asset
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        softwareDetail: true,
        history: {
          orderBy: { changedAt: "desc" },
        },
        request: true,
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(asset);

    return NextResponse.json(asset);
  } catch (error) {
    console.error("GET /api/assets/:id error:", error);
    return NextResponse.json({ error: "Failed to fetch asset" }, { status: 500 });
  }
}

// PATCH /api/assets/:id - Update asset
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const parsed = updateAssetSchema.parse(body);

    const { id } = await params;
    const existing = await prisma.asset.findUnique({
      where: { id },
      include: { softwareDetail: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const { softwareDetail, status, ...otherUpdates } = parsed;

    // Track status change in history if applicable
    const historyEntries: any[] = [];
    if (status && status !== existing.status) {
      historyEntries.push({
        assetId: id,
        fromStatus: existing.status,
        toStatus: status as LifecycleState,
        changedBy: "system",
        notes: `Status changed from ${existing.status} to ${status}`,
      });
    }

    // Build update data
    const updateData: any = {
      ...otherUpdates,
      assignedTo: otherUpdates.assignedTo || null,
      purchaseDate: otherUpdates.purchaseDate ? new Date(otherUpdates.purchaseDate) : null,
      warrantyExpiry: otherUpdates.warrantyExpiry ? new Date(otherUpdates.warrantyExpiry) : null,
    };

    if (status) updateData.status = status;

    // Handle software detail
    if (softwareDetail) {
      if (existing.softwareDetail) {
        updateData.softwareDetail = {
          update: {
            ...softwareDetail,
            renewalDate: softwareDetail.renewalDate ? new Date(softwareDetail.renewalDate) : null,
          },
        };
      } else if (existing.type === "SOFTWARE" || existing.type === "CLOUD") {
        updateData.softwareDetail = {
          create: {
            ...softwareDetail,
            renewalDate: softwareDetail.renewalDate ? new Date(softwareDetail.renewalDate) : null,
          },
        };
      }
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: updateData,
      include: {
        softwareDetail: true,
        history: true,
      },
    });

    // Create history entries after update
    if (historyEntries.length > 0) {
      await prisma.assetHistory.createMany({
        data: historyEntries.map((h) => ({ ...h, assetId: id })),
      });
    }

    return NextResponse.json(asset);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }
    console.error("PATCH /api/assets/:id error:", error);
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

// DELETE /api/assets/:id - Soft delete (retire asset)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.asset.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        status: "RETIRED",
        retiredAt: new Date(),
      },
      include: {
        softwareDetail: true,
      },
    });

    await prisma.assetHistory.create({
      data: {
        assetId: id,
        fromStatus: existing.status,
        toStatus: "RETIRED",
        changedBy: "system",
        notes: "Asset retired",
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("DELETE /api/assets/:id error:", error);
    return NextResponse.json({ error: "Failed to retire asset" }, { status: 500 });
  }
}
