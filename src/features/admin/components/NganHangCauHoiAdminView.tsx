"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Folder,
  FolderOpen,
  BookOpen,
  Target,
  ChevronRight,
  ChevronDown,
  Search,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  GraduationCap,
  FileText,
  Filter,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { MathRenderer } from "@/components/shared/MathRenderer";
import {
  layCayNganHangCauHoiAction,
  layDanhSachCauHoiTheoDangAction,
  ChuongTreeNode,
  CauHoiAdminItem,
} from "../actions/lay-du-lieu-cau-hoi";

interface Props {
  initialLopId: string;
  initialCayPhanCap: ChuongTreeNode[];
  initialTongSoCau: number;
  initialQuestions?: CauHoiAdminItem[];
  defaultChuDeId?: string;
  defaultDangBai?: string;
}

export function NganHangCauHoiAdminView({
  initialLopId,
  initialCayPhanCap,
  initialTongSoCau,
  initialQuestions = [],
  defaultChuDeId,
  defaultDangBai,
}: Props) {
  const router = useRouter();
  const [lopId, setLopId] = useState<string>(initialLopId);
  const [cayPhanCap, setCayPhanCap] = useState<ChuongTreeNode[]>(initialCayPhanCap);
  const [tongSoCau, setTongSoCau] = useState<number>(initialTongSoCau);

  // Trạng thái nhánh mở/gập
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  // Dạng bài đang chọn
  const [activeChuDeId, setActiveChuDeId] = useState<string>(defaultChuDeId || "");
  const [activeDangBai, setActiveDangBai] = useState<string>(defaultDangBai || "");
  const [activeBreadcrumb, setActiveBreadcrumb] = useState<{
    chuongTen: string;
    chuDeTen: string;
    dangTen: string;
  }>({ chuongTen: "", chuDeTen: "", dangTen: "" });

  // Danh sách câu hỏi đang xem
  const [questions, setQuestions] = useState<CauHoiAdminItem[]>(initialQuestions);
  const [isPending, startTransition] = useTransition();

  // Bộ lọc bên cột câu hỏi
  const [tuKhoaTree, setTuKhoaTree] = useState<string>("");
  const [tuKhoaQuestion, setTuKhoaQuestion] = useState<string>("");
  const [mucDoFilter, setMucDoFilter] = useState<string>("all");

  // Tự động mở nhánh đầu tiên khi khởi tạo nếu chưa có
  useEffect(() => {
    if (cayPhanCap.length > 0) {
      const firstChuong = cayPhanCap[0];
      const firstChuDe = firstChuong.danhSachChuDe[0];
      const firstDang = firstChuDe?.danhSachDang[0];

      setExpandedNodes((prev) => ({
        ...prev,
        [`chuong_${firstChuong.id}`]: true,
        [`chude_${firstChuDe?.id}`]: true,
      }));

      if (!activeChuDeId && firstChuDe && firstDang) {
        handleSelectDang(firstChuDe.id, firstDang.ten, {
          chuongTen: firstChuong.ten,
          chuDeTen: firstChuDe.ten,
          dangTen: firstDang.ten,
        });
      }
    }
  }, [cayPhanCap]);

  // Đổi Lớp học (Toán 10 / Toán 11)
  const handleLopChange = (newLopId: string) => {
    if (newLopId === lopId) return;
    setLopId(newLopId);
    startTransition(async () => {
      try {
        const res = await layCayNganHangCauHoiAction(newLopId);
        setCayPhanCap(res.cayPhanCap);
        setTongSoCau(res.tongSoCauLop);
        setQuestions([]);
        setActiveChuDeId("");
        setActiveDangBai("");
      } catch (err) {
        console.error("Lỗi khi tải cây ngân hàng câu hỏi:", err);
      }
    });
  };

  // Mở/gập 1 node
  const toggleNode = (nodeKey: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  // Mở tất cả / Thu gọn tất cả
  const handleToggleAll = (expand: boolean) => {
    const nextState: Record<string, boolean> = {};
    if (expand) {
      cayPhanCap.forEach((c) => {
        nextState[`chuong_${c.id}`] = true;
        c.danhSachChuDe.forEach((cd) => {
          nextState[`chude_${cd.id}`] = true;
        });
      });
    }
    setExpandedNodes(nextState);
  };

  // Khi bấm chọn một Dạng bài
  const handleSelectDang = (
    chuDeId: string,
    dangTen: string,
    breadcrumbs: { chuongTen: string; chuDeTen: string; dangTen: string }
  ) => {
    setActiveChuDeId(chuDeId);
    setActiveDangBai(dangTen);
    setActiveBreadcrumb(breadcrumbs);

    startTransition(async () => {
      try {
        const res = await layDanhSachCauHoiTheoDangAction({
          chuDeId,
          dangBai: dangTen,
        });
        setQuestions(res);
      } catch (err) {
        console.error("Lỗi tải câu hỏi:", err);
      }
    });
  };

  // Lọc câu hỏi theo từ khóa và mức độ
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (mucDoFilter !== "all" && q.mucDo !== mucDoFilter) return false;
      if (tuKhoaQuestion.trim()) {
        const kw = tuKhoaQuestion.toLowerCase();
        const matchId = q.id.toLowerCase().includes(kw);
        const matchDe = q.deBai.toLowerCase().includes(kw);
        const matchGiai = q.loiGiaiChiTiet.toLowerCase().includes(kw);
        if (!matchId && !matchDe && !matchGiai) return false;
      }
      return true;
    });
  }, [questions, mucDoFilter, tuKhoaQuestion]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" /> Quản lý Ngân hàng câu hỏi
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Ngân Hàng Câu Hỏi Theo Dạng Bài
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Duyệt cây phân cấp Chương → Bài học → Dạng bài và kiểm tra chi tiết đề bài, đáp án, lời giải từng câu
          </p>
        </div>

        {/* Bộ chuyển đổi Lớp học */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => handleLopChange("lop-10")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              lopId === "lop-10"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Toán 10</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-white/20">
              933 câu
            </span>
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
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-white/20">
              3,047 câu
            </span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout: Left Tree + Right Question Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: MENU DẠNG TREE (4/12) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[750px]">
          {/* Tree Header & Search */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" /> Cây Danh Mục
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleAll(true)}
                  title="Mở tất cả"
                  className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-slate-800 transition-colors text-[11px] font-semibold flex items-center gap-1 border border-transparent hover:border-slate-200 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Mở hết
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAll(false)}
                  title="Thu gọn tất cả"
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
                placeholder="Lọc chương, bài hoặc dạng..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          {/* Tree Content (Scrollable) */}
          <div className="p-3 overflow-y-auto flex-1 space-y-1 text-xs">
            {cayPhanCap.map((chuong) => {
              const chuongKey = `chuong_${chuong.id}`;
              const isChuongExpanded = !!expandedNodes[chuongKey];

              // Lọc theo từ khóa tìm kiếm trong cây
              const matchesChuong =
                !tuKhoaTree.trim() ||
                chuong.ten.toLowerCase().includes(tuKhoaTree.toLowerCase()) ||
                chuong.danhSachChuDe.some(
                  (cd) =>
                    cd.ten.toLowerCase().includes(tuKhoaTree.toLowerCase()) ||
                    cd.danhSachDang.some((d) =>
                      d.ten.toLowerCase().includes(tuKhoaTree.toLowerCase())
                    )
                );

              if (!matchesChuong) return null;

              return (
                <div key={chuong.id} className="space-y-0.5">
                  {/* Node Chương */}
                  <div
                    onClick={() => toggleNode(chuongKey)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100/80 cursor-pointer select-none transition-colors group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      {isChuongExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      {isChuongExpanded ? (
                        <FolderOpen className="w-4 h-4 text-purple-600 shrink-0" />
                      ) : (
                        <Folder className="w-4 h-4 text-purple-600 shrink-0" />
                      )}
                      <span className="font-bold text-slate-800 truncate text-[11px]">
                        {chuong.ten}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 shrink-0">
                      {chuong.soCauHoi}
                    </span>
                  </div>

                  {/* Danh sách Bài học (Chủ đề) trong Chương */}
                  {isChuongExpanded && (
                    <div className="pl-4 space-y-0.5 border-l-2 border-slate-100 ml-3">
                      {chuong.danhSachChuDe.map((chuDe) => {
                        const chuDeKey = `chude_${chuDe.id}`;
                        const isChuDeExpanded = !!expandedNodes[chuDeKey];

                        return (
                          <div key={chuDe.id} className="space-y-0.5">
                            {/* Node Bài học */}
                            <div
                              onClick={() => toggleNode(chuDeKey)}
                              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer select-none transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
                                {isChuDeExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                )}
                                <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="font-semibold text-slate-700 truncate text-[11px]">
                                  {chuDe.ten}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                {chuDe.soCauHoi} câu
                              </span>
                            </div>

                            {/* Danh sách Dạng bài trong Bài học */}
                            {isChuDeExpanded && (
                              <div className="pl-4 space-y-0.5 border-l-2 border-slate-100 ml-3">
                                {chuDe.danhSachDang.map((dang) => {
                                  const isSelected =
                                    activeChuDeId === chuDe.id &&
                                    activeDangBai === dang.ten;

                                  return (
                                    <button
                                      type="button"
                                      key={dang.ten}
                                      onClick={() =>
                                        handleSelectDang(chuDe.id, dang.ten, {
                                          chuongTen: chuong.ten,
                                          chuDeTen: chuDe.ten,
                                          dangTen: dang.ten,
                                        })
                                      }
                                      className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                        isSelected
                                          ? "bg-purple-600 text-white font-bold shadow-xs"
                                          : "hover:bg-purple-50 text-slate-600 hover:text-purple-700"
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <Target
                                          className={`w-3 h-3 shrink-0 ${
                                            isSelected ? "text-white" : "text-purple-500"
                                          }`}
                                        />
                                        <span className="truncate text-[11px]">{dang.ten}</span>
                                      </div>
                                      <span
                                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                                          isSelected
                                            ? "bg-white/20 text-white"
                                            : "bg-slate-100 text-slate-600"
                                        }`}
                                      >
                                        {dang.soCauHoi}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CỘT PHẢI: XEM CHI TIẾT CÂU HỎI (8/12) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Header Thông tin Dạng bài đang chọn */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 flex-wrap">
                  <span>{lopId === "lop-10" ? "Toán 10" : "Toán 11"}</span>
                  <span>/</span>
                  <span>{activeBreadcrumb.chuongTen || "Chọn chương"}</span>
                  <span>/</span>
                  <span>{activeBreadcrumb.chuDeTen || "Chọn bài học"}</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span>{activeDangBai || "Vui lòng chọn 1 dạng bài từ cây bên trái"}</span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-3 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  {filteredQuestions.length} câu hỏi hiển thị
                </span>
              </div>
            </div>

            {/* Thanh công cụ: Tìm kiếm & Lọc mức độ nhận thức */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tuKhoaQuestion}
                  onChange={(e) => setTuKhoaQuestion(e.target.value)}
                  placeholder="Tìm theo nội dung đề bài, lời giải hoặc mã câu..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs text-slate-400 font-semibold shrink-0">Mức độ:</span>
                {[
                  { key: "all", label: "Tất cả" },
                  { key: "NHAN_BIET", label: "Nhận biết" },
                  { key: "THONG_HIEU", label: "Thông hiểu" },
                  { key: "VAN_DUNG", label: "Vận dụng" },
                  { key: "VAN_DUNG_CAO", label: "Vận dụng cao" },
                ].map((m) => (
                  <button
                    type="button"
                    key={m.key}
                    onClick={() => setMucDoFilter(m.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      mucDoFilter === m.key
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Danh sách Câu hỏi (Question Cards) */}
          {isPending ? (
            <div className="bg-white p-16 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-3">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Đang tải danh sách câu hỏi...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="bg-white p-16 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                Không có câu hỏi nào phù hợp với bộ lọc.
              </p>
              <p className="text-xs text-slate-400">
                Hãy chọn dạng bài khác ở cây phân cấp bên trái hoặc xóa từ khóa tìm kiếm.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q, idx) => {
                const mucDoBadge =
                  q.mucDo === "NHAN_BIET"
                    ? { bg: "bg-blue-50 text-blue-700 border-blue-200", label: "Nhận biết" }
                    : q.mucDo === "THONG_HIEU"
                    ? { bg: "bg-teal-50 text-teal-700 border-teal-200", label: "Thông hiểu" }
                    : q.mucDo === "VAN_DUNG"
                    ? { bg: "bg-amber-50 text-amber-700 border-amber-200", label: "Vận dụng" }
                    : { bg: "bg-rose-50 text-rose-700 border-rose-200", label: "Vận dụng cao" };

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 hover:border-purple-300 transition-colors"
                  >
                    {/* Top bar của câu hỏi: Số thứ tự, Mã ID, Mức độ, Thông số IRT */}
                    <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <code className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {q.id}
                        </code>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${mucDoBadge.bg}`}
                        >
                          {mucDoBadge.label}
                        </span>

                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          IRT b: <strong className="text-slate-800">{q.doKhoIRT}</strong> • a:{" "}
                          <strong className="text-slate-800">{q.doPhanBiet}</strong>
                        </span>

                        <span className="text-[11px] text-slate-400">
                          {q.soLanDung}/{q.soLanLam} đúng
                        </span>
                      </div>
                    </div>

                    {/* Nội dung Đề bài */}
                    <div className="text-slate-900 font-medium text-sm leading-relaxed pl-1">
                      <MathRenderer content={q.deBai} />
                    </div>

                    {/* Các phương án lựa chọn (A, B, C, D) */}
                    {Object.keys(q.cacLuaChon).length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                        {Object.entries(q.cacLuaChon).map(([key, value]) => {
                          const isCorrect =
                            key.trim().toUpperCase() === q.dapAnDung.trim().toUpperCase();

                          return (
                            <div
                              key={key}
                              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                                isCorrect
                                  ? "bg-emerald-50/70 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-400/30"
                                  : "bg-slate-50/50 border-slate-200/80 text-slate-700"
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 ${
                                  isCorrect
                                    ? "bg-emerald-600 text-white shadow-2xs"
                                    : "bg-white border border-slate-300 text-slate-700"
                                }`}
                              >
                                {key}
                              </div>

                              <div className="flex-1 overflow-x-auto pt-0.5">
                                <MathRenderer content={value} />
                              </div>

                              {isCorrect && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đúng
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Lời giải chi tiết */}
                    {q.loiGiaiChiTiet && (
                      <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1.5">
                        <div className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Lời giải chi tiết:</span>
                        </div>
                        <div className="text-slate-700 leading-relaxed pl-1">
                          <MathRenderer content={q.loiGiaiChiTiet} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
