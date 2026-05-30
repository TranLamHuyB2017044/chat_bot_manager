import { cookies } from "next/headers";

const BACKEND_URL = "https://api-ocr.bittechx.cloud";

/**
 * Gọi API backend với api_key từ HttpOnly cookie.
 * Chỉ dùng trong Server Components hoặc Route Handlers.
 */
export async function backendFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const cookieStore = await cookies();
  const apiKey = cookieStore.get("bt_api_key")?.value;

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
  });
}
