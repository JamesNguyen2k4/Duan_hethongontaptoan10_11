import { auth } from "@/lib/auth";
import Link from "next/link";
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  Camera,
  Image as ImageIcon,
  Layers,
  Target,
  Sparkles,
} from "lucide-react";
import {
  layDanhSachBaiViet,
  layDanhSachChuDeDienDan,
} from "@/features/dien-dan/services/bai-viet";
import { TheBaiViet } from "@/features/dien-dan/components/TheBaiViet";
import { layLopHienTai, thongTinLop } from "@/lib/lop-context";

import { ThanhLocDienDan } from "@/features/dien-dan/components/ThanhLocDienDan";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: {
    chuDeId?: string;
    dangBai?: string;
    tuKhoa?: string;
    trang?: string;
    chiBaiTap?: string;
    lop?: string;
  };
}

export default async function DienDanPage({ searchParams }: Props) {
  const session = await auth();
  const lopMacDinh = await layLopHienTai();
  const lopFilter = searchParams.lop === "all" ? "all" : lopMacDinh;
  const lopInfo = thongTinLop(lopMacDinh);

  const trang = parseInt(searchParams.trang || "1", 10);
  const chuDeId = searchParams.chuDeId || undefined;
  const dangBai = searchParams.dangBai || undefined;
  const tuKhoa = searchParams.tuKhoa || undefined;
  const chiBaiTap = searchParams.chiBaiTap === "true";

  const [danhSachRes, danhSachChuDe] = await Promise.all([
    layDanhSachBaiViet({
      lopId: lopFilter,
      chuDeId,
      dangBai,
      tuKhoa,
      chiBaiTap,
      trang,
      soLuongMoiTrang: 10,
    }),
    layDanhSachChuDeDienDan(lopFilter),
  ]);

  const { danhSach, tongSo, tongSoTrang, trangHienTai } = danhSachRes;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 animate-in fade-in duration-200">
      {/* Khung tạo bài viết nhanh kiểu mạng xã hội */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs ring-2 ring-blue-50">
          {session?.user?.name?.charAt(0).toUpperCase() || "?"}
        </div>
        <Link
          href="/dien-dan/tao-moi"
          prefetch={true}
          className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-xs sm:text-sm text-slate-500 font-medium transition-colors cursor-pointer text-left truncate"
        >
          {session?.user?.name
            ? `${session.user.name} ơi, bạn gặp bài toán khó nào? Bấm để hỏi nhé...`
            : "Bạn đang gặp bài toán khó nào hôm nay? Chụp ảnh bài làm để hỏi nhé..."}
        </Link>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/dien-dan/tao-moi?action=camera"
            prefetch={true}
            className="w-10 h-10 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
            title="Chụp ảnh bài làm (Máy ảnh)"
          >
            <Camera className="w-5 h-5 text-emerald-600" />
          </Link>
          <Link
            href="/dien-dan/tao-moi?action=file"
            prefetch={true}
            className="w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
            title="Tải tệp ảnh từ máy (Tệp)"
          >
            <ImageIcon className="w-5 h-5 text-blue-600" />
          </Link>
        </div>
      </div>

      {/* Thanh công cụ tìm kiếm và lọc bài */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <ThanhLocDienDan
          danhSachChuDe={danhSachChuDe}
          tuKhoaMacDinh={tuKhoa}
          chuDeIdMacDinh={chuDeId}
          dangBaiMacDinh={dangBai}
          lopFilter={searchParams.lop}
        />

        {/* Bộ lọc nhanh (Quick Pills) */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs text-slate-500 flex-wrap">
          <span className="font-semibold text-slate-400">Xem nhanh:</span>
          <Link
            href="/dien-dan"
            className={`px-3 py-1 rounded-full border transition-all ${!chuDeId && !chiBaiTap && lopFilter !== "all"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
              }`}
          >
            {lopInfo.ten} ({lopFilter !== "all" ? tongSo : "lọc theo lớp"})
          </Link>
          <Link
            href="/dien-dan?lop=all"
            className={`px-3 py-1 rounded-full border transition-all ${lopFilter === "all" && !chuDeId && !chiBaiTap
                ? "bg-blue-50 text-blue-800 border-blue-300 font-bold"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
              }`}
          >
            Tất cả các lớp
          </Link>
          <Link
            href="/dien-dan?chiBaiTap=true"
            className={`px-3 py-1 rounded-full border transition-all flex items-center gap-1 ${chiBaiTap
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
              }`}
          >
            <Target className="w-3 h-3 text-emerald-600" />
            Gắn câu hỏi trắc nghiệm
          </Link>
        </div>
      </div>

      {/* Danh sách bài viết dạng Newsfeed mạng xã hội */}
      <div className="space-y-5">
        {danhSach.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/90 p-8 space-y-3 shadow-xs">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">
              Chưa có bài thảo luận nào phù hợp
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Không tìm thấy câu hỏi nào với bộ lọc hiện tại. Bạn có thể là người
              đầu tiên đặt câu hỏi hoặc chụp ảnh bài làm để bắt đầu thảo luận!
            </p>
            <Link
              href="/dien-dan/tao-moi"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" /> Đặt câu hỏi ngay
            </Link>
          </div>
        ) : (
          danhSach.map((baiViet) => (
            <TheBaiViet key={baiViet.id} baiViet={baiViet as any} />
          ))
        )}
      </div>

      {/* Phân trang */}
      {tongSoTrang > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: tongSoTrang }, (_, i) => i + 1).map((p) => {
            const queryParams = new URLSearchParams();
            if (chuDeId) queryParams.set("chuDeId", chuDeId);
            if (tuKhoa) queryParams.set("tuKhoa", tuKhoa);
            if (chiBaiTap) queryParams.set("chiBaiTap", "true");
            queryParams.set("trang", p.toString());

            return (
              <Link
                key={p}
                href={`/dien-dan?${queryParams.toString()}`}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${p === trangHienTai
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

