import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendFetch";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const incomingFormData = await req.formData();
    const backendFormData = new FormData();

    // Sao chép toàn bộ files/fields sang FormData mới
    for (const [key, value] of incomingFormData.entries()) {
      backendFormData.append(key, value);
    }

    const res = await backendFetch(`/api/rag/workspaces/${workspaceId}/upload`, {
      method: "POST",
      body: backendFormData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[api/rag/workspaces/[id]/upload POST] Error:", error);
    return NextResponse.json(
      { statusCode: 500, message: "Có lỗi xảy ra khi tải tài liệu lên" },
      { status: 500 }
    );
  }
}
