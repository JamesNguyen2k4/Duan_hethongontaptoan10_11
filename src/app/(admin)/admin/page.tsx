import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, BookOpen, Layers, CheckCircle2, TrendingUp, ShieldAlert, Brain, Target, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "QUAN_TRI" && session.user.role !== "GIAO_VIEN")) {
    redirect("/dashboard");
  }

  const [totalUsers, totalBais, totalBaiTaps, totalLanLam, totalPhienLuyen, recentUsers, recentDangBaiLuyenTap] = await Promise.all([
    db.nguoiDung.count(),
    db.bai.count(),
    db.baiTap.count(),
    db.lanLamBai.count(),
    db.lichSuLuyenTap.count(),
    db.nguoiDung.findMany({
      take: 5,
      orderBy: { taoLuc: "desc" },
    }),
    db.nangLucDangBai.findMany({
      where: { soLanLuyen: { gt: 0 } },
      take: 8,
      orderBy: { lanLuyenCuoi: "desc" },
      include: {
        nguoiDung: true,
        chuDe: {
          include: { chuong: true },
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

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Người dùng</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalUsers}</div>
          <p className="text-xs text-slate-400">Tài khoản học sinh</p>
        </div>

        <Link
          href="/admin/ly-thuyet"
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2 hover:border-emerald-300 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-emerald-700 transition-colors">Bài lý thuyết</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalBais}</div>
          <p className="text-xs text-slate-400 flex items-center justify-between">
            <span>Bài học Toán 10 & 11</span>
            <span className="text-[11px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">Xem tree →</span>
          </p>
        </Link>

        <Link
          href="/admin/cau-hoi"
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2 hover:border-purple-300 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-purple-700 transition-colors">Ngân hàng câu hỏi</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalBaiTaps}</div>
          <p className="text-xs text-slate-400 flex items-center justify-between">
            <span>Câu hỏi trắc nghiệm chuẩn</span>
            <span className="text-[11px] font-bold text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">Xem tree →</span>
          </p>
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Lượt nộp câu</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalLanLam}</div>
          <p className="text-xs text-slate-400">Tổng số câu hỏi đã nộp</p>
        </div>

        <div className="bg-white rounded-2xl border border-indigo-200/80 bg-indigo-50/20 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-xs font-bold uppercase tracking-wider">Lần luyện tập</span>
            <Brain className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-900">{totalPhienLuyen}</div>
          <p className="text-xs text-indigo-500">Lần luyện tập theo dạng bài</p>
        </div>
      </div>

      {/* Grid Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hoạt động luyện tập dạng bài & độ thành thạo gần đây */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>Hoạt động luyện tập dạng bài mới nhất</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi dạng bài học sinh vừa luyện tập và mức độ thành thạo đạt được
              </p>
            </div>
            <span className="text-xs text-slate-400 font-normal">Thời gian thực</span>
          </div>

          <div className="divide-y divide-slate-100">
            {recentDangBaiLuyenTap.length > 0 ? (
              recentDangBaiLuyenTap.map((item) => {
                const masteryPercent = Number((item.xacSuatThanhThao * 100).toFixed(1));
                const lopIdFinal = item.lopId || item.chuDe.chuong.lopId || "lop-10";
                const lopLabel = lopIdFinal === "lop-11" ? "Toán 11" : "Toán 10";

                return (
                  <div
                    key={item.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/hoc-sinh/${item.nguoiDungId}?lopId=${lopIdFinal}`}
                          className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                        >
                          {item.nguoiDung.tenHienThi}
                        </Link>
                        <span className="text-[11px] text-slate-400">
                          ({item.nguoiDung.email})
                        </span>
                        <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                          {lopLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 flex-wrap">
                        <span className="font-medium text-slate-700">
                          {item.chuDe.ten}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded">
                          {item.dangBai}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                        <span>
                          Đã làm:{" "}
                          <strong className="text-slate-700">
                            {item.soLanDung}/{item.soLanLuyen}
                          </strong>{" "}
                          câu đúng
                        </span>
                        <span>•</span>
                        <span>
                          Độ bền trí nhớ:{" "}
                          <strong className="text-slate-700">
                            {item.doBenTriNho.toFixed(1)} ngày
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-20 sm:w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all ${
                              masteryPercent >= 85
                                ? "bg-emerald-500"
                                : masteryPercent >= 60
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(5, masteryPercent)
                              )}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                            masteryPercent >= 85
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : masteryPercent >= 60
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {masteryPercent.toFixed(1)}%
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 text-right">
                        {new Date(item.lanLuyenCuoi).toLocaleTimeString("vi-VN")}{" "}
                        -{" "}
                        {new Date(item.lanLuyenCuoi).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                Chưa có dữ liệu luyện tập dạng bài nào từ học sinh.
              </div>
            )}
          </div>
        </div>

        {/* Recent Registered Users */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Người dùng mới</h2>
            <Link
              href="/admin/hoc-sinh"
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>
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
