import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BASE_URL;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, isDev } = body;

    if (!username || !password) {
      return NextResponse.json(
        { statusCode: 400, message: "Vui lòng nhập tên đăng nhập và mật khẩu" },
        { status: 400 }
      );
    }

    // Lấy Device ID từ header, bắt buộc trừ khi isDev = true
    const deviceId = req.headers.get("X-Device-ID") || req.headers.get("x-device-id");
    if (!isDev && !deviceId) {
      return NextResponse.json(
        { statusCode: 400, message: "Thiếu Device ID" },
        { status: 400 }
      );
    }

    // Forward request đến backend thật
    const backendHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (deviceId) {
      backendHeaders["X-Device-ID"] = deviceId;
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: backendHeaders,
      body: JSON.stringify({ username, password, isDev: isDev ?? false }),
    });

    const data = await backendRes.json();

    if (data.statusCode !== 200 || !data.data?.api_key) {
      return NextResponse.json(
        { statusCode: data.statusCode ?? 401, message: data.message ?? "Đăng nhập thất bại" },
        { status: data.statusCode ?? 401 }
      );
    }

    const { api_key, user, refresh_token } = data.data;

    // Tạo response trả về cho client (không bao gồm api_key trực tiếp)
    const response = NextResponse.json({
      statusCode: 200,
      message: "Đăng nhập thành công",
      data: {
        user, // Trả về thông tin user để store
      },
    });

    // Lưu api_key vào HttpOnly cookie (bảo mật - JS phía client không đọc được)
    response.cookies.set("bt_api_key", api_key, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
      path: "/",
    });

    // Lưu refresh_token vào HttpOnly cookie để gọi API logout của backend
    if (refresh_token) {
      response.cookies.set("bt_refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 ngày
        path: "/",
      });
    }

    // Lưu user info (non-sensitive) vào cookie thường để middleware đọc
    response.cookies.set("bt_user", JSON.stringify(user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[login] Error:", error);
    return NextResponse.json(
      { statusCode: 500, message: "Có lỗi xảy ra, vui lòng thử lại sau" },
      { status: 500 }
    );
  }
}
