import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { layThongKeTheOnTap } from "@/lib/spaced-repetition";
import { MathRenderer } from "@/components/shared/MathRenderer";
import {
  Repeat,
  Clock,
  CheckCircle2,
  Play,
  Calendar,
  Sparkles,
  Brain,
  ShieldCheck,
  TrendingUp,
  Layers,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OnTapNgatQuangPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/dang-nhap?callbackUrl=/on-tap");
  }

  const userId = session.user.id;
  const thongKe = await layThongKeTheOnTap(userId);

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Lấy các thẻ ôn tập đến hạn hôm nay
  const theOnTaps = await db.theOnTap.findMany({
    where: {
      nguoiDungId: userId,
      ngayOnKeTiep: { lte: today },
    },
    include: {
      baiTap: {
        include: {
          chuDe: true,
        },
      },
    },
    orderBy: {
      ngayOnKeTiep: "asc",
    },
  });

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-orange-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative space-y-2 z-10">
          <div className="flex items-center gap-2 text-amber-100 text-xs font-bold uppercase tracking-wider">
            <Repeat className="w-4 h-4" /> Phương pháp Học Thích Ứng Spaced Repetition (SM-2)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ôn Tập Lặp Lại Ngắt Quãng
          </h1>
          <p className="text-amber-50 max-w-xl text-xs sm:text-sm leading-relaxed">
            Thuật toán SM-2 tính toán chính xác đường cong lãng quên Ebbinghaus, nhắc nhở bạn làm lại bài tập ngay trước khi chuẩn bị quên, chuyển hóa kiến thức ngắn hạn thành trí nhớ vĩnh viễn.
          </p>
        </div>

        <div className="relative z-10 bg-white/20 backdrop-blur-md rounded-2xl p-5 text-center sm:text-right shrink-0 border border-white/20 space-y-1">
          <span className="text-4xl font-black block tracking-tight">
            {thongKe.denHanHomNay}
          </span>
          <span className="text-xs text-amber-100 font-semibold block">
            thẻ cần ôn hôm nay
          </span>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-600">
            <Calendar className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Đến hạn
            </span>
          </div>
          <p className="text-2xl font-black text-slate-800">
            {thongKe.denHanHomNay}
          </p>
          <p className="text-xs text-slate-500 font-medium">Hôm nay cần ôn</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-blue-600">
            <Clock className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ngày mai
            </span>
          </div>
          <p className="text-2xl font-black text-slate-800">
            {thongKe.denHanNgayMai}
          </p>
          <p className="text-xs text-slate-500 font-medium">Sắp đến hạn</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-orange-600">
            <Zap className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Đang củng cố
            </span>
          </div>
          <p className="text-2xl font-black text-slate-800">
            {thongKe.theDangCungCo}
          </p>
          <p className="text-xs text-slate-500 font-medium">Lặp 2 - 4 lần</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Dài hạn
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {thongKe.theDaiHan}
          </p>
          <p className="text-xs text-slate-500 font-medium">Đã ghi nhớ sâu</p>
        </div>
      </div>

      {/* Start Session CTA */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-500" />
            {theOnTaps.length > 0
              ? `Bạn có ${theOnTaps.length} câu hỏi sẵn sàng ôn tập`
              : "Bộ nhớ đang trong trạng thái tối ưu!"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {theOnTaps.length > 0
              ? "Bắt đầu phiên ôn tập liên hoàn dạng Flashcard kèm đánh giá mức độ ghi nhớ để thuật toán SM-2 tính chu kỳ tiếp theo."
              : "Toàn bộ bài tập đến hạn đã được hoàn thành. Bạn có thể ôn tập tăng cường hoặc giải thêm bài tập mới."}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {theOnTaps.length > 0 ? (
            <Link
              href="/on-tap/session"
              className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" /> Bắt đầu ôn tập ({theOnTaps.length} câu)
            </Link>
          ) : (
            <>
              {thongKe.tongSoThe > 0 && (
                <Link
                  href="/on-tap/session?mode=tang-cuong"
                  className="px-5 py-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" /> Ôn tập tăng cường (Cram Mode)
                </Link>
              )}
              <Link
                href="/bai-tap"
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
              >
                Làm thêm bài tập mới →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 7-Day Forecast Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Dự báo lịch ôn tập 7 ngày tới
          </h3>
          <span className="text-xs text-slate-500">
            Tổng cộng: {thongKe.tongSoThe} thẻ đã lưu
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {thongKe.lich7Ngay.map((d, i) => {
            const isToday = i === 0;
            return (
              <div
                key={d.ngay}
                className={`p-3 rounded-2xl text-center border transition-all ${
                  isToday
                    ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20"
                    : "bg-slate-50/60 border-slate-200"
                }`}
              >
                <span className="text-[11px] font-bold text-slate-500 block">
                  {d.ngay}
                </span>
                <span
                  className={`text-lg font-black block mt-1 ${
                    d.soThe > 0
                      ? isToday
                        ? "text-amber-700"
                        : "text-blue-700"
                      : "text-slate-400"
                  }`}
                >
                  {d.soThe}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">thẻ</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Due Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            Danh sách câu hỏi cần ôn hôm nay
          </h3>
          <span className="text-xs text-slate-500">
            {theOnTaps.length} câu
          </span>
        </div>

        {theOnTaps.length > 0 ? (
          <div className="space-y-3">
            {theOnTaps.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-amber-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      {item.baiTap.chuDe.ten}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                      Mức độ: {item.baiTap.mucDo}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Đã ôn {item.soLanOnLienTiep} lần • Chu kỳ {item.khoangCachNgay} ngày • Hệ số EF: {item.heSoDe.toFixed(1)}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-800 line-clamp-2">
                    <MathRenderer content={item.baiTap.deBai} />
                  </div>
                </div>

                <Link
                  href="/on-tap/session"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Ôn tập ngay
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">
              Không có bài ôn tập nào đang chờ hôm nay!
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Bạn đã ôn tập xong tất cả các thẻ đến hạn. Khi làm thêm bài tập mới hoặc khi đến thời điểm vàng tiếp theo, hệ thống sẽ tự động nhắc nhở tại đây.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
