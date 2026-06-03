import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const token = await requireAuth(req);
  if (token instanceof NextResponse) return token;

  try {
    const { searchParams } = new URL(req.url);
    const minAgeYears = parseInt(searchParams.get("minAge") || "3");

    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setFullYear(now.getFullYear() - minAgeYears);

    const assets = await prisma.asset.findMany({
      where: {
        type: "HARDWARE",
        status: { not: "RETIRED" },
        purchaseDate: { lte: cutoffDate },
      },
      include: { softwareDetail: true },
      orderBy: { purchaseDate: "asc" },
    });

    const aging = assets.map((asset) => {
      const age = asset.purchaseDate
        ? now.getFullYear() - new Date(asset.purchaseDate).getFullYear()
        : 0;
      const warrantyExpired = asset.warrantyExpiry
        ? new Date(asset.warrantyExpiry) < now
        : false;

      return {
        id: asset.id,
        tag: asset.tag,
        title: asset.title,
        purchaseDate: asset.purchaseDate,
        age,
        warrantyExpiry: asset.warrantyExpiry,
        warrantyExpired,
        status: asset.status,
        department: asset.department,
      };
    });

    return NextResponse.json({
      data: aging,
      meta: { minAgeYears, total: aging.length },
    });
  } catch (error) {
    console.error("GET /api/compliance/aging error:", error);
    return NextResponse.json({ error: "Failed to fetch aging data" }, { status: 500 });
  }
}
