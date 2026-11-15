export type TrangThaiThanhThao = "THANH_THAO" | "KHA" | "CAN_LUYEN" | "CHUA_HOC";

export interface DangBaiReport {
  id: string;
  ten: string;
  moTa: string;
  doThanhThao: number;
  nangLucIRT: number;
  doBenTriNho: number;
  soLanLuyenPhien: number;
  soCauDaLam: number;
  soCauDung: number;
  tiLeDung: number;
  ngayOnKeTiep: Date | string | null;
  lanLuyenCuoi: Date | string | null;
  trangThai: TrangThaiThanhThao;
  cacLanLuyen: Array<{
    lanThu: number;
    id: string;
    doThanhThao: number;
    soCauDaLam: number;
    soCauDung: number;
    tiLeDung?: number;
    thoiGianGiay: number;
    thoiDiemKetThuc: Date | string;
  }>;
}

export interface BaiHocReport {
  id: string;
  ten: string;
  thuTu: number;
  soDang: number;
  doThanhThaoBai: number;
  trangThaiBai: TrangThaiThanhThao;
  danhSachDangBai: DangBaiReport[];
}

export interface ChuongReport {
  id: string;
  ten: string;
  thuTu: number;
  lopId: string;
  danhSachBai: BaiHocReport[];
}

export interface BaoCaoChiTietHocSinhData {
  hocSinh: {
    id: string;
    tenHienThi: string;
    email: string;
    anhDaiDien: string | null;
    lopDangHocId: string;
    taoLuc: Date | string;
  };
  selectedLopId: string;
  tongQuan: {
    tongSoLanLuyen: number;
    tongSoCauLam: number;
    soCauDung: number;
    tiLeDung: number;
    soDangThanhThao: number;
    tongSoDang: number;
    doThanhThaoTB: number;
  };
  danhSachChuong: ChuongReport[];
  lichSuCacLanLuyen: Array<{
    lanThu: number;
    id: string;
    chuDeId: string;
    chuDeTen: string;
    dangBai: string;
    doThanhThao: number;
    soCauDaLam: number;
    soCauDung: number;
    thoiGianGiay: number;
    thoiDiemKetThuc: Date | string;
  }>;
  bieuDoTienTrinh: Array<{
    lanThu: string;
    dangBai: string;
    chuDeTen: string;
    doThanhThao: number;
    soCauDung: number;
    soCauDaLam: number;
    thoiGianPhut: number;
    thoiDiem: string;
  }>;
}
