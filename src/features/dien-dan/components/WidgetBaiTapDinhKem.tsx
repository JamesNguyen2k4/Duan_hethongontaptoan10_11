"use client";

import { useState } from "react";
import { Target, ChevronDown, ChevronUp, CheckCircle, HelpCircle } from "lucide-react";
import { MathRenderer } from "@/components/shared/MathRenderer";

interface Props {
  baiTap: {
    id: string;
    deBai: string;
    dapAn: string;
    loiGiaiChiTiet: string;
    dangBai: string | null;
    mucDo: string;
  };
}

export function WidgetBaiTapDinhKem({ baiTap }: Props) {
  const [hienLoiGiai, setHienLoiGiai] = useState(false);

  let cacLuaChon: Record<string, string> = {};
  let dapAnDung = "";
  try {
    const parsed = JSON.parse(baiTap.dapAn);
    cacLuaChon = parsed.cacLuaChon || {};
    dapAnDung = parsed.dapAnDung || "";
  } catch {
    dapAnDung = baiTap.dapAn;
  }

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
            <Target className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Bài tập thảo luận đính kèm
            </h4>
            {baiTap.dangBai && (
              <span className="text-[11px] text-slate-500 font-medium">
                {baiTap.dangBai} • Mức độ: {baiTap.mucDo}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setHienLoiGiai(!hienLoiGiai)}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
        >
          {hienLoiGiai ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Thu gọn đáp án
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> Xem đáp án & lời giải
            </>
          )}
        </button>
      </div>

      {/* Đề bài */}
      <div className="text-sm font-medium text-slate-900 leading-relaxed">
        <MathRenderer content={baiTap.deBai} />
      </div>

      {/* Các lựa chọn trắc nghiệm */}
      {Object.keys(cacLuaChon).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {Object.entries(cacLuaChon).map(([key, val]) => (
            <div
              key={key}
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 bg-white ${
                hienLoiGiai && key === dapAnDung
                  ? "border-emerald-400 bg-emerald-50/50 text-emerald-900 font-bold"
                  : "border-slate-200/80 text-slate-800"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                  hienLoiGiai && key === dapAnDung
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {key}
              </span>
              <div className="flex-1">
                <MathRenderer content={val} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lời giải chi tiết (hiện khi bấm) */}
      {hienLoiGiai && (
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Đáp án đúng: {dapAnDung}</span>
          </div>
          {baiTap.loiGiaiChiTiet && (
            <div className="text-xs text-slate-700 pt-1 border-t border-emerald-200/60 leading-relaxed">
              <MathRenderer content={baiTap.loiGiaiChiTiet} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

