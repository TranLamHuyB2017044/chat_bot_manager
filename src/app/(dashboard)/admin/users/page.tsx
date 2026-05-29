import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Search, UserPlus, Shield, ShieldOff, Trash2 } from "lucide-react";

// Demo user data — replace with DB call
const USERS = [
  { id: "1", name: "Admin BitTech",  email: "admin@bittech.io",  role: "admin", status: "active",  joined: "2024-01-15" },
  { id: "2", name: "Normal User",    email: "user@bittech.io",   role: "user",  status: "active",  joined: "2024-03-22" },
  { id: "3", name: "Nguyễn Thị Hoa",email: "hoa@email.com",     role: "user",  status: "active",  joined: "2025-05-01" },
  { id: "4", name: "Trần Minh Khoa", email: "khoa@email.com",    role: "user",  status: "banned",  joined: "2025-04-10" },
  { id: "5", name: "Lê Thị Lan",     email: "lan@email.com",     role: "admin", status: "active",  joined: "2024-11-08" },
  { id: "6", name: "Phạm Văn Đức",   email: "duc@email.com",     role: "user",  status: "inactive",joined: "2025-03-30" },
];

export default async function UsersPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/dashboard");

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary dark:text-textDark-primary">
            Quản lý người dùng
          </h1>
          <p className="text-sm text-text-muted dark:text-textDark-secondary mt-0.5">
            {USERS.length} tài khoản trong hệ thống
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-btn bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition shadow-sm shadow-brand/20">
          <UserPlus size={15} />
          Thêm người dùng
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-textDark-muted"
          />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            className="w-full pl-9 pr-3 py-2 rounded-btn text-sm bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border text-text-primary dark:text-textDark-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex rounded-btn overflow-hidden border border-surface-border dark:border-dark-border bg-surface-card dark:bg-dark-card">
          {["Tất cả", "Active", "Banned"].map((f, i) => (
            <button
              key={f}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                i === 0
                  ? "bg-brand text-white"
                  : "text-text-muted dark:text-textDark-secondary hover:bg-surface-input dark:hover:bg-dark-input"
              } ${i > 0 ? "border-l border-surface-border dark:border-dark-border" : ""}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-page dark:bg-dark-page border-b border-surface-border dark:border-dark-border">
            <tr>
              {["Người dùng", "Email", "Vai trò", "Trạng thái", "Ngày tham gia", "Hành động"].map((h) => (
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
            {USERS.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-surface-page dark:hover:bg-dark-page transition-colors"
              >
                {/* Avatar + Name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand/15 dark:bg-brand/10 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                      {user.name[0]}
                    </div>
                    <span className="font-medium text-text-primary dark:text-textDark-primary text-sm">
                      {user.name}
                    </span>
                  </div>
                </td>

                {/* Email */}
                <td className="px-4 py-3 text-xs text-text-muted dark:text-textDark-secondary">
                  {user.email}
                </td>

                {/* Role */}
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-pill font-semibold ${
                    user.role === "admin"
                      ? "bg-brand-soft text-success-text dark:bg-brand-softDark dark:text-brand"
                      : "bg-surface-input dark:bg-dark-input text-text-muted dark:text-textDark-secondary"
                  }`}>
                    {user.role}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-pill font-semibold ${
                    user.status === "active"
                      ? "bg-success-bg text-success-text"
                      : user.status === "banned"
                      ? "bg-danger-bg text-danger-text"
                      : "bg-warning-bg text-warning-text"
                  }`}>
                    {user.status}
                  </span>
                </td>

                {/* Joined */}
                <td className="px-4 py-3 text-xs text-text-muted dark:text-textDark-secondary font-mono">
                  {user.joined}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1.5 rounded-btn text-text-muted dark:text-textDark-muted hover:bg-brand-soft dark:hover:bg-brand-softDark hover:text-success-text transition"
                      title={user.role === "admin" ? "Hạ quyền" : "Nâng quyền Admin"}
                    >
                      {user.role === "admin" ? (
                        <ShieldOff size={14} />
                      ) : (
                        <Shield size={14} />
                      )}
                    </button>
                    <button
                      className="p-1.5 rounded-btn text-text-muted dark:text-textDark-muted hover:bg-danger-bg hover:text-danger-text transition"
                      title="Xoá tài khoản"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Table footer */}
        <div className="px-4 py-3 border-t border-surface-border dark:border-dark-border flex items-center justify-between">
          <p className="text-xs text-text-muted dark:text-textDark-secondary">
            Hiển thị {USERS.length} / {USERS.length} người dùng
          </p>
          <div className="flex gap-1">
            {["←", "1", "2", "→"].map((p) => (
              <button
                key={p}
                className="w-7 h-7 rounded-btn text-xs font-medium text-text-muted dark:text-textDark-secondary hover:bg-surface-input dark:hover:bg-dark-input transition flex items-center justify-center"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
