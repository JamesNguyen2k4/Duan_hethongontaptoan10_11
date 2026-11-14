"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import {
  BookOpen,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  GraduationCap,
  Clock,
  Maximize2,
  Minimize2,
  FileText,
} from "lucide-react";
import { MathRenderer } from "@/components/shared/MathRenderer";
import {
  layCayLyThuyetAdminAction,
  layChiTietBaiLyThuyetAction,
  ChuongLyThuyetTreeNode,
} from "../actions/lay-du-lieu-ly-thuyet";

interface Props {
  initialLopId: string;
  initialCayPhanCap: ChuongLyThuyetTreeNode[];
  initialTongSoBai: number;
  initialSelectedBai?: {
    id: string;
    tieu_de: string;
    noiDung: string;
    thuTu: number;
    capNhatLuc: Date | string;
    chuong: {
      id: string;
      ten: string;
      lopId: string;
    };
  } | null;
}

export function LyThuyetAdminView({
  initialLopId,
  initialCayPhanCap,
  initialTongSoBai,
  initialSelectedBai,
}: Props) {
  const [lopId, setLopId] = useState<string>(initialLopId);
  const [cayPhanCap, setCayPhanCap] = useState<ChuongLyThuyetTreeNode[]>(initialCayPhanCap);
  const [tongSoBai, setTongSoBai] = useState<number>(initialTongSoBai);

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [activeBaiId, setActiveBaiId] = useState<string>(initialSelectedBai?.id || "");
  const [currentBai, setCurrentBai] = useState(initialSelectedBai || null);

  const [tuKhoaTree, setTuKhoaTree] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Khởi tạo mở nhánh đầu tiên
  useEffect(() => {
    if (cayPhanCap.length > 0) {
      const firstChuong = cayPhanCap[0];
      const firstBai = firstChuong.danhSachBai[0];

      setExpandedNodes((prev) => ({
        ...prev,
        [`chuong_${firstChuong.id}`]: true,
      }));

      if (!activeBaiId && firstBai) {
        handleSelectBai(firstBai.id);
      }
    }
  }, [cayPhanCap]);

  // Đổi Lớp (Toán 10 / Toán 11)
  const handleLopChange = (newLopId: string) => {
    if (newLopId === lopId) return;
    setLopId(newLopId);
    startTransition(async () => {
      try {
        const res = await layCayLyThuyetAdminAction(newLopId);
        setCayPhanCap(res.cayPhanCap);
        setTongSoBai(res.tongSoBai);

        const firstChuong = res.cayPhanCap[0];
        const firstBai = firstChuong?.danhSachBai[0];
        if (firstBai) {
          handleSelectBai(firstBai.id);
        } else {
          setCurrentBai(null);
          setActiveBaiId("");
        }
      } catch (err) {
        console.error("Lỗi khi tải cây lý thuyết:", err);
      }
    });
  };

  const toggleNode = (nodeKey: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  const handleToggleAll = (expand: boolean) => {
    const nextState: Record<string, boolean> = {};
    if (expand) {
      cayPhanCap.forEach((c) => {
        nextState[`chuong_${c.id}`] = true;
      });
    }
    setExpandedNodes(nextState);
  };

  const handleSelectBai = (baiId: string) => {
    setActiveBaiId(baiId);
    startTransition(async () => {
      try {
        const res = await layChiTietBaiLyThuyetAction(baiId);
        setCurrentBai(res);
      } catch (err) {
        console.error("Lỗi khi tải chi tiết bài lý thuyết:", err);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" /> Quản lý nội dung học tập
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quản Lý & Xem Lý Thuyết Toán
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Duyệt cây bài học theo Chương và xem chi tiết nội dung kiến thức, công thức toán học chuẩn KaTeX
          </p>
        </div>

        {/* Bộ chuyển đổi Lớp học */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => handleLopChange("lop-10")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              lopId === "lop-10"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Toán 10</span>
          </button>

          <button
            type="button"
            onClick={() => handleLopChange("lop-11")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              lopId === "lop-11"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Toán 11</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: MENU CÂY BÀI HỌC (4/12) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[750px]">
          <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" /> Cây Bài Học
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleAll(true)}
                  className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-slate-800 transition-colors text-[11px] font-semibold flex items-center gap-1 border border-transparent hover:border-slate-200 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Mở hết
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAll(false)}
                  className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-slate-800 transition-colors text-[11px] font-semibold flex items-center gap-1 border border-transparent hover:border-slate-200 cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" /> Thu gọn
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tuKhoaTree}
                onChange={(e) => setTuKhoaTree(e.target.value)}
                placeholder="Lọc chương hoặc bài học..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="p-3 overflow-y-auto flex-1 space-y-1 text-xs">
            {cayPhanCap.map((chuong) => {
              const chuongKey = `chuong_${chuong.id}`;
              const isChuongExpanded = !!expandedNodes[chuongKey];

              const matches =
                !tuKhoaTree.trim() ||
                chuong.ten.toLowerCase().includes(tuKhoaTree.toLowerCase()) ||
                chuong.danhSachBai.some((b) =>
                  b.tieu_de.toLowerCase().includes(tuKhoaTree.toLowerCase())
                );

              if (!matches) return null;

              return (
                <div key={chuong.id} className="space-y-0.5">
                  <div
                    onClick={() => toggleNode(chuongKey)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      {isChuongExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      {isChuongExpanded ? (
                        <FolderOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Folder className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <span className="font-bold text-slate-800 truncate text-[11px]">
                        {chuong.ten}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                      {chuong.danhSachBai.length} bài
                    </span>
                  </div>

                  {isChuongExpanded && (
                    <div className="pl-4 space-y-0.5 border-l-2 border-slate-100 ml-3">
                      {chuong.danhSachBai.map((bai) => {
                        const isSelected = activeBaiId === bai.id;

                        return (
                          <button
                            type="button"
                            key={bai.id}
                            onClick={() => handleSelectBai(bai.id)}
                            className={`w-full text-left p-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 text-white font-bold shadow-xs"
                                : "hover:bg-emerald-50 text-slate-700 hover:text-emerald-800"
                            }`}
                          >
                            <FileText
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? "text-white" : "text-emerald-500"
                              }`}
                            />
                            <span className="truncate text-xs flex-1">{bai.tieu_de}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CỘT PHẢI: KHUNG ĐỌC NỘI DUNG LÝ THUYẾT (8/12) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6 min-h-[750px]">
          {isPending ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Đang tải nội dung lý thuyết...</p>
            </div>
          ) : !currentBai ? (
            <div className="py-24 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Chưa chọn bài học lý thuyết nào.</p>
              <p className="text-xs text-slate-400">
                Hãy bấm chọn bài học ở cây danh mục bên trái để xem nội dung bài giảng.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Bài học */}
              <div className="pb-5 border-b border-slate-100 space-y-2">
                <div className="text-xs font-semibold text-slate-400 flex items-center gap-2 flex-wrap">
                  <span>{currentBai.chuong.lopId === "lop-10" ? "Toán 10" : "Toán 11"}</span>
                  <span>/</span>
                  <span>{currentBai.chuong.ten}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {currentBai.tieu_de}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Cập nhật: {new Date(currentBai.capNhatLuc).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              {/* Nội dung Lý thuyết (Markdown + KaTeX) */}
              <div className="prose prose-slate max-w-none text-sm leading-relaxed">
                <MathRenderer content={currentBai.noiDung} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
