"use client";

import { useState } from "react";
import { X, ZoomIn, Download, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  danhSachAnhIds: string[];
}

export function LuoiAnhMangXaHoi({ danhSachAnhIds }: Props) {
  const [chiSoDangXem, setChiSoDangXem] = useState<number | null>(null);

  if (!danhSachAnhIds || danhSachAnhIds.length === 0) return null;

  const soLuong = danhSachAnhIds.length;

  const moXemAnh = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setChiSoDangXem(index);
  };

  const dongXemAnh = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setChiSoDangXem(null);
  };

  const xemAnhTruoc = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (chiSoDangXem !== null) {
      setChiSoDangXem((chiSoDangXem - 1 + soLuong) % soLuong);
    }
  };

  const xemAnhTiep = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (chiSoDangXem !== null) {
      setChiSoDangXem((chiSoDangXem + 1) % soLuong);
    }
  };

  return (
    <>
      {/* ================================================================= */}
      {/* BỐ CỤC ẢNH KIỂU MẠNG XÃ HỘI (1, 2, 3, 4+ ẢNH)                     */}
      {/* ================================================================= */}
      <div className="rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-50 my-3 shadow-2xs">
        {/* Trường hợp 1 ảnh: Hiển thị trọn vẹn, rõ ràng bài làm */}
        {soLuong === 1 && (
          <div
            onClick={(e) => moXemAnh(e, 0)}
            className="relative group cursor-pointer max-h-[500px] flex items-center justify-center bg-slate-950/5 overflow-hidden"
          >
            <img
              src={`/api/hinh-anh/${danhSachAnhIds[0]}`}
              alt="Ảnh bài làm"
              loading="lazy"
              className="w-full max-h-[480px] object-contain hover:scale-[1.01] transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-[1px]">
              <ZoomIn className="w-5 h-5 drop-shadow-md" />
              <span>Bấm để phóng to xem rõ nét</span>
            </div>
          </div>
        )}

        {/* Trường hợp 2 ảnh: Chia đôi 2 cột đều nhau */}
        {soLuong === 2 && (
          <div className="grid grid-cols-2 gap-1.5 h-64 sm:h-80">
            {danhSachAnhIds.slice(0, 2).map((id, idx) => (
              <div
                key={id}
                onClick={(e) => moXemAnh(e, idx)}
                className="relative group cursor-pointer overflow-hidden h-full bg-slate-100"
              >
                <img
                  src={`/api/hinh-anh/${id}`}
                  alt={`Ảnh bài làm ${idx + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5">
                  <ZoomIn className="w-4 h-4" />
                  <span>Xem ảnh {idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trường hợp 3 ảnh: 1 ảnh lớn bên trái, 2 ảnh nhỏ bên phải */}
        {soLuong === 3 && (
          <div className="grid grid-cols-3 gap-1.5 h-72 sm:h-88">
            <div
              onClick={(e) => moXemAnh(e, 0)}
              className="col-span-2 relative group cursor-pointer overflow-hidden h-full bg-slate-100"
            >
              <img
                src={`/api/hinh-anh/${danhSachAnhIds[0]}`}
                alt="Ảnh bài làm 1"
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5">
                <ZoomIn className="w-4 h-4" />
                <span>Xem ảnh 1</span>
              </div>
            </div>

            <div className="col-span-1 grid grid-rows-2 gap-1.5 h-full">
              {danhSachAnhIds.slice(1, 3).map((id, idx) => (
                <div
                  key={id}
                  onClick={(e) => moXemAnh(e, idx + 1)}
                  className="relative group cursor-pointer overflow-hidden h-full bg-slate-100"
                >
                  <img
                    src={`/api/hinh-anh/${id}`}
                    alt={`Ảnh bài làm ${idx + 2}`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5">
                    <ZoomIn className="w-4 h-4" />
                    <span>Ảnh {idx + 2}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trường hợp 4 ảnh trở lên: Lưới 2x2, ảnh cuối có overlay +N */}
        {soLuong >= 4 && (
          <div className="grid grid-cols-2 gap-1.5 h-72 sm:h-92">
            {danhSachAnhIds.slice(0, 4).map((id, idx) => {
              const isLast = idx === 3 && soLuong > 4;
              return (
                <div
                  key={id}
                  onClick={(e) => moXemAnh(e, idx)}
                  className="relative group cursor-pointer overflow-hidden h-full bg-slate-100"
                >
                  <img
                    src={`/api/hinh-anh/${id}`}
                    alt={`Ảnh bài làm ${idx + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />

                  {isLast ? (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-2xl group-hover:bg-black/70 transition-colors">
                      +{soLuong - 3}
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5">
                      <ZoomIn className="w-4 h-4" />
                      <span>Xem ảnh {idx + 1}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* MODAL PHÓNG TO TOÀN MÀN HÌNH (LIGHTBOX VIEWER)                    */}
      {/* ================================================================= */}
      {chiSoDangXem !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150 select-none"
          onClick={dongXemAnh}
        >
          {/* Nút đóng và tải ảnh */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
            <span className="text-xs text-white/80 font-semibold bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-xs">
              {chiSoDangXem + 1} / {soLuong}
            </span>
            <a
              href={`/api/hinh-anh/${danhSachAnhIds[chiSoDangXem]}`}
              download={`bai-lam-${chiSoDangXem + 1}.jpg`}
              onClick={(e) => e.stopPropagation()}
              className="text-white hover:text-white bg-white/15 hover:bg-white/25 p-2 rounded-full cursor-pointer transition-colors"
              title="Tải ảnh về máy"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              type="button"
              onClick={dongXemAnh}
              className="text-white hover:text-white bg-white/15 hover:bg-white/25 p-2 rounded-full cursor-pointer transition-colors"
              title="Đóng (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nút chuyển ảnh trước */}
          {soLuong > 1 && (
            <button
              type="button"
              onClick={xemAnhTruoc}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white bg-white/15 hover:bg-white/30 p-3 rounded-full cursor-pointer transition-all z-50 active:scale-95"
              title="Ảnh trước"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Ảnh phóng to */}
          <div
            className="max-w-[95vw] max-h-[88vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`/api/hinh-anh/${danhSachAnhIds[chiSoDangXem]}`}
              alt={`Ảnh bài làm ${chiSoDangXem + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Nút chuyển ảnh tiếp theo */}
          {soLuong > 1 && (
            <button
              type="button"
              onClick={xemAnhTiep}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white bg-white/15 hover:bg-white/30 p-3 rounded-full cursor-pointer transition-all z-50 active:scale-95"
              title="Ảnh tiếp theo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </>
  );
}

