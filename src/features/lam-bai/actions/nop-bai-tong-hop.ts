"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { capNhatTheOnTapSM2 } from "@/lib/spaced-repetition";

export interface KetQuaChiTietCau {
  id: string;
  deBai: string;
  dangBai: string | null;
  mucDo: string;
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
}

export async function nopBaiTapTongHopAction(
  chuDeId: string,
  danhSachCauHoiIds: string[],
  cauTraLoiMap: Record<string, string>, // { [baiTapId]: "A" | "B" | "C" | "D" }
  thoiGianGiay: number
): Promise<KetQuaPhienTongHop> {
  const session = await auth();
  const userId = session?.user?.id;

  // Lấy dữ liệu chi tiết của toàn bộ câu hỏi trong đề từ database
  const baiTaps = await db.baiTap.findMany({
    where: {
      id: { in: danhSachCauHoiIds },
    },
  });

  const baiTapMap = new Map(baiTaps.map((b) => [b.id, b]));

  let soCauDung = 0;
  let soCauSai = 0;
  let soCauChuaLam = 0;
  const chiTietCacCau: KetQuaChiTietCau[] = [];

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

    const luaChon = cauTraLoiMap[qId] ? cauTraLoiMap[qId].trim().toUpperCase() : null;
    const dung = luaChon !== null && luaChon === parsedDapAn.trim().toUpperCase();

    if (luaChon === null) {
      soCauChuaLam++;
    } else if (dung) {
      soCauDung++;
    } else {
      soCauSai++;
    }

    // Nếu học sinh đã đăng nhập: Lưu lịch sử và cập nhật Spaced Repetition (SM-2)
    if (userId) {
      // 1. Lưu bản ghi lượt làm
      await db.lanLamBai.create({
        data: {
          nguoiDungId: userId,
          baiTapId: bt.id,
          baiLam: luaChon || "CHUA_LAM",
          ketQua: dung ? "DUNG" : "SAI",
          thoiGianGiay: Math.round(thoiGianGiay / danhSachCauHoiIds.length),
        },
      });

      // 2. Cập nhật lượt làm bài tập
      await db.baiTap.update({
        where: { id: bt.id },
        data: {
          soLanLam: { increment: 1 },
          soLanDung: dung ? { increment: 1 } : undefined,
        },
      });

      // 3. Tự động đưa câu sai vào SM-2 ôn lại
      if (!dung) {
        await capNhatTheOnTapSM2(userId, bt.id, 1); // điểm nhớ = 1 (cần ôn lại ngay)
      } else {
        await capNhatTheOnTapSM2(userId, bt.id, 4); // điểm nhớ = 4 (làm tốt)
      }
    }

    chiTietCacCau.push({
      id: bt.id,
      deBai: bt.deBai,
      dangBai: bt.dangBai,
      mucDo: bt.mucDo,
      cacLuaChon,
      luaChonCuaHocSinh: luaChon,
      dapAnDung: parsedDapAn,
      dung,
      loiGiaiChiTiet: bt.loiGiaiChiTiet,
    });
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
  };
}

