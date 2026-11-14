"use client";

import { useState } from "react";
import { doiLopAction } from "@/features/auth/actions/doi-lop";
import { Loader2 } from "lucide-react";

const LOPS = [
  { id: "lop-10", label: "Toán 10" },
  { id: "lop-11", label: "Toán 11" },
] as const;

export function BoChuyenLop({ lopHienTai }: { lopHienTai: string }) {
  const [dangChuyenLop, setDangChuyenLop] = useState<string | null>(null);

  const chonLop = async (lopId: string) => {
    if (lopId === lopHienTai || dangChuyenLop) return;
    setDangChuyenLop(lopId);

    try {
      const res = await doiLopAction(lopId);
      if (res.ok) {
        // Tải lại hoàn toàn ngữ cảnh dữ liệu của lớp mới, xóa các query param cũ của lớp trước
        const pathname = window.location.pathname;
        if (pathname.startsWith("/ly-thuyet")) {
          window.location.href = "/ly-thuyet";
        } else if (pathname.startsWith("/bai-tap")) {
          window.location.href = "/bai-tap";
        } else if (pathname.startsWith("/lam-bai")) {
          window.location.href = "/bai-tap";
        } else {
          window.location.reload();
        }
        return;
      }
    } catch (err) {
      console.error("Lỗi khi chuyển lớp:", err);
    }
    setDangChuyenLop(null);
  };

  return (
    <div
      className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80 shadow-2xs"
      role="group"
      aria-label="Chọn lớp học"
    >
      {LOPS.map((lop) => {
        const active = lop.id === lopHienTai;
        const isLoadingThis = dangChuyenLop === lop.id;
        return (
          <button
            key={lop.id}
            type="button"
            disabled={!!dangChuyenLop}
            onClick={() => chonLop(lop.id)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none inline-flex items-center gap-1.5 ${
              active
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            } ${dangChuyenLop ? "opacity-75" : ""}`}
          >
            {isLoadingThis && (
              <Loader2 className="w-3 h-3 animate-spin text-current" />
            )}
            <span>{lop.label}</span>
          </button>
        );
      })}
    </div>
  );
}
