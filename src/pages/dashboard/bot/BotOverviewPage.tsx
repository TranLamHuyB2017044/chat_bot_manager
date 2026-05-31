import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useChatbotStore, useStoreHydration, mapBackendBotToFrontend } from "@/store/chatbotStore";
import { Loader2, MessageSquare, HelpCircle, Coins, MessageCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

export default function BotOverviewPage() {
  const { id: botId } = useParams<{ id: string }>();
  const { chatbots, updateChatbot } = useChatbotStore();
  const isHydrated = useStoreHydration();

  // Fetch updated stats from API server
  useEffect(() => {
    if (botId && isHydrated) {
      apiFetch(`/api/chatbot/${botId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.data) {
            // Response mới: data.data là chatbot object trực tiếp
            const mappedBot = mapBackendBotToFrontend(data.data);
            const { chatbots: existingChatbots, updateChatbot } = useChatbotStore.getState();
            
            // Kiểm tra xem bot đã có trong store chưa
            const botExists = existingChatbots.find((b) => b.id === botId);
            if (botExists) {
              updateChatbot(botId, mappedBot);
            } else {
              // Nếu chưa có, thêm bot mới vào store
              useChatbotStore.setState((state) => {
                state.chatbots.push(mappedBot);
              });
            }
          }
        })
        .catch((err) => console.error("Error fetching live chatbot statistics:", err));
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
      {/* Top Banner Card */}
      <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-text-primary dark:text-textDark-primary leading-tight">
              Theo dõi tương tác người dùng, fallback và mức sử dụng credits theo từng giai đoạn
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-pill font-medium bg-success-bg text-success-text border border-success/10 capitalize">
                <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                Hoạt động
              </span>
              <span className="text-[10px] text-text-secondary dark:text-textDark-secondary bg-surface-input dark:bg-dark-input px-2 py-0.5 rounded border border-surface-border/50 dark:border-dark-border/50 font-medium">
                {fileCount} file / {pageCount} trang đã học
              </span>
              <span className="text-[10px] text-text-muted dark:text-textDark-secondary font-mono">
                {new Date().toLocaleTimeString("vi-VN")} {bot.createdAt}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border px-3.5 py-1.5 rounded-btn text-xs font-semibold text-text-secondary dark:text-textDark-primary cursor-pointer hover:border-brand/40 transition-colors">
            <Calendar size={13} className="text-text-muted dark:text-textDark-secondary" />
            <span>{getFormattedDateRange()}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted dark:text-textDark-secondary">
              Cuộc hội thoại
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <MessageSquare size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-text-primary dark:text-textDark-primary leading-none">
              {bot.chatsCount}
            </p>
            <p className="text-[10px] text-text-secondary dark:text-textDark-secondary mt-1 font-medium">
              Số cuộc hội thoại mới
            </p>
          </div>
          <div className="border-t border-surface-border/50 dark:border-dark-border/50 pt-2 text-[9px] text-text-muted dark:text-textDark-muted font-medium">
            — Không có dữ liệu trước đó
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted dark:text-textDark-secondary">
              Tin nhắn người dùng
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <MessageCircle size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-text-primary dark:text-textDark-primary leading-none">
              {bot.messagesCount}
            </p>
            <p className="text-[10px] text-text-secondary dark:text-textDark-secondary mt-1 font-medium">
              Tổng số tin nhắn nhận được
            </p>
          </div>
          <div className="border-t border-surface-border/50 dark:border-dark-border/50 pt-2 text-[9px] text-text-muted dark:text-textDark-muted font-medium">
            — Không có dữ liệu trước đó
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted dark:text-textDark-secondary">
              Fallback rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <HelpCircle size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-text-primary dark:text-textDark-primary leading-none">
              {bot.fallbackRate}%
            </p>
            <p className="text-[10px] text-text-secondary dark:text-textDark-secondary mt-1 font-medium">
              Câu hỏi không thể trả lời
            </p>
          </div>
          <div className="border-t border-surface-border/50 dark:border-dark-border/50 pt-2 text-[9px] text-text-muted dark:text-textDark-muted font-medium">
            — Không có dữ liệu trước đó
          </div>
        </div>

        {/* KPI 4 */}
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
              {bot.creditsUsed}
            </p>
            <p className="text-[10px] text-text-secondary dark:text-textDark-secondary mt-1 font-medium">
              Credits tiêu thụ bởi chat
            </p>
          </div>
          <div className="border-t border-surface-border/50 dark:border-dark-border/50 pt-2 text-[9px] text-text-muted dark:text-textDark-muted font-medium">
            — Không có dữ liệu trước đó
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary dark:text-textDark-primary">
            Biểu đồ tương tác
          </h3>
          <p className="text-xs text-text-muted dark:text-textDark-secondary mt-0.5">
            Tin nhắn người dùng và cuộc hội thoại mới theo thời gian
          </p>
        </div>
        
        <div className="w-full h-64 bg-slate-50/50 dark:bg-dark-page/40 rounded-btn border border-surface-border/50 dark:border-dark-border/50 p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="w-full border-t border-surface-border/20 dark:border-dark-border/10" />
            ))}
          </div>
          
          <div className="flex-1 w-full relative min-h-40 mt-4">
            <svg className="w-full h-full" viewBox="0 0 700 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2DB87A" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2DB87A" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="subGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
              </defs>

              <line x1="0" y1="160" x2="700" y2="160" stroke="currentColor" className="text-surface-border dark:text-dark-border" strokeWidth="1" />

              <path
                d="M 0 140 C 100 130, 200 90, 300 110 C 400 130, 500 40, 600 80 C 650 100, 700 20, 700 20 L 700 160 L 0 160 Z"
                fill="url(#chartGradient)"
              />
              <path
                d="M 0 140 C 100 130, 200 90, 300 110 C 400 130, 500 40, 600 80 C 650 100, 700 20, 700 20"
                fill="none"
                stroke="#2DB87A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <path
                d="M 0 150 C 100 145, 200 130, 300 140 C 400 148, 500 110, 600 135 C 650 140, 700 90, 700 90 L 700 160 L 0 160 Z"
                fill="url(#subGradient)"
              />
              <path
                d="M 0 150 C 100 145, 200 130, 300 140 C 400 148, 500 110, 600 135 C 650 140, 700 90, 700 90"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeDasharray="4 2"
                strokeLinecap="round"
              />

              <circle cx="700" cy="20" r="4.5" fill="#2DB87A" stroke="#fff" strokeWidth="1.5" />
              <circle cx="700" cy="90" r="4" fill="#3B82F6" stroke="#fff" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="flex justify-between text-[10px] text-text-muted dark:text-textDark-secondary mt-2 px-1 font-semibold">
            {["T6", "T7", "CN", "T2", "T3", "T4", "Hôm nay"].map((day, idx) => (
              <span key={day} className={cn(idx === 6 && "text-brand font-bold")}>
                {day}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-6 pt-2 text-[10px] font-bold">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1.5 bg-brand rounded-full inline-block" />
            <span className="text-text-secondary dark:text-textDark-secondary">Tin nhắn người dùng</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1.5 bg-blue-500 rounded-full inline-block border-dashed border-t" />
            <span className="text-text-secondary dark:text-textDark-secondary">Cuộc hội thoại mới</span>
          </div>
        </div>
      </div>
    </div>
  );
}
