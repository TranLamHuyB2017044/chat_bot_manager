"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useChatbotStore } from "@/store/chatbotStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Copy, Check, Code, Sparkles, BookOpen, Laptop, Globe, Server, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Platform = "html" | "wordpress" | "nextjs" | "shopify" | "php";

export default function BotEmbedPage() {
  const params = useParams();
  const botId = params.id as string;
  const { chatbots } = useChatbotStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<Platform>("html");

  // Sync hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const bot = isHydrated ? chatbots.find((b) => b.id === botId) : null;

  // Mount the real widget script dynamically on the client!
  useEffect(() => {
    if (botId && isHydrated) {
      // Wait slightly to ensure page hydration is fully completed
      const timer = setTimeout(() => {
        const script = document.createElement("script");
        script.src = `/widget.js?botId=${botId}`;
        script.id = `vielora-widget-loader-${botId}`;
        script.defer = true;
        document.body.appendChild(script);
      }, 500);

      return () => {
        clearTimeout(timer);
        // Cleanup widget script
        const scriptEl = document.getElementById(`vielora-widget-loader-${botId}`);
        if (scriptEl) scriptEl.remove();
        
        // Remove widget DOM container (inside shadow DOM)
        const widgetContainer = document.getElementById("vielora-chat-widget-container");
        if (widgetContainer) widgetContainer.remove();
      };
    }
  }, [botId, isHydrated]);

  if (!isHydrated || !bot) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  // Get local dev CDN URL or fallback
  const cdnUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}/widget.js?botId=${botId}`
    : `https://cdn.vielora.com/widget.js?botId=${botId}`;

  // Script snippets
  const embedCodeSingle = `<script src="${cdnUrl}" defer></script>`;
  const embedCodeDouble = `<script>
  window.VieloraWidgetConfig = {
    botId: "${botId}"
  };
</script>
<script src="${typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}/widget.js` : "https://cdn.vielora.com/widget.js"}" defer></script>`;

  const activeEmbedCode = activeTab === "nextjs" ? `import Script from 'next/script';

export default function ChatWidget() {
  return (
    <>
      <Script
        src="${cdnUrl}"
        strategy="lazyOnload"
      />
    </>
  );
}` : embedCodeSingle;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeTab === "nextjs" ? activeEmbedCode : embedCodeSingle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Platform instructions
  const platformGuides: Record<Platform, { title: string; steps: string[] }> = {
    html: {
      title: "Nhúng vào Website HTML tĩnh",
      steps: [
        "Sao chép đoạn mã script CDN ở trên.",
        "Mở file HTML của website bạn (thường là index.html).",
        "Dán đoạn mã trước thẻ đóng </body>.",
        "Lưu file và tải lại trang web để kiểm tra."
      ],
    },
    wordpress: {
      title: "Nhúng vào website WordPress",
      steps: [
        "Cài đặt plugin Insert Headers and Footers (WPCode) trên WordPress admin.",
        "Đi đến Settings -> WPCode (Headers & Footers).",
        "Dán đoạn script CDN vào vùng Footer Script.",
        "Nhấn Save Changes và tải lại trang web của bạn."
      ],
    },
    nextjs: {
      title: "Tích hợp trong Next.js (App Router)",
      steps: [
        "Tạo một component mới (ví dụ: ChatWidget.tsx).",
        "Sao chép code React/Next.js ở trên và dán vào component.",
        "Import component này vào file Root Layout (layout.tsx) để hiển thị trên toàn trang.",
        "Khởi động lại dev server Next.js."
      ],
    },
    shopify: {
      title: "Nhúng vào cửa hàng Shopify",
      steps: [
        "Truy cập trang Shopify Admin -> Online Store -> Themes.",
        "Nhấp vào Actions (...) bên cạnh theme hiện tại và chọn Edit Code.",
        "Mở file theme.liquid.",
        "Dán đoạn script CDN ở trên ngay trước thẻ đóng </body> và nhấn Save."
      ],
    },
    php: {
      title: "Nhúng vào mã nguồn PHP / CMS khác",
      steps: [
        "Mở file header template chung hoặc file footer.php.",
        "Dán đoạn script CDN nhúng vào cuối file trước thẻ đóng </body>.",
        "Đẩy code lên host và kiểm tra hoạt động."
      ],
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto animate-fadeIn">
      
      {/* Left Column: Embed code & Setup Instructions */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Code box card */}
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-border dark:border-dark-border pb-3">
            <Code size={16} className="text-brand" />
            <h2 className="text-sm font-bold text-text-primary dark:text-textDark-primary">
              Mã nhúng Widget
            </h2>
          </div>

          <p className="text-xs text-text-muted dark:text-textDark-secondary leading-relaxed">
            Sao chép mã dưới đây và dán vào website của bạn để nhúng khung chat tự động. Chatbot được tối ưu hóa tải không đồng bộ để không ảnh hưởng đến tốc độ load trang.
          </p>

          {/* Copyable code textarea */}
          <div className="relative">
            <pre className="bg-neutral-900 border border-zinc-800 rounded-btn p-4 font-mono text-[10px] text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-normal">
              {activeTab === "nextjs" ? activeEmbedCode : embedCodeSingle}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 p-2 bg-neutral-800 hover:bg-neutral-700 text-zinc-300 hover:text-white rounded-btn transition-colors flex items-center gap-1.5 text-[10px] font-bold"
            >
              {copied ? (
                <>
                  <Check size={11} className="text-success" />
                  <span className="text-success">Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy size={11} />
                  <span>Copy mã</span>
                </>
              )}
            </button>
          </div>
          
          <div className="flex gap-2 p-3 bg-brand-soft dark:bg-brand-softDark border border-brand/10 rounded-btn text-[10px] text-brand leading-relaxed">
            <Sparkles size={14} className="shrink-0 mt-0.5" />
            <p>
              <strong>Bật mí:</strong> Một widget chat màu xanh lá cây nhỏ đã xuất hiện ở góc dưới bên phải màn hình này! Bạn có thể click trực tiếp vào đó để trải nghiệm thử.
            </p>
          </div>
        </div>

        {/* Integration guides tab container */}
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-border dark:border-dark-border pb-3">
            <BookOpen size={16} className="text-brand" />
            <h2 className="text-sm font-bold text-text-primary dark:text-textDark-primary">
              Hướng dẫn tích hợp chi tiết
            </h2>
          </div>

          {/* Tabs header */}
          <div className="flex flex-wrap gap-1 bg-surface-input dark:bg-dark-input p-1 rounded-btn text-xs font-semibold text-text-muted">
            {[
              { id: "html", label: "HTML", icon: Globe },
              { id: "wordpress", label: "WordPress", icon: Laptop },
              { id: "nextjs", label: "Next.js", icon: Code },
              { id: "shopify", label: "Shopify", icon: Server },
              { id: "php", label: "PHP", icon: Server },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveTab(p.id as Platform)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-btn transition-colors",
                    activeTab === p.id
                      ? "bg-white dark:bg-dark-card text-brand shadow-sm"
                      : "hover:text-text-primary dark:hover:text-textDark-primary"
                  )}
                >
                  <Icon size={12} />
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="space-y-4 pt-1 animate-fadeIn">
            <h3 className="text-xs font-bold text-text-primary dark:text-textDark-primary">
              {platformGuides[activeTab].title}
            </h3>
            <ol className="list-decimal pl-4 space-y-2 text-xs text-text-secondary dark:text-textDark-primary">
              {platformGuides[activeTab].steps.map((stepText, idx) => (
                <li key={idx} className="pl-1.5 leading-relaxed">
                  {stepText}
                </li>
              ))}
            </ol>
          </div>
        </div>

      </div>

      {/* Right Column: Integration diagnostics */}
      <div className="space-y-6">
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-text-primary dark:text-textDark-primary uppercase tracking-widest border-b border-surface-border dark:border-dark-border pb-2.5">
            Trạng thái kết nối
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary dark:text-textDark-secondary">CDN Endpoint:</span>
              <span className="text-[10px] bg-success-bg dark:bg-success/10 text-success-text dark:text-success border border-success/15 px-2 py-0.5 rounded font-bold font-mono">
                ONLINE
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary dark:text-textDark-secondary">Quyền truy cập API:</span>
              <span className="text-[10px] bg-success-bg dark:bg-success/10 text-success-text dark:text-success border border-success/15 px-2 py-0.5 rounded font-bold font-mono">
                PUBLIC (CORS OK)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary dark:text-textDark-secondary">Cấu hình Widget:</span>
              <span className="text-[10px] bg-success-bg dark:bg-success/10 text-success-text dark:text-success border border-success/15 px-2 py-0.5 rounded font-bold font-mono">
                ĐỒNG BỘ XONG
              </span>
            </div>
          </div>
          
          <div className="border-t border-surface-border dark:border-dark-border pt-4 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs text-success font-bold bg-success-bg dark:bg-success/10 px-3 py-1.5 rounded-btn border border-success/20">
              <CheckCircle2 size={13} />
              Sẵn sàng tích hợp
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function Loader2({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
