"use client";

import { useState, useMemo } from "react";
import { Search, Filter, RotateCcw, BookOpen, Layers } from "lucide-react";

interface ChuDeItem {
  id: string;
  ten: string;
  chuong: {
    id: string;
    ten: string;
    lopId: string;
  };
  danhSachDangBai: string[];
}

interface Props {
  danhSachChuDe: ChuDeItem[];
  tuKhoaMacDinh?: string;
  chuDeIdMacDinh?: string;
  dangBaiMacDinh?: string;
  lopFilter?: string;
}

export function ThanhLocDienDan({
  danhSachChuDe,
  tuKhoaMacDinh = "",
  chuDeIdMacDinh = "",
  dangBaiMacDinh = "",
  lopFilter,
}: Props) {
  const [selectedChuDeId, setSelectedChuDeId] = useState(chuDeIdMacDinh);
  const [selectedDangBai, setSelectedDangBai] = useState(dangBaiMacDinh);
  const [tuKhoa, setTuKhoa] = useState(tuKhoaMacDinh);

  // Danh sách dạng bài khả dụng dựa trên bài học đã chọn
  const danhSachDangBaiKhaDung = useMemo(() => {
    if (!selectedChuDeId) {
      // Nếu chưa chọn bài cụ thể, tập hợp tất cả các dạng bài của các bài hiện tại
      const allDang = new Set<string>();
      danhSachChuDe.forEach((cd) => {
        cd.danhSachDangBai.forEach((d) => allDang.add(d));
      });
      return Array.from(allDang).sort();
    }

    const chuDe = danhSachChuDe.find((cd) => cd.id === selectedChuDeId);
    return chuDe ? chuDe.danhSachDangBai : [];
  }, [selectedChuDeId, danhSachChuDe]);

  // Xử lý khi thay đổi bài học
  const handleChuDeChange = (newChuDeId: string) => {
    setSelectedChuDeId(newChuDeId);

    // Nếu dạng bài hiện tại không thuộc bài mới, tự reset về rỗng
    if (newChuDeId) {
      const chuDe = danhSachChuDe.find((cd) => cd.id === newChuDeId);
      if (chuDe && !chuDe.danhSachDangBai.includes(selectedDangBai)) {
        setSelectedDangBai("");
      }
    }
  };

  const hasFilter = Boolean(tuKhoa || selectedChuDeId || selectedDangBai);

  return (
    <form method="GET" action="/dien-dan" className="space-y-3">
      {/* Giữ lại tham số lớp nếu có */}
      {lopFilter && lopFilter !== "all" && (
        <input type="hidden" name="lop" value={lopFilter} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
        {/* 1. Ô tìm kiếm từ khóa */}
        <div className="lg:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="tuKhoa"
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Tìm kiếm bài hỏi, thắc mắc..."
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* 2. Dropdown CHỌN BÀI HỌC */}
        <div className="lg:col-span-4 relative">
          <div className="relative">
            <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              name="chuDeId"
              value={selectedChuDeId}
              onChange={(e) => handleChuDeChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none font-medium text-slate-700 transition-all appearance-none cursor-pointer truncate"
            >
              <option value="">📚 Tất cả bài học</option>
              {danhSachChuDe.map((cd) => (
                <option key={cd.id} value={cd.id}>
                  {cd.chuong.ten.split(":")[0] || cd.chuong.ten} • {cd.ten}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* 3. Dropdown CHỌN DẠNG BÀI */}
        <div className="lg:col-span-3 relative">
          <div className="relative">
            <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              name="dangBai"
              value={selectedDangBai}
              onChange={(e) => setSelectedDangBai(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none font-medium text-slate-700 transition-all appearance-none cursor-pointer truncate"
            >
              <option value="">
                {selectedChuDeId ? "🏷️ Tất cả dạng bài" : "🏷️ Tất cả dạng bài"}
              </option>
              {danhSachDangBaiKhaDung.map((dang) => (
                <option key={dang} value={dang}>
                  {dang}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* 4. Nút LỌC BÀI & Nút RESET */}
        <div className="lg:col-span-1 flex items-center gap-1.5">
          <button
            type="submit"
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
            title="Áp dụng bộ lọc"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc</span>
          </button>

          {hasFilter && (
            <a
              href={`/dien-dan${lopFilter && lopFilter !== "all" ? `?lop=${lopFilter}` : ""}`}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer flex items-center justify-center"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </form>
  );
}
