"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useChatbotStore, useStoreHydration } from "@/store/chatbotStore";
import { Button } from "@/components/ui/Button";
import { Send, Bot, User, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function BotPlaygroundPage() {
  const params = useParams();
  const botId = params.id as string;
  const { chatbots, updateChatbot } = useChatbotStore();
  const isHydrated = useStoreHydration();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const bot = isHydrated ? chatbots.find((b) => b.id === botId) : null;

  // Initialize messages list with welcome message once hydrated
  useEffect(() => {
    if (bot) {
      setMessages([
        {
          role: "assistant",
          content: bot.widgetConfig.welcomeMessage || "Xin chào! Tôi có thể giúp gì cho bạn hôm nay?",
        },
      ]);
    }
  }, [bot]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || !bot) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, messages: newMessages }),
      });

      const data = await response.json();

      if (data && !data.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        
        // Sync statistics on the frontend store too
        if (data.botStats) {
          updateChatbot(botId, {
            chatsCount: data.botStats.chatsCount,
            messagesCount: data.botStats.messagesCount,
            fallbackRate: data.botStats.fallbackRate,
            creditsUsed: data.botStats.creditsUsed,
          });
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Đã có lỗi xảy ra từ máy chủ. Vui lòng thử lại." },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    if (bot) {
      setMessages([
        {
          role: "assistant",
          content: bot.widgetConfig.welcomeMessage || "Xin chào! Tôi có thể giúp gì cho bạn hôm nay?",
        },
      ]);
      setInput("");
    }
  };

  if (!isHydrated || !bot) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-var(--topbar-height)-3.5rem)] flex flex-col bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card shadow-sm overflow-hidden animate-fadeIn">
      {/* Playground Header */}
      <div className="p-4 border-b border-surface-border dark:border-dark-border bg-surface-page/50 dark:bg-dark-page/20 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm"
            style={{ backgroundColor: bot.widgetConfig.primaryColor }}
          >
            {bot.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary dark:text-textDark-primary">
              Môi trường thử nghiệm ({bot.name})
            </h2>
            <p className="text-[10px] text-text-muted dark:text-textDark-secondary font-medium">
              Bạn có thể trò chuyện để kiểm tra tri thức của bot
            </p>
          </div>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
          icon={<RotateCcw size={13} />}
          className="text-xs"
        >
          Làm mới
        </Button>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-neutral-900/10">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={cn(
              "flex gap-3 max-w-[80%] animate-fadeIn",
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm",
                msg.role === "user"
                  ? "bg-text-secondary dark:bg-textDark-secondary"
                  : ""
              )}
              style={msg.role === "assistant" ? { backgroundColor: bot.widgetConfig.primaryColor } : {}}
            >
              {msg.role === "user" ? <User size={12} /> : <Bot size={12} />}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                "p-3 rounded-card text-xs leading-relaxed shadow-sm",
                msg.role === "user"
                  ? "bg-brand text-white font-medium rounded-tr-none"
                  : "bg-white dark:bg-dark-input border border-surface-border dark:border-dark-border text-text-primary dark:text-textDark-primary rounded-tl-none"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        
        {/* Thinking loader */}
        {sending && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center animate-pulse">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm"
              style={{ backgroundColor: bot.widgetConfig.primaryColor }}
            >
              <Bot size={12} />
            </div>
            <div className="bg-white dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-card rounded-tl-none p-3 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted dark:bg-textDark-secondary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted dark:bg-textDark-secondary animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted dark:bg-textDark-secondary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-surface-border dark:border-dark-border bg-white dark:bg-dark-card flex gap-3 shrink-0"
      >
        <input
          type="text"
          placeholder={bot.widgetConfig.placeholderText || "Nhập tin nhắn của bạn..."}
          className="flex-1 px-4 py-2.5 rounded-btn text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!input.trim() || sending}
          icon={<Send size={13} />}
          className="px-5 font-semibold text-xs shadow-md shadow-brand/20 transition-all hover:scale-105"
        >
          Gửi
        </Button>
      </form>
    </div>
  );
}
