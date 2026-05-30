import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { Toaster } from "@/components/ui/Sonner";
import { HydrationWrapper } from "@/components/HydrationWrapper";
import { useAuthStore, useAuthHydration } from "@/store/authStore";
import { Loader2 } from "lucide-react";

export default function DashboardLayout() {
  const { user } = useAuthStore();
  const isAuthHydrated = useAuthHydration();

  if (!isAuthHydrated) {
    // Show loading while auth store is hydrating
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <HydrationWrapper>
      <div className="flex min-h-screen bg-surface-page dark:bg-dark-page">
        <Sidebar role={user.role} />
        <div
          className="flex flex-col flex-1 min-w-0"
          style={{ marginLeft: "var(--sidebar-width)" }}
        >
          <Topbar user={user} />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
          <Toaster />
        </div>
      </div>
    </HydrationWrapper>
  );
}
