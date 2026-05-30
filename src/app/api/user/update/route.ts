import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendFetch";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await backendFetch("/api/user/update", {
      method: "PUT",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[api/user/update PUT] Error:", error);
    return NextResponse.json(
      { statusCode: 500, message: "Có lỗi xảy ra khi cập nhật thông tin" },
      { status: 500 }
    );
  }
}
