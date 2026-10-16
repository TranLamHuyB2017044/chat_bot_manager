import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useChatbotStore, useStoreHydration, CHATBOT_DOMAINS } from "@/store/chatbotStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  Send,
  Bot,
  User,
  RotateCcw,
  Loader2,
  Search,
  SlidersHorizontal,
  Sparkles,
  Layers,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Cpu,
  BookOpen,
  Bookmark,
  MessageSquare,
  Zap,
  Info,
  Code
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch, testRagPlayground } from "@/lib/api";
import { toast } from "@/components/ui/Sonner";
import { Category } from "@/types/category";
import { PlaygroundResponse, PlaygroundChunk } from "@/types/playground";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function BotPlaygroundPage() {
  const { id: botId } = useParams<{ id: string }>();
  const { chatbots, updateChatbot } = useChatbotStore();
  const isHydrated = useStoreHydration();

  // Mode switcher: "inspector" (RAG Inspector) vs "chat" (Chat preview)
  const [activeMode, setActiveMode] = useState<"inspector" | "chat">("inspector");

  const bot = chatbots.find((b) => b.id === botId);

  // ─────────────────────────────────────────────────────────────
  // 1. RAG PLAYGROUND SEARCH INSPECTOR STATES
  // ─────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDomain, setSelectedDomain] = useState<string>("general");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState<number>(5);
  const [minScore, setMinScore] = useState<number>(0.35);
  const [generateAnswer, setGenerateAnswer] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);

  // Search Results & UI states
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<PlaygroundResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<"chunks" | "context" | "json">("chunks");

  // Clipboard copy tracker
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // 2. END-USER CHAT PREVIEW STATES
  // ─────────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Sync workspace_id and domain when bot is loaded
  useEffect(() => {
    if (bot) {
      const wsId = bot.workspaceId || bot.id;
      setSelectedWorkspaceId(wsId);
      if (bot.domain) {
        setSelectedDomain(bot.domain);
      }
      fetchCategories(wsId);

      // Initialize chat messages
      setChatMessages([
        {
          role: "assistant",
          content: bot.widgetConfig.welcomeMessage || "Xin chào! Tôi có thể giúp gì cho bạn hôm nay?",
        },
      ]);
    }
  }, [bot]);

  // Fetch categories for workspace
  const fetchCategories = async (wsId: string) => {
    if (!wsId) return;
    try {
      const res = await apiFetch(`/api/chatbot/workspaces/${wsId}/categories`);
      const data = await res.json();
      if (res.ok || data?.statusCode === 200) {
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setCategories(list);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Scroll to bottom on new chat messages
  useEffect(() => {
    if (activeMode === "chat") {
      chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatSending, activeMode]);

  // Copy helper
  const handleCopy = (text: string, key: string, label: string = "Đã sao chép!") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(label);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLE RAG PLAYGROUND SEARCH
  // ─────────────────────────────────────────────────────────────
  const handleSearchInspector = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setSearchError(null);

    const payload = {
      workspace_id: selectedWorkspaceId || bot?.workspaceId || bot?.id || "",
      query: query.trim(),
      category: selectedCategory || undefined,
      limit,
      min_score: minScore,
      domain: selectedDomain,
      generate_answer: generateAnswer,
    };

    try {
      const data = await testRagPlayground(payload);
      setSearchResult(data);
      toast.success("Truy xuất RAG hoàn tất!");
    } catch (err: any) {
      console.error("Playground search error:", err);
      const msg = err?.message || "Không thể thực hiện truy xuất RAG search.";
      setSearchError(msg);
      toast.error(msg);
    } finally {
      setIsSearching(false);
    }
  };

  // Sample queries generator for quick testing
  const sampleQueries = [
    "Thẩm quyền xử phạt hành vi chở hàng vượt khổ giới hạn là ai?",
    "Mức xử phạt khi vi phạm quy định về tốc độ là bao nhiêu?",
    "Thời gian hiệu lực và phạm vi áp dụng của văn bản này?",
  ];

  // ─────────────────────────────────────────────────────────────
  // HANDLE LIVE CHAT PREVIEW
  // ─────────────────────────────────────────────────────────────
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatSending || !bot) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    const newMessages = [...chatMessages, { role: "user" as const, content: userMessage }];
    setChatMessages(newMessages);
    setChatSending(true);

    try {
      const response = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ botId, messages: newMessages }),
      });

      const data = await response.json();

      if (data && !data.error) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        if (data.botStats) {
          updateChatbot(botId!, {
            chatsCount: data.botStats.chatsCount,
            messagesCount: data.botStats.messagesCount,
            fallbackRate: data.botStats.fallbackRate,
            creditsUsed: data.botStats.creditsUsed,
          });
        }
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Đã có lỗi xảy ra từ máy chủ. Vui lòng thử lại." },
        ]);
      }
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng." },
      ]);
    } finally {
      setChatSending(false);
    }
  };

  const handleResetChat = () => {
    if (bot) {
      setChatMessages([
        {
          role: "assistant",
          content: bot.widgetConfig.welcomeMessage || "Xin chào! Tôi có thể giúp gì cho bạn hôm nay?",
        },
      ]);
      setChatInput("");
    }
  };

  // Reason badge mapping
  const renderReasonBadge = (reason: string, reasonVi?: string) => {
    switch (reason) {
      case "ANSWER_FOUND":
        return (
          <Badge variant="success" className="text-xs py-1 px-2.5">
            <CheckCircle2 size={13} className="mr-1" />
            {reasonVi || "✅ Tìm thấy câu trả lời"}
          </Badge>
        );
      case "NOT_FOUND_IN_DOCUMENT_CONTENT":
        return (
          <Badge variant="warning" className="text-xs py-1 px-2.5">
            <AlertTriangle size={13} className="mr-1" />
            {reasonVi || "⚠️ Đoạn văn bản không chứa đáp án"}
          </Badge>
        );
      case "LOW_SIMILARITY_SCORE":
        return (
          <Badge variant="danger" className="text-xs py-1 px-2.5">
            <XCircle size={13} className="mr-1" />
            {reasonVi || "❌ Điểm tương đồng quá thấp"}
          </Badge>
        );
      case "NO_CHUNKS_FOUND":
        return (
          <Badge variant="default" className="text-xs py-1 px-2.5">
            <XCircle size={13} className="mr-1" />
            {reasonVi || "❌ Không tìm thấy chunks nào"}
          </Badge>
        );
      default:
        return (
          <Badge variant="info" className="text-xs py-1 px-2.5">
            <Info size={13} className="mr-1" />
            {reasonVi || reason}
          </Badge>
        );
    }
  };

  // Score badge & color
  const getScoreBadge = (score: number, minScoreThreshold: number) => {
    const isBelowThreshold = score < minScoreThreshold;
    if (score >= 0.7) {
      return {
        bg: "bg-success/15 border-success/30 text-success",
        barBg: "bg-success",
        label: "Rất liên quan",
      };
    }
    if (score >= 0.4) {
      return {
        bg: "bg-warning/15 border-warning/30 text-warning-text dark:text-warning",
        barBg: "bg-warning",
        label: isBelowThreshold ? "Dưới ngưỡng" : "Khá liên quan",
      };
    }
    return {
      bg: "bg-danger/15 border-danger/30 text-danger",
      barBg: "bg-danger",
      label: "Điểm thấp / Nhiễu",
    };
  };

  if (!bot) {
    if (!isHydrated || chatbots.length === 0) {
      return (
        <div className="flex h-[70vh] items-center justify-center">
          <Loader2 className="animate-spin text-brand" size={32} />
        </div>
      );
    }
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-16">
      {/* ── Page Header & Mode Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border dark:border-dark-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-text-primary dark:text-textDark-primary flex items-center gap-2">
              <Sparkles size={20} className="text-brand" />
              RAG Playground & Search Inspector
            </h1>
            <Badge variant="info" className="text-[10px] font-mono">
              API POST /api/rag/playground/search
            </Badge>
          </div>
          <p className="text-xs text-text-muted dark:text-textDark-secondary">
            Phòng thí nghiệm kiểm tra vector search Qdrant, điểm tương đồng (Similarity Score), và ngữ cảnh (Context) gửi LLM.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center bg-surface-input dark:bg-dark-input p-1 rounded-card border border-surface-border dark:border-dark-border shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveMode("inspector")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-semibold transition-all",
              activeMode === "inspector"
                ? "bg-brand text-white shadow-sm"
                : "text-text-muted dark:text-textDark-secondary hover:text-text-primary dark:hover:text-textDark-primary"
            )}
          >
            <Search size={14} />
            <span>RAG Inspector</span>
          </button>

          <button
            onClick={() => setActiveMode("chat")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-semibold transition-all",
              activeMode === "chat"
                ? "bg-brand text-white shadow-sm"
                : "text-text-muted dark:text-textDark-secondary hover:text-text-primary dark:hover:text-textDark-primary"
            )}
          >
            <MessageSquare size={14} />
            <span>Chatbot Preview</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODE 1: RAG PLAYGROUND SEARCH INSPECTOR (SPLIT-VIEW)          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeMode === "inspector" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── CỘT TRÁI (LEFT PANEL: INPUTS & CONFIG) ── */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border dark:border-dark-border pb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary dark:text-textDark-primary flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-brand" />
                  Cấu hình & Nhập câu hỏi
                </h2>
                <span className="text-[10px] text-text-muted dark:text-textDark-secondary font-mono">
                  {bot.name}
                </span>
              </div>

              <form onSubmit={handleSearchInspector} className="space-y-4">
                {/* 1. Workspace selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary dark:text-textDark-primary flex items-center justify-between">
                    <span>1. Workspace / Chatbot:</span>
                    <span className="text-[10px] font-mono text-text-muted truncate max-w-[150px]">
                      ID: {selectedWorkspaceId}
                    </span>
                  </label>
                  <select
                    value={selectedWorkspaceId}
                    onChange={(e) => {
                      setSelectedWorkspaceId(e.target.value);
                      fetchCategories(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-btn text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand"
                  >
                    {chatbots.map((cb) => (
                      <option key={cb.id} value={cb.workspaceId || cb.id}>
                        {cb.name} ({cb.workspaceId || cb.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Category selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary dark:text-textDark-primary flex items-center justify-between">
                    <span>2. Danh mục tài liệu:</span>
                    <span className="text-[10px] text-text-muted">
                      ({categories.length} chuyên mục)
                    </span>
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-btn text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand"
                  >
                    <option value="">-- Tất cả danh mục (ALL) --</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name} ({c.slug})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Domain selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary dark:text-textDark-primary">
                    3. Lĩnh vực (Domain):
                  </label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-btn text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand"
                  >
                    {CHATBOT_DOMAINS.map((dom) => (
                      <option key={dom.value} value={dom.value}>
                        {dom.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Question input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-primary dark:text-textDark-primary">
                      4. Câu hỏi thử nghiệm:
                    </label>
                    <button
                      type="button"
                      onClick={() => setQuery(sampleQueries[Math.floor(Math.random() * sampleQueries.length)])}
                      className="text-[10px] text-brand hover:underline font-medium"
                    >
                      Dùng câu mẫu
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Nhập câu hỏi bạn muốn kiểm tra hệ thống RAG kéo dữ liệu..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-btn text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand resize-y leading-relaxed"
                  />
                </div>

                {/* 5. Advanced RAG Options (Collapsible) */}
                <div className="border border-surface-border/60 dark:border-dark-border/60 rounded-btn overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full px-3 py-2 bg-surface-page/50 dark:bg-dark-page/40 flex items-center justify-between text-xs font-semibold text-text-primary dark:text-textDark-primary hover:bg-surface-input/50 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal size={13} className="text-brand" />
                      Tùy chọn nâng cao (Limit, Min Score, LLM)
                    </span>
                    {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showAdvanced && (
                    <div className="p-3.5 space-y-3.5 bg-surface-card dark:bg-dark-card border-t border-surface-border/60 dark:border-dark-border/60">
                      {/* Slider Limit */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-text-muted dark:text-textDark-secondary">
                            Số chunk lấy tối đa (Limit):
                          </span>
                          <span className="font-mono font-bold text-brand">{limit}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="15"
                          step="1"
                          value={limit}
                          onChange={(e) => setLimit(Number(e.target.value))}
                          className="w-full accent-brand cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-text-muted">
                          <span>1 chunk</span>
                          <span>7 (chuẩn)</span>
                          <span>15 chunks</span>
                        </div>
                      </div>

                      {/* Slider Min Score */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-text-muted dark:text-textDark-secondary">
                            Ngưỡng điểm tương đồng (Min Score):
                          </span>
                          <span className="font-mono font-bold text-brand">{minScore.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="0.8"
                          step="0.05"
                          value={minScore}
                          onChange={(e) => setMinScore(Number(e.target.value))}
                          className="w-full accent-brand cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-text-muted">
                          <span>0.1 (lấy hết)</span>
                          <span>0.35 (khuyên dùng)</span>
                          <span>0.8 (chặt chẽ)</span>
                        </div>
                      </div>

                      {/* Toggle Generate Answer */}
                      <div className="pt-1 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-text-primary dark:text-textDark-primary">
                            Bật gọi LLM sinh đáp án
                          </p>
                          <p className="text-[10px] text-text-muted dark:text-textDark-secondary">
                            Tắt để chỉ test vector search trong ~20ms, không tốn token LLM
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={generateAnswer}
                            onChange={(e) => setGenerateAnswer(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Search Button */}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5 shadow-md shadow-brand/20 font-bold text-xs"
                  disabled={!query.trim() || isSearching}
                  loading={isSearching}
                  icon={<Zap size={14} />}
                >
                  {isSearching ? "Đang truy xuất & phân tích..." : "🚀 THỬ NGHIỆM TÌM KIẾM"}
                </Button>
              </form>
            </div>

            {/* ── KẾT QUẢ TỔNG QUAN (SUMMARY CARD) ── */}
            {searchResult && (
              <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-surface-border dark:border-dark-border pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary dark:text-textDark-primary flex items-center gap-2">
                    <Info size={14} className="text-brand" />
                    Kết quả tổng quan
                  </h3>
                  <span className="text-[10px] font-mono text-text-muted">
                    Total: {searchResult.stats?.total_time_ms || 0}ms
                  </span>
                </div>

                {/* Status & Reason */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted dark:text-textDark-secondary">
                      Trạng thái phản hồi:
                    </span>
                    {renderReasonBadge(searchResult.reason, searchResult.reason_vi)}
                  </div>
                  {searchResult.reason_vi && (
                    <div className="p-2.5 bg-surface-page dark:bg-dark-page rounded-btn border border-surface-border/40 dark:border-dark-border/40 text-xs text-text-secondary dark:text-textDark-primary">
                      <span className="font-semibold text-text-muted mr-1">Lý do:</span>
                      {searchResult.reason_vi}
                    </div>
                  )}
                </div>

                {/* Score Summary Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-surface-page dark:bg-dark-page p-2.5 rounded-btn border border-surface-border/40 dark:border-dark-border/40">
                    <span className="text-[10px] text-text-muted block">Điểm cao nhất:</span>
                    <span className="font-mono font-bold text-brand text-sm">
                      {searchResult.stats?.highest_score !== undefined
                        ? searchResult.stats.highest_score.toFixed(4)
                        : "0.0000"}
                    </span>
                  </div>
                  <div className="bg-surface-page dark:bg-dark-page p-2.5 rounded-btn border border-surface-border/40 dark:border-dark-border/40">
                    <span className="text-[10px] text-text-muted block">Số Chunks tìm thấy:</span>
                    <span className="font-mono font-bold text-text-primary dark:text-textDark-primary text-sm">
                      {searchResult.stats?.total_chunks_found ?? searchResult.retrieved_chunks?.length ?? 0}
                    </span>
                  </div>
                </div>

                {/* Latency Breakdown Bar */}
                <div className="space-y-1.5 pt-1 border-t border-surface-border/60 dark:border-dark-border/60">
                  <span className="text-[11px] font-semibold text-text-primary dark:text-textDark-primary flex items-center gap-1">
                    <Clock size={12} className="text-brand" />
                    Đo lường thời gian xử lý:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                    <div className="p-1.5 rounded bg-surface-page dark:bg-dark-page border border-surface-border/40">
                      <span className="text-text-muted block">Embedding</span>
                      <strong className="text-brand">{searchResult.stats?.embed_time_ms || 0}ms</strong>
                    </div>
                    <div className="p-1.5 rounded bg-surface-page dark:bg-dark-page border border-surface-border/40">
                      <span className="text-text-muted block">Qdrant Search</span>
                      <strong className="text-blue-500">{searchResult.stats?.search_time_ms || 0}ms</strong>
                    </div>
                    <div className="p-1.5 rounded bg-surface-page dark:bg-dark-page border border-surface-border/40">
                      <span className="text-text-muted block">LLM Answer</span>
                      <strong className="text-purple-500">
                        {searchResult.stats?.llm_time_ms !== undefined ? `${searchResult.stats.llm_time_ms}ms` : "Tắt"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── CỘT PHẢI (RIGHT PANEL: CHUNKS & CONTEXT INSPECTOR) ── */}
          <div className="lg:col-span-7 space-y-4">
            {/* LLM Answer Banner (if generated) */}
            {searchResult && (
              <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between border-b border-surface-border dark:border-dark-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <Bot size={16} className="text-brand" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary dark:text-textDark-primary">
                      Câu trả lời của LLM
                    </h3>
                  </div>
                  {searchResult.llm_answer && (
                    <button
                      onClick={() => handleCopy(searchResult.llm_answer || "", "llm_answer", "Đã sao chép câu trả lời!")}
                      className="text-xs text-text-muted hover:text-brand flex items-center gap-1 font-medium"
                    >
                      {copiedKey === "llm_answer" ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                      Sao chép
                    </button>
                  )}
                </div>

                {searchResult.llm_answer ? (
                  <div className="p-3.5 bg-brand-soft/30 dark:bg-brand-softDark/30 border border-brand/20 rounded-btn text-xs text-text-primary dark:text-textDark-primary leading-relaxed whitespace-pre-wrap">
                    {searchResult.llm_answer}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted dark:text-textDark-secondary italic py-2">
                    {generateAnswer
                      ? "LLM không sinh câu trả lời do không tìm thấy thông tin phù hợp trong các đoạn trích."
                      : "Chế độ tìm kiếm nhanh (Fast Search) - LLM không được gọi để tiết kiệm chi phí & thời gian."}
                  </p>
                )}
              </div>
            )}

            {/* Error state */}
            {searchError && (
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-card flex items-start gap-3">
                <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-danger">Lỗi khi gọi API RAG Playground</h4>
                  <p className="text-xs text-danger/90">{searchError}</p>
                </div>
              </div>
            )}

            {/* Right Tabs Navigation */}
            <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border dark:border-dark-border pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveResultTab("chunks")}
                    className={cn(
                      "px-3 py-1.5 rounded-btn text-xs font-semibold flex items-center gap-1.5 transition-all",
                      activeResultTab === "chunks"
                        ? "bg-brand/10 text-brand border border-brand/20"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    <Layers size={13} />
                    <span>Top Chunks ({searchResult?.retrieved_chunks?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveResultTab("context")}
                    className={cn(
                      "px-3 py-1.5 rounded-btn text-xs font-semibold flex items-center gap-1.5 transition-all",
                      activeResultTab === "context"
                        ? "bg-brand/10 text-brand border border-brand/20"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    <FileText size={13} />
                    <span>Context gửi LLM</span>
                  </button>

                  <button
                    onClick={() => setActiveResultTab("json")}
                    className={cn(
                      "px-3 py-1.5 rounded-btn text-xs font-semibold flex items-center gap-1.5 transition-all",
                      activeResultTab === "json"
                        ? "bg-brand/10 text-brand border border-brand/20"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    <Code size={13} />
                    <span>Raw JSON</span>
                  </button>
                </div>

                {searchResult && (
                  <span className="text-[10px] text-text-muted font-mono">
                    Ngưỡng min_score: {searchResult.stats?.min_score_threshold ?? minScore}
                  </span>
                )}
              </div>

              {/* TAB 1: RETRIEVED CHUNKS LIST */}
              {activeResultTab === "chunks" && (
                <div className="space-y-3.5">
                  {!searchResult && !isSearching && (
                    <div className="py-16 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-surface-input dark:bg-dark-input flex items-center justify-center mx-auto text-text-muted">
                        <Layers size={22} />
                      </div>
                      <h4 className="text-xs font-bold text-text-primary dark:text-textDark-primary">
                        Chưa có dữ liệu tìm kiếm
                      </h4>
                      <p className="text-xs text-text-muted dark:text-textDark-secondary max-w-sm mx-auto">
                        Nhập câu hỏi ở cột bên trái và bấm <strong>"🚀 THỬ NGHIỆM TÌM KIẾM"</strong> để xem các chunk được Qdrant kéo về cùng điểm số Similarity Score.
                      </p>
                    </div>
                  )}

                  {isSearching && (
                    <div className="py-16 flex flex-col items-center justify-center gap-3">
                      <Loader2 size={30} className="animate-spin text-brand" />
                      <p className="text-xs text-text-muted dark:text-textDark-secondary">
                        Đang embedding câu hỏi và tìm kiếm trong vector database...
                      </p>
                    </div>
                  )}

                  {searchResult && searchResult.retrieved_chunks?.length === 0 && (
                    <div className="p-8 text-center bg-surface-page dark:bg-dark-page rounded-btn border border-surface-border/50 text-xs text-text-muted">
                      Không có chunk nào vượt qua ngưỡng điểm tương đồng ({minScore}).
                    </div>
                  )}

                  {searchResult &&
                    searchResult.retrieved_chunks?.map((chunk: PlaygroundChunk, idx: number) => {
                      const scoreInfo = getScoreBadge(chunk.score, minScore);
                      const isBelow = chunk.score < (searchResult.stats?.min_score_threshold ?? minScore);

                      return (
                        <div
                          key={chunk.chunk_id || idx}
                          className={cn(
                            "bg-surface-page dark:bg-dark-page border rounded-card p-4 space-y-3 transition-all",
                            isBelow
                              ? "border-danger/30 opacity-75"
                              : "border-surface-border dark:border-dark-border hover:border-brand/40"
                          )}
                        >
                          {/* Chunk Header */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-input dark:bg-dark-input text-text-primary dark:text-textDark-primary border border-surface-border/60">
                                CHUNK #{chunk.chunk_index !== undefined ? chunk.chunk_index : idx + 1}
                              </span>

                              {/* Similarity Score Pill */}
                              <div
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-xs font-bold border font-mono",
                                  scoreInfo.bg
                                )}
                              >
                                <span>Score: {chunk.score.toFixed(4)}</span>
                                <span className="text-[10px] font-sans font-medium opacity-80">
                                  ({scoreInfo.label})
                                </span>
                              </div>
                            </div>

                            {/* Copy button */}
                            <button
                              onClick={() => handleCopy(chunk.text, `chunk_${idx}`, "Đã sao chép nội dung chunk!")}
                              className="p-1 rounded-btn text-text-muted hover:text-brand transition-colors text-xs flex items-center gap-1"
                            >
                              {copiedKey === `chunk_${idx}` ? (
                                <Check size={12} className="text-success" />
                              ) : (
                                <Copy size={12} />
                              )}
                              Sao chép
                            </button>
                          </div>

                          {/* Progress Score Bar */}
                          <div className="w-full bg-surface-input dark:bg-dark-input h-1.5 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full transition-all duration-500", scoreInfo.barBg)}
                              style={{ width: `${Math.min(100, Math.max(5, chunk.score * 100))}%` }}
                            />
                          </div>

                          {/* Source File & Page Info */}
                          <div className="flex items-center gap-2 text-xs text-text-muted dark:text-textDark-secondary flex-wrap">
                            <span className="flex items-center gap-1 font-medium text-text-primary dark:text-textDark-primary">
                              <FileText size={12} className="text-brand" />
                              {chunk.document_name}
                            </span>
                            {chunk.page_num !== undefined && chunk.page_num !== null && (
                              <span>• Trang: <strong>{chunk.page_num}</strong></span>
                            )}
                            {chunk.category && (
                              <span className="px-1.5 py-0.2 rounded bg-brand/10 text-brand text-[10px] font-semibold">
                                {chunk.category}
                              </span>
                            )}
                            {chunk.document_id && (
                              <Link
                                to={`/dashboard/bot/${botId}/knowledge/${chunk.document_id}`}
                                className="text-brand hover:underline inline-flex items-center gap-0.5 text-[11px] ml-auto"
                                target="_blank"
                                rel="noreferrer"
                              >
                                Xem tài liệu <ExternalLink size={10} />
                              </Link>
                            )}
                          </div>

                          {/* Section & Chapter Titles */}
                          {(chunk.chapter_title || chunk.section_title) && (
                            <div className="bg-surface-card dark:bg-dark-card p-2 rounded-btn border border-surface-border/40 text-xs space-y-0.5">
                              {chunk.chapter_title && (
                                <p className="text-text-muted dark:text-textDark-secondary font-medium truncate flex items-center gap-1">
                                  <Bookmark size={11} className="text-brand shrink-0" />
                                  {chunk.chapter_title}
                                </p>
                              )}
                              {chunk.section_title && (
                                <p className="text-brand font-semibold truncate flex items-center gap-1">
                                  <span className="text-[10px] px-1 rounded bg-brand/10 font-bold">Mục</span>
                                  {chunk.section_title}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Chunk Content Text */}
                          <div className="p-3 bg-surface-card dark:bg-dark-card border border-surface-border/30 rounded-btn text-xs text-text-primary dark:text-textDark-primary font-sans whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                            {chunk.text}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* TAB 2: FULL CONTEXT SENT TO LLM */}
              {activeResultTab === "context" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-text-muted dark:text-textDark-secondary">
                      Nguyên văn đoạn Context được server ghép lại từ các chunks để đưa vào prompt cho LLM:
                    </p>
                    {searchResult?.full_context_sent_to_llm && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            searchResult.full_context_sent_to_llm,
                            "full_context",
                            "Đã sao chép toàn bộ Context!"
                          )
                        }
                        icon={
                          copiedKey === "full_context" ? (
                            <Check size={12} className="text-success" />
                          ) : (
                            <Copy size={12} />
                          )
                        }
                      >
                        Sao chép Context
                      </Button>
                    )}
                  </div>

                  {!searchResult?.full_context_sent_to_llm ? (
                    <div className="p-8 text-center text-xs text-text-muted bg-surface-page dark:bg-dark-page rounded-btn border border-surface-border/50">
                      Chưa có Context nào được tạo. Hãy chạy tìm kiếm thử nghiệm trước.
                    </div>
                  ) : (
                    <div className="p-4 bg-surface-page dark:bg-dark-page border border-surface-border dark:border-dark-border rounded-btn font-mono text-xs text-text-primary dark:text-textDark-primary whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto select-text">
                      {searchResult.full_context_sent_to_llm}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RAW JSON */}
              {activeResultTab === "json" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-text-muted dark:text-textDark-secondary">
                      Dữ liệu phản hồi gốc từ API:
                    </p>
                    {searchResult && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            JSON.stringify(searchResult, null, 2),
                            "raw_json",
                            "Đã sao chép JSON!"
                          )
                        }
                        icon={
                          copiedKey === "raw_json" ? (
                            <Check size={12} className="text-success" />
                          ) : (
                            <Copy size={12} />
                          )
                        }
                      >
                        Sao chép JSON
                      </Button>
                    )}
                  </div>

                  {!searchResult ? (
                    <div className="p-8 text-center text-xs text-text-muted bg-surface-page dark:bg-dark-page rounded-btn border border-surface-border/50">
                      Chưa có dữ liệu phản hồi JSON.
                    </div>
                  ) : (
                    <pre className="p-4 bg-surface-page dark:bg-dark-page border border-surface-border dark:border-dark-border rounded-btn font-mono text-xs text-text-primary dark:text-textDark-primary overflow-x-auto max-h-[500px] select-text">
                      {JSON.stringify(searchResult, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODE 2: END-USER CHAT PREVIEW                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeMode === "chat" && (
        <div className="max-w-4xl mx-auto h-[620px] flex flex-col bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card shadow-sm overflow-hidden animate-fadeIn">
          {/* Chat Header */}
          <div className="p-4 border-b border-surface-border dark:border-dark-border bg-surface-page/50 dark:bg-dark-page/20 flex flex-col gap-3 shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm overflow-hidden"
                  style={{ backgroundColor: bot.widgetConfig.primaryColor }}
                >
                  {bot.avatarUrl ? (
                    <img src={bot.avatarUrl} alt={bot.name} className="w-full h-full object-cover" />
                  ) : (
                    bot.name.substring(0, 2).toUpperCase()
                  )}
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
                onClick={handleResetChat}
                icon={<RotateCcw size={13} />}
                className="text-xs"
              >
                Làm mới
              </Button>
            </div>

            <div className="p-2.5 bg-brand-soft dark:bg-brand-softDark border border-brand/20 rounded-btn flex items-center gap-2">
              <span className="text-brand shrink-0">💡</span>
              <p className="text-xs text-text-secondary dark:text-textDark-primary">
                Chế độ này mô phỏng giao diện widget người dùng cuối. Để mổ xẻ chi tiết các đoạn chunks và điểm similarity, hãy chuyển sang chế độ <strong>RAG Inspector</strong> ở trên.
              </p>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-neutral-900/10">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3 max-w-[80%] animate-fadeIn",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm",
                    msg.role === "user" ? "bg-text-secondary dark:bg-textDark-secondary" : ""
                  )}
                  style={msg.role === "assistant" ? { backgroundColor: bot.widgetConfig.primaryColor } : {}}
                >
                  {msg.role === "user" ? <User size={12} /> : <Bot size={12} />}
                </div>

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

            {chatSending && (
              <div className="flex gap-3 max-w-[80%] mr-auto items-center animate-pulse">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm"
                  style={{ backgroundColor: bot.widgetConfig.primaryColor }}
                >
                  <Bot size={12} />
                </div>
                <div className="bg-white dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-card rounded-tl-none p-3 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={chatScrollRef} />
          </div>

          {/* Input bar */}
          <form
            onSubmit={handleSendChat}
            className="p-4 border-t border-surface-border dark:border-dark-border bg-white dark:bg-dark-card flex gap-3 shrink-0"
          >
            <input
              type="text"
              placeholder="Nhập tin nhắn của bạn..."
              className="flex-1 px-4 py-2.5 rounded-btn text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={chatSending}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!chatInput.trim() || chatSending}
              icon={<Send size={13} />}
              className="px-5 font-semibold text-xs shadow-md shadow-brand/20"
            >
              Gửi
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
