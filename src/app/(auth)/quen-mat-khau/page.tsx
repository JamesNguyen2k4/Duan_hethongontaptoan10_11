import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quên mật khẩu | Hệ thống ôn tập Toán 10–11",
};

export default function QuenMatKhauPage() {
  return (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4">
        Σ
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Quên mật khẩu</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Chức năng đặt lại mật khẩu sẽ sớm được cập nhật.
      </p>
      <a
        href="/dang-nhap"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        ← Quay lại đăng nhập
      </a>
    </div>
  );
}

