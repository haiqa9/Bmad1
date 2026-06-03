import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";

const approvalSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
  approverId: z.string().min(1),
  stage: z.enum(["MANAGER", "IT"]),
});

// GET /api/approvals - List pending approvals by stage and department
export async function GET(req: NextRequest) {
  const token = await requireAuth(req);
  if (token instanceof NextResponse) return token;

  try {
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage"); // MANAGER or IT
    const department = searchParams.get("department");
    const status = searchParams.get("status") || "PENDING";

    const where: any = {};

    if (status === "PENDING") {
      if (stage === "MANAGER") {
        where.status = "PENDING_MANAGER";
        if (department) where.department = department;
      } else if (stage === "IT") {
        where.status = "PENDING_IT";
      }
    } else {
      // For history views
      where.status = { in: ["APPROVED", "REJECTED"] };
    }

    const requests = await prisma.assetRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        asset: true,
        approvals: {
          include: { approver: { select: { name: true, role: true } } },
        },
      },
    });

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

    return NextResponse.json({ data: enriched });
  } catch (error) {
    console.error("GET /api/approvals error:", error);
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 });
  }
}

// POST /api/approvals - Submit an approval decision
export async function POST(req: NextRequest) {
  const token = await requireAuth(req);
  if (token instanceof NextResponse) return token;

  try {
    const body = await req.json();
    const parsed = approvalSchema.parse(body);

    // Create approval log
    await prisma.approvalLog.create({
      data: {
        requestId: parsed.requestId,
        approverId: parsed.approverId,
        stage: parsed.stage,
        decision: parsed.decision,
        notes: parsed.notes || null,
      },
    });

    // Update request status based on stage and decision
    const request = await prisma.assetRequest.findUnique({
      where: { id: parsed.requestId },
      include: { asset: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    let newStatus = request.status;
    let assetStatus = request.asset?.status;

    if (parsed.decision === "REJECTED") {
      newStatus = "REJECTED";
      assetStatus = "RETIRED";
    } else if (parsed.stage === "MANAGER") {
      newStatus = "PENDING_IT";
    } else if (parsed.stage === "IT") {
      newStatus = "APPROVED";
      assetStatus = "PROCURED";
    }

    // Update request
    const updatedRequest = await prisma.assetRequest.update({
      where: { id: parsed.requestId },
      data: { status: newStatus as any },
      include: {
        asset: true,
        approvals: {
          include: { approver: { select: { name: true, role: true } } },
        },
      },
    });

    // Update linked asset status if changed
    if (assetStatus && request.assetId) {
      await prisma.asset.update({
        where: { id: request.assetId },
        data: { status: assetStatus as any },
      });

      // Add history entry
      await prisma.assetHistory.create({
        data: {
          assetId: request.assetId,
          fromStatus: request.asset?.status as any,
          toStatus: assetStatus as any,
          changedBy: parsed.approverId,
          notes: `Request ${parsed.decision.toLowerCase()} at ${parsed.stage} stage`,
        },
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }
    console.error("POST /api/approvals error:", error);
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
  }
}
