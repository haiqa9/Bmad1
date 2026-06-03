import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSheetConfig } from "@/lib/sheets";
import { requireManager } from "@/lib/api-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sheet: string; id: string }> }
) {
  const token = await requireManager(req);
  if (token instanceof NextResponse) return token;

  const { sheet, id } = await params;
  const config = getSheetConfig(sheet);

  if (!config) {
    return NextResponse.json({ error: "Sheet not found" }, { status: 404 });
  }

  try {
    const body = await req.json();

    // Build update payload from config fields
    const data: Record<string, any> = {};
    for (const field of config.fields) {
      if (body[field] !== undefined) {
        data[field] = body[field] || "";
      }
    }

    let result: any;

    switch (config.prismaModel) {
      case "laptopRecord":
        result = await prisma.laptopRecord.update({ where: { id }, data });
        break;
      case "serverDevice":
        result = await prisma.serverDevice.update({ where: { id }, data });
        break;
      case "iloIdrac":
        result = await prisma.iloIdrac.update({ where: { id }, data });
        break;
      case "cloudVm":
        result = await prisma.cloudVm.update({ where: { id }, data });
        break;
      case "labVm":
        result = await prisma.labVm.update({ where: { id }, data });
        break;
      case "publicFqdn":
        result = await prisma.publicFqdn.update({ where: { id }, data });
        break;
      case "gatePass":
        result = await prisma.gatePass.update({ where: { id }, data });
        break;
      case "receivedItem":
        result = await prisma.receivedItem.update({ where: { id }, data });
        break;
      case "portDetail":
        result = await prisma.portDetail.update({ where: { id }, data });
        break;
      case "freeVm":
        result = await prisma.freeVm.update({ where: { id }, data });
        break;
      case "device":
        result = await prisma.device.update({ where: { id }, data });
        break;
      default:
        return NextResponse.json({ error: "Unknown sheet model" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`PATCH /api/sheets/${sheet}/${id} error:`, error);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sheet: string; id: string }> }
) {
  const token = await requireManager(req);
  if (token instanceof NextResponse) return token;

  const { sheet, id } = await params;
  const config = getSheetConfig(sheet);

  if (!config) {
    return NextResponse.json({ error: "Sheet not found" }, { status: 404 });
  }

  try {
    switch (config.prismaModel) {
      case "laptopRecord":
        await prisma.laptopRecord.delete({ where: { id } });
        break;
      case "serverDevice":
        await prisma.serverDevice.delete({ where: { id } });
        break;
      case "iloIdrac":
        await prisma.iloIdrac.delete({ where: { id } });
        break;
      case "cloudVm":
        await prisma.cloudVm.delete({ where: { id } });
        break;
      case "labVm":
        await prisma.labVm.delete({ where: { id } });
        break;
      case "publicFqdn":
        await prisma.publicFqdn.delete({ where: { id } });
        break;
      case "gatePass":
        await prisma.gatePass.delete({ where: { id } });
        break;
      case "receivedItem":
        await prisma.receivedItem.delete({ where: { id } });
        break;
      case "portDetail":
        await prisma.portDetail.delete({ where: { id } });
        break;
      case "freeVm":
        await prisma.freeVm.delete({ where: { id } });
        break;
      case "device":
        await prisma.device.delete({ where: { id } });
        break;
      default:
        return NextResponse.json({ error: "Unknown sheet model" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/sheets/${sheet}/${id} error:`, error);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
