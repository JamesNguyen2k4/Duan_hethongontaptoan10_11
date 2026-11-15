"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { DANH_MUC_DANG_BAI } from "@/lib/danh-muc-dang-bai";
import type { BaoCaoChiTietHocSinhData, TrangThaiThanhThao } from "../types";

/**
 * Hàm tính số phiên làm bài thực tế dựa trên khoảng thời gian giữa các câu trả lời
 * (Nếu 2 câu làm cách nhau hơn 20 phút thì được tính là 2 phiên luyện tập khác nhau)
 */
function tinhSoPhienTuLanLam(lanLams: { thoiDiem: Date }[]): number {
  if (!lanLams || lanLams.length === 0) return 0;
  const sorted = [...lanLams].sort(
    (a, b) => new Date(a.thoiDiem).getTime() - new Date(b.thoiDiem).getTime()
  );
  let soPhien = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diffMs =
      new Date(sorted[i].thoiDiem).getTime() -
      new Date(sorted[i - 1].thoiDiem).getTime();
    if (diffMs > 20 * 60 * 1000) {
      soPhien++;
    }
  }
  return soPhien;
}

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
    // Nếu lọc theo lopId cụ thể thì ưu tiên số liệu của lớp đó, nếu xem tất cả thì hiển thị theo lớp học sinh đang học
    const lopMucTieu = (lopId && lopId !== "all") ? lopId : (hs.lopDangHocId || "lop-10");

    const filteredLichSu = hs.lichSuLuyenTaps.filter(
      (l) => l.lopId === lopMucTieu || (!l.lopId && lopMucTieu === "lop-10")
    );
    const filteredLanLam = hs.lanLamBais.filter(
      (l) => l.lopId === lopMucTieu || (!l.lopId && lopMucTieu === "lop-10")
    );
    const filteredNangLuc = hs.nangLucDangBais.filter(
      (n) => n.lopId === lopMucTieu || (!n.lopId && lopMucTieu === "lop-10")
    );

    const phienTuLanLam = tinhSoPhienTuLanLam(filteredLanLam);
    const tongSoLanLuyen = Math.max(
      filteredLichSu.length,
      phienTuLanLam,
      filteredLanLam.length > 0 ? 1 : 0
    );
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

    // Kiểm tra số lần luyện ở lớp học khác (nếu học sinh luyện cả 2 khối lớp)
    const khacLopId = lopMucTieu === "lop-10" ? "lop-11" : "lop-10";
    const khacLichSu = hs.lichSuLuyenTaps.filter((l) => l.lopId === khacLopId);
    const khacLanLam = hs.lanLamBais.filter((l) => l.lopId === khacLopId);
    const soLanLuyenLopKhac = Math.max(
      khacLichSu.length,
      tinhSoPhienTuLanLam(khacLanLam),
      khacLanLam.length > 0 ? 1 : 0
    );

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
      soLanLuyenLopKhac,
      tenLopKhac: khacLopId === "lop-10" ? "Toán 10" : "Toán 11",
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

        // Lấy % thành thạo hiện tại (dạng số thập phân 1 chữ số)
        let mastery = 0;
        if (nangLuc) {
          mastery = Number((nangLuc.xacSuatThanhThao * 100).toFixed(1));
        } else if (historyForDang.length > 0) {
          mastery = Number((historyForDang[0].doThanhThao * 100).toFixed(1));
        }

        totalMasterySum += mastery;
        if (mastery >= 85) totalDangsMastered++;

        // Lấy danh sách câu hỏi đã làm của riêng dạng bài này từ student.lanLamBais
        const lanLamForDang = student.lanLamBais.filter(
          (l) => l.baiTap.chuDeId === chuDe.id && l.baiTap.dangBai === dang.ten
        );
        const phienTuLanLam = tinhSoPhienTuLanLam(lanLamForDang);

        const soCauDaLam =
          nangLuc?.soLanLuyen ||
          lanLamForDang.length ||
          historyForDang.reduce((a, b) => a + b.soCauDaLam, 0);

        const soCauDung =
          nangLuc?.soLanDung ??
          lanLamForDang.filter((l) => l.ketQua === "DUNG").length;

        // Số lần luyện phiên: Nếu có bản ghi trong LichSuLuyenTap thì lấy,
        // nếu chưa có bản ghi (do học sinh chưa bấm nút dừng) nhưng đã làm bài thì tính theo phiên thực tế
        const soLanLuyenPhien = Math.max(
          historyForDang.length,
          phienTuLanLam,
          soCauDaLam > 0 ? 1 : 0
        );

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
          // Lịch sử các lần luyện riêng của dạng toán này (sắp xếp tăng dần theo thời gian: Lần 1 -> Lần 2 -> ...)
          cacLanLuyen: (() => {
            if (historyForDang.length > 0) {
              const sorted = [...historyForDang].sort(
                (a, b) =>
                  new Date(a.thoiDiemKetThuc).getTime() -
                  new Date(b.thoiDiemKetThuc).getTime()
              );
              return sorted.map((h, idx) => ({
                lanThu: idx + 1,
                id: h.id,
                doThanhThao: Number((h.doThanhThao * 100).toFixed(1)),
                soCauDaLam: h.soCauDaLam,
                soCauDung: h.soCauDung,
                tiLeDung:
                  h.soCauDaLam > 0
                    ? Math.round((h.soCauDung / h.soCauDaLam) * 100)
                    : 0,
                thoiGianGiay: h.thoiGianGiay,
                thoiDiemKetThuc: h.thoiDiemKetThuc,
              }));
            }

            // Nếu chưa có trong bảng LichSuLuyenTap nhưng đã có các câu làm trong LanLamBai
            if (lanLamForDang.length > 0) {
              const sortedLanLam = [...lanLamForDang].sort(
                (a, b) =>
                  new Date(a.thoiDiem).getTime() -
                  new Date(b.thoiDiem).getTime()
              );
              // Chia thành các phiên nếu cách nhau > 20 phút
              const sessions: typeof lanLamForDang[] = [];
              let curSession = [sortedLanLam[0]];
              for (let i = 1; i < sortedLanLam.length; i++) {
                const diffMs =
                  new Date(sortedLanLam[i].thoiDiem).getTime() -
                  new Date(sortedLanLam[i - 1].thoiDiem).getTime();
                if (diffMs > 20 * 60 * 1000) {
                  sessions.push(curSession);
                  curSession = [sortedLanLam[i]];
                } else {
                  curSession.push(sortedLanLam[i]);
                }
              }
              if (curSession.length > 0) sessions.push(curSession);

              return sessions.map((s, idx) => {
                const soLam = s.length;
                const soDung = s.filter((x) => x.ketQua === "DUNG").length;
                const endTime = s[s.length - 1].thoiDiem;
                const isLast = idx === sessions.length - 1;
                // Nếu là phiên cuối thì lấy mastery hiện tại, nếu phiên trước thì ước lượng theo tỉ lệ đúng
                const mVal = isLast
                  ? mastery
                  : Number(Math.min(mastery, Math.max(5.0, (soDung / soLam) * 20)).toFixed(1));

                return {
                  lanThu: idx + 1,
                  id: `fallback-${idx + 1}`,
                  doThanhThao: mVal,
                  soCauDaLam: soLam,
                  soCauDung: soDung,
                  tiLeDung: soLam > 0 ? Math.round((soDung / soLam) * 100) : 0,
                  thoiGianGiay: s.reduce((acc, cur) => acc + (cur.thoiGianGiay || 30), 0),
                  thoiDiemKetThuc: endTime,
                };
              });
            }

            return [];
          })(),
        };
      });

      // Độ thành thạo trung bình của Bài học
      const avgMasteryBai =
        danhSachDangBai.length > 0
          ? Number(
              (
                danhSachDangBai.reduce((acc, cur) => acc + cur.doThanhThao, 0) /
                danhSachDangBai.length
              ).toFixed(1)
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
      doThanhThao: Number((item.doThanhThao * 100).toFixed(1)),
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

  const ls10 = student.lichSuLuyenTaps.filter((l) => l.lopId === "lop-10");
  const ll10 = student.lanLamBais.filter((l) => l.lopId === "lop-10");
  const soLanLop10 = Math.max(
    ls10.length,
    tinhSoPhienTuLanLam(ll10),
    ll10.length > 0 ? 1 : 0
  );

  const ls11 = student.lichSuLuyenTaps.filter((l) => l.lopId === "lop-11");
  const ll11 = student.lanLamBais.filter((l) => l.lopId === "lop-11");
  const soLanLop11 = Math.max(
    ls11.length,
    tinhSoPhienTuLanLam(ll11),
    ll11.length > 0 ? 1 : 0
  );

  const thongKeTheoLop = {
    lop10: {
      soLanLuyen: soLanLop10,
      soCauDaLam: ll10.length,
      soCauDung: ll10.filter((x) => x.ketQua === "DUNG").length,
    },
    lop11: {
      soLanLuyen: soLanLop11,
      soCauDaLam: ll11.length,
      soCauDung: ll11.filter((x) => x.ketQua === "DUNG").length,
    },
    tongSoLanTatCa: soLanLop10 + soLanLop11,
    tongSoCauTatCa: student.lanLamBais.length,
  };

  const tongSoCauLam = student.lanLamBais.filter((l) => (l.lopId || "lop-10") === selectedLopId).length;
  const soCauDung = student.lanLamBais.filter((l) => (l.lopId || "lop-10") === selectedLopId && l.ketQua === "DUNG").length;
  const tiLeDung =
    tongSoCauLam > 0 ? Math.round((soCauDung / tongSoCauLam) * 100) : 0;

  const doThanhThaoTB =
    totalDangsInGrade > 0
      ? Number((totalMasterySum / totalDangsInGrade).toFixed(1))
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
    thongKeTheoLop,
    tongQuan: {
      tongSoLanLuyen: selectedLopId === "lop-10" ? soLanLop10 : soLanLop11,
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
      doThanhThao: Number((item.doThanhThao * 100).toFixed(1)),
      soCauDaLam: item.soCauDaLam,
      soCauDung: item.soCauDung,
      thoiGianGiay: item.thoiGianGiay,
      thoiDiemKetThuc: item.thoiDiemKetThuc,
    })),
    bieuDoTienTrinh,
  };
}
