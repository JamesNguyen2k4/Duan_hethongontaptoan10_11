import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/dang-nhap");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Thanh điều hướng trên desktop */}
      <header className="hidden md:flex sticky top-0 z-50 h-14 items-center border-b bg-white px-6 gap-6 shadow-sm">
        <span className="font-bold text-primary text-lg">Σ Ôn Tập Toán</span>
        <nav className="flex items-center gap-4 text-sm">
          <a href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Tổng quan</a>
          <a href="/ly-thuyet" className="text-muted-foreground hover:text-foreground transition-colors">Lý thuyết</a>
          <a href="/bai-tap" className="text-muted-foreground hover:text-foreground transition-colors">Bài tập</a>
          <a href="/phan-tich" className="text-muted-foreground hover:text-foreground transition-colors">Phân tích</a>
          <a href="/on-tap" className="text-muted-foreground hover:text-foreground transition-colors">Ôn tập</a>
          <a href="/dien-dan" className="text-muted-foreground hover:text-foreground transition-colors">Diễn đàn</a>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{session.user?.name}</span>
          <a
            href="/api/auth/signout"
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Đăng xuất
          </a>
        </div>
      </header>

      {/* Nội dung */}
      <main className="pb-20 md:pb-0">{children}</main>

      {/* Thanh điều hướng dưới đáy trên mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden h-16 items-center justify-around border-t bg-white px-2">
        <a href="/dashboard" className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground">
          <span className="text-lg">🏠</span>Tổng quan
        </a>
        <a href="/ly-thuyet" className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground">
          <span className="text-lg">📚</span>Lý thuyết
        </a>
        <a href="/bai-tap" className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground">
          <span className="text-lg">✏️</span>Bài tập
        </a>
        <a href="/on-tap" className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground">
          <span className="text-lg">🔄</span>Ôn tập
        </a>
        <a href="/dien-dan" className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground">
          <span className="text-lg">💬</span>Diễn đàn
        </a>
      </nav>
    </div>
  );
}

