"use client";

import { useState, useEffect } from "react";
import { nopBaiTapAction } from "../actions/nop-bai";
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  Award,
  MessageSquare,
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

interface AdaptiveContextProps {
  xacSuatThanhThao: number;
  nangLucIRT: number;
  doBenTriNho: number;
  soLanLuyen: number;
  xacSuatDuDoan: number;
  dangBaiFilter?: string;
}

interface Props {
  baiTap: {
    id: string;
    deBai: string;
    mucDo: string;
    dangBai: string | null;
    doKhoIRT?: number;
    doPhanBiet?: number;
    chuDe: {
      id: string;
      ten: string;
      chuongTen?: string;
    };
    cacLuaChon: Record<string, string>;
  };
  adaptiveContext?: AdaptiveContextProps;
  navigation?: NavigationProps;
}

export function PhongLamBaiForm({
  baiTap,
  adaptiveContext,
  navigation,
}: Props) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [thoiGian, setThoiGian] = useState<number>(0);
  const [dangNop, setDangNop] = useState<boolean>(false);
  const [ketQua, setKetQua] = useState<any>(null);

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
      const res = await nopBaiTapAction(
        baiTap.id,
        selectedOption,
        thoiGian,
        adaptiveContext?.dangBaiFilter
      );
      if (res.ok) {
        setKetQua(res);
      } else {
        alert(res.message);
      }
    } finally {
      setDangNop(false);
    }
  };

  // Tính % độ thành thạo hiển thị trực tiếp (cập nhật ngay khi học sinh vừa bấm Nộp bài)
  const masteryBefore = Math.round(
    (ketQua?.adaptiveUpdate?.xacSuatThanhThaoTruoc ??
      adaptiveContext?.xacSuatThanhThao ??
      0) * 100
  );
  const masteryCurrent = Math.round(
    (ketQua?.adaptiveUpdate?.xacSuatThanhThaoMoi ??
      adaptiveContext?.xacSuatThanhThao ??
      0) * 100
  );
  const masteryDelta = masteryCurrent - masteryBefore;

  const thetaCurrent =
    ketQua?.adaptiveUpdate?.nangLucIRTMoi ??
    adaptiveContext?.nangLucIRT ??
    -0.4;
  const stabilityCurrent =
    ketQua?.adaptiveUpdate?.doBenTriNhoMoi ??
    adaptiveContext?.doBenTriNho ??
    1.0;

  const doKhoIRT = baiTap.doKhoIRT ?? 0.0;
  const zpdProbPercent = Math.round(
    (adaptiveContext?.xacSuatDuDoan ?? 0.7) * 100
  );

  // Link câu tiếp theo ưu tiên câu được chọn động theo ZPD (IRT 3PL P ~ 0.70)
  const adaptiveNextId =
    ketQua?.nextAdaptiveQuestion?.baiTapId || navigation?.nextBaiTapId || null;
  const nextDangQuery =
    navigation?.dangBaiQuery ||
    (ketQua?.nextAdaptiveQuestion?.dangBai
      ? `?dangBai=${encodeURIComponent(ketQua.nextAdaptiveQuestion.dangBai)}`
      : "");

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
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

      {/* Top Status, BKT Mastery Progress & ZPD Telemetry */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
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
              {baiTap.mucDo}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Prev / Next sequential navigation */}
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

                <span className="text-xs font-semibold px-1 text-slate-400">
                  |
                </span>

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

        {/* Live BKT Mastery Progress Bar & IRT / FSRS Metrics */}
        <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Brain className="w-4 h-4 text-indigo-600" />
              <span>Độ thành thạo dạng bài:</span>
              <span
                className={`px-2 py-0.5 rounded-md font-black ${
                  masteryCurrent >= 85
                    ? "bg-emerald-100 text-emerald-800"
                    : masteryCurrent >= 60
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {masteryCurrent}%
              </span>
              {ketQua && masteryDelta !== 0 && (
                <span
                  className={`text-[11px] font-bold ${
                    masteryDelta > 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  ({masteryDelta > 0 ? `+${masteryDelta}%` : `${masteryDelta}%`})
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 flex-wrap">
              <span>
                Độ phù hợp: <strong className="text-indigo-700">{zpdProbPercent}%</strong>
              </span>
              {adaptiveContext && adaptiveContext.soLanLuyen > 0 && (
                <>
                  <span>•</span>
                  <span>
                    Đã luyện: <strong className="text-slate-700">{adaptiveContext.soLanLuyen} câu</strong>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Thanh tiến trình BKT với vạch mốc 85% Mastery */}
          <div className="relative w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
                masteryCurrent >= 85
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600"
              }`}
              style={{
                width: `${
                  masteryCurrent === 0
                    ? 0
                    : Math.min(100, Math.max(4, masteryCurrent))
                }%`,
              }}
            />
            {/* Vạch đích 85% Thành thạo */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-700/70"
              style={{ left: "85%" }}
              title="Ngưỡng công nhận Thành thạo (85%)"
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Khởi đầu (0%)</span>
            <span className="text-emerald-700 font-bold">
              ★ Đích Thành thạo: 85%
            </span>
          </div>
        </div>
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

            let btnStyle =
              "border-slate-200 bg-white hover:bg-slate-50 text-slate-800";
            if (isSelected && !ketQua) {
              btnStyle =
                "border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-600";
            } else if (isCorrect) {
              btnStyle =
                "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500";
            } else if (isWrong) {
              btnStyle =
                "border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500";
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
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700"
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
              {dangNop ? "Đang phân tích & chấm bài..." : "Nộp bài ngay"}
            </button>
          </div>
        ) : (
          /* Result Notification, Adaptive Telemetry & Explanation */
          <div className="space-y-6 pt-6 border-t border-slate-200">
            <div
              className={`p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                ketQua.ketQua === "DUNG"
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-rose-50 border border-rose-200"
              }`}
            >
              <div className="flex items-start gap-3.5">
                {ketQua.ketQua === "DUNG" ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <h3
                    className={`font-bold text-base ${
                      ketQua.ketQua === "DUNG"
                        ? "text-emerald-900"
                        : "text-rose-900"
                    }`}
                  >
                    {ketQua.ketQua === "DUNG"
                      ? "Tuyệt vời! Bạn đã chọn đáp án chính xác."
                      : "Chưa chính xác! Hệ thống đã điều chỉnh lộ trình cho bạn."}
                  </h3>
                  <p className="text-sm text-slate-700">
                    Đáp án chuẩn xác là:{" "}
                    <strong className="text-blue-700 uppercase font-black">
                      {ketQua.dapAnDung}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Khối thông báo cập nhật BKT + Spaced Repetition */}
              {ketQua.adaptiveUpdate && (
                <div className="bg-white/90 backdrop-blur-xs rounded-xl p-3 border border-slate-200/80 text-xs space-y-1 shrink-0">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      Thành thạo: {masteryBefore}% →{" "}
                      <strong className="text-blue-700">{masteryCurrent}%</strong>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Nhắc nhở ôn lại:{" "}
                    <strong className="text-slate-700">
                      sau {ketQua.adaptiveUpdate.khoangCachOnNgay} ngày
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Banner chúc mừng khi cán mốc 85% */}
            {ketQua.adaptiveUpdate?.daDatThanhThao && (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-2xl flex items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <Award className="w-7 h-7 text-amber-300 shrink-0" />
                  <div>
                    <h4 className="font-black text-sm">
                      Chúc mừng! Bạn đã nắm vững dạng toán này (Đạt ≥ 85%)
                    </h4>
                    <p className="text-xs text-emerald-50">
                      Hệ thống đã ghi nhận kết quả và sẽ nhắc bạn ôn lại sau{" "}
                      {ketQua.adaptiveUpdate.khoangCachOnNgay} ngày.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/bai-tap?chuDeId=${baiTap.chuDe.id}`}
                  className="px-3.5 py-2 bg-white text-emerald-900 font-bold text-xs rounded-xl shrink-0 hover:bg-emerald-50 transition-colors"
                >
                  Chuyển dạng bài mới →
                </Link>
              </div>
            )}

            {/* Explanation box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" /> Lời giải chi tiết:
                </h4>
                <Link
                  href={`/dien-dan/tao-moi?baiTapId=${baiTap.id}&chuDeId=${baiTap.chuDe.id}`}
                  target="_blank"
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer hover:border-emerald-300"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chưa hiểu? Hỏi trên diễn đàn</span>
                </Link>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 leading-relaxed text-sm">
                <MathRenderer content={ketQua.loiGiaiChiTiet} />
              </div>
            </div>

            {/* Next Adaptive Question & Actions Banner */}
            {ketQua.adaptiveUpdate?.daDatThanhThao ? (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                      <Award className="w-3.5 h-3.5" /> Đã hoàn thành mục tiêu Thành thạo (≥ 85%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Bạn đã làm chủ dạng bài này ở cả mức độ Vận dụng! Hãy quay lại danh mục để chuyển sang dạng bài tiếp theo hoặc luyện thêm nếu muốn nâng cao.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                  {adaptiveNextId && (
                    <Link
                      href={`/lam-bai/${adaptiveNextId}${nextDangQuery}`}
                      prefetch={true}
                      className="px-4 py-3 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Luyện thêm câu nâng cao</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <Link
                    href={`/bai-tap?chuDeId=${baiTap.chuDe.id}`}
                    prefetch={true}
                    className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Hoàn thành dạng bài! Chuyển dạng mới</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-lg">
                      <Target className="w-3.5 h-3.5" /> Gợi ý câu hỏi tiếp theo theo độ khó thích ứng
                    </span>
                  </div>
                  {ketQua.nextAdaptiveQuestion && (
                    <p className="text-xs text-slate-600">
                      {ketQua.nextAdaptiveQuestion.lyDoChon}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                  <Link
                    href={`/bai-tap?chuDeId=${baiTap.chuDe.id}`}
                    prefetch={true}
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
                  >
                    Tạm dừng / Đổi dạng
                  </Link>

                  {adaptiveNextId ? (
                    <Link
                      href={`/lam-bai/${adaptiveNextId}${nextDangQuery}`}
                      prefetch={true}
                      className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-4 h-4 fill-current" />
                      <span>Làm câu tiếp theo</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Link
                      href={`/bai-tap?chuDeId=${baiTap.chuDe.id}`}
                      prefetch={true}
                      className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Hoàn thành dạng bài! Quay lại danh mục</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
