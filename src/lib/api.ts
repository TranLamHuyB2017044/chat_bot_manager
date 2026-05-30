const DEFAULT_BACKEND_URL = "https://api-ocr.bittechx.cloud";

export const getBackendUrl = (): string => {
  // Trong môi trường dev, trả về rỗng để gọi qua Vite Proxy (tránh CORS và IP restriction)
  if (import.meta.env.DEV) {
    return "";
  }
  return import.meta.env.VITE_API_URL || DEFAULT_BACKEND_URL;
};

/**
 * Đọc API key từ localStorage.
 */
export const getApiKey = (): string | null => {
  return localStorage.getItem("bt_api_key");
};

/**
 * Lưu API key vào localStorage.
 */
export const setApiKey = (key: string) => {
  localStorage.setItem("bt_api_key", key);
};

/**
 * Đọc thông tin user từ localStorage.
 */
export const getAuthUser = (): any | null => {
  const userStr = localStorage.getItem("bt_user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Lưu thông tin user vào localStorage.
 */
export const setAuthUser = (user: any) => {
  localStorage.setItem("bt_user", JSON.stringify(user));
};

/**
 * Xóa thông tin đăng nhập khỏi localStorage.
 */
export const clearAuth = () => {
  localStorage.removeItem("bt_api_key");
  localStorage.removeItem("bt_user");
};

/**
 * Wrapper xung quanh fetch() để gọi API trực tiếp tới Backend.
 * Tự động đính kèm header `x-api-key` và `Content-Type: application/json` nếu có.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = getBackendUrl();
  const apiKey = getApiKey();

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  // Lấy Device ID để gửi cùng request nếu có
  const deviceId = localStorage.getItem("device_id");
  if (deviceId) {
    headers["x-device-id"] = deviceId;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  // Không tự động redirect với window.location.href vì gây loop
  // Nếu gặp 401, chỉ clear auth, let components handle redirect
  if (response.status === 401) {
    clearAuth();
  }

  return response;
}
