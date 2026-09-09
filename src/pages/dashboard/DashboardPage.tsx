import { useEffect } from "react";
import { useChatbotStore, useStoreHydration } from "@/store/chatbotStore";
import { useAuthHydration, useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/Avatar";
import { Bot, MessageSquare, Calendar, ArrowRight, Loader2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { chatbots, fetchChatbots, deleteChatbotApi, setActiveChatbotId, isLoading } = useChatbotStore();
  const isChatbotHydrated = useStoreHydration();
  const isAuthHydrated = useAuthHydration();
  const allHydrated = isChatbotHydrated && isAuthHydrated;
  const isAdmin = user?.role === 0;

  // Sync state on mount and redirect non-admin users to first bot
  useEffect(() => {
    const handleRedirect = async () => {
      if (allHydrated) {
        setActiveChatbotId(null);
        
        if (chatbots.length === 0) {
          await fetchChatbots();
        }
      }
    };
    
    handleRedirect();
  }, [allHydrated, setActiveChatbotId, fetchChatbots]);

  // Separate effect to check chatbots and redirect non-admin
  useEffect(() => {
    if (allHydrated && !isAdmin) {
      if (chatbots.length > 0) {
        navigate(`/dashboard/bot/${chatbots[0].id}`);
      } else {
        // If no chatbots, redirect to create page
        navigate("/dashboard/create");
      }
    }
  }, [allHydrated, chatbots, isAdmin, navigate]);

  const handleSelectBot = (id: string) => {
    setActiveChatbotId(id);
    navigate(`/dashboard/bot/${id}`);
  };

  const handleDeleteBot = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa chatbot này không? Mọi dữ liệu tri thức sẽ bị mất.")) {
      await deleteChatbotApi(id);
    }
  };

  if (!allHydrated || (isLoading && chatbots.length === 0)) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  // Only render dashboard UI for admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Dashboard Header */}
      {chatbots.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary dark:text-textDark-primary">
              Chatbot của bạn
            </h1>
            <p className="text-xs text-text-muted dark:text-textDark-secondary mt-0.5">
              Quản lý, huấn luyện và lấy mã nhúng widget cho chatbot của bạn
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/create")}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-btn transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ Tạo Chatbot</span>
          </button>
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
          <p className="text-xs text-text-muted dark:text-textDark-secondary max-w-sm mb-6 leading-relaxed">
            Tạo chatbot đầu tiên của bạn để bắt đầu.
          </p>
          <button
            onClick={() => navigate("/dashboard/create")}
            className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-btn transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            Tạo Chatbot
          </button>
        </div>
      ) : (
        // Chatbot Card
        <div className="grid grid-cols-1 gap-6">
          {chatbots.map((bot) => (
            <div
              key={bot.id}
              onClick={() => handleSelectBot(bot.id)}
              className="group relative flex flex-col justify-between p-5 bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card hover:border-brand/40 dark:hover:border-brand/40 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex items-start gap-4">
                <Avatar
                  src={bot.avatarUrl}
                  alt={bot.name}
                  fallbackText={bot.name}
                  size="md"
                  backgroundColor={bot.widgetConfig?.primaryColor || "#2DB87A"}
                />
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
                ) : bot.status === "inactive" ? (
                  <Badge variant="secondary" dot>
                    Đã tạm dừng
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
