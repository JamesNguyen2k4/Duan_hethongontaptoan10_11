import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { BookOpen, Layers, TrendingUp, Repeat, ArrowRight, Award, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/dang-nhap");

  const [totalBais, totalBaiTaps, lanLams, theOns] = await Promise.all([
    db.bai.count(),
    db.baiTap.count(),
    db.lanLamBai.findMany({
      where: { nguoiDungId: session.user.id },
      take: 5,
      orderBy: { thoiDiem: "desc" },
      include: {
        baiTap: {
          include: { chuDe: true },
        },
      },
    }),
    db.theOnTap.count({
      where: {
        nguoiDungId: session.user.id,
        ngayOnKeTiep: { lte: new Date() },
      },
    }),
  ]);

  const soCauDung = lanLams.filter((l) => l.ketQua === "DUNG").length;
  const tiLeDung = lanLams.length > 0 ? Math.round((soCauDung / lanLams.length) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              {session.user.role === "HOC_SINH" ? "Học sinh" : session.user.role}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Xin chào, {session.user?.name}! 👋
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm max-w-xl leading-relaxed">
            Chào mừng bạn quay lại hệ thống ôn tập Toán 10–11 theo phương pháp học khép kín & học thích ứng (Adaptive Learning).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {theOns > 0 && (
            <Link
              href="/on-tap"
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Repeat className="w-4 h-4" /> Có {theOns} thẻ cần ôn ngay!
            </Link>
          )}

          {(session.user.role === "QUAN_TRI" || session.user.role === "GIAO_VIEN") && (
            <Link
              href="/admin"
              className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Trang Quản trị →
            </Link>
          )}
        </div>
      </div>

      {/* 4 Feature Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link
          href="/ly-thuyet"
          prefetch={true}
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:border-blue-400 hover:shadow-md active:scale-[0.98] transition-all group cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 text-base">Học Lý Thuyết</h2>
          <p className="text-xs text-slate-500 mt-1">
            Toàn bộ 9 chương sách KNTT kèm công thức KaTeX và phương pháp giải.
          </p>
        </Link>

        <Link
          href="/bai-tap"
          prefetch={true}
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:border-indigo-400 hover:shadow-md active:scale-[0.98] transition-all group cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 text-base">Ngân Hàng Bài Tập</h2>
          <p className="text-xs text-slate-500 mt-1">
            Hơn 3.500 câu hỏi trắc nghiệm phân hóa 4 mức độ có đáp án & lời giải chi tiết.
          </p>
        </Link>

        <Link
          href="/phan-tich"
          prefetch={true}
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:border-purple-400 hover:shadow-md active:scale-[0.98] transition-all group cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 text-base">Học Thích Ứng (AI)</h2>
          <p className="text-xs text-slate-500 mt-1">
            Biểu đồ Radar chẩn đoán điểm yếu và tự động gợi ý bài tập tương ứng.
          </p>
        </Link>

        <Link
          href="/on-tap"
          prefetch={true}
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:border-amber-400 hover:shadow-md active:scale-[0.98] transition-all group cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Repeat className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 text-base">Ôn Tập Ngắt Quãng</h2>
          <p className="text-xs text-slate-500 mt-1">
            Thuật toán SM-2 nhắc nhở thông minh không để quên kiến thức.
          </p>
        </Link>
      </div>

      {/* Recent History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" /> Bài làm gần đây của bạn
          </h2>
          <Link href="/bai-tap" className="text-xs font-semibold text-blue-600 hover:underline">
            Luyện thêm câu hỏi mới →
          </Link>
        </div>

        {lanLams.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {lanLams.map((l) => (
              <div key={l.id} className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {l.baiTap.chuDe.ten}
                  </span>
                  <p className="text-xs text-slate-800 line-clamp-1">{l.baiTap.deBai}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    l.ketQua === "DUNG" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {l.ketQua === "DUNG" ? "Đúng" : "Sai"}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(l.thoiDiem).toLocaleTimeString("vi-VN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-6 text-center">
            Bạn chưa có lần làm bài nào. Hãy vào mục <strong>Ngân hàng bài tập</strong> để bắt đầu thử sức!
          </p>
        )}
      </div>
    </div>
  );
}
