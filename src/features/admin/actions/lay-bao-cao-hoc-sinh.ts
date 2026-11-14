"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { DANH_MUC_DANG_BAI } from "@/lib/danh-muc-dang-bai";
import type { BaoCaoChiTietHocSinhData, TrangThaiThanhThao } from "../types";

/**
 * 1. Lấy danh sách học sinh theo lớp học kèm các chỉ số tổng hợp
 */
export async function layDanhSachHocSinhAction({
  lopId,
  tuKhoa,
}: {
  lopId?: string;
  tuKhoa?: string;
}) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "QUAN_TRI" && session.user.role !== "GIAO_VIEN")
  ) {
    throw new Error("Không có quyền truy cập");
  }

  // Điều kiện lọc học sinh
  const whereCondition: any = {
    vaiTro: "HOC_SINH",
  };

  if (lopId && lopId !== "all") {
    whereCondition.OR = [
      { lopDangHocId: lopId },
      { lichSuLuyenTaps: { some: { lopId } } },
      { lanLamBais: { some: { lopId } } },
    ];
  }

  if (tuKhoa && tuKhoa.trim()) {
    const kw = tuKhoa.trim();
    whereCondition.AND = [
      {
        OR: [
          { tenHienThi: { contains: kw, mode: "insensitive" } },
          { email: { contains: kw, mode: "insensitive" } },
        ],
      },
    ];
  }

  const hocSinhs = await db.nguoiDung.findMany({
    where: whereCondition,
    select: {
      id: true,
      tenHienThi: true,
      email: true,
      anhDaiDien: true,
      lopDangHocId: true,
      taoLuc: true,
      lichSuLuyenTaps: {
        select: {
          id: true,
          doThanhThao: true,
          soCauDaLam: true,
          soCauDung: true,
          thoiDiemKetThuc: true,
          lopId: true,
        },
        orderBy: { thoiDiemKetThuc: "desc" },
      },
      lanLamBais: {
        select: {
          id: true,
          ketQua: true,
          thoiDiem: true,
          lopId: true,
        },
        orderBy: { thoiDiem: "desc" },
      },
      nangLucDangBais: {
        select: {
          id: true,
          dangBai: true,
          xacSuatThanhThao: true,
          nangLucIRT: true,
          soLanLuyen: true,
          soLanDung: true,
          lanLuyenCuoi: true,
          lopId: true,
        },
      },
    },
    orderBy: { taoLuc: "desc" },
  });

  return hocSinhs.map((hs) => {
    // Nếu lọc theo lopId cụ thể thì ưu tiên số liệu của lớp đó
    const filterLop = lopId && lopId !== "all" ? lopId : null;

    const filteredLichSu = filterLop
      ? hs.lichSuLuyenTaps.filter((l) => l.lopId === filterLop || !l.lopId)
      : hs.lichSuLuyenTaps;

    const filteredLanLam = filterLop
      ? hs.lanLamBais.filter((l) => l.lopId === filterLop || !l.lopId)
      : hs.lanLamBais;

    const filteredNangLuc = filterLop
      ? hs.nangLucDangBais.filter((n) => n.lopId === filterLop || !n.lopId)
      : hs.nangLucDangBais;

    const tongSoLanLuyen = filteredLichSu.length;
    const tongCauDaLam = filteredLanLam.length;
    const soCauDung = filteredLanLam.filter((l) => l.ketQua === "DUNG").length;
    const tiLeDung =
      tongCauDaLam > 0 ? Math.round((soCauDung / tongCauDaLam) * 100) : 0;

    const soDangThanhThao = filteredNangLuc.filter(
      (n) => n.xacSuatThanhThao >= 0.85
    ).length;

    // Độ thành thạo trung bình các dạng bài đã rèn luyện
    const practicedNangLuc = filteredNangLuc.filter((n) => n.soLanLuyen > 0);
    const doThanhThaoTB =
      practicedNangLuc.length > 0
        ? Math.round(
            (practicedNangLuc.reduce((acc, cur) => acc + cur.xacSuatThanhThao, 0) /
              practicedNangLuc.length) *
              100
          )
        : 0;

    const lanLuyenCuoi =
      filteredLichSu[0]?.thoiDiemKetThuc ||
      filteredLanLam[0]?.thoiDiem ||
      null;

    return {
      id: hs.id,
      tenHienThi: hs.tenHienThi,
      email: hs.email,
      anhDaiDien: hs.anhDaiDien,
      lopDangHocId: hs.lopDangHocId || "lop-10",
      taoLuc: hs.taoLuc,
      tongSoLanLuyen,
      tongCauDaLam,
      soCauDung,
      tiLeDung,
      soDangThanhThao,
      doThanhThaoTB,
      lanLuyenCuoi,
    };
  });
}

