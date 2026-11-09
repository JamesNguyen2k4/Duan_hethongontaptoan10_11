import { db } from "@/lib/db";
import { DANH_MUC_DANG_BAI } from "@/lib/danh-muc-dang-bai";
import {
  capNhatMoHinhNguoiHoc,
  tinhDoDuyTriTriNho,
  tinhDoThanhThaoThucTe,
  phanLoaiTrangThaiDangBai,
  quyDoiThetaSangMucDo,
  tinhXacSuatIRT3PL,
  chonCauHoiThichUngZPD,
} from "@/lib/adaptive-engine";

export interface ThongKeChuDe {
  chuDeId: string;
  tenChuDe: string;
  tongSoLam: number;
  soLanDung: number;
  doThanhThao: number; // Trung bình P_eff(L) theo BKT + Ebbinghaus Decay
  doNhoTrungBinh: number; // Trung bình R(t)
  nangLucIRT: number; // Trung bình theta_k
  tiLeDung: number;
  laDiemYeu: boolean;
  mucDoGoiY: "NHAN_BIET" | "THONG_HIEU" | "VAN_DUNG" | "VAN_DUNG_CAO";
}

export interface ThongKeDangBaiChiTiet {
  id: string;
  chuDeId: string;
  tenChuDe: string;
  dangBai: string;
  xacSuatThanhThao: number; // P(L_t)
  doNhoHienTai: number; // R(t)
  xacSuatHieuDung: number; // P_eff(L) = P(L_t) * R(t)
  nangLucIRT: number; // theta_k
  doBenTriNho: number; // Stability S (ngày)
  soLanLuyen: number;
  soLanDung: number;
  lanLuyenCuoi: Date;
  ngayOnKeTiep: Date;
  trangThai: "CHUA_HOC" | "DANG_REN_LUYEN" | "CAN_ON_LAI" | "THANH_THAO";
  nhanTrangThai: string;
  mucDoGoiY: "NHAN_BIET" | "THONG_HIEU" | "VAN_DUNG" | "VAN_DUNG_CAO";
}

/**
 * Phân tích năng lực học sinh hợp nhất:
 * BKT (Bayesian Knowledge Tracing) + IRT 3PL + Đường cong lãng quên Ebbinghaus (FSRS/SM-2)
 */
