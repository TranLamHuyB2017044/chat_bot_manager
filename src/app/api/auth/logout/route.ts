import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BASE_URL;

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("bt_refresh_token")?.value;

  if (refreshToken) {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (error) {
      console.error("[logout] Backend logout failed:", error);
    }
  }

  const response = NextResponse.json({ statusCode: 200, message: "Đăng xuất thành công" });

  // Xóa HttpOnly cookie api_key
  response.cookies.set("bt_api_key", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  // Xóa cookie user
  response.cookies.set("bt_user", "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  // Xóa HttpOnly cookie refresh_token
  response.cookies.set("bt_refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
