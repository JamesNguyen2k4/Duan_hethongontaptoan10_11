"use client";

import { useState } from "react";
import { X, ZoomIn, Download } from "lucide-react";

interface Props {
  danhSachAnhIds: string[];
}

export function BoSuuTapAnh({ danhSachAnhIds }: Props) {
  const [anhDangXem, setAnhDangXem] = useState<string | null>(null);

  if (!danhSachAnhIds || danhSachAnhIds.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-3">
        {danhSachAnhIds.map((id, idx) => {
          const imgUrl = `/api/hinh-anh/${id}`;
          return (
            <div
              key={id}
              onClick={() => setAnhDangXem(imgUrl)}
              className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 cursor-pointer shadow-xs hover:shadow-md transition-all"
            >
              <img
                src={imgUrl}
                alt={`Ảnh bài làm ${idx + 1}`}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-[1px]">
                <ZoomIn className="w-4 h-4" />
                <span>Xem ảnh {idx + 1}</span>
              </div>
            </div>
          );
        })}
      </div>

      {anhDangXem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setAnhDangXem(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
            <a
              href={anhDangXem}
              download="bai-lam.jpg"
              onClick={(e) => e.stopPropagation()}
              className="text-white hover:text-slate-300 bg-white/10 hover:bg-white/20 p-2.5 rounded-full cursor-pointer transition-colors"
              title="Tải ảnh về máy"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              type="button"
              onClick={() => setAnhDangXem(null)}
              className="text-white hover:text-slate-300 bg-white/10 hover:bg-white/20 p-2.5 rounded-full cursor-pointer transition-colors"
              title="Đóng xem ảnh"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <img
            src={anhDangXem}
            alt="Ảnh bài làm chi tiết"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

