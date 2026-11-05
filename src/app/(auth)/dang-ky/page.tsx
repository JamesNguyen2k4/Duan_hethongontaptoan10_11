import type { Metadata } from "next";
import { DangKyForm } from "@/features/auth/components/DangKyForm";

export const metadata: Metadata = {
  title: "Đăng ký | Hệ thống ôn tập Toán 10–11",
  description: "Tạo tài khoản mới để bắt đầu học Toán 10 và 11",
};

export default function DangKyPage() {
  return <DangKyForm />;
}

