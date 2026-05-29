"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CheckCircle, Loader2 } from "lucide-react";

const schema = z
  .object({
    name:            z.string().min(2, "Tên tối thiểu 2 ký tự"),
    email:           z.string().email("Email không hợp lệ"),
    password:        z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path:    ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const FIELDS: {
  key: keyof FormData;
  label: string;
  type: string;
  placeholder: string;
}[] = [
  { key: "name",            label: "Họ tên",           type: "text",     placeholder: "Nguyễn Văn A" },
  { key: "email",           label: "Email",             type: "email",    placeholder: "you@bittech.io" },
  { key: "password",        label: "Mật khẩu",          type: "password", placeholder: "••••••••" },
  { key: "confirmPassword", label: "Xác nhận mật khẩu", type: "password", placeholder: "••••••••" },
];

export default function RegisterPage() {
  const router  = useRouter();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (_data: FormData) => {
    // TODO: POST to /api/register with real DB integration
    setSuccess(true);
    setTimeout(() => router.push("/login"), 2200);
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
          Tạo tài khoản
        </h1>
        <p className="text-sm text-text-muted dark:text-textDark-secondary mb-6">
          Điền thông tin để đăng ký tài khoản mới.
        </p>

        {success && (
          <div className="mb-5 px-4 py-3 rounded-btn bg-success-bg border border-success/20 text-success-text text-sm flex items-center gap-2">
            <CheckCircle size={15} className="shrink-0" />
            Đăng ký thành công! Đang chuyển hướng...
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {FIELDS.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-text-secondary dark:text-textDark-secondary mb-1.5">
                {label}
              </label>
              <input
                {...register(key)}
                type={type}
                placeholder={placeholder}
                className={inputCls(!!errors[key])}
              />
              {errors[key] && (
                <p className="text-xs text-danger mt-1">{errors[key]?.message}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full py-2.5 rounded-btn text-sm font-semibold text-white mt-2",
              "bg-brand hover:bg-brand-hover active:scale-[0.98] transition",
              "shadow-md shadow-brand/25",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Đang tạo tài khoản...
              </span>
            ) : (
              "Đăng ký"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted dark:text-textDark-secondary mt-6">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-brand font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
