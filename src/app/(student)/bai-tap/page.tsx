import { db } from "@/lib/db";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  Layers,
  GraduationCap,
  Play,
  RotateCcw,
} from "lucide-react";
import { DANH_MUC_DANG_BAI } from "@/lib/danh-muc-dang-bai";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: {
    chuongId?: string;
    chuDeId?: string;
  };
}

export default async function BaiTapIndexPage({ searchParams }: Props) {
  const { chuDeId } = searchParams;

  // Lấy danh sách toàn bộ 9 chương kèm các bài học/chủ đề
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
  // CHẾ ĐỘ 1: XEM THEO TỪNG BÀI HỌC CỤ THỂ (?chuDeId=...)
  // HIỂN THỊ CÁC DẠNG TOÁN & LUYỆN TẬP TỔNG HỢP (KHÔNG HIỂN THỊ LIST CÂU HỎI)
  // =========================================================================
  if (chuDeId) {
    const currentChuDe = await db.chuDe.findUnique({
      where: { id: chuDeId },
      include: {
        chuong: true,
      },
    });

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
    const configDangBai = DANH_MUC_DANG_BAI[chuDeId];

    // Thống kê số lượng câu hỏi theo từng dạng bài từ database
    const dangsStats = await db.baiTap.groupBy({
      by: ["dangBai"],
      where: { chuDeId },
      _count: true,
    });

    const countMap = new Map(dangsStats.map((d) => [d.dangBai, d._count]));
    const totalQuestionsInLesson = Array.from(countMap.values()).reduce(
      (a, b) => a + b,
      0
    );

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
        {/* BANNER 1: LUYỆN TẬP TỔNG HỢP BÀI HỌC (ĐỀ NGẪU NHIÊN CHUẨN THI)    */}
        {/* ================================================================= */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 space-y-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-blue-100 text-xs font-bold uppercase tracking-wider">
                <Target className="w-4 h-4 text-amber-300" /> Chế độ Luyện Tập Tổng Hợp
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {currentChuDe.ten}
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                Hệ thống sẽ <strong>nhặt ngẫu nhiên</strong> bộ câu hỏi phân hóa từ toàn bộ các dạng bài để tạo đề kiểm tra tổng hợp có tính giờ, chấm điểm và xếp lịch ôn tập thông minh.
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 text-center border border-white/20 shrink-0">
              <span className="text-3xl sm:text-4xl font-black block tracking-tight">
                {totalQuestionsInLesson}
              </span>
              <span className="text-xs text-blue-100 font-semibold block mt-0.5">
                câu hỏi trong ngân hàng
              </span>
            </div>
          </div>

          {/* Các nút chọn số lượng câu thi */}
          <div className="pt-4 border-t border-white/15 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-100">
              <span>CHỌN CHẾ ĐỘ ĐỀ THI:</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/lam-bai/tong-hop/${chuDeId}?soCau=10`}
                prefetch={true}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-[0.98] border border-white/25 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
              >
                <span>Đề nhanh (10 câu)</span>
              </Link>

              <Link
                href={`/lam-bai/tong-hop/${chuDeId}?soCau=15`}
                prefetch={true}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-400/20 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Đề tiêu chuẩn (15 câu)</span>
                <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded">Khuyên dùng</span>
              </Link>

              <Link
                href={`/lam-bai/tong-hop/${chuDeId}?soCau=20`}
                prefetch={true}
                className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 active:scale-[0.98] font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Đề thử thách (20 câu)</span>
              </Link>

              {baiId && (
                <Link
                  href={`/ly-thuyet/lop-11/${currentChuDe.chuongId}/${baiId}`}
                  prefetch={true}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/20 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Đọc lý thuyết
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* KHỐI 2: DANH MỤC CÁC DẠNG TOÁN TRỌNG TÂM                         */}
        {/* ================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Các dạng bài toán trọng tâm cần rèn luyện:
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chọn từng dạng cụ thể để rèn luyện chuyên sâu các dạng kỹ năng giải toán.
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {configDangBai?.dangs.length || dangsStats.length} dạng toán
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {configDangBai?.dangs.map((dang, idx) => {
              const qCount = countMap.get(dang.ten) || 0;

              return (
                <div
                  key={dang.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                        {dang.ten}
                      </h3>
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                        {qCount} câu hỏi
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed pl-8">
                      {dang.moTa}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Link
                      href={`/lam-bai/chu-de/${chuDeId}?dangBai=${encodeURIComponent(dang.ten)}`}
                      prefetch={true}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 group-hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Luyện tập dạng này</span>
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
  // CHẾ ĐỘ 2: DANH MỤC 9 CHƯƠNG TOÁN 11 (TRANG CHỦ BÀI TẬP)
  // =========================================================================
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative space-y-2 z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-blue-100 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" /> Hệ Thống Luyện Thi Toán 11 (KNTT)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ngân Hàng Bài Tập Phân Dạng
          </h1>
          <p className="text-blue-50 text-xs sm:text-sm leading-relaxed">
            Hơn <strong>{totalAllQuestions} câu hỏi trắc nghiệm</strong> được phân chia khoa học thành từng <strong>Dạng bài toán trọng tâm</strong>, hỗ trợ luyện tập chuyên sâu hoặc thi thử tổng hợp ngẫu nhiên.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0 flex-wrap">
          <Link
            href="/on-tap"
            prefetch={true}
            className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-current" /> Đến phòng Ôn tập ngắt quãng (SM-2) →
          </Link>
        </div>
      </div>

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
                  const dangCount = DANH_MUC_DANG_BAI[chuDe.id]?.dangs.length || 4;

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
                        </div>
                        <p className="text-xs text-slate-400">
                          Phân chia theo dạng toán trọng tâm kèm tính năng tạo đề luyện tập tổng hợp ngẫu nhiên.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {/* Link đọc lý thuyết */}
                        <Link
                          href={`/ly-thuyet/lop-11/${chuong.id}/${baiId}`}
                          prefetch={true}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.98] text-xs font-semibold text-slate-600 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Lý thuyết
                        </Link>

                        {/* Link mở danh mục Dạng bài */}
                        <Link
                          href={`/bai-tap?chuDeId=${chuDe.id}`}
                          prefetch={true}
                          className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 active:scale-[0.98] text-xs font-semibold text-blue-700 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" /> Dạng bài ({dangCount})
                        </Link>

                        {/* Nút Luyện tập tổng hợp ngẫu nhiên */}
                        <Link
                          href={`/lam-bai/tong-hop/${chuDe.id}?soCau=15`}
                          prefetch={true}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Target className="w-3.5 h-3.5" /> Luyện tổng hợp
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
