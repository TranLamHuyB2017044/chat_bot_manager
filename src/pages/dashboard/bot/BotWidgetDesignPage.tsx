import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useChatbotStore, WidgetConfig, useStoreHydration } from "@/store/chatbotStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowRight, Palette, Loader2, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function BotWidgetDesignPage() {
  const { id: botId } = useParams<{ id: string }>();
  const { chatbots, updateChatbot } = useChatbotStore();
  const isHydrated = useStoreHydration();
  const [saving, setSaving] = useState(false);

  // Widget config form states
  const [primaryColor, setPrimaryColor] = useState("#2DB87A");
  const [displayName, setDisplayName] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [placeholderText, setPlaceholderText] = useState("");

  const bot = chatbots.find((b) => b.id === botId);

  // Initialize form fields once bot is loaded
  useEffect(() => {
    if (bot) {
      setPrimaryColor(bot.widgetConfig.primaryColor || "#2DB87A");
      setDisplayName(bot.widgetConfig.displayName || bot.name);
      setWelcomeMessage(bot.widgetConfig.welcomeMessage || "Xin chào!");
      setPlaceholderText(bot.widgetConfig.placeholderText || "Nhập tin nhắn...");
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

  const handleSave = async () => {
    setSaving(true);
    const newConfig: WidgetConfig = {
      primaryColor,
      displayName,
      welcomeMessage,
      placeholderText,
    };

    const updatedBot = {
      ...bot,
      widgetConfig: newConfig,
    };

    updateChatbot(botId!, { widgetConfig: newConfig });

    try {
      await apiFetch("/api/bots", {
        method: "POST",
        body: JSON.stringify(updatedBot),
      });
    } catch (e) {
      console.error("Error saving widget configuration:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto animate-fadeIn">
      {/* Settings Form panel */}
      <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-6 shadow-sm flex flex-col justify-between min-h-[50vh]">
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-surface-border dark:border-dark-border pb-3">
            <Palette size={16} className="text-brand animate-pulse" />
            <h2 className="text-sm font-bold text-text-primary dark:text-textDark-primary">
              Cấu hình thiết kế widget
            </h2>
          </div>

          <div className="space-y-4">
            {/* Color picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary dark:text-textDark-secondary">
                Màu chủ đạo Widget (Primary Color)
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-surface-border dark:border-dark-border overflow-hidden bg-transparent shrink-0"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="font-mono text-xs uppercase"
                  placeholder="#2DB87A"
                />
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

            <Input
              label="Gợi ý ô nhập liệu tin nhắn (Placeholder)"
              value={placeholderText}
              onChange={(e) => setPlaceholderText(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="border-t border-surface-border dark:border-dark-border pt-4 mt-6">
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            icon={<Sparkles size={13} />}
            className="w-full font-semibold text-xs shadow-md shadow-brand/20 transition-all hover:scale-[1.01]"
          >
            Lưu thay đổi thiết kế
          </Button>
        </div>
      </div>

      {/* Live Preview panel */}
      <div className="flex flex-col border border-surface-border dark:border-dark-border rounded-card bg-surface-page dark:bg-dark-page p-6 items-center justify-center min-h-[450px]">
        <p className="text-[10px] font-bold text-text-muted dark:text-textDark-secondary mb-6 uppercase tracking-wider">
          Xem trước Widget thực tế
        </p>

        {/* Chat Window Mockup */}
        <div className="w-full max-w-[320px] bg-white dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card shadow-2xl flex flex-col overflow-hidden animate-scaleIn">
          {/* Header bar */}
          <div
            className="p-4 text-white flex items-center justify-between shadow-sm transition-colors duration-300"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 border border-white/10 flex items-center justify-center text-white text-xs font-bold shadow-inner overflow-hidden">
                {bot.avatarUrl ? (
                  <img
                    src={bot.avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayName.substring(0, 2).toUpperCase() || "AI"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold leading-tight truncate">
                  {displayName || "Trợ lý AI"}
                </p>
                <p className="text-[9px] opacity-80 leading-none">● Trực tuyến</p>
              </div>
            </div>
            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold cursor-pointer hover:bg-white/20">
              ✕
            </div>
          </div>

          {/* Messages Body */}
          <div className="p-4 space-y-3 h-52 overflow-y-auto bg-slate-50 dark:bg-neutral-900/50">
            <div className="flex gap-2.5 items-start">
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0 text-text-muted">
                AI
              </div>
              <div className="bg-white dark:bg-zinc-800 border border-surface-border dark:border-dark-border rounded-card rounded-tl-none p-3 text-xs text-text-secondary dark:text-textDark-primary leading-relaxed max-w-[85%] shadow-sm">
                {welcomeMessage}
              </div>
            </div>
          </div>

          {/* Footer Input */}
          <div className="p-3 border-t border-surface-border dark:border-dark-border bg-white dark:bg-dark-card flex items-center gap-2">
            <div className="flex-1 bg-surface-input dark:bg-dark-input px-3 py-2 rounded-pill text-[10px] text-text-muted dark:text-textDark-secondary border border-surface-border/50 dark:border-dark-border/50">
              {placeholderText}
            </div>
            <button
              className="w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0 shadow-md transition-transform hover:scale-105"
              style={{ backgroundColor: primaryColor }}
              type="button"
            >
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
