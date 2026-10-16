import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Layers,
  Search,
  Copy,
  Check,
  Download,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Loader2,
  Calendar,
  FolderKanban,
  Hash,
  BookOpen,
  Bookmark,
  FileCode,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  AlignLeft,
  Eye,
  CheckCircle2,
  HelpCircle,
  FileCheck,
  FileSpreadsheet
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/Sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { useChatbotStore, useStoreHydration } from "@/store/chatbotStore";
import {
  DocumentRawTextData,
  DocumentChunkItem,
  DocumentChunksData
} from "@/types/document";

export default function BotDocumentDetailPage() {
  const { id: botId, docId } = useParams<{ id: string; docId: string }>();
  const navigate = useNavigate();
  const { chatbots } = useChatbotStore();
  const isHydrated = useStoreHydration();

  const bot = chatbots.find((b) => b.id === botId);

  // States
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [activeTab, setActiveTab] = useState<"chunks" | "raw" | "inspector">("chunks");

  // Raw text data
  const [rawData, setRawData] = useState<DocumentRawTextData | null>(null);
  const [rawTextError, setRawTextError] = useState<string | null>(null);

  // Chunks data
  const [chunksData, setChunksData] = useState<DocumentChunksData | null>(null);
  const [chunksError, setChunksError] = useState<string | null>(null);

  // Chunks filtering & searching
  const [chunkSearch, setChunkSearch] = useState("");
  const [selectedPage, setSelectedPage] = useState<string>("ALL");
  const [selectedChapter, setSelectedChapter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"index-asc" | "index-desc" | "chars-desc" | "chars-asc" | "page-asc">("index-asc");
  const [expandedChunkId, setExpandedChunkId] = useState<string | null>(null);

  // Raw text viewer options
  const [rawSearch, setRawSearch] = useState("");
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wrapText, setWrapText] = useState(true);

  // Clipboard copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, label: string = "Đã sao chép") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(label);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Fetch document data
  const fetchAllData = async () => {
    if (!docId) return;
    setLoading(true);
    setRawTextError(null);
    setChunksError(null);

    // 1. Fetch raw text (try /text first, then /content fallback)
    try {
      let res = await apiFetch(`/api/rag/documents/${docId}/text`);
      if (res.status === 404) {
        res = await apiFetch(`/api/rag/documents/${docId}/content`);
      }
      const json = await res.json();
      if (res.ok || json?.statusCode === 200 || json?.data) {
        setRawData(json.data || json);
      } else {
        setRawTextError(json?.message || "Không thể tải nội dung văn bản thô.");
      }
    } catch (err: any) {
      console.error("Error fetching raw text:", err);
      setRawTextError(err?.message || "Lỗi kết nối khi tải văn bản thô.");
    }

    // 2. Fetch chunks from Qdrant
    try {
      const res = await apiFetch(`/api/rag/documents/${docId}/chunks`);
      const json = await res.json();
      if (res.ok || json?.statusCode === 200 || json?.data) {
        setChunksData(json.data || json);
      } else {
        setChunksError(json?.message || "Không thể tải danh sách chunks từ Qdrant.");
      }
    } catch (err: any) {
      console.error("Error fetching chunks:", err);
      setChunksError(err?.message || "Lỗi kết nối khi tải vector chunks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (docId) {
      fetchAllData();
    }
  }, [docId]);

  // Handle reindex
  const handleReindex = async () => {
    if (!docId) return;
    setReindexing(true);
    try {
      const res = await apiFetch(`/api/rag/documents/${docId}/reindex`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok || data?.statusCode === 200) {
        toast.success("Đã kích hoạt reindex tài liệu thành công! Đang đồng bộ lại...");
        fetchAllData();
      } else {
        toast.error(data?.message || "Reindex thất bại");
      }
    } catch (err) {
      console.error("Error reindexing:", err);
      toast.error("Lỗi kết nối khi reindex tài liệu");
    } finally {
      setReindexing(false);
    }
  };

  // Export raw text to .txt file
  const handleDownloadRawText = () => {
    if (!rawData?.raw_text) {
      toast.error("Không có nội dung văn bản để tải về");
      return;
    }
    const blob = new Blob([rawData.raw_text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const name = rawData.filename || rawData.original_filename || `document_${docId}.txt`;
    a.href = url;
    a.download = name.endsWith(".txt") ? name : `${name.replace(/\.[^/.]+$/, "")}_ocr.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Đã tải xuống file văn bản OCR!");
  };

  // Derive document title & info
  const docTitle = rawData?.filename || rawData?.original_filename || chunksData?.document_name || "Chi tiết tài liệu";
  const docCategory = rawData?.category || chunksData?.category;
  const docStatus = rawData?.status || "READY";
  const totalChunks = chunksData?.total_chunks || rawData?.total_chunks || chunksData?.chunks?.length || 0;
  const totalChars = rawData?.total_characters || rawData?.raw_text?.length || 0;
  const totalWords = rawData?.total_words || (rawData?.raw_text ? rawData.raw_text.trim().split(/\s+/).filter(Boolean).length : 0);

  // Available pages for filter
  const availablePages = useMemo(() => {
    if (!chunksData?.chunks) return [];
    const pages = new Set<number>();
    chunksData.chunks.forEach((c) => {
      if (c.page_num !== undefined && c.page_num !== null) {
        pages.add(c.page_num);
      }
    });
    return Array.from(pages).sort((a, b) => a - b);
  }, [chunksData]);

  // Available chapters for filter
  const availableChapters = useMemo(() => {
    if (!chunksData?.chunks) return [];
    const chapters = new Set<string>();
    chunksData.chunks.forEach((c) => {
      if (c.chapter_title && c.chapter_title.trim()) {
        chapters.add(c.chapter_title.trim());
      }
    });
    return Array.from(chapters);
  }, [chunksData]);

  // Filter & sort chunks
  const filteredChunks = useMemo(() => {
    if (!chunksData?.chunks) return [];
    let list = [...chunksData.chunks];

    // Page filter
    if (selectedPage !== "ALL") {
      const pageNum = parseInt(selectedPage, 10);
      list = list.filter((c) => c.page_num === pageNum);
    }

    // Chapter filter
    if (selectedChapter !== "ALL") {
      list = list.filter((c) => (c.chapter_title || "").trim() === selectedChapter);
    }

    // Search query
    if (chunkSearch.trim()) {
      const q = chunkSearch.toLowerCase().trim();
      list = list.filter((c) => {
        return (
          (c.text && c.text.toLowerCase().includes(q)) ||
          (c.section_title && c.section_title.toLowerCase().includes(q)) ||
          (c.chapter_title && c.chapter_title.toLowerCase().includes(q)) ||
          (c.chunk_id && c.chunk_id.toLowerCase().includes(q)) ||
          `chunk ${c.chunk_index}`.includes(q) ||
          `#${c.chunk_index}`.includes(q)
        );
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "index-asc") return (a.chunk_index ?? 0) - (b.chunk_index ?? 0);
      if (sortBy === "index-desc") return (b.chunk_index ?? 0) - (a.chunk_index ?? 0);
      if (sortBy === "chars-desc") return (b.char_count ?? b.text?.length ?? 0) - (a.char_count ?? a.text?.length ?? 0);
      if (sortBy === "chars-asc") return (a.char_count ?? a.text?.length ?? 0) - (b.char_count ?? b.text?.length ?? 0);
      if (sortBy === "page-asc") return (a.page_num ?? 0) - (b.page_num ?? 0);
      return 0;
    });

    return list;
  }, [chunksData, chunkSearch, selectedPage, selectedChapter, sortBy]);

  // Raw text lines & search
  const rawLines = useMemo(() => {
    if (!rawData?.raw_text) return [];
    return rawData.raw_text.split("\n");
  }, [rawData]);

  const rawSearchCount = useMemo(() => {
    if (!rawSearch.trim() || !rawData?.raw_text) return 0;
    const escaped = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = rawData.raw_text.match(new RegExp(escaped, "gi"));
    return matches ? matches.length : 0;
  }, [rawSearch, rawData]);

  // Helper to highlight search keywords
  const renderHighlightedText = (content: string, query: string) => {
    if (!query.trim()) return content;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = content.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-warning/40 text-text-primary dark:text-textDark-primary px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Extracted TOC (Chapters & Sections)
  const tableOfContents = useMemo(() => {
    if (!chunksData?.chunks) return [];
    const map = new Map<string, Array<{ section_title: string; chunk_index: number; page_num?: number }>>();
    chunksData.chunks.forEach((c) => {
      const chapter = (c.chapter_title || "Văn bản chung").trim();
      const section = (c.section_title || "").trim();
      if (!map.has(chapter)) {
        map.set(chapter, []);
      }
      if (section && !map.get(chapter)!.some((item) => item.section_title === section)) {
        map.get(chapter)!.push({
          section_title: section,
          chunk_index: c.chunk_index,
          page_num: c.page_num,
        });
      }
    });
    return Array.from(map.entries());
  }, [chunksData]);

  // Jump to specific section in chunks tab
  const handleSelectSectionFromTOC = (sectionTitle: string) => {
    setActiveTab("chunks");
    setChunkSearch(sectionTitle);
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Top Breadcrumbs & Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border/60 dark:border-dark-border/60">
        <div className="flex items-center gap-2 text-xs text-text-muted dark:text-textDark-secondary">
          <Link
            to={botId ? `/dashboard/bot/${botId}/knowledge` : "/dashboard"}
            className="hover:text-brand flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft size={14} />
            Kiến thức tài liệu
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-text-primary dark:text-textDark-primary font-semibold truncate max-w-xs sm:max-w-md">
            {docTitle}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchAllData}
            disabled={loading}
            icon={<RefreshCw size={13} className={loading ? "animate-spin" : ""} />}
          >
            Làm mới
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadRawText}
            disabled={!rawData?.raw_text}
            icon={<Download size={13} />}
          >
            Tải file OCR (.txt)
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleReindex}
            disabled={reindexing}
            loading={reindexing}
            icon={<Sparkles size={13} />}
          >
            Reindex lại
          </Button>
        </div>
      </div>

      {/* ── Document Hero Card ── */}
      <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 border border-brand/20 shadow-inner">
              <FileText size={24} />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-text-primary dark:text-textDark-primary break-all">
                  {docTitle}
                </h1>
                <Badge
                  variant={
                    docStatus === "READY"
                      ? "success"
                      : docStatus === "FAILED"
                      ? "danger"
                      : "warning"
                  }
                >
                  {docStatus === "READY" ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={11} /> Sẵn sàng (READY)
                    </span>
                  ) : docStatus === "FAILED" ? (
                    <span className="flex items-center gap-1">
                      <AlertCircle size={11} /> Thất bại
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Loader2 size={11} className="animate-spin" /> {docStatus}
                    </span>
                  )}
                </Badge>
                {docCategory && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
                    <FolderKanban size={11} />
                    {docCategory}
                  </span>
                )}
              </div>

              {rawData?.original_filename && rawData.original_filename !== docTitle && (
                <p className="text-xs text-text-muted dark:text-textDark-secondary">
                  Tên file gốc: <span className="font-mono">{rawData.original_filename}</span>
                </p>
              )}

              {/* Document ID and Meta info */}
              <div className="flex items-center gap-4 text-xs text-text-muted dark:text-textDark-secondary flex-wrap pt-1">
                <div className="flex items-center gap-1.5 font-mono bg-surface-input dark:bg-dark-input px-2 py-0.5 rounded border border-surface-border/50 dark:border-dark-border/50">
                  <span className="text-[10px] uppercase font-bold text-text-muted">Doc ID:</span>
                  <span>{docId}</span>
                  <button
                    onClick={() => handleCopy(docId || "", "docId", "Đã sao chép Document ID")}
                    className="hover:text-brand transition-colors ml-0.5"
                    title="Sao chép ID"
                  >
                    {copiedKey === "docId" ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  </button>
                </div>

                {rawData?.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Tạo: {new Date(rawData.created_at).toLocaleString("vi-VN")}
                  </span>
                )}

                {rawData?.updated_at && (
                  <span className="flex items-center gap-1">
                    <RefreshCw size={12} />
                    Cập nhật: {new Date(rawData.updated_at).toLocaleString("vi-VN")}
                  </span>
                )}
              </div>

              {/* Source files list (if any) */}
              {rawData?.source_files && rawData.source_files.length > 0 && (
                <div className="pt-1 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-medium text-text-muted dark:text-textDark-secondary">
                    Nguồn lưu trữ:
                  </span>
                  {rawData.source_files.map((sf, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono bg-surface-page dark:bg-dark-page px-2 py-0.5 rounded text-text-secondary dark:text-textDark-primary border border-surface-border dark:border-dark-border"
                      title={sf.storage_path}
                    >
                      {sf.file_name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 4 Key Metric Boxes ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-surface-border/60 dark:border-dark-border/60">
          <div className="bg-surface-page dark:bg-dark-page p-3.5 rounded-card border border-surface-border/50 dark:border-dark-border/50">
            <div className="flex items-center justify-between text-text-muted dark:text-textDark-secondary mb-1">
              <span className="text-xs font-medium">Tổng Chunks (Qdrant)</span>
              <Layers size={15} className="text-brand" />
            </div>
            <p className="text-2xl font-bold text-text-primary dark:text-textDark-primary">
              {totalChunks.toLocaleString()}
            </p>
            <span className="text-[10px] text-text-muted dark:text-textDark-secondary">
              Đoạn trích vector hóa
            </span>
          </div>

          <div className="bg-surface-page dark:bg-dark-page p-3.5 rounded-card border border-surface-border/50 dark:border-dark-border/50">
            <div className="flex items-center justify-between text-text-muted dark:text-textDark-secondary mb-1">
              <span className="text-xs font-medium">Tổng Ký Tự OCR</span>
              <AlignLeft size={15} className="text-brand" />
            </div>
            <p className="text-2xl font-bold text-text-primary dark:text-textDark-primary">
              {totalChars.toLocaleString()}
            </p>
            <span className="text-[10px] text-text-muted dark:text-textDark-secondary">
              Characters trong MongoDB
            </span>
          </div>

          <div className="bg-surface-page dark:bg-dark-page p-3.5 rounded-card border border-surface-border/50 dark:border-dark-border/50">
            <div className="flex items-center justify-between text-text-muted dark:text-textDark-secondary mb-1">
              <span className="text-xs font-medium">Tổng Số Từ</span>
              <BookOpen size={15} className="text-brand" />
            </div>
            <p className="text-2xl font-bold text-text-primary dark:text-textDark-primary">
              {totalWords.toLocaleString()}
            </p>
            <span className="text-[10px] text-text-muted dark:text-textDark-secondary">
              Ước tính từ OCR text
            </span>
          </div>

          <div className="bg-surface-page dark:bg-dark-page p-3.5 rounded-card border border-surface-border/50 dark:border-dark-border/50">
            <div className="flex items-center justify-between text-text-muted dark:text-textDark-secondary mb-1">
              <span className="text-xs font-medium">Trung Bình Chunk</span>
              <Hash size={15} className="text-brand" />
            </div>
            <p className="text-2xl font-bold text-text-primary dark:text-textDark-primary">
              {totalChunks > 0 ? Math.round(totalChars / totalChunks).toLocaleString() : 0}
            </p>
            <span className="text-[10px] text-text-muted dark:text-textDark-secondary">
              Ký tự mỗi đoạn vector
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-surface-border dark:border-dark-border gap-2 sm:gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("chunks")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === "chunks"
              ? "border-brand text-brand"
              : "border-transparent text-text-muted dark:text-textDark-secondary hover:text-text-primary dark:hover:text-textDark-primary"
          }`}
        >
          <Layers size={16} />
          <span>Vector Chunks trong Qdrant</span>
          <span className="px-2 py-0.5 rounded-pill text-[11px] font-mono bg-brand/10 text-brand">
            {totalChunks}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("raw")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === "raw"
              ? "border-brand text-brand"
              : "border-transparent text-text-muted dark:text-textDark-secondary hover:text-text-primary dark:hover:text-textDark-primary"
          }`}
        >
          <FileText size={16} />
          <span>Toàn Bộ Văn Bản OCR (Raw Text)</span>
          {rawData?.raw_text && (
            <span className="px-2 py-0.5 rounded-pill text-[11px] font-mono bg-surface-input dark:bg-dark-input text-text-secondary dark:text-textDark-primary">
              {rawLines.length} dòng
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("inspector")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === "inspector"
              ? "border-brand text-brand"
              : "border-transparent text-text-muted dark:text-textDark-secondary hover:text-text-primary dark:hover:text-textDark-primary"
          }`}
        >
          <FileCheck size={16} />
          <span>Kiểm Tra Chất Lượng & Mục Lục OCR</span>
          {tableOfContents.length > 0 && (
            <span className="px-2 py-0.5 rounded-pill text-[11px] font-mono bg-brand/10 text-brand">
              {tableOfContents.length} chương
            </span>
          )}
        </button>
      </div>

      {/* ── TAB 1: VECTOR CHUNKS IN QDRANT ── */}
      {activeTab === "chunks" && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-4 space-y-3 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search input */}
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-textDark-secondary"
                />
                <input
                  type="text"
                  placeholder="Tìm nội dung, Điều, Chương, Chunk ID..."
                  value={chunkSearch}
                  onChange={(e) => setChunkSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-btn text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand"
                />
                {chunkSearch && (
                  <button
                    onClick={() => setChunkSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-brand"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Filter by Page */}
              <div>
                <select
                  value={selectedPage}
                  onChange={(e) => setSelectedPage(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-btn text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand"
                >
                  <option value="ALL">-- Tất cả các trang ({availablePages.length} trang) --</option>
                  {availablePages.map((p) => (
                    <option key={p} value={p.toString()}>
                      Trang {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Chapter */}
              <div>
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-btn text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand truncate"
                >
                  <option value="ALL">-- Tất cả Chương / Mục --</option>
                  {availableChapters.map((ch, idx) => (
                    <option key={idx} value={ch}>
                      {ch.length > 40 ? `${ch.substring(0, 40)}...` : ch}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort by */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-btn text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand"
                >
                  <option value="index-asc">Thứ tự đoạn (Tăng dần #1, #2...)</option>
                  <option value="index-desc">Thứ tự đoạn (Giảm dần)</option>
                  <option value="chars-desc">Độ dài ký tự (Nhiều nhất)</option>
                  <option value="chars-asc">Độ dài ký tự (Ít nhất)</option>
                  <option value="page-asc">Theo số trang (Tăng dần)</option>
                </select>
              </div>
            </div>

            {/* Results count & active filter reset */}
            <div className="flex items-center justify-between text-xs text-text-muted dark:text-textDark-secondary pt-1 border-t border-surface-border/40 dark:border-dark-border/40">
              <span>
                Hiển thị <strong className="text-text-primary dark:text-textDark-primary">{filteredChunks.length}</strong> / {totalChunks} chunks
              </span>

              {(chunkSearch || selectedPage !== "ALL" || selectedChapter !== "ALL") && (
                <button
                  onClick={() => {
                    setChunkSearch("");
                    setSelectedPage("ALL");
                    setSelectedChapter("ALL");
                  }}
                  className="text-brand hover:underline font-medium"
                >
                  Đặt lại bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Error notice if chunks failed */}
          {chunksError && (
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-card flex items-start gap-3">
              <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-danger">Không thể tải Chunks từ Vector Database</h4>
                <p className="text-xs text-danger/90 mt-0.5">{chunksError}</p>
                <button
                  onClick={fetchAllData}
                  className="mt-2 text-xs text-brand hover:underline font-semibold"
                >
                  Thử tải lại
                </button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={32} className="animate-spin text-brand" />
              <p className="text-xs text-text-muted dark:text-textDark-secondary">
                Đang tải danh sách chunks từ Qdrant...
              </p>
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredChunks.length === 0 && (
            <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-input dark:bg-dark-input flex items-center justify-center mx-auto text-text-muted">
                <Layers size={22} />
              </div>
              <h3 className="text-sm font-bold text-text-primary dark:text-textDark-primary">
                Không tìm thấy chunks nào
              </h3>
              <p className="text-xs text-text-muted dark:text-textDark-secondary max-w-sm mx-auto">
                {chunksData?.chunks && chunksData.chunks.length > 0
                  ? "Không có chunk nào khớp với bộ lọc tìm kiếm hiện tại."
                  : "Tài liệu này chưa có chunk nào trong Qdrant hoặc đang trong quá trình vector hóa."}
              </p>
            </div>
          )}

          {/* Chunks List */}
          {!loading && filteredChunks.length > 0 && (
            <div className="space-y-3">
              {filteredChunks.map((chunk) => {
                const isExpanded = expandedChunkId === chunk.chunk_id;
                const charLen = chunk.char_count ?? chunk.text?.length ?? 0;

                return (
                  <div
                    key={chunk.chunk_id || chunk.chunk_index}
                    className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border hover:border-brand/50 rounded-card p-4 transition-all shadow-sm space-y-3"
                  >
                    {/* Chunk Top Meta Header */}
                    <div className="flex items-center justify-between gap-3 flex-wrap border-b border-surface-border/50 dark:border-dark-border/50 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
                          Chunk #{chunk.chunk_index !== undefined ? chunk.chunk_index : "?"}
                        </span>

                        {chunk.page_num !== undefined && chunk.page_num !== null && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-surface-input dark:bg-dark-input text-text-secondary dark:text-textDark-primary">
                            <BookOpen size={11} className="text-brand" />
                            Trang {chunk.page_num}
                          </span>
                        )}

                        <span className="text-[11px] font-mono text-text-muted dark:text-textDark-secondary">
                          {charLen.toLocaleString()} ký tự
                        </span>

                        {chunk.category && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-surface-input dark:bg-dark-input text-text-muted dark:text-textDark-secondary">
                            {chunk.category}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Tooltip content="Sao chép Chunk ID">
                          <button
                            onClick={() =>
                              handleCopy(chunk.chunk_id, `cid_${chunk.chunk_id}`, "Đã sao chép Chunk ID")
                            }
                            className="p-1.5 rounded-btn text-text-muted hover:text-brand hover:bg-brand/10 transition-colors"
                          >
                            {copiedKey === `cid_${chunk.chunk_id}` ? (
                              <Check size={13} className="text-success" />
                            ) : (
                              <Hash size={13} />
                            )}
                          </button>
                        </Tooltip>

                        <Tooltip content="Sao chép nội dung chunk">
                          <button
                            onClick={() =>
                              handleCopy(chunk.text, `text_${chunk.chunk_id}`, "Đã sao chép nội dung chunk")
                            }
                            className="p-1.5 rounded-btn text-text-muted hover:text-brand hover:bg-brand/10 transition-colors"
                          >
                            {copiedKey === `text_${chunk.chunk_id}` ? (
                              <Check size={13} className="text-success" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Legal Hierarchy (Chapter & Section Title) */}
                    {(chunk.chapter_title || chunk.section_title) && (
                      <div className="bg-surface-page dark:bg-dark-page p-2.5 rounded-btn border border-surface-border/40 dark:border-dark-border/40 space-y-1">
                        {chunk.chapter_title && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary dark:text-textDark-primary">
                            <Bookmark size={12} className="text-brand shrink-0" />
                            <span className="truncate">
                              {renderHighlightedText(chunk.chapter_title, chunkSearch)}
                            </span>
                          </div>
                        )}
                        {chunk.section_title && (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-brand">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand/15 font-bold">Mục</span>
                            <span className="truncate">
                              {renderHighlightedText(chunk.section_title, chunkSearch)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Chunk Text Content */}
                    <div className="relative">
                      <div
                        className={`text-xs font-sans leading-relaxed text-text-primary dark:text-textDark-primary whitespace-pre-wrap bg-surface-page/50 dark:bg-dark-page/50 p-3.5 rounded-btn border border-surface-border/30 dark:border-dark-border/30 ${
                          !isExpanded && charLen > 500 ? "max-h-48 overflow-hidden" : ""
                        }`}
                      >
                        {renderHighlightedText(chunk.text || "", chunkSearch)}
                      </div>

                      {/* Expand / Collapse gradient overlay if long */}
                      {charLen > 500 && (
                        <div
                          className={`flex items-center justify-center pt-2 ${
                            !isExpanded
                              ? "absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface-card dark:from-dark-card pt-8 pb-1"
                              : ""
                          }`}
                        >
                          <button
                            onClick={() =>
                              setExpandedChunkId(isExpanded ? null : chunk.chunk_id)
                            }
                            className="text-[11px] font-semibold text-brand hover:underline bg-surface-card dark:bg-dark-card px-2.5 py-1 rounded-pill border border-brand/20 shadow-sm"
                          >
                            {isExpanded ? "Thu gọn bớt" : `Xem toàn bộ (${charLen} ký tự)`}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: TOÀN BỘ VĂN BẢN OCR (RAW TEXT MONGODB) ── */}
      {activeTab === "raw" && (
        <div className="space-y-4">
          {/* Guide Banner */}
          <div className="bg-brand-soft/50 dark:bg-brand-softDark/50 border border-brand/20 rounded-card p-4 flex items-start gap-3">
            <Sparkles size={18} className="text-brand shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-text-primary dark:text-textDark-primary">
                Kiểm Tra Chất Lượng OCR (Raw Text từ MongoDB)
              </h4>
              <p className="text-xs text-text-muted dark:text-textDark-secondary leading-relaxed">
                Đây là toàn bộ văn bản thô sau khi hệ thống OCR hoàn tất. Sử dụng khung xem này để kiểm tra xem văn bản có bị mất chữ, sai dấu thanh tiếng Việt, lỗi ngắt dòng hay vỡ bảng số liệu hay không.
              </p>
            </div>
          </div>

          {/* Raw Text Error Notice */}
          {rawTextError && (
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-card flex items-start gap-3">
              <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-danger">Không thể tải văn bản OCR</h4>
                <p className="text-xs text-danger/90 mt-0.5">{rawTextError}</p>
                <button
                  onClick={fetchAllData}
                  className="mt-2 text-xs text-brand hover:underline font-semibold"
                >
                  Thử tải lại
                </button>
              </div>
            </div>
          )}

          {/* Toolbar for Raw Text */}
          <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            {/* Search in raw text */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-textDark-secondary"
              />
              <input
                type="text"
                placeholder="Tìm từ khóa trong văn bản OCR..."
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="w-full pl-9 pr-20 py-1.5 text-xs bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-btn text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand"
              />
              {rawSearch && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-brand/10 text-brand">
                  {rawSearchCount} kết quả
                </span>
              )}
            </div>

            {/* View options */}
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <label className="flex items-center gap-1.5 cursor-pointer text-text-muted dark:text-textDark-secondary hover:text-text-primary">
                <input
                  type="checkbox"
                  checked={showLineNumbers}
                  onChange={(e) => setShowLineNumbers(e.target.checked)}
                  className="rounded text-brand focus:ring-brand"
                />
                <span>Số dòng</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-text-muted dark:text-textDark-secondary hover:text-text-primary">
                <input
                  type="checkbox"
                  checked={wrapText}
                  onChange={(e) => setWrapText(e.target.checked)}
                  className="rounded text-brand focus:ring-brand"
                />
                <span>Tự động xuống dòng</span>
              </label>

              <div className="h-4 w-[1px] bg-surface-border dark:bg-dark-border hidden sm:block" />

              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  handleCopy(rawData?.raw_text || "", "all_raw", "Đã sao chép toàn bộ văn bản OCR!")
                }
                icon={
                  copiedKey === "all_raw" ? (
                    <Check size={13} className="text-success" />
                  ) : (
                    <Copy size={13} />
                  )
                }
              >
                Sao chép
              </Button>
            </div>
          </div>

          {/* Raw Text Viewer Container */}
          <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card overflow-hidden shadow-sm">
            <div className="bg-surface-input/60 dark:bg-dark-input/60 px-4 py-2 border-b border-surface-border dark:border-dark-border flex items-center justify-between text-xs text-text-muted dark:text-textDark-secondary">
              <div className="flex items-center gap-2">
                <FileCode size={14} className="text-brand" />
                <span className="font-mono font-medium">raw_text (MongoDB)</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span>{rawLines.length.toLocaleString()} dòng</span>
                <span>•</span>
                <span>{totalWords.toLocaleString()} từ</span>
                <span>•</span>
                <span>{totalChars.toLocaleString()} ký tự</span>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={32} className="animate-spin text-brand" />
                <p className="text-xs text-text-muted dark:text-textDark-secondary">
                  Đang tải nội dung văn bản thô...
                </p>
              </div>
            ) : !rawData?.raw_text ? (
              <div className="p-12 text-center text-xs text-text-muted dark:text-textDark-secondary">
                Không có dữ liệu văn bản thô cho tài liệu này.
              </div>
            ) : (
              <div
                className={`max-h-[650px] overflow-auto font-mono text-xs leading-relaxed p-4 select-text ${
                  wrapText ? "whitespace-pre-wrap" : "whitespace-pre overflow-x-auto"
                }`}
              >
                {showLineNumbers ? (
                  <table className="w-full border-collapse">
                    <tbody>
                      {rawLines.map((line, idx) => {
                        const lineNum = idx + 1;
                        return (
                          <tr
                            key={idx}
                            className="hover:bg-surface-input/30 dark:hover:bg-dark-input/30 group"
                          >
                            <td className="w-12 select-none text-right pr-4 text-[10px] text-text-muted/60 dark:text-textDark-secondary/60 align-top group-hover:text-brand">
                              {lineNum}
                            </td>
                            <td className="text-text-primary dark:text-textDark-primary align-top break-words">
                              {renderHighlightedText(line || " ", rawSearch)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-text-primary dark:text-textDark-primary">
                    {renderHighlightedText(rawData.raw_text, rawSearch)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: OCR QUALITY & TABLE OF CONTENTS INSPECTOR ── */}
      {activeTab === "inspector" && (
        <div className="space-y-6">
          {/* Quality Analysis Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Integrity Card */}
            <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-4 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-text-primary dark:text-textDark-primary">
                <CheckCircle2 size={16} className="text-success" />
                Độ Nguyên Vẹn Dữ Liệu
              </div>
              <p className="text-xs text-text-muted dark:text-textDark-secondary leading-relaxed">
                Tổng ký tự thô: <strong>{totalChars.toLocaleString()}</strong>.
                {chunksData?.chunks && (
                  <>
                    <br />
                    Tổng ký tự chunks:{" "}
                    <strong>
                      {chunksData.chunks
                        .reduce((acc, c) => acc + (c.char_count ?? c.text?.length ?? 0), 0)
                        .toLocaleString()}
                    </strong>
                    .
                  </>
                )}
              </p>
              <div className="pt-1">
                <span className="text-[11px] px-2 py-0.5 rounded bg-success/10 text-success font-semibold">
                  Đã phân mảnh hoàn tất
                </span>
              </div>
            </div>

            {/* Structure Extraction Card */}
            <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-4 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-text-primary dark:text-textDark-primary">
                <Bookmark size={16} className="text-brand" />
                Đề Mục & Cấu Trúc
              </div>
              <p className="text-xs text-text-muted dark:text-textDark-secondary leading-relaxed">
                Hệ thống trích xuất được <strong>{tableOfContents.length}</strong> chương và hàng chục mục/điều độc lập từ văn bản.
              </p>
              <div className="pt-1">
                <span className="text-[11px] px-2 py-0.5 rounded bg-brand/10 text-brand font-semibold">
                  Hỗ trợ tìm kiếm theo Điều/Chương
                </span>
              </div>
            </div>

            {/* Pages Spread Card */}
            <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-4 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-text-primary dark:text-textDark-primary">
                <BookOpen size={16} className="text-brand" />
                Độ Phủ Trang Văn Bản
              </div>
              <p className="text-xs text-text-muted dark:text-textDark-secondary leading-relaxed">
                Văn bản trải dài qua <strong>{availablePages.length}</strong> trang, phân bố đều theo thứ tự đọc tự nhiên.
              </p>
              <div className="pt-1">
                <span className="text-[11px] px-2 py-0.5 rounded bg-surface-input dark:bg-dark-input text-text-muted font-semibold">
                  Trang {availablePages[0] || 1} → Trang {availablePages[availablePages.length - 1] || 1}
                </span>
              </div>
            </div>
          </div>

          {/* Table of Contents Extracted from Chunks */}
          <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-surface-border dark:border-dark-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-text-primary dark:text-textDark-primary flex items-center gap-2">
                  <Bookmark size={16} className="text-brand" />
                  Mục Lục Trích Xuất Được Từ Các Chunks
                </h3>
                <p className="text-xs text-text-muted dark:text-textDark-secondary mt-0.5">
                  Nhấp vào bất kỳ Điều / Mục nào để chuyển ngay đến đoạn vector chunk tương ứng
                </p>
              </div>
            </div>

            {tableOfContents.length === 0 ? (
              <p className="text-xs text-text-muted dark:text-textDark-secondary py-6 text-center">
                Không tìm thấy cấu trúc Chương/Điều tự động trong các chunks.
              </p>
            ) : (
              <div className="space-y-4">
                {tableOfContents.map(([chapter, sections], idx) => (
                  <div
                    key={idx}
                    className="border border-surface-border/60 dark:border-dark-border/60 rounded-btn p-3.5 bg-surface-page/40 dark:bg-dark-page/40 space-y-2.5"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-brand">
                      <FolderKanban size={14} className="shrink-0" />
                      <span>{chapter}</span>
                      <span className="text-[10px] text-text-muted font-normal">
                        ({sections.length} mục con)
                      </span>
                    </div>

                    {sections.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                        {sections.map((sec, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSelectSectionFromTOC(sec.section_title)}
                            className="text-left text-xs p-2 rounded-btn bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border hover:border-brand text-text-primary dark:text-textDark-primary transition-all flex items-center justify-between gap-2 group"
                          >
                            <span className="truncate group-hover:text-brand font-medium">
                              {sec.section_title}
                            </span>
                            <span className="text-[10px] font-mono text-text-muted shrink-0 group-hover:text-brand">
                              Chunk #{sec.chunk_index} →
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
