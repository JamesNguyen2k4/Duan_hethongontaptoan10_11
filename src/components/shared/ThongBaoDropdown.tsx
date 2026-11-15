"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, MessageSquare, AlertCircle, ExternalLink } from "lucide-react";
import {
  layThongBaoGiaoVienAction,
  danhDauDaDocAction,
  danhDauTatCaDaDocAction,
} from "@/features/thong-bao/actions/thong-bao-actions";

interface ThongBaoItem {
  id: string;
  tieuDe: string;
  noiDung: string;
  duongDan: string;
  loai: string;
  daDoc: boolean;
  taoLuc: Date | string;
}

function tinhKhoangThoiGian(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Vừa xong";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function ThongBaoDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [danhSach, setDanhSach] = useState<ThongBaoItem[]>([]);
  const [soChuaDoc, setSoChuaDoc] = useState(0);
  const [vaiTroHopLe, setVaiTroHopLe] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tải thông báo ban đầu & định kỳ mỗi 30 giây
  const capNhatThongBao = async () => {
    try {
      const res = await layThongBaoGiaoVienAction();
      if (res.vaiTroHopLe) {
        setVaiTroHopLe(true);
        setDanhSach(res.danhSach as ThongBaoItem[]);
        setSoChuaDoc(res.soChuaDoc);
      } else {
        setVaiTroHopLe(false);
      }
    } catch {
      // Bỏ qua lỗi kết nối nền
    }
  };

  useEffect(() => {
    capNhatThongBao();
    const interval = setInterval(capNhatThongBao, 30000); // 30s
    return () => clearInterval(interval);
  }, []);

  // Đóng khi click ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Chỉ hiển thị chuông nếu là tài khoản Giáo viên hoặc Quản trị
  if (!vaiTroHopLe) return null;

  const handleClickItem = (item: ThongBaoItem) => {
    startTransition(async () => {
      if (!item.daDoc) {
        await danhDauDaDocAction(item.id);
        setDanhSach((prev) =>
          prev.map((tb) => (tb.id === item.id ? { ...tb, daDoc: true } : tb))
        );
        setSoChuaDoc((prev) => Math.max(0, prev - 1));
      }
      setIsOpen(false);
      router.push(item.duongDan);
    });
  };

  const handleDanhDauTatCa = () => {
    startTransition(async () => {
      await danhDauTatCaDaDocAction();
      setDanhSach((prev) => prev.map((tb) => ({ ...tb, daDoc: true })));
      setSoChuaDoc(0);
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút quả chuông */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors focus:outline-hidden"
        title="Thông báo mới từ học sinh"
      >
        <Bell className="w-5 h-5" />
        {soChuaDoc > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-rose-500 rounded-full ring-2 ring-white animate-pulse">
            {soChuaDoc > 99 ? "99+" : soChuaDoc}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">Thông báo bài hỏi</span>
              {soChuaDoc > 0 && (
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  {soChuaDoc} mới
                </span>
              )}
            </div>

            {soChuaDoc > 0 && (
              <button
                onClick={handleDanhDauTatCa}
                disabled={isPending}
                className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đã đọc tất cả
              </button>
            )}
          </div>

          {/* Danh sách thông báo */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {danhSach.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Chưa có thông báo nào</p>
              </div>
            ) : (
              danhSach.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleClickItem(item)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    item.daDoc ? "bg-white hover:bg-slate-50" : "bg-blue-50/50 hover:bg-blue-50"
                  }`}
                >
                  <div
                    className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      item.daDoc
                        ? "bg-slate-100 text-slate-500"
                        : "bg-blue-100 text-blue-600 font-bold"
                    }`}
                  >
                    {item.loai === "BAI_VIET_MOI" ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs truncate ${
                          item.daDoc ? "font-semibold text-slate-700" : "font-bold text-slate-900"
                        }`}
                      >
                        {item.tieuDe}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {tinhKhoangThoiGian(item.taoLuc)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {item.noiDung}
                    </p>

                    <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-medium mt-1">
                      Xem bài viết <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  </div>

                  {!item.daDoc && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
