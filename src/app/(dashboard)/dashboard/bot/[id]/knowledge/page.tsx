"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useChatbotStore, KnowledgeFile, useStoreHydration } from "@/store/chatbotStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  FileText,
  Globe,
  Upload,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  HelpCircle,
  Database,
  RefreshCw,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BotKnowledgePage() {
  const params = useParams();
  const botId = params.id as string;
  const { chatbots, updateChatbot } = useChatbotStore();
  
  const isHydrated = useStoreHydration();
  const [activeTab, setActiveTab] = useState<"files" | "text" | "url">("files");

  // Input states
  const [inputText, setInputText] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlerLogs, setCrawlerLogs] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const bot = isHydrated ? chatbots.find((b) => b.id === botId) : null;

  // Sync state values on load
  useEffect(() => {
    if (bot) {
      setInputText(bot.knowledgeBase.text || "");
    }
  }, [bot]);

  if (!isHydrated || !bot) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  const syncBotToServer = async (updatedBot: any) => {
    setIsUpdating(true);
    try {
      await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBot),
      });
      
      // Simulate brief retraining
      updateChatbot(botId, { status: "training", trainingProgress: 0 });
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        updateChatbot(botId, { trainingProgress: progress });
        if (progress >= 100) {
          clearInterval(interval);
          updateChatbot(botId, { status: "active", trainingProgress: 100 });
          // Sync final active state
          fetch("/api/bots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...updatedBot, status: "active", trainingProgress: 100 }),
          });
        }
      }, 300);
    } catch (e) {
      console.error("Error syncing knowledge update:", e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTextSave = () => {
    if (!bot) return;
    const updated = {
      ...bot,
      knowledgeBase: {
        ...bot.knowledgeBase,
        text: inputText,
      },
    };
    updateChatbot(botId, { knowledgeBase: updated.knowledgeBase });
    syncBotToServer(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !bot) return;
    const uploaded = Array.from(e.target.files);

    const newFiles: KnowledgeFile[] = uploaded.map((file) => ({
      name: file.name,
      size: file.size,
      progress: 100,
      type: file.name.split(".").pop() || "txt",
    }));

    const mergedFiles = [...bot.knowledgeBase.files, ...newFiles];
    const updated = {
      ...bot,
      knowledgeBase: {
        ...bot.knowledgeBase,
        files: mergedFiles,
        text: bot.knowledgeBase.text + "\n" + newFiles.map(f => `Nội dung tài liệu ${f.name}`).join("\n"),
      },
    };

    updateChatbot(botId, { knowledgeBase: updated.knowledgeBase });
    syncBotToServer(updated);
  };

  const handleDeleteResource = (name: string) => {
    if (!bot) return;
    const filteredFiles = bot.knowledgeBase.files.filter((f) => f.name !== name);
    const updated = {
      ...bot,
      knowledgeBase: {
        ...bot.knowledgeBase,
        files: filteredFiles,
      },
    };
    updateChatbot(botId, { knowledgeBase: updated.knowledgeBase });
    syncBotToServer(updated);
  };

  const handleUrlCrawl = () => {
    if (!inputUrl.trim() || !bot) return;
    setIsCrawling(true);
    setCrawlerLogs([]);

    const logs = [
      `Connecting to ${inputUrl}...`,
      `Reading sitemaps...`,
      `Crawl completed successfully! Extracted 4,120 characters from main page.`,
    ];

    let logIdx = 0;
    const interval = setInterval(() => {
      if (logIdx < logs.length) {
        setCrawlerLogs((prev) => [...prev, logs[logIdx]]);
        logIdx++;
      } else {
        clearInterval(interval);
        setIsCrawling(false);
        
        const urlDomain = inputUrl.replace(/https?:\/\/(www\.)?/, "");
        const newFile: KnowledgeFile = {
          name: `Website: ${urlDomain}`,
          size: 4120,
          progress: 100,
          type: "url",
        };

        const mergedFiles = [...bot.knowledgeBase.files, newFile];
        const textAppend = `\nThông tin thu thập từ trang ${inputUrl}: Nền tảng chatbot thông minh hỗ trợ CSS Shadow DOM.`;
        
        const updated = {
          ...bot,
          knowledgeBase: {
            ...bot.knowledgeBase,
            files: mergedFiles,
            text: bot.knowledgeBase.text + textAppend,
          },
        };
        
        setInputUrl("");
        updateChatbot(botId, { knowledgeBase: updated.knowledgeBase });
        syncBotToServer(updated);
      }
    }, 600);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto animate-fadeIn">
      
      {/* Left Columns: Resource directory */}
      <div className="lg:col-span-2 space-y-5 flex flex-col h-[calc(100vh-var(--topbar-height)-3.5rem)]">
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm flex flex-col flex-1 overflow-hidden">
          <div className="flex justify-between items-center border-b border-surface-border dark:border-dark-border pb-4 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-brand" />
              <h2 className="text-sm font-bold text-text-primary dark:text-textDark-primary">
                Cơ sở tri thức hiện tại
              </h2>
            </div>
            {bot.status === "training" ? (
              <Badge variant="warning" dot className="animate-pulse">
                Đang học ({bot.trainingProgress}%)
              </Badge>
            ) : (
              <Badge variant="success" dot>
                Đã đồng bộ
              </Badge>
            )}
          </div>

          {/* List scroll container */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {bot.knowledgeBase.files.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20 text-text-muted dark:text-textDark-secondary">
                <BookOpen size={36} className="stroke-[1.2] mb-3 text-brand/30" />
                <p className="text-xs font-semibold">Chưa có tri thức nào được cung cấp</p>
                <p className="text-[10px] mt-1">Sử dụng thanh công cụ bên phải để thêm tài liệu hoặc website.</p>
              </div>
            ) : (
              bot.knowledgeBase.files.map((file) => (
                <div
                  key={file.name}
                  className="group flex items-center justify-between p-3 bg-surface-page dark:bg-dark-page border border-surface-border dark:border-dark-border rounded-btn hover:border-brand/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-surface-input dark:bg-dark-input flex items-center justify-center text-text-secondary dark:text-textDark-primary shrink-0 border border-surface-border/50 dark:border-dark-border/50">
                      {file.type === "url" ? <Globe size={14} className="text-blue-500" /> : <FileText size={14} className="text-brand" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-text-primary dark:text-textDark-primary truncate">
                        {file.name}
                      </p>
                      <p className="text-[9px] text-text-muted dark:text-textDark-secondary font-mono mt-0.5">
                        {file.type === "url" ? "CRAWLED WEBSITE" : `${(file.size / 1024).toFixed(1)} KB — DOCUMENT`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteResource(file.name)}
                    className="p-1.5 rounded-btn text-text-muted hover:text-danger hover:bg-danger-bg transition-colors"
                    title="Xóa tri thức"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Add resources */}
      <div className="space-y-5">
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-text-primary dark:text-textDark-primary uppercase tracking-widest border-b border-surface-border dark:border-dark-border pb-2.5">
            Thêm tri thức mới
          </h3>

          {/* Action Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-surface-input dark:bg-dark-input p-1 rounded-btn text-xs font-semibold text-text-muted">
            <button
              onClick={() => setActiveTab("files")}
              className={cn(
                "py-1.5 rounded-btn text-center transition-colors",
                activeTab === "files"
                  ? "bg-white dark:bg-dark-card text-brand shadow-sm"
                  : "hover:text-text-primary dark:hover:text-textDark-primary"
              )}
            >
              Files
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={cn(
                "py-1.5 rounded-btn text-center transition-colors",
                activeTab === "text"
                  ? "bg-white dark:bg-dark-card text-brand shadow-sm"
                  : "hover:text-text-primary dark:hover:text-textDark-primary"
              )}
            >
              Text
            </button>
            <button
              onClick={() => setActiveTab("url")}
              className={cn(
                "py-1.5 rounded-btn text-center transition-colors",
                activeTab === "url"
                  ? "bg-white dark:bg-dark-card text-brand shadow-sm"
                  : "hover:text-text-primary dark:hover:text-textDark-primary"
              )}
            >
              Website
            </button>
          </div>

          {/* Tab 1: Files */}
          {activeTab === "files" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-2 border-dashed border-surface-border dark:border-dark-border hover:border-brand/40 rounded-card p-6 flex flex-col items-center justify-center cursor-pointer transition-colors relative">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.docx,.csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isUpdating}
                />
                <Upload size={24} className="text-text-muted dark:text-textDark-secondary mb-2 animate-pulse" />
                <span className="text-xs font-bold text-text-primary dark:text-textDark-primary">
                  Chọn file để tải lên
                </span>
                <span className="text-[9px] text-text-muted dark:text-textDark-secondary mt-1">
                  PDF, TXT, DOCX, CSV
                </span>
              </div>
              <div className="flex gap-2 p-3 bg-brand-soft dark:bg-brand-softDark border border-brand/10 rounded-btn text-[10px] text-brand leading-relaxed">
                <Sparkles size={14} className="shrink-0 mt-0.5" />
                <p>Mô hình AI sẽ tự động học lại ngay khi file tải lên hoàn tất thành công.</p>
              </div>
            </div>
          )}

          {/* Tab 2: Text */}
          {activeTab === "text" && (
            <div className="space-y-4 animate-fadeIn">
              <textarea
                placeholder="Gõ hoặc dán nội dung văn bản mới cần bổ sung..."
                rows={8}
                className="w-full px-3 py-2.5 rounded-btn text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition resize-none font-sans"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <Button
                variant="primary"
                onClick={handleTextSave}
                loading={isUpdating}
                disabled={inputText === bot.knowledgeBase.text || isUpdating}
                className="w-full text-xs font-semibold"
              >
                Lưu và Đồng bộ
              </Button>
            </div>
          )}

          {/* Tab 3: URL Crawler */}
          {activeTab === "url" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col gap-1.5">
                <Input
                  placeholder="https://example.com/faq"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  prefix={<Globe size={13} />}
                  className="text-xs"
                />
              </div>
              <Button
                variant="primary"
                onClick={handleUrlCrawl}
                loading={isCrawling}
                disabled={!inputUrl.trim() || isCrawling}
                className="w-full text-xs font-semibold"
              >
                Crawl Website
              </Button>

              {crawlerLogs.length > 0 && (
                <div className="p-3 bg-neutral-900 rounded-btn font-mono text-[9px] text-zinc-400 space-y-1 border border-zinc-800">
                  {crawlerLogs.map((log, i) => (
                    <p key={i} className={cn(i === crawlerLogs.length - 1 && "text-brand font-semibold")}>
                      {log}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
