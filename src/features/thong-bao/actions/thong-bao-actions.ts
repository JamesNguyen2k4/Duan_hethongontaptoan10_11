"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { LoaiThongBao } from "@prisma/client";

/**
 * Lấy danh sách thông báo và số lượng chưa đọc của giáo viên / quản trị viên hiện tại
 */
export async function layThongBaoGiaoVienAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { danhSach: [], soChuaDoc: 0, vaiTroHopLe: false };
  }

  const isGiaoVien =
    session.user.role === "GIAO_VIEN" || session.user.role === "QUAN_TRI";

  if (!isGiaoVien) {
    return { danhSach: [], soChuaDoc: 0, vaiTroHopLe: false };
  }

  try {
    const [danhSach, soChuaDoc] = await Promise.all([
      db.thongBao.findMany({
        where: { nguoiNhanId: session.user.id },
        orderBy: { taoLuc: "desc" },
        take: 20,
      }),
      db.thongBao.count({
        where: { nguoiNhanId: session.user.id, daDoc: false },
      }),
    ]);

    return { danhSach, soChuaDoc, vaiTroHopLe: true };
  } catch (error) {
    console.error("Lỗi khi lấy thông báo:", error);
    return { danhSach: [], soChuaDoc: 0, vaiTroHopLe: true };
  }
}

/**
 * Đánh dấu một thông báo đã đọc
 */
export async function danhDauDaDocAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };

  try {
    await db.thongBao.updateMany({
      where: {
        id,
        nguoiNhanId: session.user.id,
      },
      data: { daDoc: true },
    });
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    console.error("Lỗi đánh dấu đã đọc:", error);
    return { ok: false };
  }
}

/**
 * Đánh dấu tất cả thông báo của người dùng này là đã đọc
 */
export async function danhDauTatCaDaDocAction() {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };

  try {
    await db.thongBao.updateMany({
      where: {
        nguoiNhanId: session.user.id,
        daDoc: false,
      },
      data: { daDoc: true },
    });
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    console.error("Lỗi đánh dấu tất cả đã đọc:", error);
    return { ok: false };
  }
}

/**
 * Hàm nội bộ: Tạo thông báo gửi đến toàn bộ Giáo viên & Quản trị viên
 */
export async function taoThongBaoChoTatCaGiaoVien(params: {
  tieuDe: string;
  noiDung: string;
  duongDan: string;
  loai?: LoaiThongBao;
}) {
  const { tieuDe, noiDung, duongDan, loai = "BAI_VIET_MOI" } = params;

  try {
    // Tìm tất cả giáo viên và quản trị viên
    const danhSachGv = await db.nguoiDung.findMany({
      where: {
        vaiTro: { in: ["GIAO_VIEN", "QUAN_TRI"] },
        dangHoatDong: true,
      },
      select: { id: true },
    });

    if (danhSachGv.length === 0) return;

    await db.thongBao.createMany({
      data: danhSachGv.map((gv) => ({
        nguoiNhanId: gv.id,
        tieuDe,
        noiDung,
        duongDan,
        loai,
      })),
    });
  } catch (error) {
    console.error("Lỗi khi tạo thông báo cho giáo viên:", error);
  }
}

/**
 * Thử nghiệm gửi tin nhắn kiểm tra tới Telegram Bot
 */
export async function thuGuiTelegramAction() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "GIAO_VIEN" && session.user.role !== "QUAN_TRI")) {
    return { ok: false, message: "Bạn không có quyền thực hiện thao tác này" };
  }

  const { guiTinNhanTelegram } = await import("@/lib/telegram");
  const thoiGian = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  const message = [
    `🔔 <b>[KIỂM TRA KẾT NỐI TELEGRAM BOT]</b>`,
    ``,
    `✅ Hệ thống Ôn tập Toán 10-11 đã kết nối thành công với Telegram!`,
    `👤 Người gửi kiểm tra: <b>${session.user.name || "Giáo viên"}</b>`,
    `⏰ Thời gian: ${thoiGian}`,
  ].join("\n");

  const res = await guiTinNhanTelegram(message);
  return res;
}
