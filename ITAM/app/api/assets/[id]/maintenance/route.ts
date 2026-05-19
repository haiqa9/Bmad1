import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/assets/:id/maintenance - Set asset to maintenance or return to service
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, reason, expectedCompletion, changedBy } = body;

    const existing = await prisma.asset.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (action === "set_maintenance") {
      const asset = await prisma.asset.update({
        where: { id },
        data: { status: "MAINTENANCE" },
        include: { softwareDetail: true },
      });

      await prisma.assetHistory.create({
        data: {
          assetId: id,
          fromStatus: existing.status,
          toStatus: "MAINTENANCE",
          changedBy: changedBy || "system",
          notes: `Set to maintenance. Reason: ${reason || "N/A"}. Expected completion: ${expectedCompletion || "N/A"}`,
          type: "MAINTENANCE",
        },
      });

      return NextResponse.json(asset);
    }

    if (action === "return_to_service") {
      const asset = await prisma.asset.update({
        where: { id },
        data: { status: "DEPLOYED" },
        include: { softwareDetail: true },
      });

      await prisma.assetHistory.create({
        data: {
          assetId: id,
          fromStatus: existing.status,
          toStatus: "DEPLOYED",
          changedBy: changedBy || "system",
          notes: `Returned to service from maintenance. ${reason || ""}`,
          type: "MAINTENANCE",
        },
      });

      return NextResponse.json(asset);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/assets/:id/maintenance error:", error);
    return NextResponse.json({ error: "Failed to update maintenance status" }, { status: 500 });
  }
}
