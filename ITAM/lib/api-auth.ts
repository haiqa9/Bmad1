import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const MUTATION_ROLES = ["IT_OPS", "IT_ASSET_MANAGER"];

/**
 * Require any authenticated user.
 * Returns the JWT token or a 401 response.
 */
export async function requireAuth(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return token;
}

/**
 * Require an authenticated user with one of the allowed roles.
 * Returns the JWT token or a 401/403 response.
 */
export async function requireRole(req: NextRequest, allowedRoles: string[]) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = token.role as string;
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return token;
}

/**
 * Convenience helper for mutation endpoints (POST/PATCH/DELETE)
 * that should only be accessible to IT_OPS or IT_ASSET_MANAGER.
 */
export async function requireManager(req: NextRequest) {
  return requireRole(req, MUTATION_ROLES);
}
