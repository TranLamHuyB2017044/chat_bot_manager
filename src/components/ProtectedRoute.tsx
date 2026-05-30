import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore, useAuthHydration } from "@/store/authStore";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: number[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user } = useAuthStore();
  const isAuthHydrated = useAuthHydration();

  if (!isAuthHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  if (!user) {
    // Chưa đăng nhập -> redirect sang trang login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Sai quyền (không phải admin) -> redirect về dashboard mặc định của họ
    const fallbackPath = user.role === 0 ? "/admin" : "/dashboard";
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
