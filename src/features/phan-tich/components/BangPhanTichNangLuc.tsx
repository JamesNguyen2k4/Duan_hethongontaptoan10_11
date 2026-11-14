"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Sparkles,
  Play,
  Brain,
  Repeat,
  Award,
  Layers,
  Target,
} from "lucide-react";
import Link from "next/link";
import { MathRenderer } from "@/components/shared/MathRenderer";

interface Props {
  data: {
    tongBaiDaLam: number;
    soBaiDung: number;
    soDangDaLuyen?: number;
    soDangThanhThao?: number;
    soDangCanOn?: number;
    danhSachChuDe: any[];
    danhSachDangBai?: any[];
    dangBaiCanOnList?: any[];
    diemYeuList: any[];
    baiTapGoiY?: any[];
  };
}

export function BangPhanTichNangLuc({ data }: Props) {
  let chartData = data.danhSachChuDe.map((cd) => ({
    subject: cd.tenChuDe.replace(/^Bài \d+\.\s*/, "").slice(0, 18),
    fullSubject: cd.tenChuDe,
    doThanhThao: Math.round(cd.doThanhThao * 100),
    doNho: Math.round((cd.doNhoTrungBinh ?? 1) * 100),
  }));

  // Đảm bảo biểu đồ Mạng nhện (RadarChart) luôn có ít nhất 3 trục để hình thành mạng lưới đa giác tròn
  if (chartData.length > 0 && chartData.length < 3) {
    const defaultAxes = [
      { subject: "Mệnh đề & Tập hợp", fullSubject: "Chương 1. Mệnh đề và tập hợp" },
      { subject: "Hệ thức lượng tam giác", fullSubject: "Chương 3. Hệ thức lượng trong tam giác" },
      { subject: "Vectơ & Tọa độ", fullSubject: "Chương 4. Vectơ" },
    ];
    for (const axis of defaultAxes) {
      if (chartData.length >= 3) break;
      if (!chartData.some((c) => c.subject.includes(axis.subject) || axis.subject.includes(c.subject))) {
        chartData.push({
          subject: axis.subject,
          fullSubject: axis.fullSubject,
          doThanhThao: 0,
          doNho: 0,
        });
      }
    }
  }

  const tiLeTong =
    data.tongBaiDaLam > 0
      ? Math.round((data.soBaiDung / data.tongBaiDaLam) * 100)
      : 0;

  const danhSachDangBai = data.danhSachDangBai || [];
  const dangBaiCanOnList = data.dangBaiCanOnList || [];

  return (
    <div className="space-y-8">
      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Lượt tương tác học tập
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {data.tongBaiDaLam}
            </span>
            <span className="text-xs text-slate-400">
              câu ({tiLeTong}% chính xác)
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Dạng toán đang theo dõi
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-600">
              {data.soDangDaLuyen ?? danhSachDangBai.length}
            </span>
            <span className="text-xs text-slate-400">dạng bài</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Đã đạt ngưỡng Thành thạo
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">
              {data.soDangThanhThao ?? 0}
            </span>
            <span className="text-xs text-slate-400">dạng đạt (≥ 85%)</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Cần ôn tập & củng cố
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">
              {data.soDangCanOn ?? dangBaiCanOnList.length}
            </span>
            <span className="text-xs text-slate-400">
              dạng bài (&lt; 85%)
            </span>
          </div>
        </div>
      </div>

      {/* Radar Chart & Spaced Repetition / Weakness Priority Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <TrendingUp className="w-4 h-4 text-blue-600" /> Biểu đồ Năng lực: Mức độ thành thạo & Khả năng ghi nhớ
          </div>
          <p className="text-xs text-slate-500">
            Đánh giá mức độ làm chủ kiến thức và khả năng ghi nhớ theo từng bài học (ngưỡng làm chủ 85%).
          </p>
          {chartData.length > 0 ? (
            <div className="h-[290px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value}%`, name]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullSubject || ""}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Radar
                    name="Độ thành thạo (%)"
                    dataKey="doThanhThao"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.45}
                  />
                  <Radar
                    name="Khả năng ghi nhớ (%)"
                    dataKey="doNho"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[240px] flex flex-col items-center justify-center text-xs text-slate-400 gap-3">
              <Brain className="w-8 h-8 text-slate-300" />
              <span>
                Hãy bắt đầu luyện tập hoặc làm bài khảo sát để kích
                hoạt đánh giá năng lực.
              </span>
            </div>
          )}
        </div>

        {/* Spaced Repetition & Weakness Priority Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <Repeat className="w-4 h-4 text-amber-600" /> Danh sách Dạng bài cần ưu tiên Ôn tập & Củng cố
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Ưu tiên theo độ cần ôn
            </span>
          </div>

          {dangBaiCanOnList.length > 0 ? (
            <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
              {dangBaiCanOnList.map((item) => {
                const pct = Math.round(item.xacSuatHieuDung * 100);
                const retentionPct = Math.round(item.doNhoHienTai * 100);
                const isFSRSDue = item.trangThai === "CAN_ON_LAI";
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl flex items-center justify-between gap-3 border ${
                      isFSRSDue
                        ? "bg-amber-50/60 border-amber-200"
                        : "bg-blue-50/60 border-blue-200"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
                          {item.tenChuDe}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isFSRSDue
                              ? "bg-amber-100 text-amber-900"
                              : "bg-blue-100 text-blue-900"
                          }`}
                        >
                          {isFSRSDue ? item.nhanTrangThai : `Cần củng cố (${pct}%)`}
                        </span>
                        {item.thongTinLich && isFSRSDue && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md border ${item.thongTinLich.mauSacBadge}`}
                          >
                            {item.thongTinLich.vanBanLich}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {item.dangBai}
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Độ thành thạo: <strong>{pct}%</strong> • Ghi nhớ:{" "}
                        <strong>{retentionPct}%</strong> (Mục tiêu 85%)
                        {item.doBenTriNho && (
                          <>
                            {" "}• Độ bền:{" "}
                            <strong>{item.doBenTriNho} ngày</strong>
                          </>
                        )} • Đã luyện:{" "}
                        <strong>
                          {item.soLanDung}/{item.soLanLuyen} câu đúng
                        </strong>
                      </p>
                    </div>
                    <Link
                      href={`/lam-bai/chu-de/${
                        item.chuDeId
                      }?dangBai=${encodeURIComponent(item.dangBai)}`}
                      className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap shadow-xs shrink-0 ${
                        isFSRSDue
                          ? "bg-amber-500 text-white hover:bg-amber-600"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isFSRSDue ? "Ôn tập ngay" : "Củng cố ngay"}
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="text-xs space-y-1">
                <strong className="block font-bold">
                  Kiến thức của bạn đang ở trạng thái rất tốt!
                </strong>
                <span>
                  Không có dạng toán nào bị suy giảm dưới ngưỡng an toàn. Hãy
                  khám phá thêm các bài học mới trong Ngân hàng bài tập.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Learner Model Table */}
      {danhSachDangBai.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Chi tiết mức độ nắm vững theo từng Dạng bài toán
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi chi tiết tiến độ thành thạo và khả năng ghi nhớ của từng dạng bài.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {danhSachDangBai.map((d) => {
              const pEffPct = Math.round(d.xacSuatHieuDung * 100);
              const rPct = Math.round(d.doNhoHienTai * 100);

              return (
                <div
                  key={d.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between gap-3 bg-slate-50/40"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                        {d.tenChuDe}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {d.thongTinLich && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md border ${d.thongTinLich.mauSacBadge}`}
                          >
                            {d.thongTinLich.vanBanLich}
                          </span>
                        )}
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            d.trangThai === "THANH_THAO"
                              ? "bg-emerald-100 text-emerald-800"
                              : d.trangThai === "CAN_ON_LAI"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {d.nhanTrangThai} ({pEffPct}%)
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {d.dangBai}
                    </h4>

                    <div className="relative w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          d.trangThai === "THANH_THAO"
                            ? "bg-emerald-500"
                            : d.trangThai === "CAN_ON_LAI"
                            ? "bg-amber-500"
                            : "bg-blue-600"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(6, pEffPct))}%`,
                        }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-emerald-700/70"
                        style={{ left: "85%" }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>
                      Đã luyện:{" "}
                      <strong className="text-slate-700">
                        {d.soLanDung}/{d.soLanLuyen} câu đúng
                      </strong>{" "}
                      • Ghi nhớ:{" "}
                      <strong className="text-slate-700">{rPct}%</strong>
                      {d.doBenTriNho && (
                        <>
                          {" "}• Độ bền:{" "}
                          <strong className="text-slate-700">{d.doBenTriNho} ngày</strong>
                        </>
                      )}
                    </span>

                    <Link
                      href={`/lam-bai/chu-de/${
                        d.chuDeId
                      }?dangBai=${encodeURIComponent(d.dangBai)}`}
                      className="text-blue-600 font-bold hover:underline flex items-center gap-1 shrink-0"
                    >
                      <Play className="w-3 h-3 fill-current" /> Luyện tập
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
