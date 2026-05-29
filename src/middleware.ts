import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];
const ADMIN_PATHS  = ["/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session      = req.auth;
  const isPublic     = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAdmin      = ADMIN_PATHS.some((p)  => pathname.startsWith(p));

  // Not logged in → redirect to login
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Logged-in user tries public page → redirect to dashboard
  if (session && isPublic) {
    const dest = session.user.role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Non-admin tries admin route → redirect to dashboard
  if (session && isAdmin && session.user.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
