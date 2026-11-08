import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

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
        <Link href="/dashboard" className="font-bold text-primary text-lg">
          Σ Ôn Tập Toán
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link
            href="/dashboard"
            prefetch={true}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Tổng quan & Năng lực
          </Link>
          <Link
            href="/ly-thuyet"
            prefetch={true}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Lý thuyết
          </Link>
          <Link
            href="/bai-tap"
            prefetch={true}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Luyện tập thích ứng
          </Link>
          <Link
            href="/dien-dan"
            prefetch={true}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Diễn đàn
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {session.user?.name}
          </span>
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
        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground"
        >
          <span className="text-lg">🏠</span>Tổng quan
        </Link>
        <Link
          href="/ly-thuyet"
          className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground"
        >
          <span className="text-lg">📚</span>Lý thuyết
        </Link>
        <Link
          href="/bai-tap"
          className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground"
        >
          <span className="text-lg">🎯</span>Luyện tập
        </Link>
        <Link
          href="/dien-dan"
          className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground"
        >
          <span className="text-lg">💬</span>Diễn đàn
        </Link>
      </nav>
    </div>
  );
}
