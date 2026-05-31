import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useChatbotStore, useStoreHydration } from "@/store/chatbotStore";
import { Loader2, MessageSquare, HelpCircle, Coins, MessageCircle, Calendar, TrendingUp, TrendingDown, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

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
  const { chatbots, updateChatbot } = useChatbotStore();
  const isHydrated = useStoreHydration();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Fetch updated stats from API server
  useEffect(() => {
    if (botId && isHydrated) {
      apiFetch(`/api/chatbot/${botId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.data) {
            const { mapBackendBotToFrontend } = require("@/store/chatbotStore");
            const mappedBot = mapBackendBotToFrontend(data.data);
            updateChatbot(botId, mappedBot);
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
    }
  }, [botId, isHydrated]);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      

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
          ) : analytics?.top_keywords.today.length > 0 ? (
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
              {analytics.top_keywords.week.length > 0 && (
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
