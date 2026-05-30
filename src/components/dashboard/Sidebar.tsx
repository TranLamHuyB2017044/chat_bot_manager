"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  Bell,
  ChevronRight,
  MessageSquare,
  BookOpen,
  Palette,
  Code,
  ArrowLeft,
  Bot,
  Plus,
  Home,
  Users
} from "lucide-react";
import { useChatbotStore, useStoreHydration } from "@/store/chatbotStore";

export default function Sidebar({ role }: { role: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const chatbots = useChatbotStore((s) => s.chatbots);
  const isHydrated = useStoreHydration();

  // Check if we are in admin section
  const isAdminSection = pathname.startsWith("/admin");

  // Determine if we are inside a bot route
  const isBotRoute = pathname.includes("/dashboard/bot/");
  const botId = isBotRoute ? pathname.split("/dashboard/bot/")[1]?.split("/")[0] : null;
  const activeBot = isHydrated && botId ? chatbots.find((b) => b.id === botId) : null;

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (href === "/admin") {
      return pathname === "/admin";
    }
    if (href === `/dashboard/bot/${botId}`) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  // Bot-specific navigation list
  const BOT_NAV = botId ? [
    { href: `/dashboard/bot/${botId}`, label: "Tổng quan", icon: LayoutDashboard },
    { href: `/dashboard/bot/${botId}/playground`, label: "Playground", icon: MessageSquare },
    { href: `/dashboard/bot/${botId}/knowledge`, label: "Kiến thức", icon: BookOpen },
    { href: `/dashboard/bot/${botId}/widget-design`, label: "Giao diện", icon: Palette },
    { href: `/dashboard/bot/${botId}/embed`, label: "Cài đặt Widget", icon: Code },
    { href: `/dashboard/bot/${botId}/settings`, label: "Cài đặt", icon: Settings },
  ] : [];

  // Global navigation list
  const GLOBAL_NAV = [
    { href: "/dashboard", label: "Danh sách Chatbot", icon: Bot },
  ];

  // Admin navigation list
  const ADMIN_NAV = [
    { href: "/admin", label: "Home", icon: Home },
    { href: "/admin/users", label: "Accounts", icon: Users },
  ];

  return (
    <aside
      className="fixed top-0 left-0 h-full flex flex-col bg-sidebar-base border-r border-sidebar-deepest z-40 shadow-xl"
      style={{ width: "var(--sidebar-width)" }}
    >
      {/* Sidebar Header / Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-deepest shrink-0">
        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-md shadow-brand/40 transition-all hover:scale-105">
          <Bot size={18} className="text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-sidebar-navActive tracking-wide">BitTech</span>
          <p className="text-[10px] text-sidebar-navSec -mt-0.5 font-medium">SaaS AI Widget</p>
        </div>
      </div>

      {/* Active Bot Quick Info Card (If inside a bot space) */}
      {isBotRoute && activeBot && (
        <div className="px-3 py-3 border-b border-sidebar-deepest/50 bg-sidebar-active/30">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-btn bg-sidebar-active/50 border border-sidebar-deepest/30">
            <div className="w-8 h-8 rounded-pill bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-bold uppercase text-xs shrink-0">
              {activeBot.name.substring(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-sidebar-navActive truncate">
                {activeBot.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  activeBot.status === "active" ? "bg-success animate-pulse" : "bg-warning animate-bounce"
                )} />
                <span className="text-[9px] text-sidebar-navText truncate capitalize">
                  {activeBot.status === "active" ? "Đang hoạt động" : "Đang huấn luyện"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation menu */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {/* Show admin nav if role=0 and in admin section */}
        {role === 0 ? (
          <>
            <p className="text-[9px] uppercase tracking-wider text-sidebar-navSec px-3 pb-2 pt-1 font-semibold">
              Admin
            </p>
            {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-2.5 px-3 py-2 rounded-btn text-sm font-medium transition-all duration-200",
                  isActive(href)
                    ? "bg-sidebar-active text-sidebar-navActive shadow-sm border-l-2 border-brand pl-2"
                    : "text-sidebar-navText hover:bg-sidebar-hover hover:text-sidebar-navActive"
                )}
              >
                <Icon
                  size={15}
                  className={cn(
                    "shrink-0 transition-colors duration-200",
                    isActive(href) ? "text-brand" : "text-sidebar-navSec group-hover:text-sidebar-navText"
                  )}
                />
                <span className="truncate">{label}</span>
                {isActive(href) && (
                  <ChevronRight size={12} className="ml-auto text-brand opacity-60" />
                )}
              </Link>
            ))}

            {/* Divider */}
            <div className="h-px bg-sidebar-deepest/50 my-2 mx-2" />

            <p className="text-[9px] uppercase tracking-wider text-sidebar-navSec px-3 pb-2 pt-1 font-semibold">
              Bot Management
            </p>
            {GLOBAL_NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-2.5 px-3 py-2 rounded-btn text-sm font-medium transition-all duration-200",
                  isActive(href)
                    ? "bg-sidebar-active text-sidebar-navActive shadow-sm border-l-2 border-brand pl-2"
                    : "text-sidebar-navText hover:bg-sidebar-hover hover:text-sidebar-navActive"
                )}
              >
                <Icon
                  size={15}
                  className={cn(
                    "shrink-0 transition-colors duration-200",
                    isActive(href) ? "text-brand" : "text-sidebar-navSec group-hover:text-sidebar-navText"
                  )}
                />
                <span className="truncate">{label}</span>
                {isActive(href) && (
                  <ChevronRight size={12} className="ml-auto text-brand opacity-60" />
                )}
              </Link>
            ))}

            {/* Also show bot nav if in bot route */}
            {isBotRoute && activeBot && (
              <>
                <p className="text-[9px] uppercase tracking-wider text-sidebar-navSec px-3 pb-2 pt-1 font-semibold">
                  Quản lý Bot
                </p>
                {BOT_NAV.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "group flex items-center gap-2.5 px-3 py-2 rounded-btn text-sm font-medium transition-all duration-200",
                      isActive(href)
                        ? "bg-sidebar-active text-sidebar-navActive shadow-sm border-l-2 border-brand pl-2"
                        : "text-sidebar-navText hover:bg-sidebar-hover hover:text-sidebar-navActive"
                    )}
                  >
                    <Icon
                      size={15}
                      className={cn(
                        "shrink-0 transition-colors duration-200",
                        isActive(href) ? "text-brand" : "text-sidebar-navSec group-hover:text-sidebar-navText"
                      )}
                    />
                    <span className="truncate">{label}</span>
                    {isActive(href) && (
                      <ChevronRight size={12} className="ml-auto text-brand opacity-60" />
                    )}
                  </Link>
                ))}
              </>
            )}
          </>
        ) : (
          // Regular user navigation
          <>
            {isBotRoute && activeBot ? (
              <>
                <p className="text-[9px] uppercase tracking-wider text-sidebar-navSec px-3 pb-2 pt-1 font-semibold">
                  Quản lý Bot
                </p>
                {BOT_NAV.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "group flex items-center gap-2.5 px-3 py-2 rounded-btn text-sm font-medium transition-all duration-200",
                      isActive(href)
                        ? "bg-sidebar-active text-sidebar-navActive shadow-sm border-l-2 border-brand pl-2"
                        : "text-sidebar-navText hover:bg-sidebar-hover hover:text-sidebar-navActive"
                    )}
                  >
                    <Icon
                      size={15}
                      className={cn(
                        "shrink-0 transition-colors duration-200",
                        isActive(href) ? "text-brand" : "text-sidebar-navSec group-hover:text-sidebar-navText"
                      )}
                    />
                    <span className="truncate">{label}</span>
                    {isActive(href) && (
                      <ChevronRight size={12} className="ml-auto text-brand opacity-60" />
                    )}
                  </Link>
                ))}
              </>
            ) : (
              <>
                <p className="text-[9px] uppercase tracking-wider text-sidebar-navSec px-3 pb-2 pt-1 font-semibold">
                  Không gian làm việc
                </p>
                {GLOBAL_NAV.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "group flex items-center gap-2.5 px-3 py-2 rounded-btn text-sm font-medium transition-all duration-200",
                      isActive(href)
                        ? "bg-sidebar-active text-sidebar-navActive shadow-sm border-l-2 border-brand pl-2"
                        : "text-sidebar-navText hover:bg-sidebar-hover hover:text-sidebar-navActive"
                    )}
                  >
                    <Icon
                      size={15}
                      className={cn(
                        "shrink-0 transition-colors duration-200",
                        isActive(href) ? "text-brand" : "text-sidebar-navSec group-hover:text-sidebar-navText"
                      )}
                    />
                    <span className="truncate">{label}</span>
                    {isActive(href) && (
                      <ChevronRight size={12} className="ml-auto text-brand opacity-60" />
                    )}
                  </Link>
                ))}
              </>
            )}
          </>
        )}
      </nav>

      {/* Sidebar Footer / Back button */}
      <div className="px-2 py-3 border-t border-sidebar-deepest/50">
        {isBotRoute ? (
          <button
            onClick={handleBackToDashboard}
            className="flex w-full items-center gap-2 px-3 py-2 rounded-btn text-xs font-semibold text-sidebar-navText hover:bg-sidebar-hover hover:text-sidebar-navActive transition-colors"
          >
            <ArrowLeft size={13} className="shrink-0 text-sidebar-navSec group-hover:text-sidebar-navText" />
            <span className="truncate">Về Dashboard</span>
          </button>
        ) : (
          <div className="px-3 py-1">
            <p className="text-[10px] text-sidebar-navSec font-medium">
              © 2026 BitTech SaaS Inc.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
