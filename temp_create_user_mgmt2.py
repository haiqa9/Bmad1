import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

# Create directories
stdin, stdout, stderr = client.exec_command("mkdir -p /opt/itam/app/api/users /opt/itam/app/api/users/'[id]' /opt/itam/app/dashboard/admin/users")
print("mkdir:", stdout.read().decode('utf-8', errors='replace'))
print("mkdir err:", stderr.read().decode('utf-8', errors='replace'))

sftp = client.open_sftp()

# 1. User validation schema
user_validation = '''import { z } from "zod";
import { UserRole } from "@prisma/client";

export const userRoleEnum = z.enum(["EMPLOYEE", "DEPT_HEAD", "IT_OPS", "IT_ASSET_MANAGER"]);

export const createUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().min(1, "Name is required"),
  role: userRoleEnum,
  department: z.string().min(1, "Department is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: userRoleEnum.optional(),
  department: z.string().min(1).optional(),
  password: z.string().min(6).optional().or(z.literal("")),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
'''

with sftp.file('/opt/itam/lib/validations/user.ts', 'w') as f:
    f.write(user_validation)

# 2. Users API route
users_api = '''import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validations/user";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "IT_ASSET_MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// GET /api/users - List all users
export async function GET(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const where: any = {};
    if (q) {
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({ data: users });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  try {
    const body = await req.json();
    const parsed = createUserSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = parsed.password
      ? await bcrypt.hash(parsed.password, 10)
      : null;

    const user = await prisma.user.create({
      data: {
        email: parsed.email,
        name: parsed.name,
        role: parsed.role,
        department: parsed.department,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
'''

with sftp.file('/opt/itam/app/api/users/route.ts', 'w') as f:
    f.write(users_api)

# 3. Single user API route
user_id_api = '''import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/lib/validations/user";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "IT_ASSET_MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// PATCH /api/users/[id] - Update user
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateUserSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data: any = {};
    if (parsed.name !== undefined) data.name = parsed.name;
    if (parsed.role !== undefined) data.role = parsed.role;
    if (parsed.department !== undefined) data.department = parsed.department;
    if (parsed.password && parsed.password.length > 0) {
      data.password = await bcrypt.hash(parsed.password, 10);
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
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }
    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  try {
    const { id } = await params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
'''

with sftp.file("/opt/itam/app/api/users/[id]/route.ts", 'w') as f:
    f.write(user_id_api)

sftp.close()

# Verify files were created
stdin, stdout, stderr = client.exec_command("ls -la /opt/itam/app/api/users/ && ls -la /opt/itam/app/api/users/'[id]'/ && cat /opt/itam/lib/validations/user.ts | head -5")
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
