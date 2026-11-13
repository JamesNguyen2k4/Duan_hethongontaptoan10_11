"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  capNhatMoHinhNguoiHoc,
  layNangLucTheoChuDe,
  ThongTinNangLucDangBai,
} from "@/lib/adaptive-engine";

export interface KetQuaChiTietCau {
  id: string;
  deBai: string;
  dangBai: string | null;
  mucDo: string;
  doKhoIRT: number;
  cacLuaChon: Record<string, string>;
  luaChonCuaHocSinh: string | null;
  dapAnDung: string;
  dung: boolean;
  loiGiaiChiTiet: string;
}

export interface KetQuaPhienTongHop {
  ok: boolean;
  message?: string;
  diemSo: number; // thang 10
  soCauDung: number;
  soCauSai: number;
  soCauChuaLam: number;
  tongSoCau: number;
  thoiGianGiay: number;
  chiTietCacCau: KetQuaChiTietCau[];
  hoSoNangLucSauBaiThi?: ThongTinNangLucDangBai[];
}

export async function nopBaiTapTongHopAction(
  chuDeId: string,
  danhSachCauHoiIds: string[],
  cauTraLoiMap: Record<string, string>, // { [baiTapId]: "A" | "B" | "C" | "D" }
  thoiGianGiay: number
): Promise<KetQuaPhienTongHop> {
  const session = await auth();
  const userId = session?.user?.id;

  const baiTaps = await db.baiTap.findMany({
    where: {
      id: { in: danhSachCauHoiIds },
    },
    include: { chuDe: { select: { chuong: { select: { lopId: true } } } } },
  });

  const baiTapMap = new Map(baiTaps.map((b) => [b.id, b]));

  let soCauDung = 0;
  let soCauSai = 0;
  let soCauChuaLam = 0;
  const chiTietCacCau: KetQuaChiTietCau[] = [];
  const avgTimePerQ = Math.max(
    10,
    Math.round(thoiGianGiay / Math.max(1, danhSachCauHoiIds.length))
  );

  for (const qId of danhSachCauHoiIds) {
    const bt = baiTapMap.get(qId);
    if (!bt) continue;

    let parsedDapAn = "";
    let cacLuaChon: Record<string, string> = {};
    try {
      const parsed = JSON.parse(bt.dapAn);
      parsedDapAn = parsed.dapAnDung;
      cacLuaChon = parsed.cacLuaChon || {};
    } catch {
      parsedDapAn = bt.dapAn;
    }

    const luaChon = cauTraLoiMap[qId]
      ? cauTraLoiMap[qId].trim().toUpperCase()
      : null;
    const dung =
      luaChon !== null && luaChon === parsedDapAn.trim().toUpperCase();

    if (luaChon === null) {
      soCauChuaLam++;
    } else if (dung) {
      soCauDung++;
    } else {
      soCauSai++;
    }

    // Nếu học sinh đã đăng nhập: Lưu lịch sử và cập nhật Mô hình người học hợp nhất (BKT + IRT + FSRS/SM-2)
    if (userId) {
      await db.lanLamBai.create({
        data: {
          nguoiDungId: userId,
          baiTapId: bt.id,
          baiLam: luaChon || "CHUA_LAM",
          ketQua: dung ? "DUNG" : "SAI",
          thoiGianGiay: avgTimePerQ,
          lopId: bt.chuDe.chuong.lopId,
        },
      });

      await capNhatMoHinhNguoiHoc({
        nguoiDungId: userId,
        baiTapId: bt.id,
        chuDeId: bt.chuDeId,
        dangBai: bt.dangBai,
        mucDo: bt.mucDo,
        dung,
        thoiGianGiay: avgTimePerQ,
        doKhoIRT: bt.doKhoIRT,
        doPhanBiet: bt.doPhanBiet,
        lopId: bt.chuDe.chuong.lopId,
      });
    }

    chiTietCacCau.push({
      id: bt.id,
      deBai: bt.deBai,
      dangBai: bt.dangBai,
      mucDo: bt.mucDo,
      doKhoIRT: bt.doKhoIRT,
      cacLuaChon,
      luaChonCuaHocSinh: luaChon,
      dapAnDung: parsedDapAn,
      dung,
      loiGiaiChiTiet: bt.loiGiaiChiTiet,
    });
  }

  let hoSoNangLucSauBaiThi: ThongTinNangLucDangBai[] | undefined = undefined;
  if (userId) {
    hoSoNangLucSauBaiThi = await layNangLucTheoChuDe(userId, chuDeId);
  }

  const tongSoCau = danhSachCauHoiIds.length;
  const diemSo = Number(((soCauDung / (tongSoCau || 1)) * 10).toFixed(1));

  return {
    ok: true,
    diemSo,
    soCauDung,
    soCauSai,
    soCauChuaLam,
    tongSoCau,
    thoiGianGiay,
    chiTietCacCau,
    hoSoNangLucSauBaiThi,
  };
}
