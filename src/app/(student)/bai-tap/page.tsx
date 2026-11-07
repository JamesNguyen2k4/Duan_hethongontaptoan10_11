import { db } from "@/lib/db";
import Link from "next/link";
import { Filter, Play, BookOpen, Layers, Zap, ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { MathRenderer } from "@/components/shared/MathRenderer";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: {
    chuongId?: string;
    chuDeId?: string;
    mucDo?: string;
    page?: string;
  };
}

export default async function BaiTapIndexPage({ searchParams }: Props) {
  const { chuongId, chuDeId, mucDo } = searchParams;
  const currentPage = Math.max(1, parseInt(searchParams.page || "1", 10));
  const PAGE_SIZE = 20;

  // Lấy danh sách toàn bộ 9 chương kèm các chủ đề/bài học
  const chuongs = await db.chuong.findMany({
    where: { lopId: "lop-11" },
    orderBy: { thuTu: "asc" },
    include: {
      chuDes: {
        orderBy: { thuTu: "asc" },
        include: {
          _count: {
            select: { baiTaps: true },
          },
          baiTaps: {
            take: 1,
            orderBy: { taoLuc: "asc" },
            select: { id: true },
          },
        },
      },
    },
  });

  // Tính tổng số câu hỏi toàn bộ chương trình
  const totalAllQuestions = chuongs.reduce(
    (sum, ch) => sum + ch.chuDes.reduce((s, cd) => s + cd._count.baiTaps, 0),
    0
  );

  // =========================================================================
  // CHẾ ĐỘ 1: XEM CHI TIẾT CÂU HỎI THEO 1 BÀI HỌC / CHỦ ĐỀ CỤ THỂ (?chuDeId=...)
  // =========================================================================
  if (chuDeId) {
    const currentChuDe = await db.chuDe.findUnique({
      where: { id: chuDeId },
      include: {
        chuong: true,
      },
    });

    const whereClause: any = { chuDeId };
    if (mucDo) whereClause.mucDo = mucDo;

    const [totalQuestions, baiTaps] = await Promise.all([
      db.baiTap.count({ where: whereClause }),
      db.baiTap.findMany({
        where: whereClause,
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        orderBy: { taoLuc: "asc" },
        include: { chuDe: true },
      }),
    ]);

    const totalPages = Math.ceil(totalQuestions / PAGE_SIZE) || 1;
    const baiId = currentChuDe ? currentChuDe.id.replace("-cd", "-b") : null;

    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Breadcrumb & Quay lại danh mục */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/bai-tap" prefetch={true} className="hover:text-blue-600 transition-colors font-medium">
              Ngân hàng bài tập
            </Link>
            <span>/</span>
            <span className="text-slate-700">{currentChuDe?.chuong.ten}</span>
            <span>/</span>
            <span className="text-blue-600 font-semibold">{currentChuDe?.ten}</span>
          </div>

          <Link
            href="/bai-tap"
            prefetch={true}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] text-xs font-semibold text-slate-700 transition-all shadow-xs cursor-pointer select-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh mục 9 chương
          </Link>
        </div>

        {/* Chủ đề Info Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              {currentChuDe?.chuong.ten}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-2">
              {currentChuDe?.ten}
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              Gồm {totalQuestions} câu hỏi trắc nghiệm có đầy đủ 4 phương án, đáp án và lời giải chi tiết.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {baiId && (
              <Link
                href={`/ly-thuyet/lop-11/${currentChuDe?.chuongId}/${baiId}`}
                prefetch={true}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/30 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 backdrop-blur-sm cursor-pointer select-none"
              >
                <BookOpen className="w-4 h-4" /> Đọc lý thuyết
              </Link>
            )}
            {currentChuDe && (
              <Link
                href={`/lam-bai/chu-de/${currentChuDe.id}`}
                prefetch={true}
                className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 active:scale-[0.98] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer select-none"
              >
                <Play className="w-4 h-4 fill-current" /> Bắt đầu luyện ngay
              </Link>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" /> Mức độ câu hỏi:
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { label: "Tất cả mức độ", val: undefined },
              { label: "Nhận biết", val: "NHAN_BIET" },
              { label: "Thông hiểu", val: "THONG_HIEU" },
              { label: "Vận dụng", val: "VAN_DUNG" },
              { label: "Vận dụng cao", val: "VAN_DUNG_CAO" },
            ].map((item) => (
              <Link
                key={item.label}
                href={`/bai-tap?chuDeId=${chuDeId}${item.val ? `&mucDo=${item.val}` : ""}`}
                prefetch={true}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer select-none ${
                  mucDo === item.val || (!mucDo && !item.val)
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 active:scale-[0.98]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Danh sách câu hỏi */}
        <div className="space-y-4">
          {baiTaps.map((bt, index) => {
            const qNum = (currentPage - 1) * PAGE_SIZE + index + 1;
            let optionsObj: any = {};
            try {
              const parsed = JSON.parse(bt.dapAn);
              optionsObj = parsed.cacLuaChon || {};
            } catch {}

            return (
              <div
                key={bt.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-blue-300 transition-all space-y-4"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm bg-slate-100 px-2.5 py-1 rounded-lg">
                      Câu {qNum}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {bt.chuDe.ten}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      bt.mucDo === "NHAN_BIET"
                        ? "bg-emerald-100 text-emerald-800"
                        : bt.mucDo === "THONG_HIEU"
                        ? "bg-blue-100 text-blue-800"
                        : bt.mucDo === "VAN_DUNG"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {bt.mucDo.replace("_", " ")}
                  </span>
                </div>

                <div className="text-sm text-slate-800 leading-relaxed font-medium">
                  <MathRenderer content={bt.deBai} />
                </div>

                {Object.keys(optionsObj).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                    {Object.entries(optionsObj).map(([key, val]) => (
                      <div key={key} className="flex items-start gap-2">
                        <strong className="text-slate-900 font-bold shrink-0">{key}.</strong>
                        <div className="overflow-x-auto">
                          <MathRenderer content={String(val)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                  <Link
                    href={`/lam-bai/${bt.id}`}
                    prefetch={true}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer select-none"
                  >
                    <Play className="w-3.5 h-3.5" /> Làm bài câu này
                  </Link>
                </div>
              </div>
            );
          })}

          {baiTaps.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500 space-y-2">
              <p className="text-sm font-medium">Không tìm thấy câu hỏi nào thuộc mức độ này.</p>
              <Link
                href={`/bai-tap?chuDeId=${chuDeId}`}
                prefetch={true}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Xem tất cả các câu của bài này →
              </Link>
            </div>
          )}
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Link
              href={`/bai-tap?chuDeId=${chuDeId}${mucDo ? `&mucDo=${mucDo}` : ""}&page=${currentPage - 1}`}
              prefetch={true}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                currentPage > 1
                  ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
                  : "bg-slate-100 text-slate-400 border-slate-200 pointer-events-none"
              }`}
            >
              ← Trang trước
            </Link>

            <span className="text-xs font-medium text-slate-600 px-3">
              Trang {currentPage} / {totalPages}
            </span>

            <Link
              href={`/bai-tap?chuDeId=${chuDeId}${mucDo ? `&mucDo=${mucDo}` : ""}&page=${currentPage + 1}`}
              prefetch={true}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                currentPage < totalPages
                  ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
                  : "bg-slate-100 text-slate-400 border-slate-200 pointer-events-none"
              }`}
            >
              Trang sau →
            </Link>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // CHẾ ĐỘ 2: DANH MỤC PHÂN CHIA KHOA HỌC THEO 9 CHƯƠNG VÀ 33 BÀI HỌC (MẶC ĐỊNH)
  // =========================================================================
  const filteredChuongs = chuongId
    ? chuongs.filter((c) => c.id === chuongId)
    : chuongs;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              Toán 11 KNTT
            </span>
            <span className="text-blue-100 text-xs">Ngân hàng câu hỏi trắc nghiệm</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ngân Hàng Bài Tập Toán 11
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm max-w-xl leading-relaxed">
            Hệ thống gồm <strong>{totalAllQuestions} câu hỏi trắc nghiệm</strong> được phân chia khoa học thành <strong>9 Chương</strong> và <strong>33 Bài học</strong>, phân hóa 4 mức độ kèm đầy đủ phương án và lời giải chi tiết.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Link
            href="/on-tap"
            prefetch={true}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-900 font-bold text-xs rounded-2xl transition-all shadow-md cursor-pointer select-none"
          >
            <Zap className="w-4 h-4 text-slate-900" /> Phòng Ôn tập ngắt quãng (SM-2) →
          </Link>
        </div>
      </div>

      {/* Quick Chapter Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-blue-600" /> Chọn nhanh chương học:
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <Link
            href="/bai-tap"
            prefetch={true}
            className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all border cursor-pointer select-none ${
              !chuongId
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 active:scale-[0.98]"
            }`}
          >
            Tất cả 9 Chương ({totalAllQuestions})
          </Link>
          {chuongs.map((c, i) => {
            const count = c.chuDes.reduce((s, cd) => s + cd._count.baiTaps, 0);
            return (
              <Link
                key={c.id}
                href={`/bai-tap?chuongId=${c.id}`}
                prefetch={true}
                className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all border cursor-pointer select-none ${
                  chuongId === c.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 active:scale-[0.98]"
                }`}
              >
                Chương {i + 1} ({count})
              </Link>
            );
          })}
        </div>
      </div>

      {/* 9 Chapters Cards List */}
      <div className="space-y-6">
        {filteredChuongs.map((chuong) => {
          const chuongQuestionCount = chuong.chuDes.reduce(
            (sum, cd) => sum + cd._count.baiTaps,
            0
          );

          return (
            <div
              key={chuong.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
            >
              {/* Chapter Header */}
              <div className="bg-slate-50/90 border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-xs shrink-0">
                    {chuong.thuTu}
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

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-3 py-1 rounded-full">
                    {chuongQuestionCount} câu hỏi
                  </span>
                </div>
              </div>

              {/* Topics / Lessons List */}
              <div className="divide-y divide-slate-100">
                {chuong.chuDes.map((chuDe) => {
                  const baiId = chuDe.id.replace("-cd", "-b");
                  const firstQ = chuDe.baiTaps[0];

                  return (
                    <div
                      key={chuDe.id}
                      className="p-5 sm:px-6 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-800 text-sm sm:text-base hover:text-blue-600 transition-colors">
                            {chuDe.ten}
                          </h3>
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {chuDe._count.baiTaps} câu
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Đầy đủ bài tập trắc nghiệm nhận biết, thông hiểu, vận dụng kèm lời giải chi tiết.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {/* Link sang đọc lý thuyết */}
                        <Link
                          href={`/ly-thuyet/lop-11/${chuong.id}/${baiId}`}
                          prefetch={true}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.98] text-xs font-semibold text-slate-600 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer select-none"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Lý thuyết
                        </Link>

                        {/* Link xem danh sách câu hỏi */}
                        <Link
                          href={`/bai-tap?chuDeId=${chuDe.id}`}
                          prefetch={true}
                          className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 active:scale-[0.98] text-xs font-semibold text-blue-700 transition-all flex items-center gap-1 shadow-2xs cursor-pointer select-none"
                        >
                          Xem {chuDe._count.baiTaps} câu <ChevronRight className="w-3.5 h-3.5" />
                        </Link>

                        {/* Nút làm bài thông minh: tự tìm câu chưa làm của học sinh */}
                        <Link
                          href={`/lam-bai/chu-de/${chuDe.id}`}
                          prefetch={true}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer select-none"
                        >
                          <Play className="w-3 h-3 fill-current" /> Luyện tập ngay
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
