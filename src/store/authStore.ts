"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { AuthUser } from "@/types/auth";
import { clearAuthCookies } from "@/lib/cookies";

interface AuthState {
  user:       AuthUser | null;
  isLoading:  boolean;
  setUser:    (user: AuthUser | null) => void;
  setLoading: (v: boolean) => void;
  clear:      () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set) => ({
      user:      null,
      isLoading: false,

      setUser:    (user) => set((s) => { s.user = user; }),
      setLoading: (v)    => set((s) => { s.isLoading = v; }),

      // Khi logout: xóa store + cookie user (bt_api_key xóa qua server /api/auth/logout)
      clear: () => {
        set((s) => { s.user = null; s.isLoading = false; });
        clearAuthCookies();
      },
    })),
    {
      name:    "auth-store",
      storage: createJSONStorage(() => localStorage),
      // Chỉ persist user, KHÔNG persist apiKey (apiKey lưu trong HttpOnly cookie phía server)
      partialize: (s) => ({ user: s.user }),
    }
  )
);
