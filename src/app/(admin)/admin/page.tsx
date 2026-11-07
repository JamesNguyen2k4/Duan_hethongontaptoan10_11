import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, BookOpen, Layers, CheckCircle2, TrendingUp, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "QUAN_TRI" && session.user.role !== "GIAO_VIEN")) {
    redirect("/dashboard");
  }

  const [totalUsers, totalBais, totalBaiTaps, totalLanLam, recentUsers, recentAttempts] = await Promise.all([
    db.nguoiDung.count(),
    db.bai.count(),
    db.baiTap.count(),
    db.lanLamBai.count(),
    db.nguoiDung.findMany({
      take: 5,
      orderBy: { taoLuc: "desc" },
    }),
    db.lanLamBai.findMany({
      take: 8,
      orderBy: { thoiDiem: "desc" },
      include: {
        nguoiDung: true,
        baiTap: {
          include: { chuDe: true },
        },
      },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" /> Bảng điều khiển Quản trị & Giáo viên
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quản Trị Hệ Thống Ôn Tập Toán
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl font-bold border border-indigo-100">
            Vai trò: {session.user.role}
          </span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Người dùng</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalUsers}</div>
          <p className="text-xs text-slate-400">Tài khoản trong hệ thống</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Bài lý thuyết</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalBais}</div>
          <p className="text-xs text-slate-400">Bài học Toán 10 & 11</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Ngân hàng câu hỏi</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalBaiTaps}</div>
          <p className="text-xs text-slate-400">Câu hỏi trắc nghiệm có lời giải</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Lượt làm bài</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalLanLam}</div>
          <p className="text-xs text-slate-400">Lượt nộp bài từ học sinh</p>
        </div>
      </div>

      {/* Grid Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attempts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center justify-between">
            <span>Hoạt động làm bài mới nhất</span>
            <span className="text-xs text-slate-400 font-normal">Thời gian thực</span>
          </h2>

          <div className="divide-y divide-slate-100">
            {recentAttempts.map((att) => (
              <div key={att.id} className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{att.nguoiDung.tenHienThi}</span>
                    <span className="text-[11px] text-slate-400">({att.nguoiDung.email})</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Làm bài: <strong className="text-slate-700">{att.baiTap.chuDe.ten}</strong>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    att.ketQua === 'DUNG' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {att.ketQua === 'DUNG' ? 'Đúng' : 'Sai'}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {new Date(att.thoiDiem).toLocaleTimeString('vi-VN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Registered Users */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800">Người dùng mới</h2>
          <div className="space-y-3">
            {recentUsers.map((u) => (
              <div key={u.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between gap-2 border border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{u.tenHienThi}</h4>
                  <p className="text-[11px] text-slate-500">{u.email}</p>
                </div>
                <span className="text-[10px] font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                  {u.vaiTro}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
