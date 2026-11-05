"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { bamMatKhau } from "./mat-khau";
import { dangKySchema } from "../schemas";

type KetQua =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Server Action: Đăng ký tài khoản mới
 */
export async function dangKyAction(
  values: z.infer<typeof dangKySchema>
): Promise<KetQua> {
  const validated = dangKySchema.safeParse(values);
  if (!validated.success) {
    return { ok: false, message: "Dữ liệu không hợp lệ" };
  }

  const { tenHienThi, email, matKhau } = validated.data;

  // Kiểm tra email đã tồn tại chưa
  const daCoEmail = await db.nguoiDung.findUnique({ where: { email } });
  if (daCoEmail) {
    return { ok: false, message: "Email này đã được sử dụng" };
  }

  // Băm mật khẩu và tạo tài khoản
  const matKhauBam = await bamMatKhau(matKhau);

  await db.nguoiDung.create({
    data: {
      email,
      tenHienThi,
      matKhauBam,
      vaiTro: "HOC_SINH",
    },
  });

  return { ok: true, message: "Đăng ký thành công! Vui lòng đăng nhập." };
}

