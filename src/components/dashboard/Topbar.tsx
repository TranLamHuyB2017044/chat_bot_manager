import { useNavigate, useLocation } from "react-router-dom";
import { useUIStore } from "@/store";
import { useChatbotStore } from "@/store/chatbotStore";
import { useAuthStore } from "@/store/authStore";
import { Sun, Moon, LogOut, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/auth";
import { apiFetch } from "@/lib/api";

interface Props {
  user: AuthUser;
  pageTitle?: string;
}

const ROLE_LABELS: Record<number, string> = {
  0: "Admin",
  1: "Manager",
  2: "User",
};

export default function Topbar({ user, pageTitle = "Dashboard" }: Props) {
  const { theme, toggleTheme } = useUIStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const chatbots = useChatbotStore((s) => s.chatbots);
  const { clear } = useAuthStore();

  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const isBotRoute = pathname.includes("/dashboard/bot/");
  const botId = isBotRoute ? pathname.split("/dashboard/bot/")[1]?.split("/")[0] : null;
  const activeBot = isHydrated && botId ? chatbots.find((b) => b.id === botId) : null;

  // Sync theme class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const handleLogout = async () => {
    try {
      // Xóa session trên backend bằng cách gọi trực tiếp
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    } finally {
      // Xóa store + localStorage
      clear();
      navigate("/login");
    }
  };

  const displayName = user.fullname || user.email || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleLabel = ROLE_LABELS[user.role] ?? "User";

  const iconBtn = cn(
    "p-2 rounded-btn transition-colors",
    "text-text-muted dark:text-textDark-secondary",
    "hover:bg-surface-input dark:hover:bg-dark-input",
    "hover:text-text-secondary dark:hover:text-textDark-primary"
  );

  // Dynamic titles based on active route
  const getSubTitle = () => {
    if (activeBot) {
      if (pathname.endsWith("/playground")) return "Playground — Thử nghiệm hội thoại";
      if (pathname.endsWith("/knowledge")) return `Kiến thức — ${activeBot.knowledgeBase.files.length} tài liệu / trang`;
      if (pathname.endsWith("/widget-design")) return "Giao diện — Tùy chỉnh màu sắc & nội dung";
      if (pathname.endsWith("/embed")) return "Cài đặt Widget — Lấy mã nhúng website";
      if (pathname.endsWith("/settings")) return "Cài đặt — Quản lý chatbot";
      return activeBot.knowledgeBase.websiteUrl || "Trang tổng quan hoạt động";
    }
    return "Tổng quan tài khoản";
  };

  const getTitle = () => {
    if (activeBot) {
      if (pathname.endsWith("/playground")) return "Playground";
      if (pathname.endsWith("/knowledge")) return "Kiến thức";
      if (pathname.endsWith("/widget-design")) return "Cài đặt giao diện";
      if (pathname.endsWith("/embed")) return "Cài đặt Widget";
      if (pathname.endsWith("/settings")) return "Cài đặt chatbot";
      return "Tổng quan";
    }
    if (pathname.includes("/dashboard/create")) {
      return "Tạo chatbot cho website của bạn";
    }
    return pageTitle;
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 bg-surface-card dark:bg-dark-card border-b border-surface-border dark:border-dark-border shadow-sm"
      style={{ height: "var(--topbar-height)" }}
    >
      {/* Left: page title */}
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-bold text-text-primary dark:text-textDark-primary leading-tight truncate">
          {getTitle()}
        </span>
        <span className="text-[10px] text-text-muted dark:text-textDark-secondary leading-none mt-0.5 truncate font-medium">
          {getSubTitle()}
        </span>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <button className={iconBtn} aria-label="Notifications">
          <Bell size={15} />
        </button>

        {/* Theme toggle */}
        <button onClick={toggleTheme} className={iconBtn} aria-label="Toggle theme">
          {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-surface-border dark:bg-dark-border mx-1" />

        {/* Role badge */}
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded-pill font-semibold capitalize",
            user.role === 0
              ? "bg-brand-soft text-success-text dark:bg-brand-softDark dark:text-brand"
              : "bg-surface-input dark:bg-dark-input text-text-muted dark:text-textDark-secondary"
          )}
        >
          {roleLabel}
        </span>

        {/* Avatar + name */}
        <div className="flex items-center gap-2 ml-1">
          <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold shadow-sm select-none">
            {initials}
          </div>
          <span className="text-xs font-semibold text-text-primary dark:text-textDark-primary hidden sm:block max-w-[100px] truncate select-none">
            {displayName}
          </span>
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className={cn(iconBtn, "hover:text-danger ml-1")}
          aria-label="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
