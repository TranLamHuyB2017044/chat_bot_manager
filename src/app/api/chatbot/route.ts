import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendFetch";

export async function GET(req: NextRequest) {
  try {
    const res = await backendFetch("/api/chatbot");
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[api/chatbot GET] Error:", error);
    return NextResponse.json(
      { statusCode: 500, message: "Có lỗi xảy ra khi lấy danh sách chatbot" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const incomingFormData = await req.formData();
    const backendFormData = new FormData();

    // Sao chép toàn bộ fields và files sang FormData mới
    for (const [key, value] of incomingFormData.entries()) {
      backendFormData.append(key, value);
    }

    const res = await backendFetch("/api/chatbot", {
      method: "POST",
      body: backendFormData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[api/chatbot POST] Error:", error);
    return NextResponse.json(
      { statusCode: 500, message: "Có lỗi xảy ra khi tạo chatbot" },
      { status: 500 }
    );
  }
}
