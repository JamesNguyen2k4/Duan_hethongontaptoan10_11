"use client";

import { useState, useEffect } from "react";
import { MathRenderer } from "@/components/shared/MathRenderer";
import {
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  Award,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Brain,
  Target,
  Play,
} from "lucide-react";
import Link from "next/link";
import {
  nopBaiTapTongHopAction,
  KetQuaPhienTongHop,
} from "../actions/nop-bai-tong-hop";

export interface CauHoiTongHopItem {
  id: string;
  deBai: string;
  dangBai: string | null;
  mucDo: string;
  doKhoIRT?: number;
  cacLuaChon: Record<string, string>;
}

interface Props {
  chuDeId: string;
  chuDeTen: string;
  chuongTen: string;
  danhSachCauHoi: CauHoiTongHopItem[];
  cheDo?: "CHAN_DOAN_DAU_VAO" | "LUYEN_TONG_HOP";
}

export function PhienLuyenTapTongHop({
  chuDeId,
  chuDeTen,
  chuongTen,
  danhSachCauHoi,
  cheDo = "LUYEN_TONG_HOP",
}: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [thoiGian, setThoiGian] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [ketQua, setKetQua] = useState<KetQuaPhienTongHop | null>(null);
  const [filterReview, setFilterReview] = useState<"ALL" | "SAI" | "DUNG">(
    "ALL"
  );

  // Timer đếm giờ
  useEffect(() => {
    if (ketQua) return;
    const interval = setInterval(() => {
      setThoiGian((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [ketQua]);

  const formatThoiGian = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (qId: string, optKey: string) => {
    if (ketQua) return;
    setAnswers((prev) => ({
      ...prev,
      [qId]: optKey,
    }));
  };

  const currentQ = danhSachCauHoi[currentIdx];
  const soCauDaLam = Object.keys(answers).length;
  const tongSoCau = danhSachCauHoi.length;

  const handleSubmitExam = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      const qIds = danhSachCauHoi.map((q) => q.id);
      const res = await nopBaiTapTongHopAction(
        chuDeId,
        qIds,
        answers,
        thoiGian
      );
      if (res.ok) {
        setKetQua(res);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // GIAO DIỆN 1: KẾT QUẢ, HỒ SƠ NĂNG LỰC BKT/IRT & LỜI GIẢI SAU KHI NỘP BÀI
  // =========================================================================
  if (ketQua) {
    const listFiltered = ketQua.chiTietCacCau.filter((c) => {
      if (filterReview === "SAI") return !c.dung;
      if (filterReview === "DUNG") return c.dung;
      return true;
    });

    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-300">
        {/* Banner Tổng kết điểm số */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-100 text-xs font-bold uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-300" />
                {cheDo === "CHAN_DOAN_DAU_VAO"
                  ? "Kết quả Chẩn đoán Năng lực Đầu vào (Cold-Start Placement)"
                  : "Kết quả Luyện tập Tổng hợp"}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">{chuDeTen}</h1>
              <p className="text-blue-100 text-xs sm:text-sm">
                Thời gian làm bài:{" "}
                <strong className="text-white">
                  {formatThoiGian(ketQua.thoiGianGiay)}
                </strong>{" "}
                • Hệ thống BKT + IRT 3PL & FSRS đã tự động cập nhật hồ sơ năng
                lực và lịch ôn tập ngắt quãng cho từng dạng bài.
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-6 text-center border border-white/20 shrink-0">
              <span className="text-4xl sm:text-5xl font-black block tracking-tight">
                {ketQua.diemSo}
              </span>
              <span className="text-xs text-blue-100 font-semibold block mt-1">
                Thang điểm 10
              </span>
            </div>
          </div>

          {/* 3 Thống kê chi tiết */}
          <div className="grid grid-cols-3 gap-3 relative z-10 pt-2 border-t border-white/15 text-center">
            <div className="bg-white/10 rounded-xl p-3">
              <span className="text-xl sm:text-2xl font-bold block text-emerald-300">
                {ketQua.soCauDung}
              </span>
              <span className="text-[11px] text-blue-100 font-medium">
                Câu đúng
              </span>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <span className="text-xl sm:text-2xl font-bold block text-rose-300">
                {ketQua.soCauSai}
              </span>
              <span className="text-[11px] text-blue-100 font-medium">
                Câu sai
              </span>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <span className="text-xl sm:text-2xl font-bold block text-amber-300">
                {ketQua.soCauChuaLam}
              </span>
              <span className="text-[11px] text-blue-100 font-medium">
                Chưa làm
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 relative z-10 flex-wrap">
            <Link
              href={`/lam-bai/chu-de/${chuDeId}`}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" /> Bắt đầu Luyện
              thích ứng ZPD theo lỗ hổng →
            </Link>
            <Link
              href={`/lam-bai/tong-hop/${chuDeId}?soCau=${tongSoCau}&t=${Date.now()}`}
              className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 active:scale-[0.98] font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Làm đề khác
            </Link>
            <Link
              href={`/bai-tap?chuDeId=${chuDeId}`}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-[0.98] text-white border border-white/20 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              ← Quay lại danh mục dạng bài
            </Link>
          </div>
        </div>

        {/* Bảng cập nhật Hồ sơ năng lực BKT + IRT theo từng Dạng bài */}
        {ketQua.hoSoNangLucSauBaiThi &&
          ketQua.hoSoNangLucSauBaiThi.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  Hồ sơ Năng lực & Độ thành thạo BKT vừa cập nhật:
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  Ngưỡng làm chủ: 85%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {ketQua.hoSoNangLucSauBaiThi.map((nl) => {
                  const pct = Math.round(nl.xacSuatHieuDung * 100);
                  return (
                    <div
                      key={nl.dangBai}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 line-clamp-1">
                            {nl.dangBai}
                          </span>
                          <span
                            className={`text-[11px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                              pct >= 85
                                ? "bg-emerald-100 text-emerald-800"
                                : pct >= 60
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>

                        <div className="relative w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              pct >= 85 ? "bg-emerald-500" : "bg-blue-600"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-emerald-700/70"
                            style={{ left: "85%" }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>
                          θ = {nl.nangLucIRT >= 0 ? `+${nl.nangLucIRT}` : nl.nangLucIRT} • Độ bền:{" "}
                          {nl.doBenTriNho} ngày
                        </span>
                        <Link
                          href={`/lam-bai/chu-de/${chuDeId}?dangBai=${encodeURIComponent(
                            nl.dangBai
                          )}`}
                          className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" /> Luyện ZPD
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Filter Review Buttons */}
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Xem lại chi tiết từng câu & Lời giải:
          </h2>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterReview("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterReview === "ALL"
                  ? "bg-white text-slate-800 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tất cả ({ketQua.tongSoCau})
            </button>
            <button
              onClick={() => setFilterReview("SAI")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterReview === "SAI"
                  ? "bg-rose-600 text-white shadow-2xs font-bold"
                  : "text-rose-700 hover:bg-rose-50"
              }`}
            >
              Câu sai ({ketQua.soCauSai + ketQua.soCauChuaLam})
            </button>
            <button
              onClick={() => setFilterReview("DUNG")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterReview === "DUNG"
                  ? "bg-emerald-600 text-white shadow-2xs font-bold"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              Câu đúng ({ketQua.soCauDung})
            </button>
          </div>
        </div>

        {/* Review Questions List */}
        <div className="space-y-6">
          {listFiltered.map((q) => {
            const originalIndex =
              ketQua.chiTietCacCau.findIndex((x) => x.id === q.id) + 1;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm space-y-5 transition-all ${
                  q.dung
                    ? "border-slate-200"
                    : "border-rose-200 ring-1 ring-rose-200/50"
                }`}
              >
                {/* Header item */}
                <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-black px-2.5 py-1 rounded-lg ${
                        q.dung
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      Câu {originalIndex}
                    </span>
                    {q.dangBai && (
                      <span className="text-slate-600 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
                        {q.dangBai}
                      </span>
                    )}
                    <span className="text-slate-500 font-medium">
                      {q.mucDo} • IRT b ={" "}
                      {q.doKhoIRT >= 0 ? `+${q.doKhoIRT}` : q.doKhoIRT}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold">
                    {q.dung ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Chính xác
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1">
                        <XCircle className="w-4 h-4" />{" "}
                        {q.luaChonCuaHocSinh ? "Sai" : "Chưa trả lời"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Đề bài */}
                <div className="text-slate-900 font-bold text-base leading-relaxed">
                  <MathRenderer content={q.deBai} />
                </div>

                {/* 4 Phương án */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(q.cacLuaChon).map(([k, val]) => {
                    const isSelected = q.luaChonCuaHocSinh === k;
                    const isCorrect = q.dapAnDung === k;

                    let style = "border-slate-200 bg-slate-50/50 text-slate-700";
                    if (isCorrect) {
                      style =
                        "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500";
                    } else if (isSelected && !q.dung) {
                      style =
                        "border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-500";
                    }

                    return (
                      <div
                        key={k}
                        className={`p-3.5 rounded-xl border flex items-center gap-3 text-sm ${style}`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            isCorrect
                              ? "bg-emerald-600 text-white"
                              : isSelected
                              ? "bg-rose-600 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {k}
                        </span>
                        <div className="flex-1">
                          <MathRenderer content={val} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Lời giải chi tiết */}
                <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200/80 space-y-2 text-sm">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" /> Lời giải chi
                    tiết:
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200/60 leading-relaxed text-slate-800">
                    <MathRenderer content={q.loiGiaiChiTiet} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // GIAO DIỆN 2: PHÒNG THI / LUYỆN ĐỀ ĐANG LÀM
  // =========================================================================
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>{chuongTen}</span>
              <span>/</span>
              <span className="text-blue-600 font-bold">{chuDeTen}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 flex items-center gap-2">
              {cheDo === "CHAN_DOAN_DAU_VAO" ? (
                <>
                  <Target className="w-5 h-5 text-amber-500" />
                  <span>
                    Chẩn Đoán Năng Lực Đầu Vào ({tongSoCau} câu phân tầng IRT)
                  </span>
                </>
              ) : (
                <span>Luyện Tập Tổng Hợp (Đề {tongSoCau} câu phân tầng)</span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{formatThoiGian(thoiGian)}</span>
            </div>

            {/* Nộp bài button */}
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Nộp bài ({soCauDaLam}/{tongSoCau})
            </button>
          </div>
        </div>

        {/* Thanh tiến trình */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(soCauDaLam / tongSoCau) * 100}%` }}
          />
        </div>
      </div>

      {/* Palette Chọn Nhanh Câu Hỏi (Question Grid) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>DANH SÁCH CÂU HỎI:</span>
          <span>
            Đã làm: <strong className="text-blue-600">{soCauDaLam}</strong> /{" "}
            {tongSoCau}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {danhSachCauHoi.map((q, idx) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = idx === currentIdx;

            let btnStyle =
              "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200";
            if (isAnswered) {
              btnStyle =
                "bg-blue-600 text-white border-blue-600 shadow-2xs font-bold";
            }
            if (isCurrent) {
              btnStyle += " ring-2 ring-blue-500 ring-offset-2";
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all cursor-pointer ${btnStyle}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Card */}
      {currentQ && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold bg-blue-600 text-white px-3 py-1 rounded-full">
                Câu {currentIdx + 1} / {tongSoCau}
              </span>
              {currentQ.dangBai && (
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                  {currentQ.dangBai}
                </span>
              )}
              <span className="text-xs bg-slate-50 text-slate-500 px-2.5 py-1 rounded-full font-medium">
                {currentQ.mucDo} • IRT b ={" "}
                {(currentQ.doKhoIRT ?? 0) >= 0
                  ? `+${currentQ.doKhoIRT ?? 0}`
                  : currentQ.doKhoIRT ?? 0}
              </span>
            </div>

            <div className="text-xs font-semibold text-slate-400">
              {answers[currentQ.id] ? "✓ Đã chọn đáp án" : "Chưa chọn đáp án"}
            </div>
          </div>

          {/* Đề bài */}
          <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
            <MathRenderer content={currentQ.deBai} />
          </div>

          {/* Options */}
          <div className="space-y-3">
            {Object.entries(currentQ.cacLuaChon).map(([key, val]) => {
              const isSelected = answers[currentQ.id] === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.id, key)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all font-medium text-sm sm:text-base cursor-pointer ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-600 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {key}
                  </span>
                  <div className="flex-1">
                    <MathRenderer content={val} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Nav Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Câu trước
            </button>

            {currentIdx < tongSoCau - 1 ? (
              <button
                onClick={() =>
                  setCurrentIdx((prev) => Math.min(tongSoCau - 1, prev + 1))
                }
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                Câu tiếp theo <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                Hoàn thành & Nộp bài <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-slate-900">
                Xác nhận nộp bài?
              </h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Bạn đã hoàn thành{" "}
              <strong className="text-blue-600">{soCauDaLam}</strong> trên tổng
              số <strong>{tongSoCau}</strong> câu hỏi.
              {soCauDaLam < tongSoCau && (
                <span className="block mt-1 text-rose-600 font-semibold">
                  ⚠️ Còn {tongSoCau - soCauDaLam} câu bạn chưa chọn đáp án!
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {isSubmitting ? "Đang phân tích BKT/IRT..." : "Nộp bài ngay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
