import { db } from "@/lib/db";

/**
 * Thuật toán SuperMemo SM-2 cho ôn tập ngắt quãng (Spaced Repetition)
 * - q: Đánh giá chất lượng nhớ (0 đến 5)
 *      1: Lại (Again) - Quên hoàn toàn hoặc làm sai
 *      3: Khó (Hard)  - Làm đúng nhưng gặp khó khăn / mất nhiều thời gian
 *      4: Tốt (Good)  - Làm đúng với tốc độ vừa phải
 *      5: Dễ (Easy)   - Nhớ rất rõ, làm nhanh chóng và chính xác
 */

export interface DuBaoMucDo {
  q: number;
  nhan: string;
  moTa: string;
  khoangCachNgay: number;
  vanBanKhoangCach: string;
  mauSac: "rose" | "amber" | "emerald" | "blue";
}

/**
 * Tính toán trạng thái SM-2 tiếp theo
 */
export function tinhToanSM2(
  soLanHienTai: number,
  efHienTai: number,
  khoangCachHienTai: number,
  q: number
) {
  let soLan = soLanHienTai;
  let ef = efHienTai;
  let khoangCach = 1;

  if (q < 3) {
    // Trả lời sai hoặc quên: Đặt lại chu kỳ
    soLan = 0;
    khoangCach = 1;
  } else if (q === 3) {
    // Trả lời đúng nhưng khó: Tăng nhẹ khoảng cách
    if (soLan === 0) {
      khoangCach = 1;
    } else if (soLan === 1) {
      khoangCach = 3;
    } else {
      khoangCach = Math.max(khoangCachHienTai + 1, Math.round(khoangCachHienTai * 1.2));
    }
    soLan += 1;
  } else if (q === 4) {
    // Trả lời tốt: Chuẩn SM-2
    if (soLan === 0) {
      khoangCach = 1;
    } else if (soLan === 1) {
      khoangCach = 6;
    } else {
      khoangCach = Math.round(khoangCachHienTai * ef);
    }
    soLan += 1;
  } else {
    // Trả lời dễ (q = 5): Thưởng thêm khoảng cách
    if (soLan === 0) {
      khoangCach = 3;
    } else if (soLan === 1) {
      khoangCach = 8;
    } else {
      khoangCach = Math.round(khoangCachHienTai * ef * 1.3);
    }
    soLan += 1;
  }

  // Cập nhật hệ số dễ (Ease Factor): EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ef < 1.3) ef = 1.3;
  if (ef > 3.0) ef = 3.0;

  const ngayOnKeTiep = new Date();
  ngayOnKeTiep.setDate(ngayOnKeTiep.getDate() + khoangCach);
  ngayOnKeTiep.setHours(4, 0, 0, 0); // Đặt vào 4 giờ sáng ngày đến hạn

  return {
    soLanOnLienTiep: soLan,
    heSoDe: Number(ef.toFixed(2)),
    khoangCachNgay: khoangCach,
    ngayOnKeTiep,
  };
}

/**
 * Trả về dự báo thời gian ôn kế tiếp cho cả 4 mức đánh giá (Anki Style)
 */
export function duBaoKhoangCachTiepTheo(
  soLanHienTai: number = 0,
  efHienTai: number = 2.5,
  khoangCachHienTai: number = 1
): DuBaoMucDo[] {
  const formatText = (days: number) => {
    if (days <= 1) return "1 ngày";
    if (days < 30) return `${days} ngày`;
    const months = Math.round(days / 30);
    return `${months} tháng`;
  };

  const muc1 = tinhToanSM2(soLanHienTai, efHienTai, khoangCachHienTai, 1);
  const muc3 = tinhToanSM2(soLanHienTai, efHienTai, khoangCachHienTai, 3);
  const muc4 = tinhToanSM2(soLanHienTai, efHienTai, khoangCachHienTai, 4);
  const muc5 = tinhToanSM2(soLanHienTai, efHienTai, khoangCachHienTai, 5);

  return [
    {
      q: 1,
      nhan: "Lại (Quên)",
      moTa: "Chọn sai hoặc không nhớ",
      khoangCachNgay: muc1.khoangCachNgay,
      vanBanKhoangCach: formatText(muc1.khoangCachNgay),
      mauSac: "rose",
    },
    {
      q: 3,
      nhan: "Khó",
      moTa: "Làm đúng nhưng vất vả",
      khoangCachNgay: muc3.khoangCachNgay,
      vanBanKhoangCach: formatText(muc3.khoangCachNgay),
      mauSac: "amber",
    },
    {
      q: 4,
      nhan: "Tốt",
      moTa: "Làm đúng, nhớ tốt",
      khoangCachNgay: muc4.khoangCachNgay,
      vanBanKhoangCach: formatText(muc4.khoangCachNgay),
      mauSac: "emerald",
    },
    {
      q: 5,
      nhan: "Dễ",
      moTa: "Rất quen thuộc, giải nhanh",
      khoangCachNgay: muc5.khoangCachNgay,
      vanBanKhoangCach: formatText(muc5.khoangCachNgay),
      mauSac: "blue",
    },
  ];
}

