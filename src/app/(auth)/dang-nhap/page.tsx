import type { Metadata } from "next";
import { Suspense } from "react";
import { DangNhapForm } from "@/features/auth/components/DangNhapForm";

export const metadata: Metadata = {
  title: "Đăng nhập | Hệ thống ôn tập Toán 10–11",
  description: "Đăng nhập vào hệ thống ôn tập Toán lớp 10 và 11",
};

export default function DangNhapPage() {
  return (
    <Suspense>
      <DangNhapForm />
    </Suspense>
  );
}

