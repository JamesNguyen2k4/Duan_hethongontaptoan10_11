import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập | Hệ thống ôn tập Toán 10–11",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        {children}
      </div>
    </div>
  );
}

