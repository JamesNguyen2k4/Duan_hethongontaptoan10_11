"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { AlertTriangle, CheckCircle, TrendingUp, Sparkles, ArrowRight, Play } from "lucide-react";
import Link from "next/link";

interface Props {
  data: {
    tongBaiDaLam: number;
    soBaiDung: number;
    danhSachChuDe: any[];
    diemYeuList: any[];
    baiTapGoiY: any[];
  };
}

export function BangPhanTichNangLuc({ data }: Props) {
  const chartData = data.danhSachChuDe.map((cd) => ({
    subject: cd.tenChuDe.replace(/^Bài \d+\.\s*/, "").slice(0, 16),
    doThanhThao: Math.round(cd.doThanhThao * 100),
    tiLeDung: cd.tiLeDung,
  }));

  const tiLeTong = data.tongBaiDaLam > 0 ? Math.round((data.soBaiDung / data.tongBaiDaLam) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* 3 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Số câu đã hoàn thành</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{data.tongBaiDaLam}</span>
            <span className="text-xs text-slate-400">câu hỏi</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tỷ lệ chính xác</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${tiLeTong >= 70 ? 'text-emerald-600' : 'text-blue-600'}`}>
              {tiLeTong}%
            </span>
            <span className="text-xs text-slate-400">({data.soBaiDung}/{data.tongBaiDaLam} câu đúng)</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vùng kiến thức cần bù đắp</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">{data.diemYeuList.length}</span>
            <span className="text-xs text-slate-400">chủ đề điểm yếu</span>
          </div>
        </div>
      </div>

      {/* Radar Chart & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <TrendingUp className="w-4 h-4 text-blue-600" /> Biểu đồ Radar: Độ thành thạo kiến thức
          </div>
          <p className="text-xs text-slate-500">
            Tính toán theo công thức Bayesian Laplace smoothing (ngưỡng an toàn 60%).
          </p>
          {chartData.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Độ thành thạo (%)" dataKey="doThanhThao" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-xs text-slate-400">
              Hãy làm ít nhất 3 câu hỏi để kích hoạt biểu đồ phân tích năng lực.
            </div>
          )}
        </div>

        {/* Weakness Alert Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600" /> Chẩn đoán điểm yếu cần khắc phục
          </div>

          {data.diemYeuList.length > 0 ? (
            <div className="space-y-3">
              {data.diemYeuList.map((weak) => (
                <div key={weak.chuDeId} className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-rose-900">{weak.tenChuDe}</h4>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      Độ thành thạo: <strong>{Math.round(weak.doThanhThao * 100)}%</strong> • Đã làm {weak.tongSoLam} bài
                    </p>
                  </div>
                  <Link
                    href={`/bai-tap?chuDeId=${weak.chuDeId}`}
                    className="text-xs bg-rose-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-rose-700 transition-colors whitespace-nowrap shadow-sm"
                  >
                    Ôn ngay
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <strong className="block font-bold">Chưa ghi nhận điểm yếu nghiêm trọng!</strong>
                Bạn đang duy trì phong độ làm bài rất tốt trên các chủ đề đã học.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Adaptive Learning Recommended Questions */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" /> Hệ thống gợi ý thích ứng (Adaptive Learning)
            </div>
            <h3 className="text-xl font-black mt-1">Các câu hỏi nhắm thẳng vào lỗ hổng kiến thức của bạn</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.baiTapGoiY.map((q) => (
            <div key={q.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-blue-400 transition-all flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold bg-blue-500/30 text-blue-200 px-2.5 py-1 rounded-full uppercase">
                  {q.chuDe.ten}
                </span>
                <p className="text-xs font-medium text-slate-100 line-clamp-3 leading-relaxed">
                  {q.deBai}
                </p>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-white/10">
                <Link
                  href={`/lam-bai/${q.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-blue-950 px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" /> Làm câu này
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

