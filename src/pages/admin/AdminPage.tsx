import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import KpiCard from "@/components/dashboard/KpiCard";
import { Users, Activity, ShieldOff, MessageSquare, Bot, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { DashboardStats } from "@/types/admin";

export default function AdminPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiFetch("/api/admin/dashboard");
        const json = await res.json();
        setStats(json.data || null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary dark:text-textDark-primary">
            Admin Overview
          </h1>
          <p className="text-sm text-text-muted dark:text-textDark-secondary mt-0.5">
            Toàn bộ hệ thống — chỉ Admin mới thấy trang này.
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-pill bg-brand-soft dark:bg-brand-softDark text-success-text dark:text-brand font-semibold border border-brand/20">
          🛡 Admin Mode
        </span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard 
          label="Tổng người dùng" 
          value={stats?.total_users.toString() || "0"} 
          change={stats?.active_users.toString() || "0"} 
          up 
          icon={<Users size={16} />} 
        />
        <KpiCard 
          label="Người dùng hoạt động" 
          value={stats?.active_users.toString() || "0"} 
          change={`${stats ? Math.round((stats.active_users / stats.total_users) * 100) : 0}%`} 
          up 
          icon={<Activity size={16} />} 
        />
        <KpiCard 
          label="Tổng chatbot" 
          value={stats?.total_chatbots.toString() || "0"} 
          change={stats?.active_chatbots.toString() || "0"} 
          up 
          icon={<Bot size={16} />} 
        />
        <KpiCard 
          label="Tin nhắn hôm nay" 
          value={stats?.messages_today.toString() || "0"} 
          change="Hôm nay" 
          up 
          icon={<MessageSquare size={16} />} 
        />
        <KpiCard 
          label="Tổng tin nhắn" 
          value={stats?.total_messages.toString() || "0"} 
          change="Tất cả" 
          up 
          icon={<ShieldOff size={16} />} 
        />
      </div>

      {/* Stats & recent items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Message Stats */}
        <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-5">
          <p className="text-sm font-semibold text-text-primary dark:text-textDark-primary mb-4">
            Thống kê tin nhắn
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted dark:text-textDark-secondary">Tuần này</span>
              <span className="text-sm font-bold text-text-primary dark:text-textDark-primary">{stats?.messages_this_week || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted dark:text-textDark-secondary">Tháng này</span>
              <span className="text-sm font-bold text-text-primary dark:text-textDark-primary">{stats?.messages_this_month || 0}</span>
            </div>
            <div className="pt-3 border-t border-surface-border dark:border-dark-border">
              <div className="flex items-center gap-2 text-xs text-text-muted dark:text-textDark-secondary">
                <TrendingUp className="text-success" size={14} />
                <span>Hệ thống đang hoạt động ổn định</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Users by Messages */}
        <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-5">
          <p className="text-sm font-semibold text-text-primary dark:text-textDark-primary mb-4">
            Người dùng hoạt động nhất
          </p>
          <div className="space-y-3">
            {!stats?.top_users_by_messages || stats.top_users_by_messages.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">Chưa có dữ liệu</p>
            ) : (
              stats.top_users_by_messages.slice(0, 4).map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-brand/15 dark:bg-brand/10 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                      {user.fullname?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary dark:text-textDark-primary truncate">{user.fullname}</p>
                      <p className="text-[10px] text-text-muted dark:text-textDark-muted truncate">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-pill font-semibold bg-brand-soft text-success-text dark:bg-brand-softDark dark:text-brand">
                    {user.message_count} tin
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Active Chatbots */}
        <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-5">
          <p className="text-sm font-semibold text-text-primary dark:text-textDark-primary mb-4">
            Chatbot hoạt động gần đây
          </p>
          <div className="space-y-3">
            {!stats?.latest_active_chatbots || stats.latest_active_chatbots.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">Chưa có chatbot nào</p>
            ) : (
              stats.latest_active_chatbots.slice(0, 4).map((chatbot) => (
                <div key={chatbot.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-brand/15 dark:bg-brand/10 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                      {chatbot.name?.[0]?.toUpperCase() || "C"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary dark:text-textDark-primary truncate">{chatbot.name}</p>
                      <p className="text-[10px] text-text-muted dark:text-textDark-muted truncate">{chatbot.user_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-pill font-semibold bg-success-bg text-success-text">
                      {chatbot.message_count} tin
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
