import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { AuthUser } from "@/types/auth";

const PUBLIC_PATHS = ["/login"];
const ADMIN_PATHS  = ["/admin"];

function getUserFromCookies(req: NextRequest): AuthUser | null {
  const userStr = req.cookies.get("bt_user")?.value;
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as AuthUser;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const user      = getUserFromCookies(req);
  const isPublic  = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAdmin   = ADMIN_PATHS.some((p)  => pathname.startsWith(p));

  // Chưa đăng nhập → redirect về login
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Đã đăng nhập mà vào trang public → redirect vào dashboard
  if (user && isPublic) {
    const dest = user.role === 0 ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Không phải admin mà vào trang admin → redirect dashboard
  if (user && isAdmin && user.role !== 0) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
