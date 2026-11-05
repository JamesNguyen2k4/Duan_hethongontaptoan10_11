import bcrypt from "bcryptjs";

/**
 * Băm mật khẩu bằng bcryptjs
 */
export async function bamMatKhau(matKhau: string): Promise<string> {
  return bcrypt.hash(matKhau, 10);
}

/**
 * So sánh mật khẩu với hash
 */
export async function xacThucMatKhau(
  matKhau: string,
  matKhauBam: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(matKhau, matKhauBam);
  } catch {
    return false;
  }
}
