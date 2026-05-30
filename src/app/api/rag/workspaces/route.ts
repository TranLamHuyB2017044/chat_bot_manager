import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendFetch";

export async function GET(req: NextRequest) {
  try {
    const res = await backendFetch("/api/rag/workspaces");
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[api/rag/workspaces GET] Error:", error);
    return NextResponse.json(
      { statusCode: 500, message: "Có lỗi xảy ra khi lấy danh sách không gian tri thức" },
      { status: 500 }
    );
  }
}
