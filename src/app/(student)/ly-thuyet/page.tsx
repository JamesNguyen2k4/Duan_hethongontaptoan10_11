import { db } from "@/lib/db";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { layLopHienTai, thongTinLop } from "@/lib/lop-context";

export const dynamic = "force-dynamic";

export default async function LyThuyetIndexPage() {
  const lopId = await layLopHienTai();
  const lopInfo = thongTinLop(lopId);

  const lopData = await db.lop.findFirst({
    where: { id: lopId },
    include: {
      chuongs: {
        orderBy: { thuTu: "asc" },
        include: {
          bais: {
            orderBy: { thuTu: "asc" },
            include: {
              tienDos: true,
            },
          },
        },
      },
    },
  });

  const soChuong = lopData?.chuongs.length ?? 0;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            Kết Nối Tri Thức
          </span>
          <span className="text-blue-100 text-sm">
            Chương trình chuẩn {lopInfo.ten}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Học Lý Thuyết & Dạng Toán {lopInfo.nhan}
        </h1>
        <p className="mt-2 text-blue-100 max-w-2xl text-sm sm:text-base leading-relaxed">
          Tổng hợp toàn bộ {soChuong} chương lý thuyết cốt lõi, ví dụ giải mẫu và các phương pháp giải dạng toán bám sát định dạng thi mới.
        </p>
      </div>

      {/* Chapters list */}
      <div className="grid grid-cols-1 gap-6">
        {lopData?.chuongs.map((chuong, index) => (
          <div key={chuong.id} className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm">
                  {index + 1}
                </span>
                <h2 className="font-bold text-slate-800 text-base sm:text-lg">
                  {chuong.ten}
                </h2>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-full">
                {chuong.bais.length} bài học
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {chuong.bais.map((bai) => (
                <Link
                  key={bai.id}
                  href={`/ly-thuyet/${lopId}/${chuong.id}/${bai.id}`}
                  prefetch={true}
                  className="flex items-center justify-between px-6 py-4 hover:bg-blue-50/60 active:bg-blue-100/60 active:scale-[0.995] transition-all group cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                        {bai.tieu_de}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Thứ tự bài: #{bai.thuTu}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white group-active:scale-95 px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5">
                      Học ngay <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

