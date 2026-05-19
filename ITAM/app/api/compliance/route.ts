import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // KPI: Total Active Assets (excluding RETIRED)
    const totalActiveAssets = await prisma.asset.count({
      where: { status: { not: "RETIRED" } },
    });

    // KPI: Pending Approvals
    const pendingApprovals = await prisma.assetRequest.count({
      where: { status: { in: ["PENDING_MANAGER", "PENDING_IT"] } },
    });

    // KPI: License Compliance %
    const softwareAssets = await prisma.asset.findMany({
      where: {
        type: { in: ["SOFTWARE", "CLOUD"] },
        status: { not: "RETIRED" },
      },
      include: { softwareDetail: true },
    });

    let licenseCompliance = 100;
    if (softwareAssets.length > 0) {
      const totalSeats = softwareAssets.reduce(
        (sum, a) => sum + (a.softwareDetail?.seatsTotal || 0),
        0
      );
      const usedSeats = softwareAssets.reduce(
        (sum, a) => sum + (a.softwareDetail?.seatsUsed || 0),
        0
      );
      licenseCompliance = totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 100;
    }

    // KPI: Assets Expiring Soon (warranty or license renewal within 30 days)
    const expiringWarranty = await prisma.asset.count({
      where: {
        status: { not: "RETIRED" },
        warrantyExpiry: { lte: thirtyDaysFromNow, gte: now },
      },
    });

    const expiringLicenses = await prisma.softwareDetail.count({
      where: {
        renewalDate: { lte: thirtyDaysFromNow, gte: now },
      },
    });

    // Chart: Assets by Type
    const assetsByType = await prisma.asset.groupBy({
      by: ["type"],
      where: { status: { not: "RETIRED" } },
      _count: { id: true },
    });

    // Chart: Assets by Status
    const assetsByStatus = await prisma.asset.groupBy({
      by: ["status"],
      where: { status: { not: "RETIRED" } },
      _count: { id: true },
    });

    // Chart: Assets by Department
    const assetsByDepartment = await prisma.asset.groupBy({
      by: ["department"],
      where: { status: { not: "RETIRED" } },
      _count: { id: true },
    });

    // Chart: Cost by Department (using costCenter as proxy)
    const costByDepartment = await prisma.asset.groupBy({
      by: ["costCenter"],
      where: { status: { not: "RETIRED" } },
      _count: { id: true },
    });

    return NextResponse.json({
      kpis: {
        totalActiveAssets,
        pendingApprovals,
        licenseCompliance,
        expiringSoon: expiringWarranty + expiringLicenses,
        expiringWarranty,
        expiringLicenses,
      },
      charts: {
        assetsByType: assetsByType.map((item) => ({
          name: item.type,
          value: item._count.id,
        })),
        assetsByStatus: assetsByStatus.map((item) => ({
          name: item.status,
          value: item._count.id,
        })),
        assetsByDepartment: assetsByDepartment.map((item) => ({
          name: item.department,
          value: item._count.id,
        })),
        costByDepartment: costByDepartment.map((item) => ({
          name: item.costCenter,
          value: item._count.id,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/compliance error:", error);
    return NextResponse.json({ error: "Failed to fetch compliance data" }, { status: 500 });
  }
}
