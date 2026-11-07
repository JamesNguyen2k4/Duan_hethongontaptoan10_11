"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { capNhatTheOnTapSM2 } from "@/lib/spaced-repetition";

export async function nopBaiTapAction(baiTapId: string, luaChonHocSinh: string, thoiGianGiay: number) {
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

  const dung = luaChonHocSinh.trim().toUpperCase() === dapAnDung.trim().toUpperCase();

  // 1. Lưu bản ghi lần làm bài
  const lanLam = await db.lanLamBai.create({
    data: {
      nguoiDungId: session.user.id,
      baiTapId: baiTap.id,
      baiLam: luaChonHocSinh,
      ketQua: dung ? "DUNG" : "SAI",
      thoiGianGiay: thoiGianGiay,
    },
  });

  // 2. Cập nhật thống kê câu hỏi
  await db.baiTap.update({
    where: { id: baiTap.id },
    data: {
      soLanLam: { increment: 1 },
      soLanDung: dung ? { increment: 1 } : undefined,
    },
  });

  // 3. Tích hợp Spaced Repetition (Adaptive SM-2):
  // Nếu sai hoặc làm đúng chậm (>60s) -> đưa vào hàng đợi ôn tập ngắt quãng
  let chatLuongNho = 4;
  if (!dung) chatLuongNho = 1;
  else if (thoiGianGiay > 60) chatLuongNho = 3;
  else chatLuongNho = 5;

  await capNhatTheOnTapSM2(session.user.id, baiTap.id, chatLuongNho);

  return {
    ok: true,
    ketQua: dung ? "DUNG" : "SAI",
    dapAnDung: dapAnDung,
    loiGiaiChiTiet: baiTap.loiGiaiChiTiet,
  };
}

