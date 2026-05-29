"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/authStore";
import { Search, UserPlus, Shield, ShieldOff, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Demo user data — replace with DB call
const USERS = [
  { id: "1", name: "Admin BitTech",  email: "admin@bittech.io",  role: 0, status: "active",  joined: "2024-01-15" },
  { id: "2", name: "Normal User",    email: "user@bittech.io",   role: 2, status: "active",  joined: "2024-03-22" },
  { id: "3", name: "Nguyễn Thị Hoa",email: "hoa@email.com",     role: 2, status: "active",  joined: "2025-05-01" },
  { id: "4", name: "Trần Minh Khoa", email: "khoa@email.com",    role: 2, status: "banned",  joined: "2025-04-10" },
  { id: "5", name: "Lê Thị Lan",     email: "lan@email.com",     role: 0, status: "active",  joined: "2024-11-08" },
  { id: "6", name: "Phạm Văn Đức",   email: "duc@email.com",     role: 2, status: "inactive",joined: "2025-03-30" },
];

const createUserSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  fullname: z.string().min(1, "Vui lòng nhập họ tên"),
  phone: z.string().optional(),
  role: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(2),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export default function UsersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if not admin
  if (!user || user.role !== 0) {
    router.push("/dashboard");
    return null;
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData>({ resolver: zodResolver(createUserSchema) });

  const onSubmitCreateUser = async (data: CreateUserFormData) => {
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // x-api-key được tự động đọc từ HttpOnly cookie server-side
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.statusCode === 201) {
        setSuccess("Tạo tài khoản thành công!");
        setShowModal(false);
        reset();
        // TODO: Refresh user list
      } else {
        setError(result.message || "Tạo tài khoản thất bại");
      }
    } catch (err) {
      setError("Có lỗi xảy ra, vui lòng thử lại sau");
    }
  };

  const getRoleLabel = (role: number) => {
    switch (role) {
      case 0: return "Admin";
      case 1: return "Manager";
      case 2: return "User";
      default: return "Unknown";
    }
  };

  const inputCls = (hasErr?: boolean) =>
    cn(
      "w-full px-3 py-2.5 rounded-btn text-sm transition",
      "bg-surface-input dark:bg-dark-input",
      "border border-surface-border dark:border-dark-border",
      "text-text-primary dark:text-textDark-primary",
      "placeholder:text-text-muted dark:placeholder:text-textDark-muted",
      "focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20",
      hasErr && "border-danger focus:border-danger focus:ring-danger/20"
    );

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
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-btn bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition shadow-sm shadow-brand/20"
        >
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
                    user.role === 0
                      ? "bg-brand-soft text-success-text dark:bg-brand-softDark dark:text-brand"
                      : "bg-surface-input dark:bg-dark-input text-text-muted dark:text-textDark-secondary"
                  }`}>
                    {getRoleLabel(user.role)}
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
                      title={user.role === 0 ? "Hạ quyền" : "Nâng quyền Admin"}
                    >
                      {user.role === 0 ? (
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

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary dark:text-textDark-primary">
                Thêm người dùng mới
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-btn hover:bg-surface-input dark:hover:bg-dark-input text-text-muted dark:text-textDark-muted transition"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-btn bg-danger-bg border border-danger/20 text-danger-text text-sm flex items-center gap-2">
                <span className="shrink-0">⚠️</span>
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 px-4 py-3 rounded-btn bg-success-bg border border-success/20 text-success-text text-sm flex items-center gap-2">
                <span className="shrink-0">✅</span>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmitCreateUser)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-textDark-secondary mb-1.5">
                  Tên đăng nhập *
                </label>
                <input
                  {...register("username")}
                  type="text"
                  placeholder="tenduongdai"
                  className={inputCls(!!errors.username)}
                />
                {errors.username && (
                  <p className="text-xs text-danger mt-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-textDark-secondary mb-1.5">
                  Email *
                </label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="email@example.com"
                  className={inputCls(!!errors.email)}
                />
                {errors.email && (
                  <p className="text-xs text-danger mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-textDark-secondary mb-1.5">
                  Họ tên *
                </label>
                <input
                  {...register("fullname")}
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className={inputCls(!!errors.fullname)}
                />
                {errors.fullname && (
                  <p className="text-xs text-danger mt-1">{errors.fullname.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-textDark-secondary mb-1.5">
                  Số điện thoại
                </label>
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder="0123456789"
                  className={inputCls()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-textDark-secondary mb-1.5">
                  Mật khẩu *
                </label>
                <input
                  {...register("password")}
                  type="password"
                  placeholder="••••••••"
                  className={inputCls(!!errors.password)}
                />
                {errors.password && (
                  <p className="text-xs text-danger mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-textDark-secondary mb-1.5">
                  Vai trò
                </label>
                <select
                  {...register("role", { valueAsNumber: true })}
                  className={inputCls()}
                >
                  <option value={2}>User</option>
                  <option value={1}>Manager</option>
                  <option value={0}>Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-btn text-sm font-semibold text-text-secondary dark:text-textDark-secondary bg-surface-input dark:bg-dark-input hover:bg-surface-border dark:hover:bg-dark-border transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-btn text-sm font-semibold text-white bg-brand hover:bg-brand-hover active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Đang tạo...
                    </span>
                  ) : (
                    "Tạo tài khoản"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
