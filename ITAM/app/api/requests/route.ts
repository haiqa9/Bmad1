import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";

const createRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["HARDWARE", "SOFTWARE", "CLOUD", "PERIPHERAL"]),
  justification: z.string().min(1, "Justification is required"),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

// GET /api/requests - List requests (with optional user filter)
export async function GET(req: NextRequest) {
  const token = await requireAuth(req);
  if (token instanceof NextResponse) return token;

  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get("user");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

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

    // Enrich with user names for requests without requestedByName
    const userEmails = requests
      .filter((r) => !r.requestedByName)
      .map((r) => r.requestedBy);
    const uniqueEmails = [...new Set(userEmails)];
    const users = uniqueEmails.length
      ? await prisma.user.findMany({
          where: { email: { in: uniqueEmails } },
          select: { email: true, name: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.email, u.name]));

    const enriched = requests.map((r) => ({
      ...r,
      requestedByName: r.requestedByName || userMap.get(r.requestedBy) || r.requestedBy,
    }));

    return NextResponse.json({
      data: enriched,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/requests error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

// POST /api/requests - Create a new asset request
export async function POST(req: NextRequest) {
  const token = await requireAuth(req);
  if (token instanceof NextResponse) return token;

  try {
    const body = await req.json();
    const parsed = createRequestSchema.parse(body);

    const requestedBy = body.requestedBy || "unknown@expertflow.com";
    const requestedByName = body.requestedByName || null;
    const department = body.department || "Unknown";

    // Create placeholder asset
    const asset = await prisma.asset.create({
      data: {
        tag: `REQ-${Date.now()}`,
        title: parsed.title,
        type: parsed.type,
        status: "REQUESTED",
        costCenter: department,
        department,
      },
    });

    // Create request
    const request = await prisma.assetRequest.create({
      data: {
        assetId: asset.id,
        requestedBy,
        requestedByName,
        department,
        justification: parsed.justification,
        status: "PENDING_MANAGER",
        urgency: parsed.urgency,
      },
      include: {
        asset: true,
        approvals: {
          include: { approver: { select: { name: true, role: true } } },
        },
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
