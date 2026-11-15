"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Clock,
  GraduationCap,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
  AlertTriangle,
  History,
  BookOpen,
} from "lucide-react";
import type {
  BaoCaoChiTietHocSinhData,
  ChuongReport,
  BaiHocReport,
  DangBaiReport,
} from "../types";

interface Props {
  data: BaoCaoChiTietHocSinhData;
}

export function BaoCaoHocSinhChiTiet({ data }: Props) {
  const router = useRouter();
  const { hocSinh, selectedLopId, tongQuan, danhSachChuong, lichSuCacLanLuyen, bieuDoTienTrinh } =
    data;

  // Trạng thái mở/đóng danh sách dạng bài của từng bài học
  const [expandedBais, setExpandedBais] = useState<Record<string, boolean>>({});
  // Trạng thái mở/đóng xem biểu đồ & chi tiết từng lần làm của từng Dạng bài
  const [expandedDangIds, setExpandedDangIds] = useState<Record<string, boolean>>({});
  // Bộ lọc dạng bài trong phần biểu đồ/lịch sử
  const [selectedDangFilter, setSelectedDangFilter] = useState<string>("all");

  const toggleExpand = (baiId: string) => {
    setExpandedBais((prev) => ({
      ...prev,
      [baiId]: !prev[baiId],
    }));
  };

  const toggleExpandDang = (dangId: string) => {
    setExpandedDangIds((prev) => ({
      ...prev,
      [dangId]: !prev[dangId],
    }));
  };

  const handleLopChange = (newLopId: string) => {
    router.push(`/admin/hoc-sinh/${hocSinh.id}?lopId=${newLopId}`);
  };

  // Lọc dữ liệu biểu đồ và bảng lịch sử theo dạng bài nếu có chọn
  const filteredBieuDo =
    selectedDangFilter === "all"
      ? bieuDoTienTrinh
      : bieuDoTienTrinh.filter((b) => b.dangBai === selectedDangFilter);

  const filteredHistory =
    selectedDangFilter === "all"
      ? lichSuCacLanLuyen
      : lichSuCacLanLuyen.filter((h) => h.dangBai === selectedDangFilter);

  // Danh sách các dạng bài đã luyện để đưa vào dropdown lọc
  const uniqueDangs = Array.from(
    new Set(lichSuCacLanLuyen.map((h) => h.dangBai))
  );

  return (
    <div className="space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/admin/hoc-sinh"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách học sinh
          </Link>

          {/* Bộ chuyển đổi Lớp học xem báo cáo */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => handleLopChange("lop-10")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedLopId === "lop-10"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Toán 10
            </button>
            <button
              type="button"
              onClick={() => handleLopChange("lop-11")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedLopId === "lop-11"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Toán 11
            </button>
          </div>
        </div>

        {/* Thông tin học sinh */}
        <div className="flex items-center gap-4 flex-wrap pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md">
            {hocSinh.tenHienThi
              ? hocSinh.tenHienThi
                  .split(" ")
                  .filter(Boolean)
                  .slice(-2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
              : "HS"}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {hocSinh.tenHienThi}
              </h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                Lớp học: {selectedLopId === "lop-10" ? "Toán 10" : "Toán 11"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Email: <strong className="text-slate-700">{hocSinh.email}</strong> •
              Ngày tham gia:{" "}
              <strong className="text-slate-700">
                {new Date(hocSinh.taoLuc).toLocaleDateString("vi-VN")}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* 4 Thẻ KPI Tóm tắt Năng lực của Học sinh ở Lớp này */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 bg-indigo-50/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng lần luyện</span>
            <Brain className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-indigo-900">
            {tongQuan.tongSoLanLuyen}
          </div>
          <p className="text-xs text-indigo-500">Phiên luyện tập dạng bài đã hoàn thành</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Độ thành thạo TB</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {tongQuan.doThanhThaoTB}%
          </div>
          <p className="text-xs text-slate-400">Trung bình trên toàn bộ chương trình</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold uppercase tracking-wider">Dạng đã thành thạo</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-900">
            {tongQuan.soDangThanhThao} / {tongQuan.tongSoDang}
          </div>
          <p className="text-xs text-emerald-500">Dạng toán đạt mốc ≥ 85%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tỉ lệ câu đúng</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {tongQuan.tiLeDung}%
          </div>
          <p className="text-xs text-slate-400">
            {tongQuan.soCauDung} / {tongQuan.tongSoCauLam} câu nộp đúng
          </p>
        </div>
      </div>

      {/* PHÂN KHU 1: TIẾN ĐỘ & ĐỘ THÀNH THẠO THEO TỪNG BÀI HỌC VÀ DẠNG BÀI */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Báo cáo Độ thành thạo theo từng Bài học & Dạng bài</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi chi tiết mức độ lĩnh hội kiến thức ở từng bài học và từng dạng toán trong chương trình{" "}
            {selectedLopId === "lop-10" ? "Toán 10" : "Toán 11"}.
          </p>
        </div>

        {/* Danh sách Chương và Bài học */}
        <div className="space-y-5">
          {danhSachChuong.map((chuong) => (
            <div
              key={chuong.id}
              className="border border-slate-200/90 rounded-2xl overflow-hidden bg-slate-50/40"
            >
              {/* Tiêu đề Chương */}
              <div className="bg-slate-100/90 px-5 py-3 border-b border-slate-200/80 flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  {chuong.ten}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {chuong.danhSachBai.length} bài học
                </span>
              </div>

              {/* Danh sách Bài học trong Chương */}
              <div className="divide-y divide-slate-200/80">
                {chuong.danhSachBai.map((bai) => {
                  const isExpanded = !!expandedBais[bai.id];

                  return (
                    <div key={bai.id} className="bg-white">
                      {/* Dòng Bài Học */}
                      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">
                              {bai.ten}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                bai.trangThaiBai === "THANH_THAO"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : bai.trangThaiBai === "KHA"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : bai.trangThaiBai === "CAN_LUYEN"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-100 text-slate-500 border-slate-200"
                              }`}
                            >
                              {bai.trangThaiBai === "THANH_THAO"
                                ? "Đã nắm vững"
                                : bai.trangThaiBai === "KHA"
                                ? "Khá"
                                : bai.trangThaiBai === "CAN_LUYEN"
                                ? "Cần rèn luyện"
                                : "Chưa học"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Gồm {bai.soDang} dạng toán trọng tâm
                          </p>
                        </div>

                        {/* Thanh % thành thạo trung bình của Bài học & Nút mở rộng */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="w-40 sm:w-48 space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-500">Thành thạo:</span>
                              <span
                                className={
                                  bai.doThanhThaoBai >= 85
                                    ? "text-emerald-700"
                                    : bai.doThanhThaoBai >= 60
                                    ? "text-blue-700"
                                    : "text-amber-700"
                                }
                              >
                                {bai.doThanhThaoBai}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  bai.doThanhThaoBai >= 85
                                    ? "bg-emerald-500"
                                    : bai.doThanhThaoBai >= 60
                                    ? "bg-blue-600"
                                    : "bg-amber-500"
                                }`}
                                style={{ width: `${Math.min(100, Math.max(2, bai.doThanhThaoBai))}%` }}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleExpand(bai.id)}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                          >
                            <span>{isExpanded ? "Thu gọn" : "Xem dạng"}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Chi tiết từng Dạng bài (Khi mở rộng) */}
                      {isExpanded && (
                        <div className="px-4 pb-5 pt-1 sm:px-6 bg-slate-50/60 border-t border-slate-100">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs bg-white rounded-xl border border-slate-200 shadow-2xs">
                              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                  <th className="py-2.5 px-3">Dạng bài học</th>
                                  <th className="py-2.5 px-3 text-center">Độ thành thạo</th>
                                  <th className="py-2.5 px-3 text-center">Năng lực IRT (θ)</th>
                                  <th className="py-2.5 px-3 text-center" title="Số phiên học sinh đã tham gia luyện tập dạng bài này">
                                    Số lần luyện
                                  </th>
                                  <th className="py-2.5 px-3 text-center" title="Số câu trả lời đúng trên tổng số câu đã làm trong dạng bài">
                                    Số câu Đúng / Đã làm
                                  </th>
                                  <th className="py-2.5 px-3 text-right">Lần luyện cuối</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {bai.danhSachDangBai.map((dang) => {
                                  const isDangExpanded = !!expandedDangIds[dang.id];

                                  return (
                                    <Fragment key={dang.id}>
                                      <tr
                                        onClick={() => toggleExpandDang(dang.id)}
                                        className={`transition-colors cursor-pointer group ${
                                          isDangExpanded ? "bg-indigo-50/70" : "hover:bg-slate-50/80"
                                        }`}
                                        title="Nhấn vào dạng bài này để xem biểu đồ và chi tiết từng lần làm"
                                      >
                                        <td className="py-3 px-3">
                                          <div className="flex items-start justify-between gap-2">
                                            <div>
                                              <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                                {dang.ten}
                                              </div>
                                              <div className="text-[11px] text-slate-400 mt-0.5">{dang.moTa}</div>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleExpandDang(dang.id);
                                              }}
                                              className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors ${
                                                isDangExpanded
                                                  ? "bg-indigo-600 text-white shadow-2xs"
                                                  : "bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700"
                                              }`}
                                            >
                                              <TrendingUp className="w-3 h-3" />
                                              <span>{isDangExpanded ? "Ẩn biểu đồ" : "Xem biểu đồ"}</span>
                                              {isDangExpanded ? (
                                                <ChevronUp className="w-3 h-3" />
                                              ) : (
                                                <ChevronDown className="w-3 h-3" />
                                              )}
                                            </button>
                                          </div>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                          <span
                                            className={`inline-block px-2.5 py-1 rounded-full font-black text-xs ${
                                              dang.doThanhThao >= 85
                                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                                : dang.doThanhThao >= 60
                                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                                : dang.doThanhThao > 0
                                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                                : "bg-slate-100 text-slate-400"
                                            }`}
                                          >
                                            {dang.doThanhThao}%
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                            {dang.nangLucIRT > 0 ? `+${dang.nangLucIRT}` : dang.nangLucIRT}
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                          <span className="font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                                            {dang.soLanLuyenPhien} lần
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                          <span className="font-bold text-slate-700">
                                            {dang.soCauDung} / {dang.soCauDaLam} câu
                                          </span>
                                          {dang.soCauDaLam > 0 && (
                                            <div className="text-[10px] text-slate-400">({dang.tiLeDung}%)</div>
                                          )}
                                        </td>
                                        <td className="py-3 px-3 text-right text-slate-500">
                                          {dang.lanLuyenCuoi ? (
                                            new Date(dang.lanLuyenCuoi).toLocaleDateString("vi-VN")
                                          ) : (
                                            <span className="text-slate-400 italic">Chưa làm</span>
                                          )}
                                        </td>
                                      </tr>

                                      {/* Khối hiển thị Biểu đồ & Dữ liệu chi tiết từng lần làm khi nhấn vào dạng đó */}
                                      {isDangExpanded && (
                                        <tr className="bg-indigo-50/20 border-b border-indigo-100">
                                          <td colSpan={6} className="p-3 sm:p-5">
                                            <div className="bg-white rounded-2xl border border-indigo-100 p-4 sm:p-5 shadow-xs space-y-4">
                                              {/* Header chi tiết dạng bài */}
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                                <div className="flex items-center gap-2">
                                                  <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                                    <TrendingUp className="w-4 h-4" />
                                                  </span>
                                                  <div>
                                                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                                                      Tiến trình độ thành thạo: {dang.ten}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-500">
                                                      Chi tiết độ thành thạo và hiệu suất đạt được sau mỗi lần làm bài
                                                    </p>
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap text-xs">
                                                  <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-semibold">
                                                    Tổng số lần luyện: <strong>{dang.soLanLuyenPhien} lần</strong>
                                                  </span>
                                                  <span className="bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg text-indigo-700 font-bold">
                                                    Thành thạo hiện tại: <strong>{dang.doThanhThao}%</strong>
                                                  </span>
                                                </div>
                                              </div>

                                              {/* Khối Biểu đồ & Bảng dữ liệu cụ thể */}
                                              {dang.cacLanLuyen && dang.cacLanLuyen.length > 0 ? (
                                                <div className="space-y-4">
                                                  {/* Biểu đồ LineChart tiến trình */}
                                                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                                                    <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-bold">
                                                      <span>Biểu đồ độ thành thạo (%) qua các lần luyện</span>
                                                      <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px]">
                                                        <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" /> Ngưỡng thành thạo: 85%
                                                      </span>
                                                    </div>
                                                    <div className="h-56 w-full">
                                                      <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart
                                                          data={
                                                            dang.cacLanLuyen.length === 1
                                                              ? [
                                                                  { lanThu: "Khởi điểm", doThanhThao: 0, soCauDaLam: 0, soCauDung: 0, thoiGianPhut: 0, thoiDiem: "Trước khi làm" },
                                                                  {
                                                                    lanThu: `Lần 1`,
                                                                    doThanhThao: dang.cacLanLuyen[0].doThanhThao,
                                                                    soCauDaLam: dang.cacLanLuyen[0].soCauDaLam,
                                                                    soCauDung: dang.cacLanLuyen[0].soCauDung,
                                                                    thoiGianPhut: Number(((dang.cacLanLuyen[0].thoiGianGiay || 30) / 60).toFixed(1)),
                                                                    thoiDiem: new Date(dang.cacLanLuyen[0].thoiDiemKetThuc).toLocaleString("vi-VN", {
                                                                      day: "2-digit",
                                                                      month: "2-digit",
                                                                      hour: "2-digit",
                                                                      minute: "2-digit",
                                                                    }),
                                                                  },
                                                                ]
                                                              : dang.cacLanLuyen.map((c) => ({
                                                                  lanThu: `Lần ${c.lanThu}`,
                                                                  doThanhThao: c.doThanhThao,
                                                                  soCauDaLam: c.soCauDaLam,
                                                                  soCauDung: c.soCauDung,
                                                                  thoiGianPhut: Number(((c.thoiGianGiay || 30) / 60).toFixed(1)),
                                                                  thoiDiem: new Date(c.thoiDiemKetThuc).toLocaleString("vi-VN", {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                  }),
                                                                }))
                                                          }
                                                          margin={{ top: 15, right: 25, left: -15, bottom: 5 }}
                                                        >
                                                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                          <XAxis dataKey="lanThu" stroke="#64748b" fontSize={11} tickLine={false} />
                                                          <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                                                          <ReferenceLine
                                                            y={85}
                                                            stroke="#10b981"
                                                            strokeDasharray="4 4"
                                                            label={{ value: "85%", fill: "#10b981", fontSize: 10, position: "insideTopRight" }}
                                                          />
                                                          <Tooltip
                                                            formatter={(val: any) => [`${val}%`, "Độ thành thạo"]}
                                                            labelFormatter={(label, payload) => {
                                                              const item = payload?.[0]?.payload;
                                                              if (!item) return label;
                                                              return `${label} (${item.thoiDiem}) • Làm ${item.soCauDaLam} câu (Đúng ${item.soCauDung})`;
                                                            }}
                                                          />
                                                          <Line
                                                            type="monotone"
                                                            dataKey="doThanhThao"
                                                            stroke="#6366f1"
                                                            strokeWidth={3}
                                                            dot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                                                            activeDot={{ r: 7 }}
                                                            label={{
                                                              position: "top",
                                                              fill: "#4f46e5",
                                                              fontSize: 10,
                                                              fontWeight: 700,
                                                              formatter: (val: any) => `${val}%`,
                                                            }}
                                                          />
                                                        </LineChart>
                                                      </ResponsiveContainer>
                                                    </div>
                                                  </div>

                                                  {/* Bảng dữ liệu cụ thể từng lần làm */}
                                                  <div>
                                                    <h5 className="font-bold text-slate-800 text-xs mb-2">
                                                      Bảng thông số chi tiết từng lần làm:
                                                    </h5>
                                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                                      <table className="w-full text-left text-xs bg-white">
                                                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                                          <tr>
                                                            <th className="py-2 px-3">Lần thứ</th>
                                                            <th className="py-2 px-3">Thời điểm làm</th>
                                                            <th className="py-2 px-3 text-center">Số câu Đúng / Làm</th>
                                                            <th className="py-2 px-3 text-center">Tỉ lệ đúng</th>
                                                            <th className="py-2 px-3 text-center">Thời gian làm</th>
                                                            <th className="py-2 px-3 text-center">Độ thành thạo sau lần làm</th>
                                                          </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                          {dang.cacLanLuyen.map((lan, idx) => {
                                                            const prevLan = idx > 0 ? dang.cacLanLuyen[idx - 1] : null;
                                                            const delta = prevLan ? Number((lan.doThanhThao - prevLan.doThanhThao).toFixed(1)) : null;
                                                            const phut = Number(((lan.thoiGianGiay || 30) / 60).toFixed(1));
                                                            const tiLe = lan.tiLeDung ?? (lan.soCauDaLam > 0 ? Math.round((lan.soCauDung / lan.soCauDaLam) * 100) : 0);

                                                            return (
                                                              <tr key={lan.id || idx} className="hover:bg-slate-50/50">
                                                                <td className="py-2.5 px-3 font-bold text-slate-900">
                                                                  Lần {lan.lanThu}
                                                                </td>
                                                                <td className="py-2.5 px-3 text-slate-600">
                                                                  {new Date(lan.thoiDiemKetThuc).toLocaleString("vi-VN", {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    year: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                  })}
                                                                </td>
                                                                <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                                                                  {lan.soCauDung} / {lan.soCauDaLam} câu
                                                                </td>
                                                                <td className="py-2.5 px-3 text-center">
                                                                  <span
                                                                    className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                                                      tiLe >= 80
                                                                        ? "bg-emerald-100 text-emerald-800"
                                                                        : tiLe >= 50
                                                                        ? "bg-blue-100 text-blue-800"
                                                                        : "bg-amber-100 text-amber-800"
                                                                    }`}
                                                                  >
                                                                    {tiLe}%
                                                                  </span>
                                                                </td>
                                                                <td className="py-2.5 px-3 text-center text-slate-500">
                                                                  {phut} phút
                                                                </td>
                                                                <td className="py-2.5 px-3 text-center">
                                                                  <div className="inline-flex items-center gap-1">
                                                                    <span
                                                                      className={`px-2.5 py-1 rounded-full font-black text-xs ${
                                                                        lan.doThanhThao >= 85
                                                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                                                          : lan.doThanhThao >= 60
                                                                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                                                                          : "bg-amber-100 text-amber-800 border border-amber-200"
                                                                      }`}
                                                                    >
                                                                      {lan.doThanhThao}%
                                                                    </span>
                                                                    {delta !== null && delta !== 0 && (
                                                                      <span
                                                                        className={`text-[10px] font-bold ${
                                                                          delta > 0 ? "text-emerald-600" : "text-rose-600"
                                                                        }`}
                                                                      >
                                                                        ({delta > 0 ? `+${delta}%` : `${delta}%`})
                                                                      </span>
                                                                    )}
                                                                  </div>
                                                                </td>
                                                             </tr>
                                                           );
                                                         })}
                                                       </tbody>
                                                     </table>
                                                   </div>
                                                 </div>
                                               </div>
                                             ) : (
                                               <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                                                 Học sinh chưa có lần luyện tập nào được ghi nhận ở dạng bài này.
                                               </div>
                                             )}
                                           </div>
                                         </td>
                                       </tr>
                                     )}
                                   </Fragment>
                                 );
                               })}
                             </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PHÂN KHU 2: LỊCH SỬ TỪNG LẦN LUYỆN TẬP & BIỂU ĐỒ TIẾN ĐỘ THÀNH THẠO */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <span>Lịch sử các lần luyện tập & Biểu đồ tiến độ</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Chi tiết độ thành thạo đạt được tại mỗi lần nộp bài kết thúc phiên luyện tập
            </p>
          </div>

          {/* Bộ lọc theo dạng bài */}
          {uniqueDangs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Xem theo dạng:</span>
              <select
                value={selectedDangFilter}
                onChange={(e) => setSelectedDangFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-xs"
              >
                <option value="all">Tất cả các dạng đã luyện</option>
                {uniqueDangs.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Biểu đồ Đường: Tiến trình tăng trưởng độ thành thạo qua các lần làm */}
        {filteredBieuDo.length > 1 ? (
          <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 px-2 font-bold">
              <span>Độ thành thạo qua các lần luyện tập (%)</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" /> Đích thành thạo: 85%
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredBieuDo} margin={{ top: 10, right: 20, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="lanThu" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                  <ReferenceLine
                    y={85}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{ value: "85%", fill: "#10b981", fontSize: 10, position: "insideTopRight" }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl text-xs space-y-1 shadow-lg border border-slate-800">
                            <p className="font-bold text-amber-300">{d.lanThu}: {d.doThanhThao}% Thành thạo</p>
                            <p className="text-slate-300">{d.dangBai}</p>
                            <p className="text-[11px] text-slate-400">
                              Làm đúng: {d.soCauDung}/{d.soCauDaLam} câu ({d.thoiGianPhut} phút)
                            </p>
                            <p className="text-[10px] text-slate-500">{d.thoiDiem}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="doThanhThao"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 7, fill: "#3b82f6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {/* Bảng chi tiết Lịch sử các lần luyện */}
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Học sinh chưa có lần luyện tập nào được lưu trữ ở lớp học này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center">Lần thứ</th>
                  <th className="py-3 px-3">Chủ đề & Dạng bài</th>
                  <th className="py-3 px-3 text-center">Số câu nộp</th>
                  <th className="py-3 px-3 text-center">Thời gian làm</th>
                  <th className="py-3 px-3 text-center">Độ thành thạo đạt được</th>
                  <th className="py-3 px-3 text-right">Thời điểm hoàn thành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((phien) => {
                  return (
                    <tr key={phien.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                          #{phien.lanThu}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{phien.chuDeTen}</div>
                        <div className="text-[11px] font-bold text-indigo-600">{phien.dangBai}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-slate-800">
                          {phien.soCauDung} / {phien.soCauDaLam} câu đúng
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">
                        {Math.floor(phien.thoiGianGiay / 60)}p {phien.thoiGianGiay % 60}s
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full font-black text-xs ${
                            phien.doThanhThao >= 85
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : phien.doThanhThao >= 60
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {phien.doThanhThao}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">
                        <div>{new Date(phien.thoiDiemKetThuc).toLocaleTimeString("vi-VN")}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(phien.thoiDiemKetThuc).toLocaleDateString("vi-VN")}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
