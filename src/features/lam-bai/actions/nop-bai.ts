"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  capNhatMoHinhNguoiHoc,
  chonCauHoiThichUngZPD,
} from "@/lib/adaptive-engine";

export async function nopBaiTapAction(
  baiTapId: string,
  luaChonHocSinh: string,
  thoiGianGiay: number,
  dangBaiFilter?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Vui lòng đăng nhập để làm bài" };
  }

  const baiTap = await db.baiTap.findUnique({
    where: { id: baiTapId },
    include: { chuDe: { select: { chuong: { select: { lopId: true } } } } },
  });

  if (!baiTap) {
    return { ok: false, message: "Không tìm thấy bài tập" };
  }
  const lopId = baiTap.chuDe.chuong.lopId;

  let dapAnDung = "";
  try {
    const parsed = JSON.parse(baiTap.dapAn);
    dapAnDung = parsed.dapAnDung;
  } catch {
    dapAnDung = baiTap.dapAn;
  }

  const dung =
    luaChonHocSinh.trim().toUpperCase() === dapAnDung.trim().toUpperCase();

  // 1. Lưu bản ghi lần làm bài
  await db.lanLamBai.create({
    data: {
      nguoiDungId: session.user.id,
      baiTapId: baiTap.id,
      baiLam: luaChonHocSinh,
      ketQua: dung ? "DUNG" : "SAI",
      thoiGianGiay: thoiGianGiay,
      lopId,
    },
  });

  // 2. Cập nhật Mô hình người học hợp nhất: BKT + IRT 3PL + PFA + FSRS
  const adaptiveUpdate = await capNhatMoHinhNguoiHoc({
    nguoiDungId: session.user.id,
    baiTapId: baiTap.id,
    chuDeId: baiTap.chuDeId,
    dangBai: baiTap.dangBai,
    mucDo: baiTap.mucDo,
    loai: baiTap.loai,
    dapAnJson: baiTap.dapAn,
    dung,
    thoiGianGiay,
    doKhoIRT: baiTap.doKhoIRT,
    doPhanBiet: baiTap.doPhanBiet,
    soLanLam: baiTap.soLanLam,
    soLanDung: baiTap.soLanDung,
    lopId,
  });

  // 3. Tự động chọn câu hỏi tiếp theo trong Vùng phát triển gần (ZPD: P(correct) ~ 70%)
  const nextZPD = await chonCauHoiThichUngZPD({
    nguoiDungId: session.user.id,
    chuDeId: baiTap.chuDeId,
    dangBai: dangBaiFilter || baiTap.dangBai || undefined,
    excludeBaiTapId: baiTap.id,
  });

  return {
    ok: true,
    ketQua: dung ? "DUNG" : "SAI",
    dapAnDung: dapAnDung,
    loiGiaiChiTiet: baiTap.loiGiaiChiTiet,
    adaptiveUpdate: {
      dangBai: adaptiveUpdate.dangBai,
      xacSuatThanhThaoTruoc: adaptiveUpdate.xacSuatThanhThaoTruoc,
      xacSuatThanhThaoMoi: adaptiveUpdate.xacSuatThanhThaoMoi,
      nangLucIRTTruoc: adaptiveUpdate.nangLucIRTTruoc,
      nangLucIRTMoi: adaptiveUpdate.nangLucIRTMoi,
      doBenTriNhoMoi: adaptiveUpdate.doBenTriNhoMoi,
      khoangCachOnNgay: adaptiveUpdate.khoangCachOnNgay,
      trangThai: adaptiveUpdate.trangThai,
      nhanTrangThai: adaptiveUpdate.nhanTrangThai,
      daDatThanhThao: adaptiveUpdate.daDatThanhThao,
    },
    nextAdaptiveQuestion: nextZPD
      ? {
          baiTapId: nextZPD.baiTapId,
          dangBai: nextZPD.dangBai,
          xacSuatDuDoan: nextZPD.xacSuatDuDoan,
          doKhoIRT: nextZPD.doKhoIRT,
          lyDoChon: nextZPD.lyDoChon,
        }
      : null,
  };
}

export async function ketThucPhienLuyenTapAction(params: {
  chuDeId: string;
  dangBai: string;
  lopId?: string | null;
  doThanhThao: number; // 0..1
  soCauDaLam: number;
  soCauDung: number;
  thoiGianGiay: number;
  thoiDiemBatDau?: string | Date;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Vui lòng đăng nhập" };
  }

  try {
    if (params.soCauDaLam > 0) {
      await db.lichSuLuyenTap.create({
        data: {
          nguoiDungId: session.user.id,
          chuDeId: params.chuDeId,
          dangBai: params.dangBai,
          lopId: params.lopId || null,
          doThanhThao: Math.min(1.0, Math.max(0.0, params.doThanhThao)),
          soCauDaLam: params.soCauDaLam,
          soCauDung: params.soCauDung,
          thoiGianGiay: Math.max(0, params.thoiGianGiay),
          thoiDiemBatDau: params.thoiDiemBatDau
            ? new Date(params.thoiDiemBatDau)
            : new Date(),
          thoiDiemKetThuc: new Date(),
        },
      });
    }

    return { ok: true };
  } catch (err: any) {
    console.error("Lỗi khi lưu phiên luyện tập:", err);
    return { ok: false, message: err?.message || "Lỗi lưu phiên luyện tập" };
  }
}
