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
  });

  if (!baiTap) {
    return { ok: false, message: "Không tìm thấy bài tập" };
  }

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
    },
  });

  // 2. Cập nhật Mô hình người học hợp nhất: BKT + IRT 3PL + FSRS/SM-2
  const adaptiveUpdate = await capNhatMoHinhNguoiHoc({
    nguoiDungId: session.user.id,
    baiTapId: baiTap.id,
    chuDeId: baiTap.chuDeId,
    dangBai: baiTap.dangBai,
    dung,
    thoiGianGiay,
    doKhoIRT: baiTap.doKhoIRT,
    doPhanBiet: baiTap.doPhanBiet,
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
