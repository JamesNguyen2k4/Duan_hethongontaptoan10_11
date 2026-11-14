import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, BookOpen, Layers, CheckCircle2, TrendingUp, ShieldAlert, Brain } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "QUAN_TRI" && session.user.role !== "GIAO_VIEN")) {
    redirect("/dashboard");
  }

  const [totalUsers, totalBais, totalBaiTaps, totalLanLam, totalPhienLuyen, recentUsers, recentAttempts, recentPhienLuyen] = await Promise.all([
    db.nguoiDung.count(),
    db.bai.count(),
    db.baiTap.count(),
    db.lanLamBai.count(),
    db.lichSuLuyenTap.count(),
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
    db.lichSuLuyenTap.findMany({
      take: 6,
      orderBy: { thoiDiemKetThuc: "desc" },
      include: {
        nguoiDung: true,
        chuDe: true,
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

      {/* Lịch sử các lần luyện tập theo dạng bài (Dữ liệu báo cáo Quản trị viên) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-600" />
              <span>Báo cáo các lần luyện tập dạng bài (Độ thành thạo)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Ghi nhận mỗi khi học sinh kết thúc một phiên luyện tập dạng bài kèm mức độ thành thạo đạt được
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/hoc-sinh"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Báo cáo theo học sinh →
            </Link>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl">
              Tổng cộng: {totalPhienLuyen} lần luyện
            </span>
          </div>
        </div>

        {recentPhienLuyen.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Chưa có lần luyện tập hoàn chỉnh nào được ghi nhận. Dữ liệu sẽ tự động lưu khi học sinh bấm "Dừng luyện tập / Đổi dạng".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Học sinh</th>
                  <th className="py-3 px-3">Chủ đề & Dạng bài</th>
                  <th className="py-3 px-3">Lớp</th>
                  <th className="py-3 px-3 text-center">Kết quả phiên</th>
                  <th className="py-3 px-3 text-center">Độ thành thạo đạt được</th>
                  <th className="py-3 px-3 text-right">Thời điểm hoàn thành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPhienLuyen.map((phien) => {
                  const masteryPercent = Number((phien.doThanhThao * 100).toFixed(1));
                  return (
                    <tr key={phien.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <Link
                          href={`/admin/hoc-sinh/${phien.nguoiDungId}?lopId=${phien.lopId || "lop-10"}`}
                          className="font-bold text-slate-800 hover:text-blue-600 transition-colors block"
                        >
                          {phien.nguoiDung.tenHienThi}
                        </Link>
                        <div className="text-[11px] text-slate-400">{phien.nguoiDung.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{phien.chuDe.ten}</div>
                        <div className="text-[11px] text-indigo-600 font-semibold">{phien.dangBai}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {phien.lopId === "lop-10" ? "Toán 10" : "Toán 11"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-slate-700">
                          {phien.soCauDung} / {phien.soCauDaLam} câu đúng
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {Math.floor(phien.thoiGianGiay / 60)}p {phien.thoiGianGiay % 60}s
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-black text-xs ${
                            masteryPercent >= 85
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : masteryPercent >= 60
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {masteryPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">
                        <div>{new Date(phien.thoiDiemKetThuc).toLocaleTimeString("vi-VN")}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(phien.thoiDiemKetThuc).toLocaleDateString("vi-VN")}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
