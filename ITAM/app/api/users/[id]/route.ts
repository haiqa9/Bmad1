import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/api-auth";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await requireManager(req);
  if (token instanceof NextResponse) return token;

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, role, department, password } = body;

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name.trim();
    if (role !== undefined) data.role = role;
    if (department !== undefined) data.department = department.trim();
    if (password !== undefined && password.length > 0) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error(`PATCH /api/users/${id} error:`, error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await requireManager(req);
  if (token instanceof NextResponse) return token;

  const { id } = await params;

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/users/${id} error:`, error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
