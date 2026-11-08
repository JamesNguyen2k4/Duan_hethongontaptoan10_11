import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Target,
  Layers,
  GraduationCap,
  Play,
  Brain,
  Repeat,
  Award,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { DANH_MUC_DANG_BAI } from "@/lib/danh-muc-dang-bai";
import {
  layNangLucTheoChuDe,
  tinhDoDuyTriTriNho,
  phanLoaiTrangThaiDangBai,
} from "@/lib/adaptive-engine";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: {
    chuongId?: string;
    chuDeId?: string;
  };
}

export default async function BaiTapIndexPage({ searchParams }: Props) {
  const { chuDeId } = searchParams;
  const session = await auth();
  const userId = session?.user?.id;

  // =========================================================================
  // CHẾ ĐỘ 1: XEM THEO TỪNG BÀI HỌC CỤ THỂ (?chuDeId=...)
  // TRUNG TÂM HỌC THÍCH ỨNG (BKT + IRT ZPD) & LẶP LẠI NGẮT QUÃNG THEO DẠNG BÀI
  // =========================================================================
  if (chuDeId) {
    const [currentChuDe, nangLucDangs] = await Promise.all([
      db.chuDe.findUnique({
        where: { id: chuDeId },
        include: {
          chuong: true,
        },
      }),
      layNangLucTheoChuDe(userId, chuDeId),
    ]);

    if (!currentChuDe) {
      return (
        <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
          <p className="text-slate-500">Không tìm thấy bài học yêu cầu.</p>
          <Link
            href="/bai-tap"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            Quay lại danh mục
          </Link>
        </div>
      );
    }

    const baiId = currentChuDe.id.replace("-cd", "-b");
    const totalQuestionsInLesson = nangLucDangs.reduce(
      (sum, d) => sum + d.soCauTrongNganHang,
      0
    );

    const soDangDaLuyen = nangLucDangs.filter((d) => d.soLanLuyen > 0).length;
    const soDangThanhThao = nangLucDangs.filter(
      (d) => d.trangThai === "THANH_THAO"
    ).length;
    const soDangCanOn = nangLucDangs.filter(
      (d) => d.trangThai === "CAN_ON_LAI"
    ).length;
    const isColdStart = soDangDaLuyen === 0;

    const avgMastery =
      nangLucDangs.length > 0
        ? Math.round(
            (nangLucDangs.reduce((s, d) => s + d.xacSuatHieuDung, 0) /
              nangLucDangs.length) *
              100
          )
        : 25;

    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-200">
        {/* Breadcrumb & Quay lại danh mục 9 chương */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/bai-tap"
              prefetch={true}
              className="hover:text-blue-600 transition-colors font-medium"
            >
              Ngân hàng bài tập
            </Link>
            <span>/</span>
            <span className="text-slate-700">{currentChuDe.chuong.ten}</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">{currentChuDe.ten}</span>
          </div>

          <Link
            href="/bai-tap"
            prefetch={true}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] text-xs font-semibold text-slate-700 transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh mục 9 chương
          </Link>
        </div>

        {/* ================================================================= */}
        {/* BANNER 1: ĐIỀU PHỐI HỌC THÍCH ỨNG (BKT + IRT) & CHẨN ĐOÁN COLD-START */}
        {/* ================================================================= */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 space-y-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex items-center gap-2 text-blue-100 text-xs font-bold uppercase tracking-wider flex-wrap">
                <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">
                  <Brain className="w-3.5 h-3.5 text-amber-300" /> Học Thích Ứng
                  Hợp Nhất (BKT + IRT 3PL + Spaced Repetition)
                </span>
                {soDangCanOn > 0 && (
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full font-black">
                    <Repeat className="w-3.5 h-3.5" /> {soDangCanOn} dạng bài
                    đang suy giảm trí nhớ
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {currentChuDe.ten}
              </h1>

              <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                Hệ thống tự động chọn câu hỏi trong{" "}
                <strong>Vùng phát triển gần (ZPD: xác suất đúng ~70%)</strong>{" "}
                và kết hợp <strong>lặp lại ngắt quãng Ebbinghaus</strong> ngay
                khi độ nhớ dạng bài suy giảm dưới ngưỡng an toàn.
              </p>
            </div>

            {/* Khối thống kê Thành thạo bài học */}
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 text-center border border-white/20 shrink-0 min-w-[160px] space-y-1">
              <span className="text-3xl sm:text-4xl font-black block tracking-tight">
                {avgMastery}%
              </span>
              <span className="text-xs text-blue-100 font-semibold block">
                Độ thành thạo bài học
              </span>
              <span className="text-[11px] text-amber-300 font-bold block">
                ★ {soDangThanhThao}/{nangLucDangs.length} dạng đã làm chủ
              </span>
            </div>
          </div>

          {/* Gợi ý Cold-Start hoặc Luyện thích ứng AI */}
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/15 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                {isColdStart
                  ? "Khởi động nguội (Cold-Start Placement): Bạn mới bắt đầu bài học này!"
                  : soDangCanOn > 0
                  ? `Cảnh báo đường cong lãng quên: Có ${soDangCanOn} dạng toán cần ôn khôi phục trí nhớ!`
                  : "Lộ trình thích ứng cá nhân hóa theo năng lực θ của bạn"}
              </div>
              <p className="text-xs text-blue-100">
                {isColdStart
                  ? "Hãy làm bài Chẩn đoán nhanh (8 câu phân tầng qua mọi dạng bài) để AI xác định chính xác năng lực θ và P(L0) ban đầu."
                  : "Bấm Luyện thích ứng ZPD để hệ thống tự động chọn dạng bài cần ưu tiên và câu hỏi vừa sức nhất (P ≈ 70%)."}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {isColdStart && (
                <Link
                  href={`/lam-bai/tong-hop/${chuDeId}?soCau=8&mode=chan-doan`}
                  prefetch={true}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Target className="w-4 h-4" /> Chẩn đoán đầu vào (8 câu)
                </Link>
              )}

              <Link
                href={`/lam-bai/chu-de/${chuDeId}`}
                prefetch={true}
                className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer active:scale-[0.98] ${
                  isColdStart
                    ? "bg-white text-blue-700 hover:bg-blue-50"
                    : "bg-amber-400 hover:bg-amber-300 text-slate-950"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {soDangCanOn > 0
                    ? "Ôn ngắt quãng & Thích ứng ngay"
                    : "Luyện thích ứng ZPD (AI chọn câu)"}
                </span>
              </Link>
            </div>
          </div>

          {/* Các nút chọn Đề thi tổng hợp ngẫu nhiên */}
          <div className="pt-2 border-t border-white/15 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-100">
              <span>THI THỬ TỔNG HỢP PHÂN TẦNG ({totalQuestionsInLesson} CÂU):</span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href={`/lam-bai/tong-hop/${chuDeId}?soCau=10`}
                prefetch={true}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-[0.98] border border-white/25 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Đề nhanh (10 câu)</span>
              </Link>

              <Link
                href={`/lam-bai/tong-hop/${chuDeId}?soCau=15`}
                prefetch={true}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 active:scale-[0.98] border border-white/30 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Đề tiêu chuẩn (15 câu)</span>
              </Link>

              <Link
                href={`/lam-bai/tong-hop/${chuDeId}?soCau=20`}
                prefetch={true}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-[0.98] border border-white/25 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Đề thử thách (20 câu)</span>
              </Link>

              {baiId && (
                <Link
                  href={`/ly-thuyet/lop-11/${currentChuDe.chuongId}/${baiId}`}
                  prefetch={true}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/20 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Đọc lý thuyết
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* KHỐI 2: DANH MỤC DẠNG TOÁN KÈM HỒ SƠ BKT + IRT + ĐỘ BỀN TRÍ NHỚ   */}
        {/* ================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Các dạng bài toán (Knowledge Components) & Trạng thái Trí nhớ:
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Độ thành thạo thực tế{" "}
                <strong>P_eff(L) = P(L_t) × 0.80^(Δt / S)</strong> kết hợp trực
                tiếp xác suất làm chủ BKT và đường cong lãng quên Ebbinghaus.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                🟢 ≥ 85%: Đã thành thạo
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                🟡 &lt; 70%: Cần ôn lại
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {nangLucDangs.map((dang, idx) => {
              const masteryPct = Math.round(dang.xacSuatHieuDung * 100);
              const retentionPct = Math.round(dang.doNhoHienTai * 100);

              let badgeStyle =
                "bg-slate-100 text-slate-600 border-slate-200";
              let cardBorder = "border-slate-200/90 hover:border-blue-300";
              let btnStyle =
                "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20";
              let btnLabel = "Luyện thích ứng (ZPD)";

              if (dang.trangThai === "THANH_THAO") {
                badgeStyle =
                  "bg-emerald-50 text-emerald-800 border-emerald-200";
                cardBorder = "border-emerald-200/90 hover:border-emerald-400";
                btnStyle =
                  "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20";
                btnLabel = "Thử thách duy trì";
              } else if (dang.trangThai === "CAN_ON_LAI") {
                badgeStyle = "bg-amber-50 text-amber-800 border-amber-300";
                cardBorder =
                  "border-amber-300 bg-amber-50/15 hover:border-amber-400";
                btnStyle =
                  "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20";
                btnLabel = "Ôn khôi phục trí nhớ";
              } else if (dang.trangThai === "DANG_REN_LUYEN") {
                badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
              }

              return (
                <div
                  key={dang.dangBai}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 group ${cardBorder}`}
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                        {dang.dangBai}
                      </h3>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}
                      >
                        {dang.nhanTrangThai}
                      </span>
                      <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                        {dang.soCauTrongNganHang} câu
                      </span>
                    </div>

                    {dang.moTaDangBai && (
                      <p className="text-xs text-slate-500 leading-relaxed pl-8">
                        {dang.moTaDangBai}
                      </p>
                    )}

                    {/* Thanh đo lường kép: BKT Mastery & Ebbinghaus Memory Stability */}
                    <div className="pl-8 pt-1 space-y-2">
                      <div className="flex items-center justify-between text-xs gap-4 flex-wrap">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-bold text-slate-700">
                            Độ thành thạo:{" "}
                            <strong
                              className={
                                masteryPct >= 85
                                  ? "text-emerald-600"
                                  : masteryPct < 60 && dang.soLanLuyen > 0
                                  ? "text-amber-600"
                                  : "text-blue-600"
                              }
                            >
                              {masteryPct}%
                            </strong>{" "}
                            <span className="text-slate-400 font-normal">
                              (Mục tiêu: 85%)
                            </span>
                          </span>

                          {dang.soLanLuyen > 0 && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-600">
                                Độ nhớ hiện tại:{" "}
                                <strong>{retentionPct}%</strong> (Độ bền S ={" "}
                                {dang.doBenTriNho} ngày)
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-600">
                                Năng lực IRT:{" "}
                                <strong>
                                  θ ={" "}
                                  {dang.nangLucIRT >= 0
                                    ? `+${dang.nangLucIRT}`
                                    : dang.nangLucIRT}
                                </strong>{" "}
                                ({dang.mucDoGoiY})
                              </span>
                            </>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400 font-medium">
                          Đã luyện: {dang.soLanDung}/{dang.soLanLuyen} câu đúng
                        </span>
                      </div>

                      {/* Progress bar với vạch đích 85% */}
                      <div className="relative w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            dang.trangThai === "THANH_THAO"
                              ? "bg-emerald-500"
                              : dang.trangThai === "CAN_ON_LAI"
                              ? "bg-amber-500"
                              : dang.soLanLuyen > 0
                              ? "bg-blue-600"
                              : "bg-slate-300"
                          }`}
                          style={{
                            width: `${
                              dang.soLanLuyen === 0
                                ? 6
                                : Math.min(100, Math.max(8, masteryPct))
                            }%`,
                          }}
                        />
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-emerald-700/60"
                          style={{ left: "85%" }}
                          title="Ngưỡng Thành thạo 85%"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    <Link
                      href={`/lam-bai/chu-de/${chuDeId}?dangBai=${encodeURIComponent(
                        dang.dangBai
                      )}`}
                      prefetch={true}
                      className={`px-4 py-2.5 rounded-xl active:scale-[0.98] font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${btnStyle}`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{btnLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CHẾ ĐỘ 2: DANH MỤC 9 CHƯƠNG TOÁN 11 (TRANG CHỦ BÀI TẬP & ÔN TẬP HỢP NHẤT)
  // =========================================================================
  const [chuongs, allUserMastery] = await Promise.all([
    db.chuong.findMany({
      where: { lopId: "lop-11" },
      orderBy: { thuTu: "asc" },
      include: {
        chuDes: {
          orderBy: { thuTu: "asc" },
          include: {
            _count: {
              select: { baiTaps: true },
            },
          },
        },
      },
    }),
    userId
      ? db.nangLucDangBai.findMany({
          where: { nguoiDungId: userId },
          include: { chuDe: true },
        })
      : Promise.resolve([]),
  ]);

  const totalAllQuestions = chuongs.reduce(
    (sum, ch) => sum + ch.chuDes.reduce((s, cd) => s + cd._count.baiTaps, 0),
    0
  );

  const now = new Date();
  const processedMastery = allUserMastery.map((rec) => {
    const r = tinhDoDuyTriTriNho(rec.lanLuyenCuoi, rec.doBenTriNho, now);
    const pEff = Number((rec.xacSuatThanhThao * r).toFixed(4));
    const status = phanLoaiTrangThaiDangBai(
      rec.soLanLuyen,
      rec.xacSuatThanhThao,
      pEff,
      r,
      rec.ngayOnKeTiep,
      now
    );
    return {
      ...rec,
      doNhoHienTai: r,
      xacSuatHieuDung: pEff,
      trangThai: status.trangThai,
      nhanTrangThai: status.nhanTrangThai,
    };
  });

  const decayingDangs = processedMastery
    .filter((m) => m.trangThai === "CAN_ON_LAI")
    .sort((a, b) => a.xacSuatHieuDung - b.xacSuatHieuDung);
  const masteredDangsCount = processedMastery.filter(
    (m) => m.trangThai === "THANH_THAO"
  ).length;
  const activeZpdCount = processedMastery.filter(
    (m) => m.trangThai === "DANG_REN_LUYEN"
  ).length;

  // Gom thống kê theo chuDeId để hiển thị trên từng bài học
  const chuDeMasteryMap = new Map<
    string,
    { count: number; mastered: number; decaying: number; avgPct: number }
  >();
  for (const m of processedMastery) {
    const cur = chuDeMasteryMap.get(m.chuDeId) || {
      count: 0,
      mastered: 0,
      decaying: 0,
      avgPct: 0,
    };
    cur.count += 1;
    if (m.trangThai === "THANH_THAO") cur.mastered += 1;
    if (m.trangThai === "CAN_ON_LAI") cur.decaying += 1;
    cur.avgPct += m.xacSuatHieuDung * 100;
    chuDeMasteryMap.set(m.chuDeId, cur);
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Hero Banner Hợp Nhất */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative space-y-2 z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-blue-100 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" /> Hệ Thống Học Thích Ứng & Lặp
            Lại Ngắt Quãng Hợp Nhất
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ngân Hàng Bài Tập Phân Dạng (BKT + IRT + FSRS)
          </h1>
          <p className="text-blue-50 text-xs sm:text-sm leading-relaxed">
            Hơn <strong>{totalAllQuestions} câu hỏi trắc nghiệm</strong> được
            hiệu chỉnh độ khó <strong>IRT 3PL</strong> theo từng{" "}
            <strong>Dạng bài toán</strong>, tự động điều phối câu hỏi vừa sức (
            <strong>ZPD ≈ 70%</strong>) và nhắc ôn ngắt quãng ngay trước khi bạn
            quên.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0 flex-wrap">
          <Link
            href="/dashboard"
            prefetch={true}
            className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2"
          >
            <Brain className="w-4 h-4" /> Xem Hồ sơ Năng lực & Biểu đồ Radar →
          </Link>
        </div>
      </div>

      {/* Thanh Trạng Thái Học Thích Ứng & Nhắc Ôn Ngắt Quãng Trực Tiếp */}
      {userId && processedMastery.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Trạng thái Mô hình Người học & Trí nhớ dài hạn của bạn:</span>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                🟢 Đã làm chủ (≥85%): {masteredDangsCount} dạng
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                🔵 Đang luyện ZPD: {activeZpdCount} dạng
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                🟡 Đang quên • Cần ôn lại: {decayingDangs.length} dạng
              </span>
            </div>
          </div>

          {decayingDangs.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-amber-600" />
                  Đường cong lãng quên Ebbinghaus: Phát hiện{" "}
                  {decayingDangs.length} dạng toán đang suy giảm trí nhớ!
                </div>
                <p className="text-xs text-amber-800">
                  Ưu tiên ôn ngay:{" "}
                  <strong>{decayingDangs[0].dangBai}</strong> (
                  {decayingDangs[0].chuDe.ten} • Độ thành thạo hiệu dụng còn{" "}
                  {Math.round(decayingDangs[0].xacSuatHieuDung * 100)}%)
                </p>
              </div>
              <Link
                href={`/lam-bai/chu-de/${
                  decayingDangs[0].chuDeId
                }?dangBai=${encodeURIComponent(decayingDangs[0].dangBai)}`}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shrink-0 transition-all shadow-xs flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Ôn khôi phục ngay
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Quick Chapter Filter Buttons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" /> Chọn nhanh Chương:
          </span>
          <span className="text-xs text-slate-400">9 Chương • 33 Bài học</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {chuongs.map((ch, idx) => (
            <a
              key={ch.id}
              href={`#${ch.id}`}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 active:scale-[0.98] transition-all shadow-2xs"
            >
              Chương {idx + 1}
            </a>
          ))}
        </div>
      </div>

      {/* Chapters & Lessons Directory */}
      <div className="space-y-8">
        {chuongs.map((chuong, chuongIdx) => {
          const chuongQuestionCount = chuong.chuDes.reduce(
            (sum, cd) => sum + cd._count.baiTaps,
            0
          );

          return (
            <div
              key={chuong.id}
              id={chuong.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-20"
            >
              {/* Chapter Header */}
              <div className="p-5 sm:px-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {chuongIdx + 1}
                  </span>
                  <div>
                    <h2 className="font-bold text-slate-800 text-base sm:text-lg">
                      {chuong.ten}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Gồm {chuong.chuDes.length} bài học trọng tâm
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-3 py-1 rounded-full">
                  {chuongQuestionCount} câu hỏi
                </span>
              </div>

              {/* Topics / Lessons List */}
              <div className="divide-y divide-slate-100">
                {chuong.chuDes.map((chuDe) => {
                  const baiId = chuDe.id.replace("-cd", "-b");
                  const dangCount =
                    DANH_MUC_DANG_BAI[chuDe.id]?.dangs.length || 3;
                  const stat = chuDeMasteryMap.get(chuDe.id);
                  const avgPct = stat ? Math.round(stat.avgPct / stat.count) : null;

                  return (
                    <div
                      key={chuDe.id}
                      className="p-5 sm:px-6 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/bai-tap?chuDeId=${chuDe.id}`}
                            prefetch={true}
                            className="font-bold text-slate-800 text-sm sm:text-base hover:text-blue-600 transition-colors"
                          >
                            {chuDe.ten}
                          </Link>
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                            {dangCount} dạng bài
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {chuDe._count.baiTaps} câu
                          </span>
                          {avgPct !== null && (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                avgPct >= 85
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-indigo-50 text-indigo-700"
                              }`}
                            >
                              Thành thạo: {avgPct}% ({stat?.mastered}/{dangCount} dạng)
                            </span>
                          )}
                          {stat && stat.decaying > 0 && (
                            <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                              ⚠️ {stat.decaying} dạng cần ôn
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          Luyện thích ứng theo từng dạng toán (BKT + IRT ZPD) kèm
                          kiểm tra chẩn đoán và thi tổng hợp phân tầng.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {/* Link đọc lý thuyết */}
                        <Link
                          href={`/ly-thuyet/lop-11/${chuong.id}/${baiId}`}
                          prefetch={true}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.98] text-xs font-semibold text-slate-600 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Lý
                          thuyết
                        </Link>

                        {/* Link mở danh mục Dạng bài & Học thích ứng */}
                        <Link
                          href={`/bai-tap?chuDeId=${chuDe.id}`}
                          prefetch={true}
                          className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 active:scale-[0.98] text-xs font-semibold text-blue-700 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" /> Các dạng bài ({dangCount})
                        </Link>

                        {/* Nút Luyện thích ứng nhanh */}
                        <Link
                          href={`/lam-bai/chu-de/${chuDe.id}`}
                          prefetch={true}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Luyện thích ứng
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
