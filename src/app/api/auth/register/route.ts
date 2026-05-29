import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://api-ocr.bittechx.cloud";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, fullname, phone } = body;

    if (!username || !email || !password || !fullname) {
      return NextResponse.json(
        { statusCode: 400, message: "Vui lòng điền đầy đủ thông tin bắt buộc" },
        { status: 400 }
      );
    }

    // Lấy api_key từ cookie (nếu admin tạo user con)
    const apiKey = req.cookies.get("bt_api_key")?.value;

    const backendHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      backendHeaders["x-api-key"] = apiKey;
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: backendHeaders,
      body: JSON.stringify({ username, email, password, fullname, phone }),
    });

    const data = await backendRes.json();

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("[register] Error:", error);
    return NextResponse.json(
      { statusCode: 500, message: "Có lỗi xảy ra, vui lòng thử lại sau" },
      { status: 500 }
    );
  }
}
