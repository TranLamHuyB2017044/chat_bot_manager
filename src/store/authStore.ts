"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { AuthUser } from "@/types/auth";

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
      clear:      ()     => set((s) => { s.user = null; s.isLoading = false; }),
    })),
    {
      name:    "auth-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ user: s.user }),
    }
  )
);
