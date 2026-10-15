import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useChatbotStore, WidgetConfig, useStoreHydration, DEFAULT_AVATARS } from "@/store/chatbotStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowRight, Palette, Loader2, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/Sonner";

export default function BotWidgetDesignPage() {
  const { id: botId } = useParams<{ id: string }>();
  const { chatbots, updateChatbot } = useChatbotStore();
  const isHydrated = useStoreHydration();
  const [saving, setSaving] = useState(false);

  // Widget config form states
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [collectContactInfo, setCollectContactInfo] = useState(true);
  const [showSources, setShowSources] = useState(true);

  const bot = chatbots.find((b) => b.id === botId);

  // Initialize form states
  useEffect(() => {
    if (bot) {
      const colorIndex = DEFAULT_AVATARS.findIndex(av => av.color === bot.widgetConfig.primaryColor);
      setSelectedColorIndex(colorIndex >= 0 ? colorIndex : 0);
      setDisplayName(bot.widgetConfig.displayName || bot.name);
      setWelcomeMessage(bot.widgetConfig.welcomeMessage || "Xin chào!");
      setCollectContactInfo(bot.collectContactInfo !== undefined ? bot.collectContactInfo : true);
      setShowSources(bot.showSources !== undefined ? bot.showSources : true);
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
        collect_contact_info: collectContactInfo,
        show_sources: showSources,
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
            {/* Color picker (enum selection) */}
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

            {/* Collect contact info setting */}
            <div className="pt-1 space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-text-primary dark:text-textDark-primary cursor-pointer p-2.5 rounded-btn bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border hover:border-brand/50 transition">
                <input
                  type="checkbox"
                  checked={collectContactInfo}
                  onChange={(e) => setCollectContactInfo(e.target.checked)}
                  className="rounded border-surface-border text-brand focus:ring-brand cursor-pointer"
                />
                <span className="font-medium select-none">
                  Thu thập thông tin khách hàng (Email / SĐT)
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-text-primary dark:text-textDark-primary cursor-pointer p-2.5 rounded-btn bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border hover:border-brand/50 transition">
                <input
                  type="checkbox"
                  checked={showSources}
                  onChange={(e) => setShowSources(e.target.checked)}
                  className="rounded border-surface-border text-brand focus:ring-brand cursor-pointer"
                />
                <div className="flex flex-col select-none">
                  <span className="font-medium">
                    Hiển thị tài liệu trích dẫn (Show Sources)
                  </span>
                  <span className="text-[11px] text-text-secondary dark:text-textDark-secondary">
                    Cho phép người dùng xem nguồn tài liệu tham khảo khi chatbot phản hồi
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Save button */}
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

      {/* Live Preview panel */}
      <div className="flex flex-col border border-surface-border dark:border-dark-border rounded-card bg-surface-page dark:bg-dark-page p-6 items-center justify-center min-h-112.5">
        <p className="text-[10px] font-bold text-text-muted dark:text-textDark-secondary mb-6 uppercase tracking-wider">
          Xem trước Widget thực tế
        </p>

        {/* Chat Window Mockup */}
        <div className="w-full max-w-95 bg-white dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scaleIn">
          {/* Header bar */}
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

          {/* Messages Body */}
          <div className="p-4 space-y-3 h-72 overflow-y-auto bg-slate-50 dark:bg-neutral-900/50">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold shrink-0 text-text-muted">
                AI
              </div>
              <div className="flex flex-col gap-1">
                <div className="bg-white dark:bg-zinc-800 border border-surface-border dark:border-dark-border rounded-2xl rounded-tl-none p-3 text-sm text-text-secondary dark:text-textDark-primary leading-relaxed max-w-65 shadow-sm">
                  {welcomeMessage}
                </div>
                <span className="text-[10px] text-gray-400 ml-2">10:01 AM</span>
              </div>
            </div>

            {/* Example user message */}
            <div className="flex gap-3 items-start justify-end">
              <div className="flex flex-col gap-1 items-end">
                <div
                  className="rounded-2xl rounded-tr-none p-3 text-sm text-white leading-relaxed max-w-65 shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  Tôi đã đọc xong tài liệu rồi
                </div>
                <span className="text-[10px] text-gray-400 mr-2">10:02 AM</span>
              </div>
            </div>

            {/* Example assistant reply */}
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold shrink-0 text-text-muted">
                AI
              </div>
              <div className="flex flex-col gap-1">
                <div className="bg-white dark:bg-zinc-800 border border-surface-border dark:border-dark-border rounded-2xl rounded-tl-none p-3 text-sm text-text-secondary dark:text-textDark-primary leading-relaxed max-w-65 shadow-sm">
                  <p>Dựa theo tài liệu hướng dẫn, hệ thống hỗ trợ tích hợp qua API và Web Widget.</p>
                  {showSources && (
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-neutral-700/60 flex items-center gap-1 text-[11px] text-text-muted">
                      <span>📚 Nguồn:</span>
                      <span className="bg-gray-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[10px] text-brand font-medium">
                        Huong_dan_su_dung.pdf
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 ml-2">10:03 AM</span>
              </div>
            </div>
          </div>

          {/* Footer Input */}
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

          {/* Powered by footer */}
          <div className="bg-gray-50 dark:bg-neutral-900/30 py-2 text-center">
            <p className="text-[10px] text-gray-400">
              Powered by <span className="text-brand font-semibold">Bittech RAG</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
