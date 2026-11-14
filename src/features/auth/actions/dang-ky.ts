"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { bamMatKhau } from "./mat-khau";
import { dangKySchema } from "../schemas";

type KetQua =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Server Action: Đăng ký tài khoản học sinh
 */
export async function dangKyAction(
  values: z.infer<typeof dangKySchema>
): Promise<KetQua> {
  const validated = dangKySchema.safeParse(values);
  if (!validated.success) {
    const errorMsg = validated.error.errors[0]?.message || "Dữ liệu không hợp lệ";
    return { ok: false, message: errorMsg };
  }

  const { tenHienThi, email, matKhau } = validated.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Kiểm tra email đã tồn tại chưa
  const daCoEmail = await db.nguoiDung.findUnique({
    where: { email: normalizedEmail },
  });

  if (daCoEmail) {
    return {
      ok: false,
      message: "Gmail này đã được đăng ký trên hệ thống. Vui lòng đăng nhập.",
    };
  }

  // Băm mật khẩu và tạo tài khoản Học sinh
  const matKhauBam = await bamMatKhau(matKhau);

  await db.nguoiDung.create({
    data: {
      email: normalizedEmail,
      tenHienThi: tenHienThi.trim(),
      matKhauBam,
      vaiTro: "HOC_SINH",
      lopDangHocId: "lop-11",
    },
  });

  return { ok: true, message: "Tạo tài khoản học sinh thành công!" };
}
