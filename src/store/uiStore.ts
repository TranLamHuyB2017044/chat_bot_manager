"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type Theme = "light" | "dark";

interface UIState {
  theme:          Theme;
  sidebarOpen:    boolean;
  toggleTheme:    () => void;
  setSidebarOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    immer((set) => ({
      theme:       "light",
      sidebarOpen: true,

      toggleTheme: () =>
        set((s) => {
          s.theme = s.theme === "light" ? "dark" : "light";
        }),

      setSidebarOpen: (v) =>
        set((s) => { s.sidebarOpen = v; }),
    })),
    {
      name:    "ui-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
