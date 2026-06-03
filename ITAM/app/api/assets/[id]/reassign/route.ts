import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/api-auth";

// POST /api/assets/:id/reassign - Reassign asset to different employee/department
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await requireManager(req);
  if (token instanceof NextResponse) return token;

  try {
    const { id } = await params;
    const body = await req.json();
    const { assignedTo, department, costCenter, transferDate, notes, changedBy } = body;

    const existing = await prisma.asset.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
    if (department !== undefined) updateData.department = department;
    if (costCenter !== undefined) updateData.costCenter = costCenter;

    const asset = await prisma.asset.update({
      where: { id },
      data: updateData,
      include: { softwareDetail: true },
    });

    await prisma.assetHistory.create({
      data: {
        assetId: id,
        fromStatus: existing.status,
        toStatus: existing.status,
        changedBy: changedBy || "system",
        notes: `Reassigned: ${assignedTo ? `to ${assignedTo}` : ""}${department ? `, dept ${department}` : ""}${costCenter ? `, cost center ${costCenter}` : ""}. Transfer date: ${transferDate || "N/A"}. ${notes || ""}`,
        type: "REASSIGNED",
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("POST /api/assets/:id/reassign error:", error);
    return NextResponse.json({ error: "Failed to reassign asset" }, { status: 500 });
  }
}
