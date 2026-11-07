import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, BookOpen, Layers, Users, LogOut, ShieldCheck } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "QUAN_TRI" && session.user.role !== "GIAO_VIEN")) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col justify-between p-5 border-r border-slate-800">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-lg shadow-md">
              Σ
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight block">Admin Portal</span>
              <span className="text-[10px] text-slate-400">Hệ thống ôn tập Toán 10-11</span>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-400" /> Bảng điều khiển
            </Link>

            <Link
              href="/ly-thuyet"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" /> Xem Lý thuyết (33 bài)
            </Link>

            <Link
              href="/bai-tap"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Layers className="w-4 h-4 text-purple-400" /> Ngân hàng bài tập (812 câu)
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Giao diện Học sinh
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 space-y-3">
          <div className="px-2">
            <p className="text-xs font-bold text-white truncate">{session.user.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{session.user.email}</p>
          </div>

          <a
            href="/api/auth/signout"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất
          </a>
        </div>
      </aside>

      {/* Main Admin Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
