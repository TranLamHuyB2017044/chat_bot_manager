"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const schema = z.object({
  email:    z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    const res = await signIn("credentials", {
      email:    data.email,
      password: data.password,
      redirect: false,
    });

    if (res?.error) {
      setError("Email hoặc mật khẩu không đúng");
      return;
    }

    const sessionRes = await fetch("/api/auth/session");
    const session    = await sessionRes.json();
    router.push(session?.user?.role === "admin" ? "/admin" : "/dashboard");
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

      <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-8 shadow-sm">
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-textDark-secondary mb-1.5">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="admin@bittech.io"
              className={inputCls(!!errors.email)}
            />
            {errors.email && (
              <p className="text-xs text-danger mt-1">{errors.email.message}</p>
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

        <p className="text-center text-sm text-text-muted dark:text-textDark-secondary mt-6">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-brand font-medium hover:underline">
            Đăng ký ngay
          </Link>
        </p>

        {/* Demo credentials */}
        <div className="mt-5 p-3.5 rounded-btn bg-brand-soft dark:bg-brand-softDark border border-brand/20 dark:border-brand/10 text-xs space-y-1.5">
          <p className="text-success-text font-semibold flex items-center gap-1.5">
            <span>🔑</span> Demo accounts
          </p>
          <p className="text-text-muted dark:text-textDark-muted font-mono">
            Admin: admin@bittech.io / admin123
          </p>
          <p className="text-text-muted dark:text-textDark-muted font-mono">
            User: &nbsp;user@bittech.io &nbsp;/ user123
          </p>
        </div>
      </div>
    </div>
  );
}
