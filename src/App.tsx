import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import LoginPage from "@/pages/auth/LoginPage";
import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import CreateBotPage from "@/pages/dashboard/CreateBotPage";
import BotOverviewPage from "@/pages/dashboard/bot/BotOverviewPage";
import BotPlaygroundPage from "@/pages/dashboard/bot/BotPlaygroundPage";
import BotKnowledgePage from "@/pages/dashboard/bot/BotKnowledgePage";
import BotWidgetDesignPage from "@/pages/dashboard/bot/BotWidgetDesignPage";
import BotEmbedPage from "@/pages/dashboard/bot/BotEmbedPage";
import BotSuccessPage from "@/pages/dashboard/bot/BotSuccessPage";
import AdminPage from "@/pages/admin/AdminPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuthStore, useAuthHydration } from "@/store/authStore";
import { Loader2 } from "lucide-react";

// Component để điều hướng trang gốc `/` dựa trên vai trò
function RootRedirect() {
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
    return <Navigate to="/login" replace />;
  }
  
  // Điều hướng theo role
  if (user.role === 0) {
    return <Navigate to="/admin" replace />;
  } else {
    // Nếu có chatbots, lấy chatbot đầu tiên để điều hướng
    if (user.chatbots && user.chatbots.length > 0) {
      return <Navigate to={`/dashboard/bot/${user.chatbots[0].id}`} replace />;
    } else {
      // Nếu không có chatbot nào, vào trang tạo bot
      return <Navigate to="/dashboard/create" replace />;
    }
  }
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "dashboard/create",
        element: <CreateBotPage />,
      },
      {
        path: "dashboard/bot/:id",
        element: <BotOverviewPage />,
      },
      {
        path: "dashboard/bot/:id/playground",
        element: <BotPlaygroundPage />,
      },
      {
        path: "dashboard/bot/:id/knowledge",
        element: <BotKnowledgePage />,
      },
      {
        path: "dashboard/bot/:id/widget-design",
        element: <BotWidgetDesignPage />,
      },
      {
        path: "dashboard/bot/:id/embed",
        element: <BotEmbedPage />,
      },
      {
        path: "dashboard/bot/:id/success",
        element: <BotSuccessPage />,
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute allowedRoles={[0]}>
            <AdminPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <ProtectedRoute allowedRoles={[0]}>
            <AdminUsersPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