/**
 * 2. Lấy Báo cáo chi tiết của một học sinh cụ thể
 *    (Bao gồm từng Bài học, từng Dạng bài học, số lần làm và độ thành thạo mỗi lần)
 */
export async function layBaoCaoChiTietHocSinhAction(
  hocSinhId: string,
  lopId?: string
): Promise<BaoCaoChiTietHocSinhData> {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "QUAN_TRI" && session.user.role !== "GIAO_VIEN")
  ) {
    throw new Error("Không có quyền truy cập");
  }

  const [student, chapters] = await Promise.all([
    db.nguoiDung.findUnique({
      where: { id: hocSinhId },
      include: {
        lichSuLuyenTaps: {
          include: { chuDe: true },
          orderBy: { thoiDiemKetThuc: "desc" },
        },
        nangLucDangBais: true,
        lanLamBais: {
          include: { baiTap: { select: { chuDeId: true, dangBai: true } } },
        },
      },
    }),
    db.chuong.findMany({
      orderBy: { thuTu: "asc" },
      include: {
        chuDes: {
          orderBy: { thuTu: "asc" },
        },
      },
    }),
  ]);

  if (!student) {
    throw new Error("Không tìm thấy học sinh");
  }

  const selectedLopId = lopId || student.lopDangHocId || "lop-10";

  // Lọc các chương theo lớp được chọn (lop-10 hoặc lop-11)
  const filteredChapters = chapters.filter((c) => c.lopId === selectedLopId);

  // Tạo map tra cứu nhanh cho NangLucDangBai
  const nangLucMap = new Map<string, any>();
  student.nangLucDangBais.forEach((nl) => {
    nangLucMap.set(`${nl.chuDeId}__${nl.dangBai}`, nl);
  });

  // Tạo map tra cứu lịch sử luyện tập theo (chuDeId, dangBai)
  const lichSuByDangMap = new Map<string, any[]>();
  student.lichSuLuyenTaps.forEach((ls) => {
    const key = `${ls.chuDeId}__${ls.dangBai}`;
    const list = lichSuByDangMap.get(key) || [];
    list.push(ls);
    lichSuByDangMap.set(key, list);
  });

  let totalDangsInGrade = 0;
  let totalMasterySum = 0;
  let totalDangsMastered = 0;

  // Xây dựng cây phân cấp: Chương -> Bài học (Chủ đề) -> Dạng bài (KC)
  const danhSachChuong = filteredChapters.map((chuong) => {
    const danhSachBai = chuong.chuDes.map((chuDe) => {
      const configDangs = DANH_MUC_DANG_BAI[chuDe.id]?.dangs || [];

      // Chi tiết từng Dạng bài học
      const danhSachDangBai = configDangs.map((dang) => {
        totalDangsInGrade++;
        const key = `${chuDe.id}__${dang.ten}`;
        const nangLuc = nangLucMap.get(key);
        const historyForDang = lichSuByDangMap.get(key) || [];

        // Lấy % thành thạo hiện tại
        let mastery = 0;
        if (nangLuc) {
          mastery = Math.round(nangLuc.xacSuatThanhThao * 100);
        } else if (historyForDang.length > 0) {
          mastery = Math.round(historyForDang[0].doThanhThao * 100);
        }

        totalMasterySum += mastery;
        if (mastery >= 85) totalDangsMastered++;

        // Tổng số lần đã luyện dạng toán này (từ bảng LichSuLuyenTap)
        const soLanLuyenPhien = historyForDang.length;
        const soCauDaLam = nangLuc?.soLanLuyen || historyForDang.reduce((a, b) => a + b.soCauDaLam, 0);
        const soCauDung = nangLuc?.soLanDung || historyForDang.reduce((a, b) => a + b.soCauDung, 0);

        return {
          id: dang.id,
          ten: dang.ten,
          moTa: dang.moTa,
          doThanhThao: mastery,
          nangLucIRT: nangLuc ? Number(nangLuc.nangLucIRT.toFixed(2)) : 0.0,
          doBenTriNho: nangLuc ? Number(nangLuc.doBenTriNho.toFixed(1)) : 1.0,
          soLanLuyenPhien,
          soCauDaLam,
          soCauDung,
          tiLeDung: soCauDaLam > 0 ? Math.round((soCauDung / soCauDaLam) * 100) : 0,
          ngayOnKeTiep: nangLuc?.ngayOnKeTiep || null,
          lanLuyenCuoi: nangLuc?.lanLuyenCuoi || historyForDang[0]?.thoiDiemKetThuc || null,
          trangThai: (mastery >= 85
            ? "THANH_THAO"
            : mastery >= 60
            ? "KHA"
            : mastery > 0
            ? "CAN_LUYEN"
            : "CHUA_HOC") as TrangThaiThanhThao,
          // Lịch sử các lần luyện riêng của dạng toán này
          cacLanLuyen: historyForDang.map((h, idx) => ({
            lanThu: historyForDang.length - idx,
            id: h.id,
            doThanhThao: Math.round(h.doThanhThao * 100),
            soCauDaLam: h.soCauDaLam,
            soCauDung: h.soCauDung,
            thoiGianGiay: h.thoiGianGiay,
            thoiDiemKetThuc: h.thoiDiemKetThuc,
          })),
        };
      });

      // Độ thành thạo trung bình của Bài học
      const avgMasteryBai =
        danhSachDangBai.length > 0
          ? Math.round(
              danhSachDangBai.reduce((acc, cur) => acc + cur.doThanhThao, 0) /
                danhSachDangBai.length
            )
          : 0;

      const trangThaiBai: TrangThaiThanhThao =
        avgMasteryBai >= 85
          ? "THANH_THAO"
          : avgMasteryBai >= 60
          ? "KHA"
          : avgMasteryBai > 0
          ? "CAN_LUYEN"
          : "CHUA_HOC";

      return {
        id: chuDe.id,
        ten: chuDe.ten,
        thuTu: chuDe.thuTu,
        soDang: danhSachDangBai.length,
        doThanhThaoBai: avgMasteryBai,
        trangThaiBai,
        danhSachDangBai,
      };
    });

    return {
      id: chuong.id,
      ten: chuong.ten,
      thuTu: chuong.thuTu,
      lopId: chuong.lopId,
      danhSachBai,
    };
  });

  // Toàn bộ các lần luyện tập của học sinh ở lớp này (cho biểu đồ và bảng lịch sử)
  const allFilteredHistory = student.lichSuLuyenTaps.filter(
    (l) => l.lopId === selectedLopId || !l.lopId
  );

  // Dữ liệu tăng trưởng độ thành thạo theo chuỗi thời gian (Mastery Growth Timeline)
  // Xếp theo thứ tự từ quá khứ đến hiện tại
  const bieuDoTienTrinh = [...allFilteredHistory]
    .reverse()
    .map((item, idx) => ({
      lanThu: `Lần ${idx + 1}`,
      dangBai: item.dangBai,
      chuDeTen: item.chuDe.ten,
      doThanhThao: Math.round(item.doThanhThao * 100),
      soCauDung: item.soCauDung,
      soCauDaLam: item.soCauDaLam,
      thoiGianPhut: Number((item.thoiGianGiay / 60).toFixed(1)),
      thoiDiem: new Date(item.thoiDiemKetThuc).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

  const tongSoCauLam = student.lanLamBais.length;
  const soCauDung = student.lanLamBais.filter((l) => l.ketQua === "DUNG").length;
  const tiLeDung =
    tongSoCauLam > 0 ? Math.round((soCauDung / tongSoCauLam) * 100) : 0;

  const doThanhThaoTB =
    totalDangsInGrade > 0
      ? Math.round(totalMasterySum / totalDangsInGrade)
      : 0;

  return {
    hocSinh: {
      id: student.id,
      tenHienThi: student.tenHienThi,
      email: student.email,
      anhDaiDien: student.anhDaiDien,
      lopDangHocId: student.lopDangHocId || "lop-10",
      taoLuc: student.taoLuc,
    },
    selectedLopId,
    tongQuan: {
      tongSoLanLuyen: allFilteredHistory.length,
      tongSoCauLam,
      soCauDung,
      tiLeDung,
      soDangThanhThao: totalDangsMastered,
      tongSoDang: totalDangsInGrade,
      doThanhThaoTB,
    },
    danhSachChuong,
    lichSuCacLanLuyen: allFilteredHistory.map((item, idx) => ({
      lanThu: allFilteredHistory.length - idx,
      id: item.id,
      chuDeId: item.chuDeId,
      chuDeTen: item.chuDe.ten,
      dangBai: item.dangBai,
      doThanhThao: Math.round(item.doThanhThao * 100),
      soCauDaLam: item.soCauDaLam,
      soCauDung: item.soCauDung,
      thoiGianGiay: item.thoiGianGiay,
      thoiDiemKetThuc: item.thoiDiemKetThuc,
    })),
    bieuDoTienTrinh,
  };
}
