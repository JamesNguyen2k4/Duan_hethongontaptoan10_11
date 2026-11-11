"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Heart,
  Share2,
  Target,
  Layers,
  Clock,
  Check,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import { LuoiAnhMangXaHoi } from "./LuoiAnhMangXaHoi";

interface Props {
  baiViet: {
    id: string;
    tieuDe: string;
    noiDung: string;
    taoLuc: Date | string;
    nguoiDung: {
      id: string;
      tenHienThi: string;
      anhDaiDien: string | null;
      vaiTro: string;
    };
    chuDe: {
      id: string;
      ten: string;
    } | null;
    baiTap: {
      id: string;
      dangBai: string | null;
      mucDo: string;
    } | null;
    hinhAnhs: { id: string }[];
    _count: {
      binhLuans: number;
      hinhAnhs: number;
    };
  };
}

export function TheBaiViet({ baiViet }: Props) {
  const [daThich, setDaThich] = useState(false);
  const [soLuotThich, setSoLuotThich] = useState(0);
  const [daSaoChep, setDaSaoChep] = useState(false);
  const [moRongNoiDung, setMoRongNoiDung] = useState(false);

  const dTaoLuc = new Date(baiViet.taoLuc);
  const now = new Date();
  const diffMinutes = Math.round(
    (now.getTime() - dTaoLuc.getTime()) / (1000 * 60)
  );
  const diffHours = Math.round(diffMinutes / 60);

  let thoiGianText = `${dTaoLuc.getDate()}/${dTaoLuc.getMonth() + 1}`;
  if (diffMinutes < 1) {
    thoiGianText = "Vừa xong";
  } else if (diffMinutes < 60) {
    thoiGianText = `${diffMinutes} phút trước`;
  } else if (diffHours < 24) {
    thoiGianText = `${diffHours} giờ trước`;
  } else if (diffHours < 48) {
    thoiGianText = "Hôm qua";
  }

  const isTeacher =
    baiViet.nguoiDung.vaiTro === "GIAO_VIEN" ||
    baiViet.nguoiDung.vaiTro === "QUAN_TRI";

  const danhSachAnhIds = baiViet.hinhAnhs.map((h) => h.id);

  const handleThich = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (daThich) {
      setDaThich(false);
      setSoLuotThich((prev) => Math.max(0, prev - 1));
    } else {
      setDaThich(true);
      setSoLuotThich((prev) => prev + 1);
    }
  };

  const handleSaoChep = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/dien-dan/${baiViet.id}`;
      navigator.clipboard.writeText(url);
      setDaSaoChep(true);
      setTimeout(() => setDaSaoChep(false), 2000);
    }
  };

  return (
    <article className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
      {/* ================================================================= */}
      {/* 1. HEADER BÀI VIẾT: TÁC GIẢ, VAI TRÒ, THỜI GIAN, CHỦ ĐỀ           */}
      {/* ================================================================= */}
      <div className="p-4 sm:p-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar mạng xã hội */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs ring-2 ring-blue-50">
            {baiViet.nguoiDung.tenHienThi.charAt(0).toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                {baiViet.nguoiDung.tenHienThi}
              </span>

              {/* Huy hiệu vai trò */}
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

            {/* Dòng thời gian & chủ đề */}
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {thoiGianText}
              </span>

              {baiViet.chuDe && (
                <>
                  <span>•</span>
                  <span className="text-blue-600 font-semibold hover:underline">
                    {baiViet.chuDe.ten.replace(/^Bài \d+\.\s*/, "")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Nút xem chi tiết / Menu */}
        <Link
          href={`/dien-dan/${baiViet.id}`}
          className="text-xs text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="Xem chi tiết bài thảo luận"
        >
          <MoreHorizontal className="w-5 h-5" />
        </Link>
      </div>

      {/* ================================================================= */}
      {/* 2. DÒNG NỘI DUNG VĂN BẢN (NẰM BÊN TRÊN BỨC ẢNH)                   */}
      {/* ================================================================= */}
      <div className="px-4 sm:p-5 pt-0 space-y-2">
        {/* Tiêu đề câu hỏi */}
        <Link href={`/dien-dan/${baiViet.id}`} prefetch={true} className="block">
          <h2 className="font-bold text-slate-900 text-base sm:text-lg hover:text-blue-600 transition-colors leading-snug">
            {baiViet.tieuDe}
          </h2>
        </Link>

        {/* Dòng ghi nội dung thắc mắc của học sinh */}
        {baiViet.noiDung && (
          <div className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
            {baiViet.noiDung.length > 280 && !moRongNoiDung ? (
              <>
                {baiViet.noiDung.slice(0, 280)}...{" "}
                <button
                  type="button"
                  onClick={() => setMoRongNoiDung(true)}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Xem thêm
                </button>
              </>
            ) : (
              baiViet.noiDung
            )}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 3. BỨC ẢNH BÀI LÀM (NẰM NGAY BÊN DƯỚI DÒNG NỘI DUNG)              */}
      {/* ================================================================= */}
      {danhSachAnhIds.length > 0 && (
        <div className="px-4 sm:px-5">
          <LuoiAnhMangXaHoi danhSachAnhIds={danhSachAnhIds} />
        </div>
      )}

      {/* 4. Thẻ bài tập trắc nghiệm đính kèm (nếu học sinh hỏi từ câu hỏi cụ thể) */}
      {baiViet.baiTap && (
        <div className="px-4 sm:px-5 my-2">
          <Link
            href={`/dien-dan/${baiViet.id}`}
            className="p-3 bg-emerald-50/70 hover:bg-emerald-100/60 border border-emerald-200/90 rounded-2xl flex items-center justify-between gap-3 transition-colors group/bt"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
                  Câu hỏi đính kèm từ phòng luyện tập
                </span>
                <span className="text-xs text-slate-700 font-medium line-clamp-1">
                  {baiViet.baiTap.dangBai || "Bài tập rèn luyện"} • Mức độ:{" "}
                  <strong>{baiTapMucDoText(baiViet.baiTap.mucDo)}</strong>
                </span>
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 group-hover/bt:translate-x-0.5 transition-transform shrink-0">
              Xem đề bài <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      )}

      {/* ================================================================= */}
      {/* 5. FOOTER TƯƠNG TÁC MẠNG XÃ HỘI (THÍCH, BÌNH LUẬN, CHIA SẺ)      */}
      {/* ================================================================= */}
      <div className="px-4 sm:px-5 py-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Nút Thích / Thả tim */}
          <button
            type="button"
            onClick={handleThich}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-90 ${
              daThich
                ? "text-rose-600 bg-rose-50 border border-rose-200"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Heart
              className={`w-4 h-4 ${
                daThich ? "fill-rose-500 text-rose-500 scale-110" : ""
              } transition-transform`}
            />
            <span>{soLuotThich > 0 ? `${soLuotThich} Thích` : "Thích"}</span>
          </button>

          {/* Nút Bình luận / Thảo luận */}
          <Link
            href={`/dien-dan/${baiViet.id}`}
            prefetch={true}
            className="px-3 py-1.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 hover:text-blue-600 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span>
              {baiViet._count.binhLuans > 0
                ? `${baiViet._count.binhLuans} câu trả lời`
                : "Bình luận"}
            </span>
          </Link>
        </div>

        {/* Nút Chia sẻ / Sao chép liên kết */}
        <button
          type="button"
          onClick={handleSaoChep}
          className="px-2.5 py-1.5 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 flex items-center gap-1 transition-all cursor-pointer"
          title="Sao chép liên kết bài viết"
        >
          {daSaoChep ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700 font-bold">Đã chép link</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Chia sẻ</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function baiTapMucDoText(mucDo: string) {
  switch (mucDo) {
    case "NHAN_BIET":
      return "Nhận biết";
    case "THONG_HIEU":
      return "Thông hiểu";
    case "VAN_DUNG":
      return "Vận dụng";
    case "VAN_DUNG_CAO":
      return "Vận dụng cao";
    default:
      return mucDo;
  }
}
