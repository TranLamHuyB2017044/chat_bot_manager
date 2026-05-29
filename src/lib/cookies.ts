import { getCookie, deleteCookie } from "cookies-next";
import type { AuthUser } from "@/types/auth";

const USER_COOKIE_KEY = "bt_user";

export interface AuthCookieData {
  user: AuthUser;
}

/**
 * Đọc thông tin user từ cookie bt_user (không chứa api_key).
 * api_key được lưu trong HttpOnly cookie bt_api_key, không thể đọc từ client.
 */
export const getAuthFromCookies = (): AuthCookieData | null => {
  const userStr = getCookie(USER_COOKIE_KEY);
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr as string) as AuthUser;
    return { user };
  } catch {
    return null;
  }
};

/**
 * Xóa cookie user (gọi khi logout).
 * Cookie bt_api_key (HttpOnly) chỉ có thể xóa server-side qua /api/auth/logout.
 */
export const clearAuthCookies = () => {
  deleteCookie(USER_COOKIE_KEY, { path: "/" });
};
