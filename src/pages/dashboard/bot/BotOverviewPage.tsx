import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  useChatbotStore,
  useStoreHydration,
  mapBackendBotToFrontend,
} from "@/store/chatbotStore";
import { Loader2, MessageSquare, HelpCircle, Coins, MessageCircle, Calendar, TrendingUp, TrendingDown, Clock, User, Power, PowerOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/Sonner";

interface Analytics {
  quota: {
    used: number;
    max: number;
    is_unlimited: boolean;
    remaining: number;
  };
  message_counts: {
    today: number;
    week: number;
    month: number;
  };
  latest_message: {
    _id: string;
    question: string;
    answer: string;
    timestamp: string;
  } | null;
  top_keywords: {
    today: [string, number][];
    week: [string, number][];
    month: [string, number][];
  };
}

export default function BotOverviewPage() {
  const { id: botId } = useParams<{ id: string }>();
  const { chatbots, updateChatbot, updateChatbotApi, fetchChatbots } = useChatbotStore();
  const isHydrated = useStoreHydration();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Fetch chatbots first, then fetch individual bot and analytics
  useEffect(() => {
    if (botId && isHydrated) {
      // First fetch all chatbots to make sure the store is populated
      fetchChatbots().then(() => {
        // Then fetch the individual chatbot details
        apiFetch(`/api/chatbot/${botId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.data) {
              const mappedBot = mapBackendBotToFrontend(data.data);
              updateChatbot(mappedBot.id, mappedBot);
            }
          })
          .catch((err) => console.error("Error fetching chatbot:", err));

        // Fetch analytics
        apiFetch(`/api/chatbot/${botId}/analytics`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.data) {
              setAnalytics(data.data);
            }
            setLoadingAnalytics(false);
          })
          .catch((err) => {
            console.error("Error fetching analytics:", err);
            setLoadingAnalytics(false);
          });
      });
    }
  }, [botId, isHydrated, fetchChatbots]);

  const bot = chatbots.find((b) => b.id === botId);

  if (!bot) {
    if (!isHydrated || chatbots.length === 0) {
      return (
        <div className="flex h-[70vh] items-center justify-center">
          <Loader2 className="animate-spin text-brand" size={32} />
        </div>
      );
    }
  }

  if (!bot) return null;

  const getFormattedDateRange = () => {
    const today = new Date();
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(today.getDate() - 6);

    const pad = (n: number) => n.toString().padStart(2, "0");
    const formatDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

    return `${formatDate(sixDaysAgo)} - ${formatDate(today)}`;
  };

  const fileCount = bot.knowledgeBase.files.filter((f) => f.type !== "url").length;
  const pageCount = bot.knowledgeBase.files.filter((f) => f.type === "url").length;

  const handleToggleStatus = async () => {
    if (!bot) return;
    setTogglingStatus(true);
    const nextStatus = bot.status === "active" ? "inactive" : "active";
    try {
      await updateChatbotApi(bot.id, { status: nextStatus });
      toast.success(nextStatus === "active" ? "Đã mở lại chatbot thành công!" : "Đã tạm dừng chatbot!");
    } catch (err: any) {
      toast.error("Không thể thay đổi trạng thái chatbot");
    } finally {
      setTogglingStatus(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Bot Info & Status Header */}
      <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-surface-border dark:border-dark-border bg-surface-input flex items-center justify-center">
            {bot.avatarUrl ? (
              <img src={bot.avatarUrl} alt={bot.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-sm text-brand">{bot.name.substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-text-primary dark:text-textDark-primary">
                {bot.name}
              </h2>
              <span className="px-2 py-0.5 rounded-pill text-[10px] font-bold uppercase tracking-wider bg-brand/10 text-brand">
                {bot.domain || "general"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-pill",
                bot.status === "active" 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", bot.status === "active" ? "bg-emerald-500" : "bg-amber-500")} />
                {bot.status === "active" ? "Đang hoạt động" : "Đã tạm dừng"}
              </span>
              <span className="text-[11px] text-text-muted dark:text-textDark-secondary">
                • Tạo ngày {bot.createdAt}
              </span>
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className={cn(
              "px-3.5 py-2 rounded-btn text-xs font-semibold flex items-center gap-2 transition cursor-pointer border",
              bot.status === "active"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
            )}
          >
            {bot.status === "active" ? (
              <>
                <PowerOff size={14} />
                <span>{togglingStatus ? "Đang xử lý..." : "Tạm dừng chatbot"}</span>
              </>
            ) : (
              <>
                <Power size={14} />
                <span>{togglingStatus ? "Đang xử lý..." : "Mở lại chatbot"}</span>
              </>
            )}
          </button>
        </div>
      </div>
      

      {/* Quota Section */}
      {loadingAnalytics ? (
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-6 shadow-sm flex items-center justify-center">
          <Loader2 className="animate-spin text-brand" size={24} />
        </div>
      ) : analytics ? (
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-6 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary dark:text-textDark-primary mb-4">Quota sử dụng</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary dark:text-textDark-secondary">Đã sử dụng</span>
              <span className="font-bold text-text-primary dark:text-textDark-primary">
                {analytics.quota.used} / {analytics.quota.is_unlimited ? "∞" : analytics.quota.max}
              </span>
            </div>
            <div className="w-full bg-surface-input dark:bg-dark-input rounded-full h-2.5">
              <div 
                className="bg-brand h-2.5 rounded-full transition-all duration-300"
                style={{ width: analytics.quota.is_unlimited ? "50%" : `${(analytics.quota.used / analytics.quota.max) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-text-muted dark:text-textDark-muted">
              <span>Còn lại: {analytics.quota.remaining} credits</span>
              {analytics.quota.is_unlimited && <span className="text-success font-bold">Unlimited</span>}
            </div>
          </div>
        </div>
      ) : null}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 - Today Messages */}
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted dark:text-textDark-secondary">
              Tin nhắn hôm nay
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <MessageCircle size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-text-primary dark:text-textDark-primary leading-none">
              {analytics?.message_counts.today ?? 0}
            </p>
            <p className="text-[10px] text-text-secondary dark:text-textDark-secondary mt-1 font-medium">
              Số tin nhắn hôm nay
            </p>
          </div>
        </div>

        {/* KPI 2 - Week Messages */}
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted dark:text-textDark-secondary">
              Tin nhắn tuần này
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <MessageSquare size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-text-primary dark:text-textDark-primary leading-none">
              {analytics?.message_counts.week ?? 0}
            </p>
            <p className="text-[10px] text-text-secondary dark:text-textDark-secondary mt-1 font-medium">
              Số tin nhắn tuần này
            </p>
          </div>
        </div>

        {/* KPI 3 - Month Messages */}
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted dark:text-textDark-secondary">
              Tin nhắn tháng này
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <TrendingUp size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-text-primary dark:text-textDark-primary leading-none">
              {analytics?.message_counts.month ?? 0}
            </p>
            <p className="text-[10px] text-text-secondary dark:text-textDark-secondary mt-1 font-medium">
              Số tin nhắn tháng này
            </p>
          </div>
        </div>

        {/* KPI 4 - Credits Used */}
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted dark:text-textDark-secondary">
              Credits đã dùng
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Coins size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-text-primary dark:text-textDark-primary leading-none">
              {analytics?.quota.used ?? bot.creditsUsed}
            </p>
            <p className="text-[10px] text-text-secondary dark:text-textDark-secondary mt-1 font-medium">
              Credits tiêu thụ bởi chat
            </p>
          </div>
        </div>
      </div>

      {/* Latest Message & Top Keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Message */}
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-6 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary dark:text-textDark-primary mb-4 flex items-center gap-2">
            <Clock size={14} className="text-brand" />
            Tin nhắn mới nhất
          </h3>
          {loadingAnalytics ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-brand" size={20} />
            </div>
          ) : analytics?.latest_message ? (
            <div className="space-y-3">
              <div className="bg-surface-input dark:bg-dark-input rounded-btn p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User size={12} className="text-text-muted dark:text-textDark-muted" />
                  <span className="text-xs font-semibold text-text-secondary dark:text-textDark-secondary">Người dùng</span>
                </div>
                <p className="text-sm text-text-primary dark:text-textDark-primary">{analytics.latest_message.question}</p>
              </div>
              <div className="bg-brand/5 dark:bg-brand/10 rounded-btn p-4 border border-brand/20">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle size={12} className="text-brand" />
                  <span className="text-xs font-semibold text-brand">Chatbot</span>
                </div>
                <p className="text-sm text-text-primary dark:text-textDark-primary">{analytics.latest_message.answer}</p>
              </div>
              <p className="text-[10px] text-text-muted dark:text-textDark-muted">
                {new Date(analytics.latest_message.timestamp).toLocaleString("vi-VN")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-text-muted dark:text-textDark-muted py-4">Chưa có tin nhắn nào</p>
          )}
        </div>

        {/* Top Keywords */}
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-6 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary dark:text-textDark-primary mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-brand" />
            Từ khóa phổ biến
          </h3>
          {loadingAnalytics ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-brand" size={20} />
            </div>
          ) : analytics && analytics.top_keywords?.today && analytics.top_keywords.today.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-text-secondary dark:text-textDark-secondary">Hôm nay</p>
              <div className="flex flex-wrap gap-2">
                {analytics.top_keywords.today.map(([keyword, count], index) => (
                  <div key={index} className="bg-surface-input dark:bg-dark-input px-3 py-1.5 rounded-btn flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary dark:text-textDark-primary">{keyword}</span>
                    <span className="text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">{count}</span>
                  </div>
                ))}
              </div>
              {analytics.top_keywords.week && analytics.top_keywords.week.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-text-secondary dark:text-textDark-secondary pt-2">Tuần này</p>
                  <div className="flex flex-wrap gap-2">
                    {analytics.top_keywords.week.slice(0, 5).map(([keyword, count], index) => (
                      <div key={index} className="bg-surface-input dark:bg-dark-input px-3 py-1.5 rounded-btn flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary dark:text-textDark-primary">{keyword}</span>
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">{count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted dark:text-textDark-muted py-4">Chưa có từ khóa nào</p>
          )}
        </div>
      </div>
    </div>
  );
}
