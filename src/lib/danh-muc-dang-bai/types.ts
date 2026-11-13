export interface DangBaiInfo {
  id: string; // VD: "lop11-b1-d1"
  ten: string; // VD: "Dạng 1. Đơn vị đo góc & độ dài cung tròn"
  moTa: string;
}

export interface BaiHocDangBaiConfig {
  baiNum: number;
  chuDeId: string;
  chuongId: string;
  tenBai: string;
  dangs: DangBaiInfo[];
}