/**
 * Cập nhật thẻ ôn tập vào cơ sở dữ liệu
 */
export async function capNhatTheOnTapSM2(nguoiDungId: string, baiTapId: string, q: number) {
  const theHienTai = await db.theOnTap.findUnique({
    where: {
      nguoiDungId_baiTapId: {
        nguoiDungId,
        baiTapId,
      },
    },
  });

  const ketQuaMoi = tinhToanSM2(
    theHienTai ? theHienTai.soLanOnLienTiep : 0,
    theHienTai ? theHienTai.heSoDe : 2.5,
    theHienTai ? theHienTai.khoangCachNgay : 1,
    q
  );

  return await db.theOnTap.upsert({
    where: {
      nguoiDungId_baiTapId: {
        nguoiDungId,
        baiTapId,
      },
    },
    update: {
      soLanOnLienTiep: ketQuaMoi.soLanOnLienTiep,
      heSoDe: ketQuaMoi.heSoDe,
      khoangCachNgay: ketQuaMoi.khoangCachNgay,
      ngayOnKeTiep: ketQuaMoi.ngayOnKeTiep,
    },
    create: {
      nguoiDungId,
      baiTapId,
      soLanOnLienTiep: ketQuaMoi.soLanOnLienTiep,
      heSoDe: ketQuaMoi.heSoDe,
      khoangCachNgay: ketQuaMoi.khoangCachNgay,
      ngayOnKeTiep: ketQuaMoi.ngayOnKeTiep,
    },
  });
}

/**
 * Lấy số liệu thống kê ôn tập ngắt quãng của học sinh
 */
export async function layThongKeTheOnTap(nguoiDungId: string) {
  const now = new Date();
  const cuoiHomNay = new Date(now);
  cuoiHomNay.setHours(23, 59, 59, 999);

  const cuoiNgayMai = new Date(cuoiHomNay);
  cuoiNgayMai.setDate(cuoiNgayMai.getDate() + 1);

  const sau7Ngay = new Date(cuoiHomNay);
  sau7Ngay.setDate(sau7Ngay.getDate() + 7);

  const allThe = await db.theOnTap.findMany({
    where: { nguoiDungId },
    select: {
      id: true,
      soLanOnLienTiep: true,
      khoangCachNgay: true,
      ngayOnKeTiep: true,
      heSoDe: true,
    },
  });

  const tongSoThe = allThe.length;
  const denHanHomNay = allThe.filter((t) => t.ngayOnKeTiep <= cuoiHomNay).length;
  const denHanNgayMai = allThe.filter(
    (t) => t.ngayOnKeTiep > cuoiHomNay && t.ngayOnKeTiep <= cuoiNgayMai
  ).length;

  // Phân loại độ bền trí nhớ:
  // - Mới học: soLanOnLienTiep <= 1
  // - Đang củng cố: soLanOnLienTiep từ 2 đến 4
  // - Trí nhớ dài hạn: soLanOnLienTiep >= 5 hoặc khoangCachNgay >= 21
  const theMoi = allThe.filter((t) => t.soLanOnLienTiep <= 1).length;
  const theDangCungCo = allThe.filter(
    (t) => t.soLanOnLienTiep >= 2 && t.soLanOnLienTiep < 5 && t.khoangCachNgay < 21
  ).length;
  const theDaiHan = allThe.filter(
    (t) => t.soLanOnLienTiep >= 5 || t.khoangCachNgay >= 21
  ).length;

  // Dự báo 7 ngày tới
  const lich7Ngay: { ngay: string; soThe: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const dStart = new Date(now);
    dStart.setDate(dStart.getDate() + i);
    dStart.setHours(0, 0, 0, 0);

    const dEnd = new Date(dStart);
    dEnd.setHours(23, 59, 59, 999);

    const count = allThe.filter((t) => {
      if (i === 0) {
        return t.ngayOnKeTiep <= dEnd;
      }
      return t.ngayOnKeTiep >= dStart && t.ngayOnKeTiep <= dEnd;
    }).length;

    const label =
      i === 0
        ? "Hôm nay"
        : i === 1
        ? "Ngày mai"
        : `T+${i}`;

    lich7Ngay.push({ ngay: label, soThe: count });
  }

  return {
    tongSoThe,
    denHanHomNay,
    denHanNgayMai,
    theMoi,
    theDangCungCo,
    theDaiHan,
    lich7Ngay,
  };
}
