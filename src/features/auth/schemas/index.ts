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

export const dangKySchema = z
  .object({
    tenHienThi: z
      .string()
      .min(2, "Tên hiển thị phải có ít nhất 2 ký tự")
      .max(50, "Tên hiển thị không quá 50 ký tự"),
    email: z
      .string()
      .min(1, "Email không được để trống")
      .email("Email không hợp lệ"),
    matKhau: z
      .string()
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
      .max(100, "Mật khẩu không quá 100 ký tự"),
    xacNhanMatKhau: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.matKhau === data.xacNhanMatKhau, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["xacNhanMatKhau"],
  });

export type DangNhapInput = z.infer<typeof dangNhapSchema>;
export type DangKyInput = z.infer<typeof dangKySchema>;

