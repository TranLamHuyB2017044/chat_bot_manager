import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { apiFetch, setApiKey } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

const schema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});
type FormData = z.infer<typeof schema>;

// Helper to get or generate device ID
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser, user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(user.role === 0 ? "/admin" : "/dashboard");
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const deviceId = getDeviceId();
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          isDev: false,
        }),
      });

      const result = await response.json();

      if (result.statusCode === 200 && result.data?.api_key) {
        // Lưu api_key vào localStorage thay vì server cookie
        setApiKey(result.data.api_key);
        
        // Lưu user info vào Zustand store + localStorage
        const loggedUser: AuthUser = result.data.user;
        setUser(loggedUser);
        
        // Điều hướng theo role
        if (loggedUser.role === 0) {
          navigate("/admin");
        } else {
          // Nếu có chatbots, lấy chatbot đầu tiên để điều hướng
          if (loggedUser.chatbots && loggedUser.chatbots.length > 0) {
            navigate(`/dashboard/bot/${loggedUser.chatbots[0].id}`);
          } else {
            // Nếu không có chatbot nào, có thể vào trang tạo bot hoặc dashboard
            navigate("/dashboard");
          }
        }
      } else {
        setError(result.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError("Có lỗi xảy ra, vui lòng thử lại sau");
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
            <span className="text-white font-bold text-sm tracking-tight">BT</span>
          </div>
          <div>
            <span className="text-xl font-bold text-text-primary dark:text-textDark-primary">
              BitTech
            </span>
            <p className="text-xs text-text-muted dark:text-textDark-muted -mt-0.5">Admin Portal</p>
          </div>
        </div>

        <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-8 shadow-lg">
          <h1 className="text-xl font-semibold text-text-primary dark:text-textDark-primary mb-1">
            Đăng nhập
          </h1>
          <p className="text-sm text-text-muted dark:text-textDark-secondary mb-6">
            Chào mừng trở lại. Nhập thông tin để tiếp tục.
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-btn bg-danger-bg border border-danger/20 text-danger-text text-sm flex items-center gap-2">
              <span className="shrink-0">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-textDark-secondary mb-1.5">
                Tên đăng nhập
              </label>
              <input
                {...register("username")}
                type="text"
                placeholder="username"
                autoComplete="off"
                className={inputCls(!!errors.username)}
              />
              {errors.username && (
                <p className="text-xs text-danger mt-1">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-textDark-secondary mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={cn(inputCls(!!errors.password), "pr-10")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-danger mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full py-2.5 rounded-btn text-sm font-semibold text-white",
                "bg-brand hover:bg-brand-hover active:scale-[0.98] transition",
                "shadow-md shadow-brand/25",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
