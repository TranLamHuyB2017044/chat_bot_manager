import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Shield,
  KeyRound,
  CheckCircle2,
  Loader2,
  Save,
  Image as ImageIcon,
  Sparkles,
  BarChart3,
  Calendar,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/Sonner";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/auth";

// Validation schema for profile update
const profileSchema = z.object({
  fullname: z.string().min(2, "Họ và tên tối thiểu 2 ký tự"),
  phone: z.string().optional(),
  avatar_url: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Validation schema for password change
const passwordSchema = z
  .object({
    old_password: z.string().min(6, "Mật khẩu hiện tại tối thiểu 6 ký tự"),
    new_password: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
    confirm_password: z.string().min(6, "Xác nhận mật khẩu tối thiểu 6 ký tự"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirm_password"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "quota">("profile");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileData, setProfileData] = useState<AuthUser | null>(user);

  // Password visibility toggles
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Forms
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    watch: watchProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile, isDirty: isDirtyProfile },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullname: user?.fullname || "",
      phone: user?.phone || "",
      avatar_url: user?.avatar_url || "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const watchedAvatarUrl = watchProfile("avatar_url");

  // Fetch latest profile from GET /api/user/profile
  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await apiFetch("/api/user/profile");
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json.user || json;
        if (data) {
          setProfileData(data);
          resetProfile({
            fullname: data.fullname || "",
            phone: data.phone || "",
            avatar_url: data.avatar_url || "",
          });
          // Update store if changed
          if (user) {
            setUser({ ...user, ...data });
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch latest user profile, using stored session:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Sync default form when user becomes available
  useEffect(() => {
    if (user && !profileData) {
      setProfileData(user);
      resetProfile({
        fullname: user.fullname || "",
        phone: user.phone || "",
        avatar_url: user.avatar_url || "",
      });
    }
  }, [user]);

  // Handle Profile Update: PUT /api/user/profile
  const onUpdateProfile = async (data: ProfileFormData) => {
    try {
      const payload = {
        fullname: data.fullname.trim(),
        phone: data.phone?.trim() || "",
        avatar_url: data.avatar_url?.trim() || "",
      };

      const res = await apiFetch("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && (result.statusCode === 200 || result.status === 200 || !result.statusCode)) {
        const updated = result.data || result.user || payload;
        const newMergedUser = {
          ...(user || ({} as AuthUser)),
          ...updated,
          fullname: payload.fullname,
          phone: payload.phone,
          avatar_url: payload.avatar_url,
        };

        setUser(newMergedUser);
        setProfileData(newMergedUser);
        resetProfile(payload);
        toast.success("Cập nhật thông tin cá nhân thành công!");
      } else {
        toast.error(result.message || result.error || "Cập nhật thông tin thất bại");
      }
    } catch (err: any) {
      toast.error(err?.message || "Có lỗi xảy ra khi cập nhật thông tin");
    }
  };

  // Handle Password Change: PUT /api/user/change-password
  const onChangePassword = async (data: PasswordFormData) => {
    try {
      const payload = {
        old_password: data.old_password,
        current_password: data.old_password, // send both for API compatibility
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      };

      const res = await apiFetch("/api/user/change-password", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && (result.statusCode === 200 || result.status === 200 || !result.statusCode)) {
        toast.success("Đổi mật khẩu thành công!");
        resetPassword();
      } else {
        toast.error(
          result.message ||
            result.error ||
            "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ."
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Có lỗi xảy ra khi đổi mật khẩu");
    }
  };

  const currentUser = profileData || user;
  const displayName = currentUser?.fullname || currentUser?.email || "Người dùng";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleLabel = currentUser?.role === 0 ? "Quản trị viên (Admin)" : "Người dùng (User)";
  const avatarToDisplay = watchedAvatarUrl || currentUser?.avatar_url;

  const inputCls = (hasErr?: boolean) =>
    cn(
      "w-full px-3.5 py-2.5 rounded-btn text-sm transition-all",
      "bg-surface-input dark:bg-dark-input",
      "border border-surface-border dark:border-dark-border",
      "text-text-primary dark:text-textDark-primary",
      "placeholder:text-text-muted dark:placeholder:text-textDark-muted",
      "focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20",
      hasErr && "border-danger focus:border-danger focus:ring-danger/20"
    );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-textDark-primary">
            Hồ sơ & Tài khoản
          </h1>
          <p className="text-sm text-text-muted dark:text-textDark-secondary mt-1">
            Quản lý thông tin cá nhân, cập nhật mật khẩu và bảo mật tài khoản của bạn.
          </p>
        </div>
        {loadingProfile && (
          <div className="flex items-center gap-2 text-xs text-brand font-medium">
            <Loader2 size={16} className="animate-spin" />
            <span>Đang đồng bộ dữ liệu...</span>
          </div>
        )}
      </div>

      {/* User Header Profile Card */}
      <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar with Preview */}
          <div className="relative group shrink-0">
            {avatarToDisplay ? (
              <img
                src={avatarToDisplay}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover border-2 border-brand/40 shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    displayName
                  )}&background=2DB87A&color=fff`;
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-brand/20 select-none">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 p-1 bg-brand text-white rounded-full shadow-sm">
              <Sparkles size={12} />
            </div>
          </div>

          {/* User Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold text-text-primary dark:text-textDark-primary truncate">
                {displayName}
              </h2>
              <span
                className={cn(
                  "text-xs px-2.5 py-0.5 rounded-pill font-semibold",
                  currentUser?.role === 0
                    ? "bg-brand/15 text-brand dark:bg-brand/20"
                    : "bg-surface-input dark:bg-dark-input text-text-secondary dark:text-textDark-secondary"
                )}
              >
                {roleLabel}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-pill font-semibold bg-success-bg text-success-text">
                Đang hoạt động
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 mt-2 text-xs text-text-muted dark:text-textDark-secondary">
              <div className="flex items-center gap-1.5">
                <Mail size={14} className="text-brand" />
                <span>{currentUser?.email || "Chưa có email"}</span>
              </div>
              {currentUser?.username && (
                <div className="flex items-center gap-1.5">
                  <User size={14} className="text-brand" />
                  <span>@{currentUser.username}</span>
                </div>
              )}
              {currentUser?.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={14} className="text-brand" />
                  <span>{currentUser.phone}</span>
                </div>
              )}
              {currentUser?.account_id && (
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="text-text-muted dark:text-textDark-muted">ID:</span>
                  <span className="truncate max-w-[140px]">{currentUser.account_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-surface-border dark:border-dark-border overflow-x-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-semibold transition-all shrink-0",
              activeTab === "profile"
                ? "bg-brand text-white shadow-sm shadow-brand/20"
                : "text-text-muted dark:text-textDark-secondary hover:bg-surface-input dark:hover:bg-dark-input"
            )}
          >
            <User size={16} />
            Thông tin cá nhân
          </button>

          <button
            onClick={() => setActiveTab("password")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-semibold transition-all shrink-0",
              activeTab === "password"
                ? "bg-brand text-white shadow-sm shadow-brand/20"
                : "text-text-muted dark:text-textDark-secondary hover:bg-surface-input dark:hover:bg-dark-input"
            )}
          >
            <KeyRound size={16} />
            Đổi mật khẩu
          </button>

          {currentUser?.quota && (
            <button
              onClick={() => setActiveTab("quota")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-semibold transition-all shrink-0",
                activeTab === "quota"
                  ? "bg-brand text-white shadow-sm shadow-brand/20"
                  : "text-text-muted dark:text-textDark-secondary hover:bg-surface-input dark:hover:bg-dark-input"
              )}
            >
              <BarChart3 size={16} />
              Gói cước & Hạn mức
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Profile Information */}
      {activeTab === "profile" && (
        <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-6 shadow-sm animate-fadeIn">
          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary dark:text-textDark-primary flex items-center gap-2">
              <User size={18} className="text-brand" />
              Chỉnh sửa thông tin cá nhân
            </h3>
            <p className="text-xs text-text-muted dark:text-textDark-secondary mt-0.5">
              Cập nhật thông tin hiển thị của bạn trên hệ thống. (Gọi API: PUT /api/user/profile)
            </p>
          </div>

          <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Fullname */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-textDark-secondary mb-1.5">
                  Họ và tên <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    {...registerProfile("fullname")}
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className={inputCls(!!profileErrors.fullname)}
                  />
                  <User
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                </div>
                {profileErrors.fullname && (
                  <p className="text-xs text-danger mt-1">{profileErrors.fullname.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-textDark-secondary mb-1.5">
                  Số điện thoại
                </label>
                <div className="relative">
                  <input
                    {...registerProfile("phone")}
                    type="tel"
                    placeholder="0912 345 678"
                    className={inputCls(!!profileErrors.phone)}
                  />
                  <Phone
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                </div>
                {profileErrors.phone && (
                  <p className="text-xs text-danger mt-1">{profileErrors.phone.message}</p>
                )}
              </div>

              {/* Avatar URL */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-textDark-secondary mb-1.5">
                  Đường dẫn ảnh đại diện (Avatar URL)
                </label>
                <div className="relative">
                  <input
                    {...registerProfile("avatar_url")}
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    className={inputCls(!!profileErrors.avatar_url)}
                  />
                  <ImageIcon
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                </div>
                <p className="text-[11px] text-text-muted dark:text-textDark-muted mt-1">
                  Nhập link ảnh trực tuyến (JPG, PNG, WebP) để cập nhật ảnh đại diện của bạn.
                </p>
                {profileErrors.avatar_url && (
                  <p className="text-xs text-danger mt-1">{profileErrors.avatar_url.message}</p>
                )}
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-textDark-secondary mb-1.5">
                  Địa chỉ Email (Cố định)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={currentUser?.email || ""}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-btn text-sm bg-surface-page dark:bg-dark-page border border-surface-border dark:border-dark-border text-text-muted dark:text-textDark-muted cursor-not-allowed opacity-80"
                  />
                  <Mail
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                </div>
                <span className="text-[11px] text-text-muted mt-1 inline-block">
                  Email dùng để nhận thông báo và khôi phục tài khoản.
                </span>
              </div>

              {/* Username (Readonly) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-textDark-secondary mb-1.5">
                  Tên đăng nhập (Cố định)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={currentUser?.username || currentUser?.email?.split("@")[0] || ""}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-btn text-sm bg-surface-page dark:bg-dark-page border border-surface-border dark:border-dark-border text-text-muted dark:text-textDark-muted cursor-not-allowed opacity-80"
                  />
                  <Shield
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                </div>
                <span className="text-[11px] text-text-muted mt-1 inline-block">
                  Tên đăng nhập định danh duy nhất trong hệ thống.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border dark:border-dark-border">
              <button
                type="submit"
                disabled={isSubmittingProfile}
                className="flex items-center gap-2 px-5 py-2.5 rounded-btn bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-all shadow-sm shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingProfile ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang lưu thay đổi...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Lưu thông tin cá nhân
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Change Password */}
      {activeTab === "password" && (
        <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-6 shadow-sm animate-fadeIn">
          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary dark:text-textDark-primary flex items-center gap-2">
              <KeyRound size={18} className="text-brand" />
              Đổi mật khẩu tài khoản
            </h3>
            <p className="text-xs text-text-muted dark:text-textDark-secondary mt-0.5">
              Để bảo mật tài khoản, vui lòng sử dụng mật khẩu mạnh có tối thiểu 6 ký tự. (Gọi API: PUT /api/user/change-password)
            </p>
          </div>

          <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-5 max-w-xl">
            {/* Old password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-textDark-secondary mb-1.5">
                Mật khẩu hiện tại <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  {...registerPassword("old_password")}
                  type={showOldPass ? "text" : "password"}
                  placeholder="Nhập mật khẩu hiện tại"
                  className={inputCls(!!passwordErrors.old_password)}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary dark:hover:text-textDark-primary transition"
                >
                  {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordErrors.old_password && (
                <p className="text-xs text-danger mt-1">{passwordErrors.old_password.message}</p>
              )}
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-textDark-secondary mb-1.5">
                Mật khẩu mới <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  {...registerPassword("new_password")}
                  type={showNewPass ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  className={inputCls(!!passwordErrors.new_password)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary dark:hover:text-textDark-primary transition"
                >
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordErrors.new_password && (
                <p className="text-xs text-danger mt-1">{passwordErrors.new_password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-textDark-secondary mb-1.5">
                Xác nhận mật khẩu mới <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  {...registerPassword("confirm_password")}
                  type={showConfirmPass ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới"
                  className={inputCls(!!passwordErrors.confirm_password)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary dark:hover:text-textDark-primary transition"
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordErrors.confirm_password && (
                <p className="text-xs text-danger mt-1">{passwordErrors.confirm_password.message}</p>
              )}
            </div>

            {/* Password Tips */}
            <div className="p-3.5 rounded-btn bg-surface-page dark:bg-dark-page border border-surface-border dark:border-dark-border space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium text-text-secondary dark:text-textDark-secondary">
                <Shield size={14} className="text-brand" />
                <span>Gợi ý tạo mật khẩu an toàn:</span>
              </div>
              <ul className="text-[11px] text-text-muted dark:text-textDark-muted space-y-1 pl-5 list-disc">
                <li>Sử dụng ít nhất 6 ký tự trở lên.</li>
                <li>Nên kết hợp chữ cái viết hoa, viết thường, chữ số và ký tự đặc biệt.</li>
                <li>Không nên dùng chung mật khẩu với các dịch vụ khác.</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border dark:border-dark-border">
              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="flex items-center gap-2 px-5 py-2.5 rounded-btn bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-all shadow-sm shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingPassword ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang đổi mật khẩu...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Cập nhật mật khẩu
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Quota Information */}
      {activeTab === "quota" && currentUser?.quota && (
        <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-6 shadow-sm animate-fadeIn">
          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary dark:text-textDark-primary flex items-center gap-2">
              <BarChart3 size={18} className="text-brand" />
              Thông tin gói cước & Hạn mức sử dụng
            </h3>
            <p className="text-xs text-text-muted dark:text-textDark-secondary mt-0.5">
              Chi tiết gói cước và số lượng yêu cầu còn lại trong tháng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-page dark:bg-dark-page rounded-btn p-4 border border-surface-border dark:border-dark-border">
              <span className="text-xs text-text-muted dark:text-textDark-secondary font-medium">
                Gói hiện tại
              </span>
              <p className="text-xl font-bold text-brand mt-1">
                {currentUser.quota.plan === 0 ? "Gói Miễn phí (Free)" : `Gói Pro (Tier ${currentUser.quota.plan})`}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                {currentUser.quota.is_unlimited ? "Không giới hạn yêu cầu" : "Có giới hạn định mức"}
              </p>
            </div>

            <div className="bg-surface-page dark:bg-dark-page rounded-btn p-4 border border-surface-border dark:border-dark-border">
              <span className="text-xs text-text-muted dark:text-textDark-secondary font-medium">
                Đã sử dụng trong tháng
              </span>
              <p className="text-xl font-bold text-text-primary dark:text-textDark-primary mt-1">
                {currentUser.quota.used_requests.toLocaleString()}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                lượt yêu cầu / trích xuất
              </p>
            </div>

            <div className="bg-surface-page dark:bg-dark-page rounded-btn p-4 border border-surface-border dark:border-dark-border">
              <span className="text-xs text-text-muted dark:text-textDark-secondary font-medium">
                Hạn mức tối đa
              </span>
              <p className="text-xl font-bold text-text-primary dark:text-textDark-primary mt-1">
                {currentUser.quota.is_unlimited
                  ? "Không giới hạn"
                  : currentUser.quota.max_requests_per_month.toLocaleString()}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                yêu cầu mỗi tháng
              </p>
            </div>
          </div>

          {!currentUser.quota.is_unlimited && (
            <div className="mt-5 p-4 rounded-btn bg-surface-page dark:bg-dark-page border border-surface-border dark:border-dark-border">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-text-secondary dark:text-textDark-secondary">
                  Tỷ lệ sử dụng hạn ngạch
                </span>
                <span className="font-bold text-brand">
                  {Math.min(
                    100,
                    Math.round(
                      (currentUser.quota.used_requests /
                        Math.max(1, currentUser.quota.max_requests_per_month)) *
                        100
                    )
                  )}
                  %
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface-border dark:bg-dark-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (currentUser.quota.used_requests /
                          Math.max(1, currentUser.quota.max_requests_per_month)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
