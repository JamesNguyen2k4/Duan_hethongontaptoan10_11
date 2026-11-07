"use client";

import { useState, useEffect } from "react";
import { TheOnTapData, danhGiaTheOnTapAction } from "../actions/on-tap-actions";
import { MathRenderer } from "@/components/shared/MathRenderer";
import {
  Clock,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  Calendar,
  Layers,
} from "lucide-react";
import Link from "next/link";

interface Props {
  danhSachThe: TheOnTapData[];
  onHoanThanh?: () => void;
}

export function PhienOnTapPlayer({ danhSachThe, onHoanThanh }: Props) {
  const [theHienTaiIndex, setTheHienTaiIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [daKiemTra, setDaKiemTra] = useState(false);
  const [thoiGian, setThoiGian] = useState(0);
  const [dangLuu, setDangLuu] = useState(false);

  // Thống kê phiên ôn tập
  const [ketQuaPhien, setKetQuaPhien] = useState({
    soCauDung: 0,
    soCauSai: 0,
    tongThoiGian: 0,
    streak: 0,
    maxStreak: 0,
  });

  const [daHoanThanhPhien, setDaHoanThanhPhien] = useState(false);

  const theHienTai = danhSachThe[theHienTaiIndex];

  // Timer đếm thời gian
  useEffect(() => {
    if (daHoanThanhPhien || daKiemTra) return;
    const interval = setInterval(() => {
      setThoiGian((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [daHoanThanhPhien, daKiemTra]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleKiemTra = () => {
    if (!selectedOption && !daKiemTra) return;
    setDaKiemTra(true);

    const isDung =
      selectedOption.trim().toUpperCase() ===
      theHienTai.baiTap.dapAnDung.trim().toUpperCase();

    setKetQuaPhien((prev) => {
      const newStreak = isDung ? prev.streak + 1 : 0;
      return {
        ...prev,
        soCauDung: isDung ? prev.soCauDung + 1 : prev.soCauDung,
        soCauSai: !isDung ? prev.soCauSai + 1 : prev.soCauSai,
        tongThoiGian: prev.tongThoiGian + thoiGian,
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
      };
    });
  };

  const handleDanhGia = async (q: number) => {
    if (dangLuu) return;
    setDangLuu(true);

    try {
      await danhGiaTheOnTapAction(theHienTai.id, q, thoiGian, selectedOption);

      // Chuyển sang câu tiếp theo
      if (theHienTaiIndex + 1 < danhSachThe.length) {
        setTheHienTaiIndex((prev) => prev + 1);
        setSelectedOption("");
        setDaKiemTra(false);
        setThoiGian(0);
      } else {
        setDaHoanThanhPhien(true);
        if (onHoanThanh) onHoanThanh();
      }
    } finally {
      setDangLuu(false);
    }
  };

  // Màn hình hoàn thành
  if (daHoanThanhPhien) {
    const tongSoCau = danhSachThe.length;
    const tyLeDung =
      tongSoCau > 0
        ? Math.round((ketQuaPhien.soCauDung / tongSoCau) * 100)
        : 100;
    const thoiGianTB =
      tongSoCau > 0 ? Math.round(ketQuaPhien.tongThoiGian / tongSoCau) : 0;

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-8 shadow-xl animate-in fade-in-50 duration-500">
        <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto text-white shadow-lg shadow-orange-500/30">
          <Award className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Xuất sắc hoàn thành
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Bạn đã ôn tập xong các thẻ hôm nay!
          </h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Bộ nhớ của bạn vừa được củng cố theo chu kỳ chuẩn SM-2. Các thẻ này sẽ tự động xuất hiện lại vào thời điểm vàng trước khi bị quên.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="p-3">
            <span className="block text-2xl font-black text-slate-800">
              {tongSoCau}
            </span>
            <span className="text-xs text-slate-500 font-medium">Số thẻ đã ôn</span>
          </div>
          <div className="p-3 border-x border-slate-200">
            <span className="block text-2xl font-black text-emerald-600">
              {tyLeDung}%
            </span>
            <span className="text-xs text-slate-500 font-medium">Chính xác</span>
          </div>
          <div className="p-3">
            <span className="block text-2xl font-black text-blue-600">
              {formatSeconds(thoiGianTB)}
            </span>
            <span className="text-xs text-slate-500 font-medium">Thời gian TB / thẻ</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/on-tap"
            className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Về trang tổng quan ôn tập
          </Link>
          <Link
            href="/bai-tap"
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Luyện thêm bài tập mới <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!theHienTai) {
    return null;
  }

  const isDung =
    daKiemTra &&
    selectedOption.trim().toUpperCase() ===
      theHienTai.baiTap.dapAnDung.trim().toUpperCase();

  const progressPercent = Math.round(
    ((theHienTaiIndex + 1) / danhSachThe.length) * 100
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Thẻ {theHienTaiIndex + 1} / {danhSachThe.length}
            </span>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              {theHienTai.baiTap.chuDe.ten}
            </span>
            <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
              Mức độ: {theHienTai.baiTap.mucDo}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {ketQuaPhien.streak > 1 && (
              <div className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-xl border border-orange-200">
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                <span>Chuỗi {ketQuaPhien.streak} đúng</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatSeconds(thoiGian)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Question Header */}
        <div className="text-slate-900 font-bold text-base sm:text-lg leading-relaxed">
          <MathRenderer content={theHienTai.baiTap.deBai} />
        </div>

        {/* Options */}
        <div className="space-y-3">
          {Object.entries(theHienTai.baiTap.cacLuaChon).map(([key, val]) => {
            const isSelected = selectedOption === key;
            const isDapAnDung =
              daKiemTra && key === theHienTai.baiTap.dapAnDung;
            const isChonSai = daKiemTra && isSelected && !isDung;

            let btnStyle =
              "border-slate-200 bg-white hover:bg-slate-50 text-slate-800";
            if (isSelected && !daKiemTra) {
              btnStyle =
                "border-amber-500 bg-amber-50/80 text-amber-900 ring-2 ring-amber-500";
            } else if (isDapAnDung) {
              btnStyle =
                "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500";
            } else if (isChonSai) {
              btnStyle =
                "border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500";
            }

            return (
              <button
                key={key}
                type="button"
                disabled={daKiemTra || dangLuu}
                onClick={() => setSelectedOption(key)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all font-medium text-sm sm:text-base ${btnStyle}`}
              >
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors ${
                    isSelected
                      ? "bg-amber-600 text-white"
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

        {/* Action: Check Button */}
        {!daKiemTra ? (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                setSelectedOption("");
                setDaKiemTra(true);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" /> Tôi chưa nhớ cách giải (Xem đáp án)
            </button>

            <button
              type="button"
              onClick={handleKiemTra}
              disabled={!selectedOption}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              Kiểm tra kết quả <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Feedback & SM-2 Self-Rating Buttons */
          <div className="space-y-6 pt-6 border-t border-slate-200 animate-in fade-in-50 duration-300">
            {/* Result banner */}
            <div
              className={`p-5 rounded-2xl flex items-start gap-3.5 ${
                isDung
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-rose-50 border border-rose-200"
              }`}
            >
              {isDung ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h4
                  className={`font-bold text-base ${
                    isDung ? "text-emerald-900" : "text-rose-900"
                  }`}
                >
                  {isDung
                    ? "Chính xác! Bạn nhớ kiến thức rất tốt."
                    : "Chưa chính xác hoặc bạn đã quên."}
                </h4>
                <p className="text-sm text-slate-700">
                  Đáp án chuẩn xác là:{" "}
                  <strong className="text-blue-700 uppercase">
                    {theHienTai.baiTap.dapAnDung}
                  </strong>
                </p>
              </div>
            </div>

            {/* Detailed Explanation */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3">
              <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                Lời giải chi tiết:
              </h5>
              <div className="bg-white p-4 rounded-xl border border-slate-200/60 overflow-hidden">
                <MathRenderer content={theHienTai.baiTap.loiGiaiChiTiet} />
              </div>
            </div>

            {/* SM-2 Rating Bar */}
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Đánh giá mức độ ghi nhớ (Thuật toán SM-2)
                </span>
                <span className="text-xs text-slate-500">
                  Chọn mức để xếp lịch nhắc lại phù hợp
                </span>
              </div>

              {/* 4 Rating Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {theHienTai.duBao.map((btn) => {
                  let style = "";
                  if (btn.mauSac === "rose") {
                    style =
                      "bg-white hover:bg-rose-50 border-rose-200 text-rose-800 hover:border-rose-400";
                  } else if (btn.mauSac === "amber") {
                    style =
                      "bg-white hover:bg-amber-50 border-amber-200 text-amber-800 hover:border-amber-400";
                  } else if (btn.mauSac === "emerald") {
                    style =
                      "bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-400";
                  } else {
                    style =
                      "bg-white hover:bg-blue-50 border-blue-200 text-blue-800 hover:border-blue-400";
                  }

                  return (
                    <button
                      key={btn.q}
                      type="button"
                      disabled={dangLuu}
                      onClick={() => handleDanhGia(btn.q)}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 shadow-sm ${style}`}
                    >
                      <span className="font-bold text-xs sm:text-sm">
                        {btn.nhan}
                      </span>
                      <span className="text-[11px] font-semibold opacity-75">
                        +{btn.vanBanKhoangCach}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

