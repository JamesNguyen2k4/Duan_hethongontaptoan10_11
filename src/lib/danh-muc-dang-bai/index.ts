// Danh mục Dạng bài hợp nhất cho mọi lớp.
// Khóa là chuDeId (có tiền tố lop10- / lop11-) nên không bao giờ trùng giữa các lớp.
import { DANH_MUC_DANG_BAI_LOP10 } from "./lop10";
import { DANH_MUC_DANG_BAI_LOP11 } from "./lop11";
import type { BaiHocDangBaiConfig } from "./types";

export type { DangBaiInfo, BaiHocDangBaiConfig } from "./types";
export { DANH_MUC_DANG_BAI_LOP10, DANH_MUC_DANG_BAI_LOP11 };

export const DANH_MUC_DANG_BAI: Record<string, BaiHocDangBaiConfig> = {
  ...DANH_MUC_DANG_BAI_LOP10,
  ...DANH_MUC_DANG_BAI_LOP11,
};

export function layDanhMucTheoLop(
  lopId: string
): Record<string, BaiHocDangBaiConfig> {
  return lopId === "lop-10" ? DANH_MUC_DANG_BAI_LOP10 : DANH_MUC_DANG_BAI_LOP11;
}

