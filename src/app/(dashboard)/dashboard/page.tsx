"use client";
import { useEffect } from "react";
import { useChatbotStore, Chatbot, useStoreHydration } from "@/store/chatbotStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Bot, Plus, MessageSquare, Calendar, ArrowRight, Loader2, Trash2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/Sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { chatbots, fetchChatbots, deleteChatbotApi, setActiveChatbotId, isLoading, error } = useChatbotStore();
  const isHydrated = useStoreHydration();

  const testToasts = () => {
    toast.success("Thao tác thành công!", { description: "Dữ liệu đã được cập nhật" });
    toast.warning("Cảnh báo!", { description: "Vui lòng kiểm tra lại thông tin" });
    toast.error("Lỗi!", { description: "Đã xảy ra lỗi khi thực hiện thao tác" });
    toast.info("Thông tin!", { description: "Thông báo hệ thống" });
  };

  // Sync state on mount
  useEffect(() => {
    if (isHydrated) {
      setActiveChatbotId(null); // Reset active chatbot context when on global dashboard
      // Only fetch if we don't have chatbots yet
      if (chatbots.length === 0) {
        fetchChatbots();
      }
    }
  }, [isHydrated, setActiveChatbotId, fetchChatbots, chatbots.length]);

  const handleCreateBot = () => {
    router.push("/dashboard/create");
  };

  const handleSelectBot = (id: string) => {
    setActiveChatbotId(id);
    router.push(`/dashboard/bot/${id}`);
  };

  const handleDeleteBot = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa chatbot này không? Mọi dữ liệu tri thức sẽ bị mất.")) {
      await deleteChatbotApi(id);
    }
  };

  if (!isHydrated || (isLoading && chatbots.length === 0)) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Dashboard Header */}
      {chatbots.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary dark:text-textDark-primary">
              Danh sách Chatbot của bạn
            </h1>
            <p className="text-xs text-text-muted dark:text-textDark-secondary mt-0.5">
              Quản lý, huấn luyện và lấy mã nhúng widget cho từng chatbot
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => fetchChatbots()}
              icon={<RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />}
              disabled={isLoading}
            >
              Làm mới
            </Button>
            <Button
              variant="secondary"
              onClick={testToasts}
            >
              Test Toast
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateBot}
              icon={<Plus size={16} />}
              className="shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Tạo Chatbot Mới
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {chatbots.length === 0 ? (
        // Empty State View
        <div className="flex flex-col items-center justify-center text-center p-8 sm:p-20 bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card shadow-sm min-h-[60vh] transition-all">
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-brand/10 border border-brand/20 text-brand mb-6 animate-pulse">
            <Bot size={44} className="stroke-[1.5]" />
            <div className="absolute top-0 right-0 w-6 h-6 bg-brand text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
              +
            </div>
          </div>
          <h2 className="text-lg font-bold text-text-primary dark:text-textDark-primary mb-2">
            Bạn chưa có chatbot nào
          </h2>
          <p className="text-xs text-text-muted dark:text-textDark-secondary max-w-sm mb-8 leading-relaxed">
            Tạo chatbot AI thông minh đầu tiên chỉ trong vài phút để nhúng trực tiếp vào website của bạn và tự động trả lời khách hàng.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCreateBot}
            icon={<Plus size={18} />}
            className="px-8 shadow-lg shadow-brand/20 transition-all hover:scale-105"
          >
            Tạo Chatbot Mới
          </Button>
        </div>
      ) : (
        // Chatbot Cards Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatbots.map((bot) => (
            <div
              key={bot.id}
              onClick={() => handleSelectBot(bot.id)}
              className="group relative flex flex-col justify-between p-5 bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card hover:border-brand/40 dark:hover:border-brand/40 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-inner transition-transform group-hover:scale-110"
                  style={{ backgroundColor: bot.widgetConfig?.primaryColor || "#2DB87A" }}
                >
                  {bot.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-sm font-bold text-text-primary dark:text-textDark-primary group-hover:text-brand transition-colors truncate">
                    {bot.name}
                  </h3>
                  <p className="text-[11px] text-text-muted dark:text-textDark-secondary truncate mt-0.5">
                    {bot.description || "Không có mô tả."}
                  </p>
                </div>
                
                {/* Delete bot button */}
                <button
                  onClick={(e) => handleDeleteBot(e, bot.id)}
                  className="absolute top-4 right-4 p-1.5 rounded-btn text-text-muted hover:text-danger hover:bg-danger-bg transition-colors"
                  title="Xóa chatbot"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mt-4 flex items-center gap-2">
                {bot.status === "active" ? (
                  <Badge variant="success" dot>
                    Đang hoạt động
                  </Badge>
                ) : (
                  <Badge variant="warning" dot className="animate-pulse">
                    Huấn luyện ({bot.trainingProgress}%)
                  </Badge>
                )}
                
                {/* File Count Info */}
                <span className="text-[10px] text-text-muted dark:text-textDark-secondary font-medium">
                  {bot.knowledgeBase.files.length} tài liệu
                </span>
              </div>

              {/* Bottom statistics */}
              <div className="border-t border-surface-border dark:border-dark-border mt-5 pt-4 flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-text-muted dark:text-textDark-secondary" />
                    <span className="text-xs font-semibold text-text-secondary dark:text-textDark-primary">
                      {bot.chatsCount}
                    </span>
                    <span className="text-[10px] text-text-muted dark:text-textDark-secondary">
                      lượt chat
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-text-muted dark:text-textDark-secondary" />
                    <span className="text-[10px] text-text-muted dark:text-textDark-secondary">
                      {bot.createdAt}
                    </span>
                  </div>
                </div>
                
                {/* Go icon */}
                <div className="w-6 h-6 rounded-full bg-surface-input dark:bg-dark-input flex items-center justify-center text-text-muted group-hover:bg-brand group-hover:text-white transition-all duration-300">
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
