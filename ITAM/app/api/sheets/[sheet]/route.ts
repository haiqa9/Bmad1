import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSheetConfig } from "@/lib/sheets";
import { requireAuth, requireManager } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sheet: string }> }
) {
  const token = await requireAuth(req);
  if (token instanceof NextResponse) return token;

  const { sheet } = await params;
  const config = getSheetConfig(sheet);

  if (!config) {
    return NextResponse.json({ error: "Sheet not found" }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const q = searchParams.get("q")?.trim() || "";
    const skip = (page - 1) * limit;

    // Build where clause for search across all string fields
    let where: any = {};
    if (q) {
      // Only search string fields (skip booleans, IDs, timestamps)
      const searchableFields = config.fields.filter(
        (f) => !["id", "createdAt", "updatedAt"].includes(f)
      );
      where.OR = searchableFields.map((field) => ({
        [field]: { contains: q },
      }));
    }

    let data: any[] = [];
    let total = 0;

    switch (config.prismaModel) {
      case "laptopRecord":
        [data, total] = await Promise.all([
          prisma.laptopRecord.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
          prisma.laptopRecord.count({ where }),
        ]);
        break;
      case "serverDevice":
        [data, total] = await Promise.all([
          prisma.serverDevice.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
          prisma.serverDevice.count({ where }),
        ]);
        break;
      case "iloIdrac":
        [data, total] = await Promise.all([
          prisma.iloIdrac.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
          prisma.iloIdrac.count({ where }),
        ]);
        break;
      case "cloudVm":
        [data, total] = await Promise.all([
          prisma.cloudVm.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
          prisma.cloudVm.count({ where }),
        ]);
        break;
      case "labVm":
        [data, total] = await Promise.all([
          prisma.labVm.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
          prisma.labVm.count({ where }),
        ]);
        break;
      case "publicFqdn":
        [data, total] = await Promise.all([
          prisma.publicFqdn.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
          prisma.publicFqdn.count({ where }),
        ]);
        break;
      case "gatePass":
        [data, total] = await Promise.all([
          prisma.gatePass.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
          prisma.gatePass.count({ where }),
        ]);
        break;
      case "receivedItem":
        [data, total] = await Promise.all([
          prisma.receivedItem.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
          prisma.receivedItem.count({ where }),
        ]);
        break;
      case "portDetail":
        [data, total] = await Promise.all([
          prisma.portDetail.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
          prisma.portDetail.count({ where }),
        ]);
        break;
      case "freeVm":
        [data, total] = await Promise.all([
          prisma.freeVm.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
          prisma.freeVm.count({ where }),
        ]);
        break;
      case "device":
        [data, total] = await Promise.all([
          prisma.device.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
          prisma.device.count({ where }),
        ]);
        break;

      default:
        return NextResponse.json({ error: "Unknown sheet model" }, { status: 500 });
    }

    return NextResponse.json({
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(`GET /api/sheets/${sheet} error:`, error);
    return NextResponse.json({ error: "Failed to fetch sheet data" }, { status: 500 });
  }
}

// POST /api/sheets/[sheet] - Create a new entry
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sheet: string }> }
) {
  const token = await requireManager(req);
  if (token instanceof NextResponse) return token;

  const { sheet } = await params;
  const config = getSheetConfig(sheet);

  if (!config) {
    return NextResponse.json({ error: "Sheet not found" }, { status: 404 });
  }

  try {
    const body = await req.json();

    // Build the create payload from the fields defined in config
    const data: Record<string, any> = {};
    for (const field of config.fields) {
      if (body[field] !== undefined) {
        data[field] = body[field] || "";
      }
    }

    let result: any;

    switch (config.prismaModel) {
      case "laptopRecord":
        result = await prisma.laptopRecord.create({ data });
        break;
      case "serverDevice":
        result = await prisma.serverDevice.create({ data });
        break;
      case "iloIdrac":
        result = await prisma.iloIdrac.create({ data });
        break;
      case "cloudVm":
        result = await prisma.cloudVm.create({ data });
        break;
      case "labVm":
        result = await prisma.labVm.create({ data });
        break;
      case "publicFqdn":
        result = await prisma.publicFqdn.create({ data });
        break;
      case "gatePass":
        result = await prisma.gatePass.create({ data });
        break;
      case "receivedItem":
        result = await prisma.receivedItem.create({ data });
        break;
      case "portDetail":
        result = await prisma.portDetail.create({ data });
        break;
      case "freeVm":
        result = await prisma.freeVm.create({ data });
        break;
      case "device":
        result = await prisma.device.create({ data });
        break;

      default:
        return NextResponse.json({ error: "Unknown sheet model" }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(`POST /api/sheets/${sheet} error:`, error);
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
