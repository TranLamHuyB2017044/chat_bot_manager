import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Bot, User, Calendar, MessageSquare, Loader2, Power, PowerOff, LayoutDashboard, ExternalLink } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Chatbot, Message } from "@/types/admin";
import { toast } from "@/components/ui/Sonner";

export default function AdminChatbotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchChatbot = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/chatbots/${id}`);
      const json = await res.json();
      setChatbot(json.data);
    } catch (err) {
      console.error("Error fetching chatbot:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!id) return;
    setMessagesLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      const res = await apiFetch(`/api/admin/chatbots/${id}/messages?${params}`);
      const json = await res.json();
      if (json.data) {
        setMessages(json.data.messages);
        setTotalPages(json.data.pagination.total_pages);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const toggleChatbotActive = async () => {
    if (!id || !chatbot) return;
    try {
      const res = await apiFetch(`/api/admin/chatbots/${id}/toggle-active`, {
        method: "PUT",
      });
      if (res.ok) {
        toast.success(`Chatbot ${chatbot.is_active ? "đã tắt" : "đã bật"}`);
        fetchChatbot();
      } else {
        toast.error("Có lỗi xảy ra");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra");
    }
  };

  useEffect(() => {
    fetchChatbot();
  }, [id]);

  useEffect(() => {
    fetchMessages();
  }, [id, page]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <p className="text-text-muted">Không tìm thấy chatbot</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/chatbots")}
            className="p-2 rounded-btn hover:bg-surface-input dark:hover:bg-dark-input transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary dark:text-textDark-primary">
              {chatbot.name}
            </h1>
            <p className="text-sm text-text-muted dark:text-textDark-secondary mt-0.5">
              {chatbot.description || "Không có mô tả."}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/dashboard/bot/${chatbot.id}`)}
          className="flex items-center gap-2 px-4 py-2 rounded-btn text-xs font-bold bg-brand text-white hover:bg-brand-hover transition shadow-sm cursor-pointer"
        >
          <LayoutDashboard size={15} />
          <span>Vào trang quản lý Chatbot (Dashboard)</span>
          <ExternalLink size={13} className="opacity-70" />
        </button>
      </div>

      {/* Chatbot Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Basic Info */}
        <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-5 lg:col-span-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-brand/15 dark:bg-brand/10 flex items-center justify-center text-2xl font-bold text-brand">
              <Bot size={32} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary dark:text-textDark-primary">
                {chatbot.name}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-pill font-semibold inline-block mt-1 ${
                  chatbot.is_active
                    ? "bg-success-bg text-success-text"
                    : "bg-danger-bg text-danger-text"
                }`}
              >
                {chatbot.is_active ? "Hoạt động" : "Đã tắt"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-text-muted dark:text-textDark-secondary mb-1">Public Token</p>
              <p className="text-sm font-mono text-text-primary dark:text-textDark-primary bg-surface-input dark:bg-dark-input rounded px-2 py-1 break-all">
                {chatbot.public_token}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <User size={16} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-muted dark:text-textDark-secondary">Người dùng</p>
                <p className="text-sm text-text-primary dark:text-textDark-primary">
                  {chatbot.user?.fullname || "N/A"}
                </p>
                <p className="text-xs text-text-muted dark:text-textDark-muted">
                  {chatbot.user?.email || ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-muted dark:text-textDark-secondary">Ngày tạo</p>
                <p className="text-sm text-text-primary dark:text-textDark-primary">
                  {new Date(chatbot.created_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border dark:border-dark-border space-y-2">
              <button
                onClick={toggleChatbotActive}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-btn text-sm font-semibold transition ${
                  chatbot.is_active
                    ? "bg-danger-bg text-danger-text hover:bg-danger hover:text-white"
                    : "bg-success-bg text-success-text hover:bg-success hover:text-white"
                }`}
              >
                {chatbot.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                {chatbot.is_active ? "Tắt chatbot" : "Bật chatbot"}
              </button>

              <button
                onClick={() => navigate(`/dashboard/bot/${chatbot.id}`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-btn text-xs font-semibold border border-brand/40 text-brand hover:bg-brand/10 transition cursor-pointer"
              >
                <LayoutDashboard size={14} />
                <span>Quản lý Tri thức, Widget & Cài đặt</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary dark:text-textDark-primary mb-4">
            Thống kê
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-input dark:bg-dark-input rounded-btn p-4">
              <p className="text-xs text-text-muted dark:text-textDark-secondary mb-1">Tổng tin nhắn</p>
              <p className="text-2xl font-bold text-text-primary dark:text-textDark-primary">
                {chatbot.stats?.total_messages || 0}
              </p>
            </div>
            <div className="bg-surface-input dark:bg-dark-input rounded-btn p-4">
              <p className="text-xs text-text-muted dark:text-textDark-secondary mb-1">Hôm nay</p>
              <p className="text-2xl font-bold text-text-primary dark:text-textDark-primary">
                {chatbot.stats?.today || 0}
              </p>
            </div>
            <div className="bg-surface-input dark:bg-dark-input rounded-btn p-4">
              <p className="text-xs text-text-muted dark:text-textDark-secondary mb-1">Tuần này</p>
              <p className="text-2xl font-bold text-text-primary dark:text-textDark-primary">
                {chatbot.stats?.this_week || 0}
              </p>
            </div>
            <div className="bg-surface-input dark:bg-dark-input rounded-btn p-4">
              <p className="text-xs text-text-muted dark:text-textDark-secondary mb-1">Tháng này</p>
              <p className="text-2xl font-bold text-text-primary dark:text-textDark-primary">
                {chatbot.stats?.this_month || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={20} className="text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary dark:text-textDark-primary">
            Tin nhắn gần đây
          </h3>
        </div>

        {messagesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-brand" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-8">Chưa có tin nhắn nào</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="border border-surface-border dark:border-dark-border rounded-btn p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-text-muted dark:text-textDark-secondary font-mono">
                    {new Date(msg.timestamp).toLocaleString("vi-VN")}
                  </span>
                  <span className="text-xs text-text-muted dark:text-textDark-muted">
                    Session: {msg.session_id}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="bg-surface-input dark:bg-dark-input rounded-btn p-3">
                    <p className="text-xs text-text-muted dark:text-textDark-secondary mb-1">Người dùng:</p>
                    <p className="text-sm text-text-primary dark:text-textDark-primary">{msg.question}</p>
                  </div>
                  <div className="bg-brand-soft dark:bg-brand-softDark rounded-btn p-3">
                    <p className="text-xs text-text-muted dark:text-textDark-secondary mb-1">Chatbot:</p>
                    <p className="text-sm text-text-primary dark:text-textDark-primary">{msg.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1">
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
        )}
      </div>
    </div>
  );
}
