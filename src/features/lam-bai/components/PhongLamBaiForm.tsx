"use client";

import { useState, useEffect } from "react";
import { nopBaiTapAction } from "../actions/nop-bai";
import { themVaoHangDoiOnTapAction } from "@/features/on-tap/actions/on-tap-actions";
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { MathRenderer } from "@/components/shared/MathRenderer";

interface NavigationProps {
  currentIndex: number;
  totalCount: number;
  prevBaiTapId: string | null;
  nextBaiTapId: string | null;
  dangBaiQuery?: string;
}

interface Props {
  baiTap: {
    id: string;
    deBai: string;
    mucDo: string;
    dangBai: string | null;
    chuDe: {
      id: string;
      ten: string;
      chuongTen?: string;
    };
    cacLuaChon: Record<string, string>;
  };
  navigation?: NavigationProps;
}

export function PhongLamBaiForm({ baiTap, navigation }: Props) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [thoiGian, setThoiGian] = useState<number>(0);
  const [dangNop, setDangNop] = useState<boolean>(false);
  const [ketQua, setKetQua] = useState<any>(null);
  const [daGhim, setDaGhim] = useState<boolean>(false);
  const [dangGhim, setDangGhim] = useState<boolean>(false);

  // Bộ đếm thời gian làm bài
  useEffect(() => {
    if (ketQua) return;
    const timer = setInterval(() => {
      setThoiGian((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [ketQua]);

  const formatThoiGian = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    if (!selectedOption || dangNop) return;
    setDangNop(true);
    try {
      const res = await nopBaiTapAction(baiTap.id, selectedOption, thoiGian);
      if (res.ok) {
        setKetQua(res);
      } else {
        alert(res.message);
      }
    } finally {
      setDangNop(false);
    }
  };

  const progressPercent = navigation
    ? Math.round((navigation.currentIndex / navigation.totalCount) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Breadcrumb & Navigation Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap text-sm text-slate-500">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/bai-tap"
            prefetch={true}
            className="hover:text-blue-600 transition-colors font-medium"
          >
            Ngân hàng bài tập
          </Link>
          <span>/</span>
          <Link
            href={`/bai-tap?chuDeId=${baiTap.chuDe.id}`}
            prefetch={true}
            className="hover:text-blue-600 transition-colors font-medium"
          >
            {baiTap.chuDe.ten}
          </Link>
          <span>/</span>
          <span className="text-blue-600 font-bold">
            Câu {navigation?.currentIndex || 1}
          </span>
        </div>

        <Link
          href={`/bai-tap?chuDeId=${baiTap.chuDe.id}`}
          prefetch={true}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] text-xs font-semibold text-slate-700 transition-all shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Danh mục dạng bài
        </Link>
      </div>

      {/* Top Status & Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold bg-blue-600 text-white px-3 py-1 rounded-full shadow-2xs">
              Câu {navigation?.currentIndex || 1} / {navigation?.totalCount || 1}
            </span>
            {baiTap.dangBai && (
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200/60">
                {baiTap.dangBai}
              </span>
            )}
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              Mức độ: {baiTap.mucDo}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Prev / Next question buttons */}
            {navigation && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {navigation.prevBaiTapId ? (
                  <Link
                    href={`/lam-bai/${navigation.prevBaiTapId}${navigation.dangBaiQuery || ""}`}
                    prefetch={true}
                    title="Câu trước đó"
                    className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold shadow-2xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Trước</span>
                  </Link>
                ) : (
                  <span className="p-1.5 text-slate-300 flex items-center gap-1 text-xs">
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Trước</span>
                  </span>
                )}

                <span className="text-xs font-semibold px-1 text-slate-400">|</span>

                {navigation.nextBaiTapId ? (
                  <Link
                    href={`/lam-bai/${navigation.nextBaiTapId}${navigation.dangBaiQuery || ""}`}
                    prefetch={true}
                    title="Câu kế tiếp"
                    className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold shadow-2xs"
                  >
                    <span className="hidden sm:inline">Sau</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="p-1.5 text-slate-300 flex items-center gap-1 text-xs">
                    <span className="hidden sm:inline">Sau</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </div>
            )}

            {/* Timer */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{formatThoiGian(thoiGian)}</span>
            </div>
          </div>
        </div>

        {/* Mini Progress Bar */}
        {navigation && (
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
          <MathRenderer content={baiTap.deBai} />
        </div>

        {/* Options */}
        <div className="space-y-3">
          {Object.entries(baiTap.cacLuaChon).map(([key, value]) => {
            const isSelected = selectedOption === key;
            const isCorrect = ketQua && ketQua.dapAnDung === key;
            const isWrong = ketQua && isSelected && ketQua.ketQua === "SAI";

            let btnStyle = "border-slate-200 bg-white hover:bg-slate-50 text-slate-800";
            if (isSelected && !ketQua) {
              btnStyle = "border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-600";
            } else if (isCorrect) {
              btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500";
            } else if (isWrong) {
              btnStyle = "border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500";
            }

            return (
              <button
                key={key}
                type="button"
                disabled={!!ketQua || dangNop}
                onClick={() => setSelectedOption(key)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all font-medium text-sm sm:text-base cursor-pointer ${btnStyle}`}
              >
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors ${
                    isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {key}
                </span>
                <div className="flex-1">
                  <MathRenderer content={value} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit Button */}
        {!ketQua ? (
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!selectedOption || dangNop}
              className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
            >
              {dangNop ? "Đang chấm bài..." : "Nộp bài ngay"}
            </button>
          </div>
        ) : (
          /* Result Notification & Explanation */
          <div className="space-y-6 pt-6 border-t border-slate-200">
            <div
              className={`p-5 rounded-2xl flex items-start gap-3.5 ${
                ketQua.ketQua === "DUNG"
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-rose-50 border border-rose-200"
              }`}
            >
              {ketQua.ketQua === "DUNG" ? (
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h3
                  className={`font-bold text-base ${
                    ketQua.ketQua === "DUNG" ? "text-emerald-900" : "text-rose-900"
                  }`}
                >
                  {ketQua.ketQua === "DUNG"
                    ? "Tuyệt vời! Bạn đã chọn đáp án chính xác."
                    : "Chưa chính xác!"}
                </h3>
                <p className="text-sm text-slate-700">
                  Đáp án chuẩn xác là:{" "}
                  <strong className="text-blue-700 uppercase font-black">
                    {ketQua.dapAnDung}
                  </strong>
                </p>
              </div>
            </div>

            {/* Explanation box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" /> Lời giải chi tiết:
              </h4>
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 leading-relaxed text-sm">
                <MathRenderer content={ketQua.loiGiaiChiTiet} />
              </div>
            </div>

            {/* Next Question & Actions Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={daGhim || dangGhim}
                  onClick={async () => {
                    setDangGhim(true);
                    try {
                      const res = await themVaoHangDoiOnTapAction(baiTap.id);
                      if (res.ok) setDaGhim(true);
                    } finally {
                      setDangGhim(false);
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    daGhim
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200"
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5 text-amber-600" />
                  {daGhim ? "✓ Đã ghim vào Ôn tập (SM-2)" : "Ghim vào Ôn tập SM-2"}
                </button>
              </div>

              {/* Nút làm câu tiếp theo */}
              {navigation?.nextBaiTapId ? (
                <Link
                  href={`/lam-bai/${navigation.nextBaiTapId}${navigation.dangBaiQuery || ""}`}
                  prefetch={true}
                  className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <span>Làm câu tiếp theo</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md">
                    {navigation.currentIndex + 1}/{navigation.totalCount}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href={`/bai-tap?chuDeId=${baiTap.chuDe.id}`}
                  prefetch={true}
                  className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Hoàn thành dạng bài! Quay lại danh mục</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
