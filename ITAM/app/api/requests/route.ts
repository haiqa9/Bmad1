import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["HARDWARE", "SOFTWARE", "CLOUD", "PERIPHERAL"]),
  justification: z.string().min(1, "Justification is required"),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

// GET /api/requests - List requests (with optional user filter)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get("user");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (userEmail) where.requestedBy = userEmail;
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      prisma.assetRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          asset: true,
          approvals: {
            include: { approver: { select: { name: true, role: true } } },
          },
        },
      }),
      prisma.assetRequest.count({ where }),
    ]);

    return NextResponse.json({
      data: requests,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/requests error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

// POST /api/requests - Create a new asset request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createRequestSchema.parse(body);

    // Get user info from session (simplified - in real app extract from JWT)
    const requestedBy = body.requestedBy || "unknown@expertflow.com";
    const department = body.department || "Unknown";

    // Create placeholder asset
    const asset = await prisma.asset.create({
      data: {
        tag: `REQ-${Date.now()}`,
        title: parsed.title,
        type: parsed.type,
        status: "REQUESTED",
        costCenter: body.costCenter || department,
        department,
      },
    });

    // Create request
    const request = await prisma.assetRequest.create({
      data: {
        assetId: asset.id,
        requestedBy,
        department,
        justification: parsed.justification,
        status: "PENDING_MANAGER",
        urgency: parsed.urgency,
      },
      include: {
        asset: true,
        approvals: true,
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }
    console.error("POST /api/requests error:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
