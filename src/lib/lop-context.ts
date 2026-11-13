import { cache } from "react";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const DANH_SACH_LOP = [
  { id: "lop-10", ten: "Toán 10", nhan: "Lớp 10" },
  { id: "lop-11", ten: "Toán 11", nhan: "Lớp 11" },
] as const;

export type LopId = (typeof DANH_SACH_LOP)[number]["id"];

export const LOP_MAC_DINH: LopId = "lop-11";
export const COOKIE_LOP = "lop_dang_hoc";

export function laLopHopLe(id: string | null | undefined): id is LopId {
  return !!id && DANH_SACH_LOP.some((l) => l.id === id);
}

export function thongTinLop(id: string) {
  return DANH_SACH_LOP.find((l) => l.id === id) ?? DANH_SACH_LOP[1];
}

/**
 * Lấy lớp học sinh đang học (ngữ cảnh hiển thị).
 * Thứ tự ưu tiên: NguoiDung.lopDangHocId → cookie → mặc định lớp 11.
 * Được cache trong 1 request.
 */
export const layLopHienTai = cache(async (): Promise<LopId> => {
  const session = await auth();
  const userId = session?.user?.id;

  if (userId) {
    const u = await db.nguoiDung.findUnique({
      where: { id: userId },
      select: { lopDangHocId: true },
    });
    if (laLopHopLe(u?.lopDangHocId)) return u!.lopDangHocId as LopId;
  }

  const c = cookies().get(COOKIE_LOP)?.value;
  if (laLopHopLe(c)) return c;

  return LOP_MAC_DINH;
});

/** Lấy lopId của một chủ đề (dùng khi GHI dữ liệu – không tin vào cookie). */
export async function layLopIdTuChuDe(chuDeId: string): Promise<string | null> {
  const cd = await db.chuDe.findUnique({
    where: { id: chuDeId },
    select: { chuong: { select: { lopId: true } } },
  });
  return cd?.chuong.lopId ?? null;
}

/** Lấy lopId của một bài tập. */
export async function layLopIdTuBaiTap(baiTapId: string): Promise<string | null> {
  const bt = await db.baiTap.findUnique({
    where: { id: baiTapId },
    select: { chuDe: { select: { chuong: { select: { lopId: true } } } } },
  });
  return bt?.chuDe.chuong.lopId ?? null;
}
