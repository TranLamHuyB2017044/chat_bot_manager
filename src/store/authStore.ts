import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { useEffect, useState } from "react";
import type { AuthUser } from "@/types/auth";
import { getAuthUser, setAuthUser, setApiKey, clearAuth } from "@/lib/api";

interface AuthState {
  user:       AuthUser | null;
  isLoading:  boolean;
  setUser:    (user: AuthUser | null) => void;
  setLoading: (v: boolean) => void;
  clear:      () => void;
}

// Hydration state tracker for auth store
let authHasHydrated = false;

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set) => ({
      user:      null, // Start with null, let persistence handle it
      isLoading: false,

      setUser: (user) =>
        set((s) => {
          s.user = user;
          if (user) {
            setAuthUser(user);
          }
        }),

      setLoading: (v) =>
        set((s) => {
          s.isLoading = v;
        }),

      clear: () => {
        set((s) => {
          s.user = null;
          s.isLoading = false;
        });
        clearAuth();
      },
    })),
    {
      name:    "auth-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => {
        return () => {
          authHasHydrated = true;
        };
      },
    }
  )
);

// Hook to check auth store hydration
export function useAuthHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (authHasHydrated) {
      setHydrated(true);
      return;
    }

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      authHasHydrated = true;
      setHydrated(true);
    });

    return unsub;
  }, []);

  return hydrated;
}
