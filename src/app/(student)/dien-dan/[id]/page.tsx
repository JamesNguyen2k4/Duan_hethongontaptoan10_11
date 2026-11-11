import { auth } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Layers,
  Camera,
  Clock,
  Target,
} from "lucide-react";
import { layChiTietBaiViet } from "@/features/dien-dan/services/bai-viet";
import { LuoiAnhMangXaHoi } from "@/features/dien-dan/components/LuoiAnhMangXaHoi";
import { WidgetBaiTapDinhKem } from "@/features/dien-dan/components/WidgetBaiTapDinhKem";
import { CayBinhLuan } from "@/features/dien-dan/components/CayBinhLuan";
import { NutXoaBaiViet } from "@/features/dien-dan/components/NutXoaBaiViet";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    id: string;
  };
}

export default async function ChiTietBaiVietPage({ params }: Props) {
  const session = await auth();
  const baiViet = await layChiTietBaiViet(params.id);

  if (!baiViet || baiViet.trangThai === "DA_XOA") {
    notFound();
  }

  const dTaoLuc = new Date(baiViet.taoLuc);
  const isTeacher =
    baiViet.nguoiDung.vaiTro === "GIAO_VIEN" ||
    baiViet.nguoiDung.vaiTro === "QUAN_TRI";
  const isAuthorOrMod =
    session?.user?.id === baiViet.nguoiDungId ||
    session?.user?.role === "GIAO_VIEN" ||
    session?.user?.role === "QUAN_TRI";

  const danhSachAnhIds = baiViet.hinhAnhs.map((h) => h.id);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-200">
      {/* Nút quay lại diễn đàn */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dien-dan"
          prefetch={true}
          className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Diễn đàn
        </Link>

        {baiViet.chuDe && (
          <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            {baiViet.chuDe.ten}
          </span>
        )}
      </div>

      {/* Khối bài đăng kiểu mạng xã hội */}
      <article className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-xs space-y-5">
        {/* =============================================================== */}
        {/* 1. HEADER: TÁC GIẢ, VAI TRÒ, THỜI GIAN, NÚT XÓA                 */}
        {/* =============================================================== */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs ring-2 ring-blue-50">
              {baiViet.nguoiDung.tenHienThi.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-slate-900">
                  {baiViet.nguoiDung.tenHienThi}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isTeacher
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : "bg-blue-50 text-blue-700 border border-blue-100"
                  }`}
                >
                  {isTeacher ? "Giáo viên" : "Học sinh"}
                </span>
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                {dTaoLuc.getDate()}/{dTaoLuc.getMonth() + 1}/
                {dTaoLuc.getFullYear()} lúc {dTaoLuc.getHours()}:
                {dTaoLuc.getMinutes() < 10 ? "0" : ""}
                {dTaoLuc.getMinutes()}
              </span>
            </div>
          </div>

          {isAuthorOrMod && <NutXoaBaiViet baiVietId={baiViet.id} />}
        </div>

        {/* =============================================================== */}
        {/* 2. DÒNG NỘI DUNG VĂN BẢN (NẰM BÊN TRÊN BỨC ẢNH)                 */}
        {/* =============================================================== */}
        <div className="space-y-3">
          {/* Tiêu đề bài hỏi */}
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
            {baiViet.tieuDe}
          </h1>

          {/* Dòng ghi nội dung thắc mắc của học sinh */}
          {baiViet.noiDung && (
            <div className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap">
              {baiViet.noiDung}
            </div>
          )}
        </div>

        {/* =============================================================== */}
        {/* 3. BỨC ẢNH BÀI LÀM (NẰM NGAY BÊN DƯỚI DÒNG NỘI DUNG)            */}
        {/* =============================================================== */}
        {danhSachAnhIds.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <LuoiAnhMangXaHoi danhSachAnhIds={danhSachAnhIds} />
          </div>
        )}

        {/* 4. Bài tập trắc nghiệm gắn kèm (nếu có) */}
        {baiViet.baiTap && (
          <div className="pt-2">
            <WidgetBaiTapDinhKem baiTap={baiViet.baiTap} />
          </div>
        )}
      </article>

      {/* Cây bình luận thảo luận */}
      <CayBinhLuan
        baiVietId={baiViet.id}
        danhSachBinhLuan={baiViet.binhLuans as any}
        currentUser={
          session?.user
            ? {
                id: session.user.id || "",
                name: session.user.name || "Người dùng",
                role: session.user.role || "HOC_SINH",
              }
            : undefined
        }
      />
    </div>
  );
}
