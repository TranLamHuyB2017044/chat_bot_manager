import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendFetch";

export async function PUT(req: NextRequest) {
  try {
    const incomingFormData = await req.formData();
    const backendFormData = new FormData();

    for (const [key, value] of incomingFormData.entries()) {
      backendFormData.append(key, value);
    }

    const res = await backendFetch("/api/user/update-user-avatar", {
      method: "PUT",
      body: backendFormData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[api/user/update-user-avatar PUT] Error:", error);
    return NextResponse.json(
      { statusCode: 500, message: "Có lỗi xảy ra khi tải ảnh đại diện lên" },
      { status: 500 }
    );
  }
}
