import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const token = await requireAuth(req);
  if (token instanceof NextResponse) return token;

  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const assets = await prisma.asset.findMany({
      where: {
        type: { in: ["SOFTWARE", "CLOUD"] },
        status: { not: "RETIRED" },
      },
      include: { softwareDetail: true },
      orderBy: { title: "asc" },
    });

    const licenses = assets.map((asset) => {
      const sd = asset.softwareDetail;
      const utilization = sd && sd.seatsTotal > 0
        ? Math.round((sd.seatsUsed / sd.seatsTotal) * 100)
        : 0;

      let health = "green";
      if (!sd) {
        health = "gray";
      } else if (sd.seatsUsed > sd.seatsTotal || (sd.renewalDate && new Date(sd.renewalDate) <= sevenDaysFromNow)) {
        health = "red";
      } else if (utilization > 85 || (sd.renewalDate && new Date(sd.renewalDate) <= thirtyDaysFromNow)) {
        health = "yellow";
      }

      return {
        id: asset.id,
        title: asset.title,
        type: asset.type,
        vendor: sd?.vendor || "—",
        licenseType: sd?.licenseType || "—",
        seatsTotal: sd?.seatsTotal || 0,
        seatsUsed: sd?.seatsUsed || 0,
        utilization,
        renewalDate: sd?.renewalDate,
        health,
      };
    });

    return NextResponse.json({ data: licenses });
  } catch (error) {
    console.error("GET /api/compliance/licenses error:", error);
    return NextResponse.json({ error: "Failed to fetch license data" }, { status: 500 });
  }
}
