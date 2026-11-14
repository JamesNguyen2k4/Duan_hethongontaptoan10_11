"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { dangKySchema, type DangKyInput } from "../schemas";
import { dangKyAction } from "../actions/dang-ky";
import { cn } from "@/lib/utils";

export function DangKyForm() {
  const router = useRouter();
  const [loi, setLoi] = useState<string>("");
  const [thanhCong, setThanhCong] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DangKyInput>({
    resolver: zodResolver(dangKySchema),
  });

  const onSubmit = (data: DangKyInput) => {
    setLoi("");
    setThanhCong("");
    startTransition(async () => {
      // 1. Tạo tài khoản học sinh
      const result = await dangKyAction(data);
      if (!result.ok) {
        setLoi(result.message);
        return;
      }

      setThanhCong("Tạo tài khoản thành công! Đang tự động chuyển vào trang học tập...");

      // 2. Tự động đăng nhập luôn
      const loginRes = await signIn("credentials", {
        email: data.email,
        matKhau: data.matKhau,
        redirect: false,
      });

      if (loginRes?.error) {
        router.push("/dang-nhap");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4 shadow-sm">
          Σ
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Đăng ký Học sinh</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Hệ thống ôn tập Toán 10–11 Cá nhân hóa
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Thông báo lỗi / thành công */}
        {loi && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">
            {loi}
          </div>
        )}
        {thanhCong && (
          <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-medium">
            {thanhCong}
          </div>
        )}

        {/* Họ và tên */}
        <div className="space-y-1.5">
          <label htmlFor="tenHienThi" className="text-sm font-medium leading-none">
            Họ và tên học sinh
          </label>
          <input
            id="tenHienThi"
            type="text"
            autoComplete="name"
            placeholder="Ví dụ: Nguyễn Văn A"
            disabled={isPending}
            {...register("tenHienThi")}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              errors.tenHienThi && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errors.tenHienThi && (
            <p className="text-xs text-destructive">{errors.tenHienThi.message}</p>
          )}
        </div>

        {/* Gmail */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium leading-none">
            Địa chỉ Gmail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="example@gmail.com"
            disabled={isPending}
            {...register("email")}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              errors.email && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Mật khẩu */}
        <div className="space-y-1.5">
          <label htmlFor="matKhau" className="text-sm font-medium leading-none">
            Mật khẩu (ít nhất 6 ký tự)
          </label>
          <input
            id="matKhau"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={isPending}
            {...register("matKhau")}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              errors.matKhau && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errors.matKhau && (
            <p className="text-xs text-destructive">{errors.matKhau.message}</p>
          )}
        </div>

        {/* Nút đăng ký */}
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "inline-flex w-full items-center justify-center rounded-md text-sm font-medium",
            "h-10 px-4 py-2 bg-primary text-primary-foreground font-semibold shadow",
            "hover:bg-primary/90 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50 mt-2"
          )}
        >
          {isPending ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Đang tạo tài khoản...
            </>
          ) : (
            "Đăng ký & Vào học ngay"
          )}
        </button>
      </form>

      {/* Link đăng nhập */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/dang-nhap" className="font-semibold text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
