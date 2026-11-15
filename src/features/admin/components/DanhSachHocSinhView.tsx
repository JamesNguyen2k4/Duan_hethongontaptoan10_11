"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Brain,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Filter,
} from "lucide-react";

export interface HocSinhItem {
  id: string;
  tenHienThi: string;
  email: string;
  anhDaiDien: string | null;
  taoLuc: Date | string;
  tongSoLanLuyen: number;
  tongCauDaLam: number;
  soCauDung: number;
  tiLeDung: number;
  soDangThanhThao: number;
  doThanhThaoTB: number;
  lanLuyenCuoi: Date | string | null;
  daHocLopNay: boolean;
  lopMucTieu: string;
}

interface Props {
  danhSachHocSinh: HocSinhItem[];
  currentLopId: string;
}

export function DanhSachHocSinhView({
  danhSachHocSinh,
  currentLopId = "lop-10",
}: Props) {
  const router = useRouter();
  const [tuKhoa, setTuKhoa] = useState<string>("");
  const [boLocHoc, setBoLocHoc] = useState<"daHoc" | "tatCa">("daHoc");
  const [sapXep, setSapXep] = useState<string>("lanLuyen");

  const handleSwitchLop = (lopId: string) => {
    if (lopId === currentLopId) return;
    router.push(`/admin/hoc-sinh?lopId=${lopId}`);
  };

  // Lọc và sắp xếp học sinh theo khối lớp hiện tại
  const filteredList = useMemo(() => {
    return danhSachHocSinh
      .filter((hs) => {
        // Lọc theo trạng thái đã học lớp này hay chưa
        if (boLocHoc === "daHoc" && !hs.daHocLopNay) {
          return false;
        }
        // Lọc theo Từ khóa
        if (tuKhoa.trim()) {
          const q = tuKhoa.toLowerCase();
          const matchName = hs.tenHienThi.toLowerCase().includes(q);
          const matchEmail = hs.email.toLowerCase().includes(q);
          if (!matchName && !matchEmail) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sapXep === "lanLuyen") return b.tongSoLanLuyen - a.tongSoLanLuyen;
        if (sapXep === "thanhThao") return b.doThanhThaoTB - a.doThanhThaoTB;
        if (sapXep === "tiLeDung") return b.tiLeDung - a.tiLeDung;
        if (sapXep === "ten") return a.tenHienThi.localeCompare(b.tenHienThi, "vi");
        return 0;
      });
  }, [danhSachHocSinh, boLocHoc, tuKhoa, sapXep]);

  // Thống kê nhanh của khối lớp đang chọn
  const stats = useMemo(() => {
    const total = filteredList.length;
    const totalSessions = filteredList.reduce((acc, cur) => acc + cur.tongSoLanLuyen, 0);
    const avgMastery =
      total > 0
        ? Number((filteredList.reduce((acc, cur) => acc + cur.doThanhThaoTB, 0) / total).toFixed(1))
        : 0;
    const totalMasteredKC = filteredList.reduce((acc, cur) => acc + cur.soDangThanhThao, 0);

    return { total, totalSessions, avgMastery, totalMasteredKC };
  }, [filteredList]);

  const tenLopHienTai = currentLopId === "lop-11" ? "Toán 11" : "Toán 10";

  return (
    <div className="space-y-6">
      {/* 4 Thẻ KPI Tóm tắt cho Khối Lớp đang chọn */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Học sinh</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.total}</div>
          <p className="text-xs text-slate-400">
            {boLocHoc === "daHoc" ? `Đã ôn luyện ${tenLopHienTai}` : "Tài khoản trong danh sách"}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 bg-indigo-50/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng lần luyện</span>
            <Brain className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-indigo-900">{stats.totalSessions}</div>
          <p className="text-xs text-indigo-500">Phiên luyện tập {tenLopHienTai}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold uppercase tracking-wider">Dạng thành thạo</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-900">{stats.totalMasteredKC}</div>
          <p className="text-xs text-emerald-500">Dạng toán đạt mốc ≥ 85%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Thành thạo TB</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.avgMastery.toFixed(1)}%</div>
          <p className="text-xs text-slate-400">Trung bình trên toàn khóa học</p>
        </div>
      </div>

      {/* Thanh công cụ: Bộ lọc Khối Lớp, Bộ lọc Đối tượng & Tìm kiếm */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Bộ lọc Khối Lớp: CHỈ 2 LỚP TOÁN 10 VÀ TOÁN 11 */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl w-full md:w-auto">
          <button
            type="button"
            onClick={() => handleSwitchLop("lop-10")}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 md:flex-initial flex items-center justify-center gap-2 ${
              currentLopId === "lop-10"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Toán 10</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchLop("lop-11")}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 md:flex-initial flex items-center justify-center gap-2 ${
              currentLopId === "lop-11"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Toán 11</span>
          </button>
        </div>

        {/* Ô Tìm kiếm, Bộ lọc học sinh & Sắp xếp */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Lọc đối tượng học sinh */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={boLocHoc}
              onChange={(e) => setBoLocHoc(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="daHoc">Đã học {tenLopHienTai}</option>
              <option value="tatCa">Tất cả học sinh</option>
            </select>
          </div>

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              placeholder="Tìm theo tên hoặc email..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <select
            value={sapXep}
            onChange={(e) => setSapXep(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="lanLuyen">Nhiều lần luyện nhất</option>
            <option value="thanhThao">Độ thành thạo cao nhất</option>
            <option value="tiLeDung">Tỉ lệ đúng cao nhất</option>
            <option value="ten">Tên học sinh (A - Z)</option>
          </select>
        </div>
      </div>

      {/* Bảng Danh sách Học sinh */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">
              Không tìm thấy học sinh nào đã học kiến thức {tenLopHienTai} phù hợp với điều kiện lọc.
            </p>
            <p className="text-xs text-slate-400">
              {boLocHoc === "daHoc"
                ? `Chọn bộ lọc "Tất cả học sinh" để xem các tài khoản chưa tham gia rèn luyện ${tenLopHienTai}.`
                : "Thử xóa từ khóa tìm kiếm để xem toàn bộ danh sách."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Học sinh</th>
                  <th className="py-3.5 px-3 text-center">Lần luyện tập</th>
                  <th className="py-3.5 px-3 text-center">Tỉ lệ đúng</th>
                  <th className="py-3.5 px-3 text-center">Độ thành thạo TB</th>
                  <th className="py-3.5 px-3 text-center">Dạng thành thạo</th>
                  <th className="py-3.5 px-3 text-right">Lần luyện cuối</th>
                  <th className="py-3.5 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((hs) => {
                  const initials = hs.tenHienThi
                    ? hs.tenHienThi
                        .split(" ")
                        .filter(Boolean)
                        .slice(-2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                    : "HS";

                  return (
                    <tr
                      key={hs.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Học sinh */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                              {hs.tenHienThi}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {hs.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Số lần luyện tập kiến thức lớp này */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <Brain className="w-3.5 h-3.5 text-indigo-600" />
                          {hs.tongSoLanLuyen} lần
                        </span>
                      </td>

                      {/* Tỉ lệ câu đúng */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="font-bold text-slate-800">
                          {Number(hs.tiLeDung).toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {hs.soCauDung}/{hs.tongCauDaLam} câu
                        </div>
                      </td>

                      {/* Độ thành thạo trung bình của lớp này */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                              hs.doThanhThaoTB >= 85
                                ? "bg-emerald-100 text-emerald-800"
                                : hs.doThanhThaoTB >= 60
                                ? "bg-blue-100 text-blue-800"
                                : hs.doThanhThaoTB > 0
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {Number(hs.doThanhThaoTB).toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Số dạng thành thạo */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          {hs.soDangThanhThao} dạng
                        </span>
                      </td>

                      {/* Lần luyện cuối */}
                      <td className="py-3.5 px-3 text-right text-slate-500">
                        {hs.lanLuyenCuoi ? (
                          <>
                            <div className="font-medium text-slate-700">
                              {new Date(hs.lanLuyenCuoi).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(hs.lanLuyenCuoi).toLocaleDateString("vi-VN")}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Chưa luyện</span>
                        )}
                      </td>

                      {/* Nút Xem báo cáo */}
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          href={`/admin/hoc-sinh/${hs.id}?lopId=${currentLopId}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                        >
                          <span>Báo cáo</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
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