export async function phanTichDiemYeuHocSinh(nguoiDungId: string) {
  // 1. Lấy lịch sử làm bài của học sinh
  const lanLamBais = await db.lanLamBai.findMany({
    where: { nguoiDungId },
    include: {
      baiTap: {
        include: {
          chuDe: true,
        },
      },
    },
    orderBy: { thoiDiem: "asc" },
  });

  // 2. Lấy hồ sơ NangLucDangBai hiện tại
  let nangLucRecords = await db.nangLucDangBai.findMany({
    where: { nguoiDungId },
    include: { chuDe: true },
  });

  // Tự động đồng bộ (Backfill) nếu học sinh đã có lịch sử làm bài cũ trước khi nâng cấp bảng NangLucDangBai
  if (nangLucRecords.length === 0 && lanLamBais.length > 0) {
    for (const item of lanLamBais) {
      await capNhatMoHinhNguoiHoc({
        nguoiDungId,
        baiTapId: item.baiTapId,
        chuDeId: item.baiTap.chuDeId,
        dangBai: item.baiTap.dangBai,
        mucDo: item.baiTap.mucDo,
        dung: item.ketQua === "DUNG",
        thoiGianGiay: item.thoiGianGiay || 40,
        doKhoIRT: item.baiTap.doKhoIRT,
        doPhanBiet: item.baiTap.doPhanBiet,
      });
    }
    nangLucRecords = await db.nangLucDangBai.findMany({
      where: { nguoiDungId },
      include: { chuDe: true },
    });
  }

  const now = new Date();

  // 3. Tính toán trạng thái thời gian thực (bao gồm suy giảm trí nhớ Ebbinghaus) cho từng Dạng bài đã luyện
  const danhSachDangBai: ThongKeDangBaiChiTiet[] = nangLucRecords
    .filter((rec) => rec.soLanLuyen > 0)
    .map((rec) => {
      const doNho = tinhDoDuyTriTriNho(rec.lanLuyenCuoi, rec.doBenTriNho, now);
      const pEff = tinhDoThanhThaoThucTe(
        rec.xacSuatThanhThao,
        rec.soLanLuyen,
        rec.soLanDung,
        doNho,
        rec.soChuoiDung,
        rec.nangLucIRT
      );
      const { trangThai, nhanTrangThai } = phanLoaiTrangThaiDangBai(
        rec.soLanLuyen,
        rec.xacSuatThanhThao,
        pEff,
        doNho,
        rec.ngayOnKeTiep,
        now
      );

      return {
        id: rec.id,
        chuDeId: rec.chuDeId,
        tenChuDe: rec.chuDe.ten,
        dangBai: rec.dangBai,
        xacSuatThanhThao: rec.xacSuatThanhThao,
        doNhoHienTai: doNho,
        xacSuatHieuDung: pEff,
        nangLucIRT: rec.nangLucIRT,
        doBenTriNho: rec.doBenTriNho,
        soLanLuyen: rec.soLanLuyen,
        soLanDung: rec.soLanDung,
        lanLuyenCuoi: rec.lanLuyenCuoi,
        ngayOnKeTiep: rec.ngayOnKeTiep,
        trangThai,
        nhanTrangThai,
        mucDoGoiY: quyDoiThetaSangMucDo(rec.nangLucIRT),
      };
    })
    .sort((a, b) => a.xacSuatHieuDung - b.xacSuatHieuDung);

  // 4. Tổng hợp lên cấp Chủ đề (Bài học) cho biểu đồ Radar
  const chuDeGroup: Record<
    string,
    {
      ten: string;
      tongLam: number;
      soDung: number;
      sumPEff: number;
      sumR: number;
      sumTheta: number;
      countDang: number;
    }
  > = {};

  for (const d of danhSachDangBai) {
    if (!chuDeGroup[d.chuDeId]) {
      chuDeGroup[d.chuDeId] = {
        ten: d.tenChuDe,
        tongLam: 0,
        soDung: 0,
        sumPEff: 0,
        sumR: 0,
        sumTheta: 0,
        countDang: 0,
      };
    }
    chuDeGroup[d.chuDeId].tongLam += d.soLanLuyen;
    chuDeGroup[d.chuDeId].soDung += d.soLanDung;
    chuDeGroup[d.chuDeId].sumPEff += d.xacSuatHieuDung;
    chuDeGroup[d.chuDeId].sumR += d.doNhoHienTai;
    chuDeGroup[d.chuDeId].sumTheta += d.nangLucIRT;
    chuDeGroup[d.chuDeId].countDang += 1;
  }

  const danhSachChuDe: ThongKeChuDe[] = [];
  const diemYeuList: ThongKeChuDe[] = [];

  for (const [cdId, g] of Object.entries(chuDeGroup)) {
    const totalDangsInChuDe = Math.max(
      g.countDang,
      DANH_MUC_DANG_BAI[cdId]?.dangs.length || g.countDang
    );
    const doThanhThao = Number((g.sumPEff / totalDangsInChuDe).toFixed(2));
    const doNhoTrungBinh = Number((g.sumR / g.countDang).toFixed(2));
    const nangLucIRT = Number((g.sumTheta / g.countDang).toFixed(2));
    const tiLeDung = Number(((g.soDung / Math.max(1, g.tongLam)) * 100).toFixed(0));
    const laDiemYeu = doThanhThao < 0.65;

    const item: ThongKeChuDe = {
      chuDeId: cdId,
      tenChuDe: g.ten,
      tongSoLam: g.tongLam,
      soLanDung: g.soDung,
      doThanhThao,
      doNhoTrungBinh,
      nangLucIRT,
      tiLeDung,
      laDiemYeu,
      mucDoGoiY: quyDoiThetaSangMucDo(nangLucIRT),
    };

    danhSachChuDe.push(item);
    if (laDiemYeu) diemYeuList.push(item);
  }

  // Các dạng bài cần ưu tiên (Đang suy giảm trí nhớ hoặc Độ thành thạo hiệu dụng < 65%)
  const dangBaiCanOnList = danhSachDangBai.filter(
    (d) => d.trangThai === "CAN_ON_LAI" || d.xacSuatHieuDung < 0.65
  );
  const soDangThanhThao = danhSachDangBai.filter(
    (d) => d.trangThai === "THANH_THAO"
  ).length;

  return {
    tongBaiDaLam: lanLamBais.length,
    soBaiDung: lanLamBais.filter((l) => l.ketQua === "DUNG").length,
    soDangDaLuyen: danhSachDangBai.length,
    soDangThanhThao,
    soDangCanOn: dangBaiCanOnList.length,
    danhSachChuDe,
    danhSachDangBai,
    dangBaiCanOnList,
    diemYeuList,
  };
}
