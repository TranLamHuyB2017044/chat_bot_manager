import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/authStore";
import { Search, UserPlus, Shield, ShieldOff, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/Sonner";
import { apiFetch } from "@/lib/api";

const createUserSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  fullname: z.string().min(1, "Vui lòng nhập họ tên"),
  phone: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export default function UsersPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);

  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData>({ resolver: zodResolver(createUserSchema) });

  // Fetch actual registered accounts
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/admin/accounts");
      const result = await response.json();
      if (response.ok && result.data) {
        const mappedUsers = result.data.map((acc: any) => ({
          id: acc._id || acc.id,
          name: acc.name || "Tài khoản vô danh",
          email: acc.email || `${acc.name?.toLowerCase().replace(/\s+/g, "") || "user"}@example.com`,
          role: acc.role !== undefined ? acc.role : 4, // 4: User
          status: acc.status || "active",
          joined: acc.created_at ? new Date(acc.created_at).toLocaleDateString("vi-VN") : "Gần đây"
        }));
        setUsersList(mappedUsers);
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Redirect if not admin
    if (!user || user.role !== 0) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  if (!user || user.role !== 0) {
    return null;
  }

  const onSubmitCreateUser = async (data: CreateUserFormData) => {
    try {
      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ ...data, role: 4 }),
      });
      const result = await response.json();

      if (result.statusCode === 201) {
        toast.success("Tạo tài khoản thành công!");
        setShowModal(false);
        reset();
        fetchUsers(); // Refresh list after successful creation!
      } else {
        toast.error(result.message || "Tạo tài khoản thất bại");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau");
    }
  };

  const getRoleLabel = (role: number) => {
    switch (role) {
      case 0: return "Admin";
      case 1: return "Manager";
      case 2: return "User";
      case 4: return "User";
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
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary dark:text-textDark-primary">
            Quản lý người dùng
          </h1>
          <p className="text-sm text-text-muted dark:text-textDark-secondary mt-0.5">
            {usersList.length} tài khoản trong hệ thống
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
        <div className="relative flex-1 min-w-50 max-w-xs">
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
              className={`px-3 py-1.5 text-xs font-medium transition ${i === 0
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
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <div className="flex justify-center items-center gap-2 text-brand">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-xs font-semibold">Đang tải danh sách...</span>
                  </div>
                </td>
              </tr>
            ) : usersList.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-text-muted">
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            ) : (
              usersList.map((userObj) => (
                <tr
                  key={userObj.id}
                  className="hover:bg-surface-page dark:hover:bg-dark-page transition-colors"
                >
                  {/* Avatar + Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand/15 dark:bg-brand/10 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                        {userObj.name[0]}
                      </div>
                      <span className="font-medium text-text-primary dark:text-textDark-primary text-sm">
                        {userObj.name}
                      </span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-xs text-text-muted dark:text-textDark-secondary">
                    {userObj.email}
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-pill font-semibold ${userObj.role === 0
                        ? "bg-brand-soft text-success-text dark:bg-brand-softDark dark:text-brand"
                        : "bg-surface-input dark:bg-dark-input text-text-muted dark:text-textDark-secondary"
                      }`}>
                      {getRoleLabel(userObj.role)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-pill font-semibold ${userObj.status === "active"
                        ? "bg-success-bg text-success-text"
                        : userObj.status === "banned"
                          ? "bg-danger-bg text-danger-text"
                          : "bg-warning-bg text-warning-text"
                      }`}>
                      {userObj.status}
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-xs text-text-muted dark:text-textDark-secondary font-mono">
                    {userObj.joined}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 rounded-btn text-text-muted dark:text-textDark-muted hover:bg-brand-soft dark:hover:bg-brand-softDark hover:text-success-text transition"
                        title={userObj.role === 0 ? "Hạ quyền" : "Nâng quyền Admin"}
                      >
                        {userObj.role === 0 ? (
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
              )))}
          </tbody>
        </table>

        {/* Table footer */}
        <div className="px-4 py-3 border-t border-surface-border dark:border-dark-border flex items-center justify-between">
          <p className="text-xs text-text-muted dark:text-textDark-secondary">
            Hiển thị {usersList.length} / {usersList.length} người dùng
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
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
