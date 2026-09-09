const DEFAULT_BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BASE_URL ||
  "https://api-ocr.bittechx.cloud";

export const getBackendUrl = (): string => {
  return DEFAULT_BACKEND_URL;
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

interface ApiLogPayload {
  method: string;
  url: string;
  path: string;
  status?: number;
  statusText?: string;
  duration: number;
  requestBody?: any;
  responseBody?: any;
  error?: string;
}

function sendToTerminal(payload: ApiLogPayload) {
  try {
    if (import.meta.hot) {
      import.meta.hot.send("terminal:api-log", payload);
      return;
    }
  } catch {
    // Ignore error if HMR is unavailable
  }

  try {
    fetch("/__api_log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    // Ignore error
  }
}

function logApi(payload: ApiLogPayload) {
  // 1. Browser DevTools Console
  const statusStr =
    payload.status !== undefined
      ? `${payload.status} ${payload.statusText || ""}`
      : "NETWORK ERROR";
  const isErr =
    payload.error || (payload.status !== undefined && payload.status >= 400);
  const statusColor = isErr ? "#ef4444" : "#10b981";

  console.groupCollapsed(
    `%c[API] %c${payload.method}%c ${payload.path} %c${statusStr} (${payload.duration}ms)`,
    "color: #6366f1; font-weight: bold;",
    "color: #0ea5e9; font-weight: bold;",
    "color: inherit; font-weight: normal;",
    `color: ${statusColor}; font-weight: bold;`
  );
  console.log("Endpoint:", payload.url);
  if (payload.requestBody !== undefined && payload.requestBody !== null) {
    console.log("Request Body:", payload.requestBody);
  }
  if (payload.responseBody !== undefined && payload.responseBody !== null) {
    console.log("Response Body:", payload.responseBody);
  }
  if (payload.error) {
    console.error("Error:", payload.error);
  }
  console.groupEnd();

  // 2. Terminal output (via Vite plugin)
  sendToTerminal(payload);
}

/**
 * Wrapper xung quanh fetch() để gọi API trực tiếp tới Backend.
 * Tự động đính kèm header `x-api-key` và `Content-Type: application/json` nếu có.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const rawBaseUrl = getBackendUrl();
  const baseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, "") : "";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${baseUrl}${cleanPath}`;
  const apiKey = getApiKey();
  const method = (options.method || "GET").toUpperCase();
  const startTime = performance.now();

  // Parse request body for logging
  let parsedRequestBody: any = null;
  if (options.body !== undefined && options.body !== null) {
    if (typeof options.body === "string") {
      try {
        parsedRequestBody = JSON.parse(options.body);
      } catch {
        parsedRequestBody = options.body;
      }
    } else if (
      typeof FormData !== "undefined" &&
      options.body instanceof FormData
    ) {
      const formObj: Record<string, any> = {};
      options.body.forEach((val, key) => {
        if (typeof File !== "undefined" && val instanceof File) {
          formObj[key] = `[File: ${val.name} (${(val.size / 1024).toFixed(1)} KB)]`;
        } else {
          formObj[key] = val;
        }
      });
      parsedRequestBody = formObj;
    } else {
      parsedRequestBody = options.body;
    }
  }

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
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

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers,
    });
  } catch (err: any) {
    const duration = Math.round(performance.now() - startTime);
    logApi({
      method,
      url: fullUrl,
      path: cleanPath,
      duration,
      requestBody: parsedRequestBody,
      error: err?.message || String(err),
    });
    throw err;
  }

  const duration = Math.round(performance.now() - startTime);

  // Clone response để đọc body log mà không làm tiêu tốn stream gốc
  let responseBody: any = null;
  try {
    const cloned = response.clone();
    const text = await cloned.text();
    if (text) {
      try {
        responseBody = JSON.parse(text);
      } catch {
        responseBody = text;
      }
    } else {
      responseBody = "[Empty Body]";
    }
  } catch {
    responseBody = "[Could not read response body]";
  }

  logApi({
    method,
    url: fullUrl,
    path: cleanPath,
    status: response.status,
    statusText: response.statusText,
    duration,
    requestBody: parsedRequestBody,
    responseBody,
  });

  // Không tự động redirect với window.location.href vì gây loop
  // Nếu gặp 401, chỉ clear auth, let components handle redirect
  if (response.status === 401) {
    clearAuth();
  }

  return response;
}
