import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useChatbotStore, WidgetConfig, useStoreHydration, DEFAULT_AVATARS } from "@/store/chatbotStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowRight, Palette, Loader2, Sparkles, MessageSquare, Settings, Send } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/Sonner";

export default function BotWidgetDesignPage() {
  const { id: botId } = useParams<{ id: string }>();
  const { chatbots, updateChatbot } = useChatbotStore();
  const isHydrated = useStoreHydration();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'widget' | 'telegram'>('widget');

  // Widget config form states
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");

  // Telegram config form states
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  const bot = chatbots.find((b) => b.id === botId);

  // Initialize form states
  useEffect(() => {
    if (bot) {
      const colorIndex = DEFAULT_AVATARS.findIndex(av => av.color === bot.widgetConfig.primaryColor);
      setSelectedColorIndex(colorIndex >= 0 ? colorIndex : 0);
      setDisplayName(bot.widgetConfig.displayName || bot.name);
      setWelcomeMessage(bot.widgetConfig.welcomeMessage || "Xin chào!");
      setTelegramBotToken(bot.telegramBotToken || "");
      setTelegramChatId(bot.telegramChatId || "");
    }
  }, [bot]);

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

  const primaryColor = DEFAULT_AVATARS[selectedColorIndex].color;

  const handleSaveWidget = async () => {
    setSaving(true);
    const newConfig: WidgetConfig = {
      primaryColor,
      displayName,
      welcomeMessage,
    };

    updateChatbot(botId!, { widgetConfig: newConfig });

    try {
      const payload = {
        name: displayName,
        greeting: welcomeMessage,
        color: selectedColorIndex,
      };
      
      const res = await apiFetch(`/api/chatbot/${botId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData.data) {
          const { mapBackendBotToFrontend } = await import("@/store/chatbotStore");
          const mappedBot = mapBackendBotToFrontend(resData.data);
          updateChatbot(botId!, mappedBot);
          toast.success("Cập nhật widget thành công!");
        } else {
          toast.error("Server trả về dữ liệu không hợp lệ!");
        }
      } else {
        toast.error("Cập nhật widget thất bại!");
      }
    } catch (e) {
      toast.error("Lỗi kết nối máy chủ!");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTelegram = async () => {
    setSaving(true);
    updateChatbot(botId!, { telegramBotToken, telegramChatId });

    try {
      const payload = {
        telegram_bot_token: telegramBotToken,
        telegram_chat_id: telegramChatId,
      };
      
      const res = await apiFetch(`/api/chatbot/${botId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData.data) {
          const { mapBackendBotToFrontend } = await import("@/store/chatbotStore");
          const mappedBot = mapBackendBotToFrontend(resData.data);
          updateChatbot(botId!, mappedBot);
          toast.success("Cập nhật Telegram thành công!");
        } else {
          toast.error("Server trả về dữ liệu không hợp lệ!");
        }
      } else {
        toast.error("Cập nhật Telegram thất bại!");
      }
    } catch (e) {
      toast.error("Lỗi kết nối máy chủ!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-surface-border dark:border-dark-border pb-1">
        <button
          onClick={() => setActiveTab('widget')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
            activeTab === 'widget'
              ? 'bg-brand text-white'
              : 'text-text-secondary dark:text-textDark-secondary hover:bg-surface-input dark:hover:bg-dark-input'
          }`}
        >
          <div className="flex items-center gap-2">
            <Palette size={14} />
            Thiết kế Widget
          </div>
        </button>
        <button
          onClick={() => setActiveTab('telegram')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
            activeTab === 'telegram'
              ? 'bg-brand text-white'
              : 'text-text-secondary dark:text-textDark-secondary hover:bg-surface-input dark:hover:bg-dark-input'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={14} />
            Cấu hình Telegram
          </div>
        </button>
      </div>

      {/* Widget Tab */}
      {activeTab === 'widget' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-6 shadow-sm flex flex-col justify-between min-h-[50vh]">
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-surface-border dark:border-dark-border pb-3">
                <Palette size={16} className="text-brand animate-pulse" />
                <h2 className="text-sm font-bold text-text-primary dark:text-textDark-primary">
                  Cấu hình thiết kế widget
                </h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-secondary dark:text-textDark-secondary">
                    Màu chủ đạo Widget (Primary Color)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {DEFAULT_AVATARS.map((av, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedColorIndex(index)}
                        className={`p-2 rounded-btn border-2 transition-all cursor-pointer ${
                          selectedColorIndex === index
                            ? "border-brand ring-2 ring-brand/25"
                            : "border-surface-border dark:border-dark-border hover:border-brand/50"
                        }`}
                      >
                        <div
                          className="w-full aspect-square rounded"
                          style={{ backgroundColor: av.color }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Tên hiển thị trên tiêu đề"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-xs"
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary dark:text-textDark-secondary">
                    Tin nhắn chào mừng mặc định
                  </label>
                  <textarea
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-btn text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-surface-border dark:border-dark-border pt-4 mt-6">
              <Button
                variant="primary"
                onClick={handleSaveWidget}
                loading={saving}
                icon={<Sparkles size={13} />}
                className="w-full font-semibold text-xs shadow-md shadow-brand/20 transition-all hover:scale-[1.01]"
              >
                Lưu thay đổi thiết kế
              </Button>
            </div>
          </div>

          <div className="flex flex-col border border-surface-border dark:border-dark-border rounded-card bg-surface-page dark:bg-dark-page p-6 items-center justify-center min-h-112.5">
            <p className="text-[10px] font-bold text-text-muted dark:text-textDark-secondary mb-6 uppercase tracking-wider">
              Xem trước Widget thực tế
            </p>

            <div className="w-full max-w-[380px] bg-white dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-scaleIn">
              <div
                className="p-4 text-white flex items-center justify-between shadow-sm transition-colors duration-300"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 border border-white/10 flex items-center justify-center text-white text-xs font-bold shadow-inner overflow-hidden">
                    <img
                      src={bot.avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold leading-tight truncate">
                      {displayName || "Trợ lý AI"}
                    </p>
                    <p className="text-xs opacity-80 leading-none flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Online
                    </p>
                  </div>
                </div>
                <button className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:bg-white/20 transition-colors">
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-3 h-72 overflow-y-auto bg-slate-50 dark:bg-neutral-900/50">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold shrink-0 text-text-muted">
                    AI
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="bg-white dark:bg-zinc-800 border border-surface-border dark:border-dark-border rounded-[16px] rounded-tl-none p-3 text-sm text-text-secondary dark:text-textDark-primary leading-relaxed max-w-[260px] shadow-sm">
                      {welcomeMessage}
                    </div>
                    <span className="text-[10px] text-gray-400 ml-2">10:01 AM</span>
                  </div>
                </div>

                <div className="flex gap-3 items-start justify-end">
                  <div className="flex flex-col gap-1 items-end">
                    <div
                      className="rounded-[16px] rounded-tr-none p-3 text-sm text-white leading-relaxed max-w-[260px] shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Tôi đã đọc xong tài liệu rồi
                    </div>
                    <span className="text-[10px] text-gray-400 mr-2">10:02 AM</span>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold shrink-0 text-text-muted">
                    AI
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="bg-white dark:bg-zinc-800 border border-surface-border dark:border-dark-border rounded-[16px] rounded-tl-none p-3 text-sm text-text-secondary dark:text-textDark-primary leading-relaxed max-w-[260px] shadow-sm">
                      Tôi không có thông tin trong tài liệu đã cung cấp.
                    </div>
                    <span className="text-[10px] text-gray-400 ml-2">10:03 AM</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-surface-border dark:border-dark-border bg-white dark:bg-dark-card flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-surface-input dark:bg-dark-input px-4 py-3 rounded-full text-sm text-text-primary dark:text-textDark-primary border border-gray-200 dark:border-dark-border focus:outline-none transition"
                  style={{
                    outline: "none",
                    borderColor: primaryColor,
                    boxShadow: `0 0 0 2px ${primaryColor}20`
                  }}
                  disabled
                />
                <button
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center shrink-0 shadow-md transition-transform hover:scale-105"
                  style={{ backgroundColor: primaryColor }}
                  type="button"
                >
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-neutral-900/30 py-2 text-center">
                <p className="text-[10px] text-gray-400">
                  Powered by <span className="text-brand font-semibold">Bittech RAG</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Tab */}
      {activeTab === 'telegram' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-surface-border dark:border-dark-border pb-3 mb-5">
              <MessageSquare size={16} className="text-brand animate-pulse" />
              <h2 className="text-sm font-bold text-text-primary dark:text-textDark-primary">
                Cấu hình thông báo Telegram
              </h2>
            </div>

            <div className="space-y-5">
              <p className="text-xs text-text-secondary dark:text-textDark-secondary">
                Khi chatbot không tìm thấy thông tin, hệ thống sẽ hỏi khách hàng để lại thông tin liên hệ và gửi thông báo đến Telegram của bạn.
              </p>

              <Input
                label="Telegram Bot Token"
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                className="text-xs"
                type="password"
              />

              <Input
                label="Telegram Chat ID"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="123456789"
                className="text-xs"
              />

              <div className="bg-brand/5 dark:bg-brand/10 p-4 rounded-btn border border-brand/20">
                <h3 className="text-xs font-bold text-brand mb-2">Cách lấy thông tin Telegram:</h3>
                <ol className="text-[10px] text-text-secondary dark:text-textDark-secondary space-y-1 list-decimal list-inside">
                  <li>Tạo bot mới bằng <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-brand underline">@BotFather</a> để lấy Token</li>
                  <li>Gửi tin nhắn cho bot của bạn</li>
                  <li>Lấy Chat ID bằng <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-brand underline">@userinfobot</a></li>
                </ol>
              </div>
            </div>

            <div className="border-t border-surface-border dark:border-dark-border pt-4 mt-6">
              <Button
                variant="primary"
                onClick={handleSaveTelegram}
                loading={saving}
                icon={<Send size={13} />}
                className="w-full font-semibold text-xs shadow-md shadow-brand/20 transition-all hover:scale-[1.01]"
              >
                Lưu cấu hình Telegram
              </Button>
            </div>
          </div>

          <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-surface-border dark:border-dark-border pb-3 mb-5">
              <Settings size={16} className="text-brand" />
              <h2 className="text-sm font-bold text-text-primary dark:text-textDark-primary">
                Trạng thái hiện tại
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary dark:text-textDark-secondary">
                  Bot Token
                </span>
                <span className={`text-xs font-semibold ${telegramBotToken ? 'text-success' : 'text-danger'}`}>
                  {telegramBotToken ? 'Đã cấu hình' : 'Chưa cấu hình'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary dark:text-textDark-secondary">
                  Chat ID
                </span>
                <span className={`text-xs font-semibold ${telegramChatId ? 'text-success' : 'text-danger'}`}>
                  {telegramChatId ? 'Đã cấu hình' : 'Chưa cấu hình'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary dark:text-textDark-secondary">
                  Trạng thái
                </span>
                <span className={`text-xs font-semibold ${telegramBotToken && telegramChatId ? 'text-success' : 'text-danger'}`}>
                  {telegramBotToken && telegramChatId ? 'Sẵn sàng' : 'Chưa sẵn sàng'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
