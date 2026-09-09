import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bot, Loader2, Eye, Power, PowerOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Chatbot, PaginatedResponse } from "@/types/admin";
import { toast } from "@/components/ui/Sonner";

export default function AdminChatbotsPage() {
  const navigate = useNavigate();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const fetchChatbots = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      const res = await apiFetch(`/api/admin/chatbots?${params}`);
      const json = await res.json();
      console.log("[GET /api/admin/chatbots Data]:", json);

      if (json && json.data) {
        setChatbots(json.data.chatbots ?? []);
        setTotalPages(json.data.pagination?.total_pages ?? 1);
      } else {
        setChatbots([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching chatbots:", err);
      setChatbots([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleChatbotActive = async (chatbotId: string, currentStatus: boolean) => {
    try {
      const res = await apiFetch(`/api/admin/chatbots/${chatbotId}/toggle-active`, {
        method: "PUT",
      });
      if (res.ok) {
        toast.success(`Chatbot ${currentStatus ? "đã tắt" : "đã bật"}`);
        fetchChatbots();
      } else {
        toast.error("Có lỗi xảy ra");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra");
    }
  };

  useEffect(() => {
    fetchChatbots();
  }, [page]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary dark:text-textDark-primary">
            Quản lý Chatbot
          </h1>
          <p className="text-sm text-text-muted dark:text-textDark-secondary mt-0.5">
            {(chatbots || []).length} chatbot trong hệ thống
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/create")}
          className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-btn transition shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <span>+ Tạo Chatbot</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-50 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-textDark-muted"
          />
          <input
            type="text"
            placeholder="Tìm kiếm chatbot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-btn text-sm bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border text-text-primary dark:text-textDark-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
          />
        </div>
      </div>

      {/* Chatbots Table */}
      <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-page dark:bg-dark-page border-b border-surface-border dark:border-dark-border">
            <tr>
              {["Chatbot", "Người dùng", "Trạng thái", "Tin nhắn", "Ngày tạo", "Hành động"].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-semibold text-text-muted dark:text-textDark-secondary px-4 py-3 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border dark:divide-dark-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <div className="flex justify-center items-center gap-2 text-brand">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-xs font-semibold">Đang tải...</span>
                  </div>
                </td>
              </tr>
            ) : chatbots.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-text-muted">
                  Không tìm thấy chatbot nào
                </td>
              </tr>
            ) : (
              chatbots.map((chatbot) => (
                <tr
                  key={chatbot.id}
                  className="hover:bg-surface-page dark:hover:bg-dark-page transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand/15 dark:bg-brand/10 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                        <Bot size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary dark:text-textDark-primary truncate">
                          {chatbot.name}
                        </p>
                        <p className="text-[10px] text-text-muted dark:text-textDark-muted truncate">
                          {chatbot.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-text-primary dark:text-textDark-primary">
                      {chatbot.user?.fullname || "N/A"}
                    </p>
                    <p className="text-[10px] text-text-muted dark:text-textDark-muted">
                      {chatbot.user?.email || ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-pill font-semibold ${
                        chatbot.is_active
                          ? "bg-success-bg text-success-text"
                          : "bg-danger-bg text-danger-text"
                      }`}
                    >
                      {chatbot.is_active ? "Hoạt động" : "Đã tắt"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-text-primary dark:text-textDark-primary">
                      {chatbot.message_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted dark:text-textDark-secondary font-mono">
                    {new Date(chatbot.created_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/chatbots/${chatbot.id}`)}
                        className="p-1.5 rounded-btn text-text-muted dark:text-textDark-muted hover:bg-brand-soft dark:hover:bg-brand-softDark hover:text-success-text transition"
                        title="Xem chi tiết"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => toggleChatbotActive(chatbot.id, chatbot.is_active)}
                        className={`p-1.5 rounded-btn transition ${
                          chatbot.is_active
                            ? "text-text-muted dark:text-textDark-muted hover:bg-danger-bg hover:text-danger-text"
                            : "text-text-muted dark:text-textDark-muted hover:bg-success-bg hover:text-success-text"
                        }`}
                        title={chatbot.is_active ? "Tắt chatbot" : "Bật chatbot"}
                      >
                        {chatbot.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-surface-border dark:border-dark-border flex items-center justify-between">
            <p className="text-xs text-text-muted dark:text-textDark-secondary">
              Trang {page} / {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(Math.max(1, page - 1))}
                className="w-7 h-7 rounded-btn text-xs font-medium text-text-muted dark:text-textDark-secondary hover:bg-surface-input dark:hover:bg-dark-input transition flex items-center justify-center disabled:opacity-50"
              >
                ←
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = page <= 3 ? i + 1 : page + i - 2;
                return pageNum > 0 && pageNum <= totalPages ? (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 rounded-btn text-xs font-medium transition flex items-center justify-center ${
                      pageNum === page
                        ? "bg-brand text-white"
                        : "text-text-muted dark:text-textDark-secondary hover:bg-surface-input dark:hover:bg-dark-input"
                    }`}
                  >
                    {pageNum}
                  </button>
                ) : null;
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                className="w-7 h-7 rounded-btn text-xs font-medium text-text-muted dark:text-textDark-secondary hover:bg-surface-input dark:hover:bg-dark-input transition flex items-center justify-center disabled:opacity-50"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
