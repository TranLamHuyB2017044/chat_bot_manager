import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendFetch";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const res = await backendFetch(`/api/rag/workspaces/${workspaceId}/documents`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[api/rag/workspaces/[id]/documents GET] Error:", error);
    return NextResponse.json(
      { statusCode: 500, message: "Có lỗi xảy ra khi lấy danh sách tài liệu" },
      { status: 500 }
    );
  }
}
