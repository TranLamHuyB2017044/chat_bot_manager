import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/authStore";
import { Search, UserPlus, Eye, Power, PowerOff, X, Loader2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/Sonner";
import { apiFetch } from "@/lib/api";
import { User as UserType, PaginatedResponse } from "@/types/admin";

const createUserSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  fullname: z.string().min(1, "Vui lòng nhập họ tên"),
  phone: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

const editUserSchema = z.object({
  fullname: z.string().min(1, "Vui lòng nhập họ tên"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().optional(),
  role: z.coerce.number(),
  password: z.string().optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

export default function UsersPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData>({ resolver: zodResolver(createUserSchema) });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isSubmittingEdit },
  } = useForm<EditUserFormData>({ resolver: zodResolver(editUserSchema) });

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (searchDebounce) {
        params.append("search", searchDebounce);
      }
      const response = await apiFetch(`/api/admin/users?${params}`);
      const result = await response.json();
      console.log("[GET /api/admin/users Data]:", result);

      if (result && result.data) {
        const users = Array.isArray(result.data)
          ? result.data
          : (result.data.users ?? []);
        setUsersList(users);

        const totalP =
          result.data.pagination?.total_pages ??
          result.pagination?.total_pages ??
          (Array.isArray(result.data) ? Math.ceil(result.data.length / 10) : 1);
        setTotalPages(Math.max(1, totalP));
      } else {
        setUsersList([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle user active status
  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/toggle-active`, {
        method: "PUT",
      });
      if (res.ok) {
        toast.success(`Người dùng ${currentStatus ? "đã tắt" : "đã bật"}`);
        fetchUsers();
      } else {
        toast.error("Có lỗi xảy ra");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra");
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [page, searchDebounce]);

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

  const handleOpenEditUser = (targetUser: UserType) => {
    setEditingUser(targetUser);
    resetEdit({
      fullname: targetUser.fullname || "",
      email: targetUser.email || "",
      phone: targetUser.phone || "",
      role: targetUser.role ?? 4,
      password: "",
    });
  };

  const onSubmitEditUser = async (data: EditUserFormData) => {
    if (!editingUser) return;
    const uid = editingUser._id || editingUser.id || editingUser.account_id || "";
    if (!uid) return;
    try {
      const payload: Record<string, any> = {
        fullname: data.fullname.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || "",
        role: Number(data.role),
      };
      if (data.password && data.password.trim().length > 0) {
        payload.password = data.password.trim();
      }

      const res = await apiFetch(`/api/admin/users/${uid}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && (result.statusCode === 200 || !result.statusCode)) {
        toast.success("Cập nhật thông tin người dùng thành công!");
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error(result.message || result.error || "Cập nhật người dùng thất bại");
      }
    } catch (err: any) {
      toast.error(err?.message || "Có lỗi xảy ra, vui lòng thử lại sau");
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
            {(usersList || []).length} tài khoản trong hệ thống
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-btn text-sm bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border text-text-primary dark:text-textDark-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
          />
        </div>
      </div>

      {/* Users table */}
      <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-page dark:bg-dark-page border-b border-surface-border dark:border-dark-border">
            <tr>
              {["Người dùng", "Email", "Điện thoại", "Trạng thái", "Chatbot", "Tin nhắn", "Ngày tham gia", "Hành động"].map((h) => (
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
                <td colSpan={8} className="py-10 text-center">
                  <div className="flex justify-center items-center gap-2 text-brand">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-xs font-semibold">Đang tải danh sách...</span>
                  </div>
                </td>
              </tr>
            ) : (!usersList || usersList.length === 0) ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-xs text-text-muted">
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            ) : (
              (usersList || []).map((userObj) => {
                const uid = userObj._id || userObj.id || userObj.account_id || "";
                return (
                  <tr
                    key={uid}
                    className="hover:bg-surface-page dark:hover:bg-dark-page transition-colors"
                  >
                    {/* Avatar + Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand/15 dark:bg-brand/10 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                          {userObj.fullname?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary dark:text-textDark-primary text-sm truncate">
                            {userObj.fullname}
                          </p>
                          <p className="text-xs text-text-muted dark:text-textDark-muted truncate">
                            @{userObj.username}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-xs text-text-muted dark:text-textDark-secondary">
                      {userObj.email}
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-xs text-text-muted dark:text-textDark-secondary">
                      {userObj.phone || "-"}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-pill font-semibold ${userObj.active
                          ? "bg-success-bg text-success-text"
                          : "bg-danger-bg text-danger-text"
                        }`}>
                        {userObj.active ? "Hoạt động" : "Đã tắt"}
                      </span>
                    </td>

                    {/* Chatbots */}
                    <td className="px-4 py-3 text-xs text-text-primary dark:text-textDark-primary">
                      {userObj.chatbot_count || 0}
                    </td>

                    {/* Messages */}
                    <td className="px-4 py-3 text-xs text-text-primary dark:text-textDark-primary">
                      {userObj.total_messages || 0}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-text-muted dark:text-textDark-secondary font-mono">
                      {userObj.created_at ? new Date(userObj.created_at).toLocaleDateString("vi-VN") : "-"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/admin/users/${uid}`)}
                          className="p-1.5 rounded-btn text-text-muted dark:text-textDark-muted hover:bg-brand-soft dark:hover:bg-brand-softDark hover:text-success-text transition"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEditUser(userObj)}
                          className="p-1.5 rounded-btn text-text-muted dark:text-textDark-muted hover:bg-brand-soft dark:hover:bg-brand-softDark hover:text-brand transition"
                          title="Chỉnh sửa thông tin"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => toggleUserActive(uid, userObj.active)}
                          className={`p-1.5 rounded-btn transition ${
                            userObj.active
                              ? "text-text-muted dark:text-textDark-muted hover:bg-danger-bg hover:text-danger-text"
                              : "text-text-muted dark:text-textDark-muted hover:bg-success-bg hover:text-success-text"
                          }`}
                          title={userObj.active ? "Tắt tài khoản" : "Bật tài khoản"}
                        >
                          {userObj.active ? <PowerOff size={14} /> : <Power size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
          </tbody>
        </table>

        {/* Table footer */}
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
      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary dark:text-textDark-primary">
                Chỉnh sửa người dùng
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-btn hover:bg-surface-input dark:hover:bg-dark-input text-text-muted dark:text-textDark-muted transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit(onSubmitEditUser)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-textDark-secondary mb-1.5">
                  Họ tên *
                </label>
                <input
                  {...registerEdit("fullname")}
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className={inputCls(!!editErrors.fullname)}
                />
                {editErrors.fullname && (
                  <p className="text-xs text-danger mt-1">{editErrors.fullname.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-textDark-secondary mb-1.5">
                  Email *
                </label>
                <input
                  {...registerEdit("email")}
                  type="email"
                  placeholder="email@example.com"
                  className={inputCls(!!editErrors.email)}
                />
                {editErrors.email && (
                  <p className="text-xs text-danger mt-1">{editErrors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-textDark-secondary mb-1.5">
                  Số điện thoại
                </label>
                <input
                  {...registerEdit("phone")}
                  type="tel"
                  placeholder="0123456789"
                  className={inputCls()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-textDark-secondary mb-1.5">
                  Vai trò (Role) *
                </label>
                <select
                  {...registerEdit("role")}
                  className={inputCls()}
                >
                  <option value={4}>Người dùng thông thường (User)</option>
                  <option value={0}>Quản trị viên (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-textDark-secondary mb-1.5">
                  Đặt lại mật khẩu mới (Tùy chọn)
                </label>
                <input
                  {...registerEdit("password")}
                  type="password"
                  placeholder="Để trống nếu không muốn đổi mật khẩu"
                  className={inputCls()}
                />
                <span className="text-[11px] text-text-muted mt-1 inline-block">
                  Chỉ nhập khi bạn muốn thiết lập lại mật khẩu đăng nhập cho người dùng này.
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 rounded-btn text-sm font-semibold text-text-secondary dark:text-textDark-secondary bg-surface-input dark:bg-dark-input hover:bg-surface-border dark:hover:bg-dark-border transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex-1 py-2.5 rounded-btn text-sm font-semibold text-white bg-brand hover:bg-brand-hover active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingEdit ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Đang lưu...
                    </span>
                  ) : (
                    "Lưu thay đổi"
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
