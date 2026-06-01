import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Calendar, Bot, Mail, Phone, Loader2, Power, PowerOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { User as UserType, Chatbot } from "@/types/admin";
import { toast } from "@/components/ui/Sonner";

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/users/${id}`);
      const json = await res.json();
      setUser(json.data);
    } catch (err) {
      console.error("Error fetching user:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserActive = async () => {
    if (!id || !user) return;
    try {
      const res = await apiFetch(`/api/admin/users/${id}/toggle-active`, {
        method: "PUT",
      });
      if (res.ok) {
        toast.success(`Người dùng ${user.active ? "đã tắt" : "đã bật"}`);
        fetchUser();
      } else {
        toast.error("Có lỗi xảy ra");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra");
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <p className="text-text-muted">Không tìm thấy người dùng</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/users")}
          className="p-2 rounded-btn hover:bg-surface-input dark:hover:bg-dark-input transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary dark:text-textDark-primary">
            {user.fullname}
          </h1>
          <p className="text-sm text-text-muted dark:text-textDark-secondary mt-0.5">
            {user.username}
          </p>
        </div>
      </div>

      {/* User Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Basic Info */}
        <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-5 lg:col-span-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-brand/15 dark:bg-brand/10 flex items-center justify-center text-2xl font-bold text-brand">
              {user.fullname?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary dark:text-textDark-primary">
                {user.fullname}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-pill font-semibold inline-block mt-1 ${
                  user.active
                    ? "bg-success-bg text-success-text"
                    : "bg-danger-bg text-danger-text"
                }`}
              >
                {user.active ? "Hoạt động" : "Đã tắt"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User size={16} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-muted dark:text-textDark-secondary">Tên đăng nhập</p>
                <p className="text-sm text-text-primary dark:text-textDark-primary">
                  {user.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Mail size={16} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-muted dark:text-textDark-secondary">Email</p>
                <p className="text-sm text-text-primary dark:text-textDark-primary">
                  {user.email}
                </p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted dark:text-textDark-secondary">Điện thoại</p>
                  <p className="text-sm text-text-primary dark:text-textDark-primary">
                    {user.phone}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-muted dark:text-textDark-secondary">Ngày tham gia</p>
                <p className="text-sm text-text-primary dark:text-textDark-primary">
                  {new Date(user.created_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border dark:border-dark-border">
              <button
                onClick={toggleUserActive}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-btn text-sm font-semibold transition ${
                  user.active
                    ? "bg-danger-bg text-danger-text hover:bg-danger hover:text-white"
                    : "bg-success-bg text-success-text hover:bg-success hover:text-white"
                }`}
              >
                {user.active ? <PowerOff size={16} /> : <Power size={16} />}
                {user.active ? "Tắt tài khoản" : "Bật tài khoản"}
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
              <p className="text-xs text-text-muted dark:text-textDark-secondary mb-1">Số chatbot</p>
              <p className="text-2xl font-bold text-text-primary dark:text-textDark-primary">
                {user.chatbot_count || 0}
              </p>
            </div>
            <div className="bg-surface-input dark:bg-dark-input rounded-btn p-4">
              <p className="text-xs text-text-muted dark:text-textDark-secondary mb-1">Tổng tin nhắn</p>
              <p className="text-2xl font-bold text-text-primary dark:text-textDark-primary">
                {user.message_stats?.total || 0}
              </p>
            </div>
            <div className="bg-surface-input dark:bg-dark-input rounded-btn p-4">
              <p className="text-xs text-text-muted dark:text-textDark-secondary mb-1">Tuần này</p>
              <p className="text-2xl font-bold text-text-primary dark:text-textDark-primary">
                {user.message_stats?.this_week || 0}
              </p>
            </div>
            <div className="bg-surface-input dark:bg-dark-input rounded-btn p-4">
              <p className="text-xs text-text-muted dark:text-textDark-secondary mb-1">Tháng này</p>
              <p className="text-2xl font-bold text-text-primary dark:text-textDark-primary">
                {user.message_stats?.this_month || 0}
              </p>
            </div>
          </div>

          {user.stats && (
            <div className="mt-4 pt-4 border-t border-surface-border dark:border-dark-border">
              <h4 className="text-xs font-semibold text-text-muted dark:text-textDark-secondary mb-3">
                Thống kê trích xuất
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-surface-input dark:bg-dark-input rounded-btn p-3">
                  <p className="text-[10px] text-text-muted dark:text-textDark-secondary mb-1">CCCD</p>
                  <p className="text-lg font-bold text-text-primary dark:text-textDark-primary">
                    {user.stats.doc_type_stats.idCard}
                  </p>
                </div>
                <div className="bg-surface-input dark:bg-dark-input rounded-btn p-3">
                  <p className="text-[10px] text-text-muted dark:text-textDark-secondary mb-1">GPLX</p>
                  <p className="text-lg font-bold text-text-primary dark:text-textDark-primary">
                    {user.stats.doc_type_stats.driverLicense}
                  </p>
                </div>
                <div className="bg-surface-input dark:bg-dark-input rounded-btn p-3">
                  <p className="text-[10px] text-text-muted dark:text-textDark-secondary mb-1">Hóa đơn</p>
                  <p className="text-lg font-bold text-text-primary dark:text-textDark-primary">
                    {user.stats.doc_type_stats.invoice}
                  </p>
                </div>
                <div className="bg-surface-input dark:bg-dark-input rounded-btn p-3">
                  <p className="text-[10px] text-text-muted dark:text-textDark-secondary mb-1">Tài liệu</p>
                  <p className="text-lg font-bold text-text-primary dark:text-textDark-primary">
                    {user.stats.doc_type_stats.document}
                  </p>
                </div>
                <div className="bg-surface-input dark:bg-dark-input rounded-btn p-3">
                  <p className="text-[10px] text-text-muted dark:text-textDark-secondary mb-1">Giấy tờ xe</p>
                  <p className="text-lg font-bold text-text-primary dark:text-textDark-primary">
                    {user.stats.doc_type_stats.vehicleDocuments}
                  </p>
                </div>
                <div className="bg-surface-input dark:bg-dark-input rounded-btn p-3">
                  <p className="text-[10px] text-text-muted dark:text-textDark-secondary mb-1">Xe</p>
                  <p className="text-lg font-bold text-text-primary dark:text-textDark-primary">
                    {user.stats.doc_type_stats.vehicle}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chatbots */}
      {user.chatbots && user.chatbots.length > 0 && (
        <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={20} className="text-text-muted" />
            <h3 className="text-sm font-semibold text-text-primary dark:text-textDark-primary">
              Chatbot của người dùng
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.chatbots.map((chatbot) => (
              <div
                key={chatbot.id}
                onClick={() => navigate(`/admin/chatbots/${chatbot.id}`)}
                className="border border-surface-border dark:border-dark-border rounded-btn p-4 hover:bg-surface-input dark:hover:bg-dark-input transition cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-brand/15 dark:bg-brand/10 flex items-center justify-center text-brand">
                    <Bot size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary dark:text-textDark-primary truncate">
                      {chatbot.name}
                    </p>
                    <p className="text-xs text-text-muted dark:text-textDark-muted truncate">
                      {chatbot.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-pill font-semibold ${
                      chatbot.is_active
                        ? "bg-success-bg text-success-text"
                        : "bg-danger-bg text-danger-text"
                    }`}
                  >
                    {chatbot.is_active ? "Hoạt động" : "Đã tắt"}
                  </span>
                  <span className="text-xs text-text-muted dark:text-textDark-muted">
                    {new Date(chatbot.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
