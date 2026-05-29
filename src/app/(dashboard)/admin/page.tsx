import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import KpiCard from "@/components/dashboard/KpiCard";
import { Users, Activity, ShieldOff, DollarSign } from "lucide-react";
import type { AuthUser } from "@/types/auth";

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Tổng users" value="1,204" change="+32" up icon={<Users size={16} />} />
        <KpiCard label="Active now"  value="87"    change="+5"  up icon={<Activity size={16} />} />
        <KpiCard label="Bị ban"      value="12"    change="+2"  up={false} icon={<ShieldOff size={16} />} />
        <KpiCard label="Revenue (M)" value="$1.2M" change="+18%" up icon={<DollarSign size={16} />} />
      </div>

      {/* System status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              { service: "Email Service", status: "Degraded", latency: "320ms", ok: false },
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
            Đăng ký gần đây
          </p>
          <div className="space-y-3">
            {[
              { name: "Nguyễn Thị Hoa", email: "hoa@email.com",  role: 2, time: "2 min ago"  },
              { name: "Trần Minh Khoa", email: "khoa@email.com", role: 2, time: "15 min ago" },
              { name: "Lê Thị Lan",     email: "lan@email.com",  role: 0, time: "1 hr ago"   },
              { name: "Phạm Văn Đức",   email: "duc@email.com",  role: 2, time: "3 hr ago"   },
            ].map(({ name, email, role, time }) => (
              <div key={email} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-brand/15 dark:bg-brand/10 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                    {name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary dark:text-textDark-primary truncate">{name}</p>
                    <p className="text-[10px] text-text-muted dark:text-textDark-muted truncate">{email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-pill font-semibold ${
                    role === 0
                      ? "bg-brand-soft text-success-text dark:bg-brand-softDark dark:text-brand"
                      : "bg-surface-input dark:bg-dark-input text-text-muted dark:text-textDark-secondary"
                  }`}>
                    {role === 0 ? "Admin" : "User"}
                  </span>
                  <span className="text-[10px] text-text-muted dark:text-textDark-muted">{time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
