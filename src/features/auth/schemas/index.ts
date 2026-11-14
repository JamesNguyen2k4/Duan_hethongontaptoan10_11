import { z } from "zod";

export const dangNhapSchema = z.object({
  email: z
    .string()
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ"),
  matKhau: z
    .string()
    .min(1, "Mật khẩu không được để trống")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export const dangKySchema = z.object({
  tenHienThi: z
    .string()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(50, "Họ và tên không quá 50 ký tự"),
  email: z
    .string()
    .min(1, "Gmail không được để trống")
    .email("Địa chỉ Gmail không hợp lệ"),
  matKhau: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .max(100, "Mật khẩu không quá 100 ký tự"),
});

export type DangNhapInput = z.infer<typeof dangNhapSchema>;
export type DangKyInput = z.infer<typeof dangKySchema>;
