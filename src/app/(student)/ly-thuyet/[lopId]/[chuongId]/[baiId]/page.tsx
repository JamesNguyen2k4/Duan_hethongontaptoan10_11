import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MathRenderer } from "@/components/shared/MathRenderer";
import { ArrowLeft, ArrowRight, CheckCircle2, BookOpen, Layers } from "lucide-react";

interface Props {
  params: {
    lopId: string;
    chuongId: string;
    baiId: string;
  };
}

export const dynamic = "force-dynamic";

export default async function BaiLyThuyetDetailPage({ params }: Props) {
  const { lopId, chuongId, baiId } = params;

  const bai = await db.bai.findUnique({
    where: { id: baiId },
    include: {
      chuong: {
        include: {
          bais: {
            orderBy: { thuTu: "asc" },
          },
        },
      },
    },
  });

  if (!bai) {
    notFound();
  }

  // Tìm bài trước và bài kế tiếp
  const currentIndex = bai.chuong.bais.findIndex((b) => b.id === bai.id);
  const prevBai = currentIndex > 0 ? bai.chuong.bais[currentIndex - 1] : null;
  const nextBai = currentIndex < bai.chuong.bais.length - 1 ? bai.chuong.bais[currentIndex + 1] : null;

  // Lấy câu hỏi liên quan đến bài này
  const chuDe = await db.chuDe.findFirst({
    where: { chuongId: chuongId, thuTu: bai.thuTu },
    include: {
      _count: {
        select: { baiTaps: true }
      }
    }
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 flex-wrap">
        <Link href="/ly-thuyet" className="hover:text-blue-600 transition-colors">
          Lý thuyết Toán 11
        </Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">{bai.chuong.ten}</span>
        <span>/</span>
        <span className="text-blue-600 font-semibold">{bai.tieu_de}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <MathRenderer content={bai.noiDung} />
          </div>

          {/* Navigation between lessons */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
            {prevBai ? (
              <Link
                href={`/ly-thuyet/${lopId}/${chuongId}/${prevBai.id}`}
                prefetch={true}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] text-slate-700 text-sm font-medium transition-all shadow-xs cursor-pointer select-none"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> {prevBai.tieu_de}
              </Link>
            ) : <div />}

            {nextBai ? (
              <Link
                href={`/ly-thuyet/${lopId}/${chuongId}/${nextBai.id}`}
                prefetch={true}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold transition-all ml-auto shadow-sm cursor-pointer select-none"
              >
                {nextBai.tieu_de} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : <div />}
          </div>
        </div>

        {/* Sidebar - Cố định (sticky) khi cuộn nội dung */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
            {/* Luyện tập bài tập card */}
            {chuDe && chuDe._count.baiTaps > 0 && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-200/70 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-blue-700 font-bold">
                  <Layers className="w-5 h-5" />
                  <span>Ngân hàng bài tập</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bài học này có <strong>{chuDe._count.baiTaps} câu hỏi trắc nghiệm</strong> phân hóa theo 4 mức độ để bạn luyện thi ngay.
                </p>
                <Link
                  href={`/bai-tap?chuDeId=${chuDe.id}`}
                  prefetch={true}
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer select-none"
                >
                  Luyện tập bài này ngay →
                </Link>
              </div>
            )}

            {/* Chapter lesson list */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2 border-b pb-3">
                <BookOpen className="w-4 h-4 text-blue-600" /> Các bài trong chương
              </h4>
              <div className="space-y-1.5">
                {bai.chuong.bais.map((b) => (
                  <Link
                    key={b.id}
                    href={`/ly-thuyet/${lopId}/${chuongId}/${b.id}`}
                    prefetch={true}
                    className={`block px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer select-none ${
                      b.id === bai.id
                        ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {b.tieu_de}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

