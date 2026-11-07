"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  capNhatTheOnTapSM2,
  duBaoKhoangCachTiepTheo,
  layThongKeTheOnTap,
} from "@/lib/spaced-repetition";

export interface TheOnTapData {
  id: string;
  baiTapId: string;
  soLanOnLienTiep: number;
  heSoDe: number;
  khoangCachNgay: number;
  ngayOnKeTiep: Date;
  baiTap: {
    id: string;
    deBai: string;
    mucDo: string;
    dangBai: string | null;
    cacLuaChon: Record<string, string>;
    dapAnDung: string;
    loiGiaiChiTiet: string;
    chuDe: {
      id: string;
      ten: string;
      chuong?: {
        id: string;
        ten: string;
      };
    };
  };
  duBao: ReturnType<typeof duBaoKhoangCachTiepTheo>;
}

/**
 * Lấy danh sách thẻ ôn tập đến hạn hoặc toàn bộ thẻ
 */
export async function layDanhSachTheOnTapAction(
  cheDo: "hom-nay" | "tang-cuong" | "chu-de" = "hom-nay",
  chuDeId?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Vui lòng đăng nhập", data: [] };
  }

  const userId = session.user.id;
  const now = new Date();
  const cuoiHomNay = new Date(now);
  cuoiHomNay.setHours(23, 59, 59, 999);

  let whereClause: any = { nguoiDungId: userId };

  if (cheDo === "hom-nay") {
    whereClause.ngayOnKeTiep = { lte: cuoiHomNay };
  } else if (cheDo === "chu-de" && chuDeId) {
    whereClause.baiTap = { chuDeId };
  }

  const list = await db.theOnTap.findMany({
    where: whereClause,
    include: {
      baiTap: {
        include: {
          chuDe: {
            include: {
              chuong: true,
            },
          },
        },
      },
    },
    orderBy: [
      { ngayOnKeTiep: "asc" },
      { soLanOnLienTiep: "asc" },
    ],
    take: 50,
  });

  const formatted: TheOnTapData[] = list.map((item) => {
    let cacLuaChon = {};
    let dapAnDung = "A";
    try {
      const parsed = JSON.parse(item.baiTap.dapAn);
      cacLuaChon = parsed.cacLuaChon || {};
      dapAnDung = parsed.dapAnDung || "A";
    } catch {
      dapAnDung = item.baiTap.dapAn;
    }

    return {
      id: item.id,
      baiTapId: item.baiTapId,
      soLanOnLienTiep: item.soLanOnLienTiep,
      heSoDe: item.heSoDe,
      khoangCachNgay: item.khoangCachNgay,
      ngayOnKeTiep: item.ngayOnKeTiep,
      baiTap: {
        id: item.baiTap.id,
        deBai: item.baiTap.deBai,
        mucDo: item.baiTap.mucDo,
        dangBai: item.baiTap.dangBai,
        cacLuaChon,
        dapAnDung,
        loiGiaiChiTiet: item.baiTap.loiGiaiChiTiet,
        chuDe: {
          id: item.baiTap.chuDe.id,
          ten: item.baiTap.chuDe.ten,
          chuong: item.baiTap.chuDe.chuong
            ? {
                id: item.baiTap.chuDe.chuong.id,
                ten: item.baiTap.chuDe.chuong.ten,
              }
            : undefined,
        },
      },
      duBao: duBaoKhoangCachTiepTheo(
        item.soLanOnLienTiep,
        item.heSoDe,
        item.khoangCachNgay
      ),
    };
  });

  return { ok: true, data: formatted };
}

/**
 * Đánh giá thẻ ôn tập (Anki/SM-2)
 */
export async function danhGiaTheOnTapAction(
  theOnTapId: string,
  q: number, // 1: Again, 3: Hard, 4: Good, 5: Easy
  thoiGianGiay: number,
  luaChonHocSinh?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Vui lòng đăng nhập" };
  }

  const the = await db.theOnTap.findUnique({
    where: { id: theOnTapId },
    include: { baiTap: true },
  });

  if (!the || the.nguoiDungId !== session.user.id) {
    return { ok: false, message: "Không tìm thấy thẻ ôn tập" };
  }

  const dung = q >= 3;

  // 1. Lưu bản ghi lần làm bài để phục vụ Adaptive Learning
  await db.lanLamBai.create({
    data: {
      nguoiDungId: session.user.id,
      baiTapId: the.baiTapId,
      baiLam: luaChonHocSinh || (dung ? "ON_TAP_DUNG" : "ON_TAP_SAI"),
      ketQua: dung ? "DUNG" : "SAI",
      thoiGianGiay: thoiGianGiay,
    },
  });

  // 2. Cập nhật thống kê bài tập
  await db.baiTap.update({
    where: { id: the.baiTapId },
    data: {
      soLanLam: { increment: 1 },
      soLanDung: dung ? { increment: 1 } : undefined,
    },
  });

  // 3. Cập nhật chu kỳ SM-2
  const theMoi = await capNhatTheOnTapSM2(session.user.id, the.baiTapId, q);

  revalidatePath("/on-tap");
  revalidatePath("/dashboard");

  return {
    ok: true,
    theMoi: {
      soLanOnLienTiep: theMoi.soLanOnLienTiep,
      khoangCachNgay: theMoi.khoangCachNgay,
      ngayOnKeTiep: theMoi.ngayOnKeTiep,
      heSoDe: theMoi.heSoDe,
    },
  };
}

/**
 * Ghim bài tập vào danh sách ôn tập ngắt quãng (bắt đầu học thẻ mới)
 */
export async function themVaoHangDoiOnTapAction(baiTapId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Vui lòng đăng nhập" };
  }

  const baiTap = await db.baiTap.findUnique({
    where: { id: baiTapId },
  });

  if (!baiTap) {
    return { ok: false, message: "Bài tập không tồn tại" };
  }

  // Tạo hoặc cập nhật thẻ ôn tập đặt lịch ngay ngày mai hoặc hôm nay
  const ngayMai = new Date();
  ngayMai.setDate(ngayMai.getDate() + 1);

  const the = await db.theOnTap.upsert({
    where: {
      nguoiDungId_baiTapId: {
        nguoiDungId: session.user.id,
        baiTapId,
      },
    },
    update: {
      ngayOnKeTiep: new Date(), // Ôn ngay
    },
    create: {
      nguoiDungId: session.user.id,
      baiTapId,
      soLanOnLienTiep: 0,
      heSoDe: 2.5,
      khoangCachNgay: 1,
      ngayOnKeTiep: new Date(),
    },
  });

  revalidatePath("/on-tap");
  return { ok: true, message: "Đã thêm vào danh sách ôn tập ngắt quãng", theId: the.id };
}

/**
 * Lấy số liệu thống kê ôn tập
 */
export async function layThongKeOnTapAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Chưa đăng nhập", data: null };
  }

  const thongKe = await layThongKeTheOnTap(session.user.id);
  return { ok: true, data: thongKe };
}

