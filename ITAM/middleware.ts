import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based route guards
    const role = token?.role as string;

    if (path.startsWith("/dashboard/admin") && role !== "IT_ASSET_MANAGER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        if (token) return true;
        return false;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
