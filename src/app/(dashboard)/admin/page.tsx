import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import KpiCard from "@/components/dashboard/KpiCard";
import { Users, Activity, ShieldOff, DollarSign, Bot } from "lucide-react";
import type { AuthUser } from "@/types/auth";
import { backendFetch } from "@/lib/backendFetch";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const userStr = cookieStore.get("bt_user")?.value;

  if (!userStr) redirect("/login");

  let user: AuthUser;
  try {
    user = JSON.parse(userStr) as AuthUser;
  } catch {
    redirect("/login");
  }

  // Chỉ admin (role === 0) mới được vào trang này
  if (user!.role !== 0) redirect("/dashboard");

  // Tải danh sách tài khoản từ API thực
  let accounts: any[] = [];
  let chatbots: any[] = [];
  try {
    const resAccounts = await backendFetch("/api/admin/accounts");
    const jsonAccounts = await resAccounts.json();
    accounts = jsonAccounts.data || [];

    const resChatbots = await backendFetch("/api/chatbot");
    const jsonChatbots = await resChatbots.json();
    chatbots = jsonChatbots.data || [];
  } catch (err) {
    console.error("Error fetching data:", err);
  }

  const totalAccounts = accounts.length;
  const totalRequests = accounts.reduce((acc, a) => acc + (a.used_requests || 0), 0);
  const premiumAccounts = accounts.filter(a => a.plan > 0).length;
  const totalChatbots = chatbots.length;
  const activeChatbots = chatbots.filter(cb => cb.is_active).length;

  return (
    <div className="space-y-6 max-w-7xl">
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
        <KpiCard label="Tổng tài khoản" value={totalAccounts.toString()} change={`+${totalAccounts}`} up icon={<Users size={16} />} />
        <KpiCard label="Lượt yêu cầu (reqs)"  value={totalRequests.toString()}    change="+100%"  up icon={<Activity size={16} />} />
        <KpiCard label="Premium (Pro+)"      value={premiumAccounts.toString()}    change={`+${premiumAccounts}`}  up icon={<DollarSign size={16} />} />
        <KpiCard label="Tổng chatbot"        value={totalChatbots.toString()}     change={`+${totalChatbots}`} up icon={<Bot size={16} />} />
        <KpiCard label="Hệ thống" value="Bình thường" change="100% OK" up icon={<ShieldOff size={16} />} />
      </div>

      {/* System status & recent items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* System Health */}
        <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-5">
          <p className="text-sm font-semibold text-text-primary dark:text-textDark-primary mb-4">
            System Health
          </p>
          <div className="space-y-3">
            {[
              { service: "API Server",    status: "Healthy",  latency: "12ms",  ok: true  },
              { service: "Database",      status: "Healthy",  latency: "3ms",   ok: true  },
              { service: "Auth Service",  status: "Healthy",  latency: "8ms",   ok: true  },
              { service: "Email Service", status: "Healthy", latency: "24ms", ok: true },
            ].map(({ service, status, latency, ok }) => (
              <div key={service} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${ok ? "bg-success" : "bg-warning"}`} />
                  <span className="text-sm text-text-primary dark:text-textDark-primary">{service}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted dark:text-textDark-secondary font-mono">{latency}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-pill font-medium ${ok ? "bg-success-bg text-success-text" : "bg-warning-bg text-warning-text"}`}>
                    {status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent registrations */}
        <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-5">
          <p className="text-sm font-semibold text-text-primary dark:text-textDark-primary mb-4">
            Danh sách tài khoản doanh nghiệp
          </p>
          <div className="space-y-3">
            {accounts.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">Chưa có tài khoản nào trong hệ thống</p>
            ) : (
              accounts.slice(0, 4).map((acc: any) => (
                <div key={acc._id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-brand/15 dark:bg-brand/10 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                      {acc.name?.[0]?.toUpperCase() || "A"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary dark:text-textDark-primary truncate">{acc.name || "Tài khoản vô danh"}</p>
                      <p className="text-[10px] text-text-muted dark:text-textDark-muted truncate">Plan ID: {acc.plan || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-pill font-semibold bg-brand-soft text-success-text dark:bg-brand-softDark dark:text-brand`}>
                      {acc.used_requests || 0} reqs
                    </span>
                    <span className="text-[10px] text-text-muted dark:text-textDark-muted">
                      {acc.created_at ? new Date(acc.created_at).toLocaleDateString("vi-VN") : "Gần đây"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent chatbots */}
        <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-5">
          <p className="text-sm font-semibold text-text-primary dark:text-textDark-primary mb-4">
            Chatbot gần đây
          </p>
          <div className="space-y-3">
            {chatbots.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">Chưa có chatbot nào trong hệ thống</p>
            ) : (
              chatbots.slice(0, 4).map((cb: any) => (
                <div key={cb._id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-brand/15 dark:bg-brand/10 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                      {cb.name?.[0]?.toUpperCase() || "B"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary dark:text-textDark-primary truncate">{cb.name || "Chatbot không tên"}</p>
                      <p className="text-[10px] text-text-muted dark:text-textDark-muted truncate">
                        {cb.is_active ? "Hoạt động" : "Không hoạt động"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-text-muted dark:text-textDark-muted">
                    {cb.created_at ? new Date(cb.created_at).toLocaleDateString("vi-VN") : "Gần đây"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
