import { db } from "@/lib/db";

/**
 * ============================================================================
 * THUẬT TOÁN ÔN TẬP NGẮT QUÃNG FSRS (Free Spaced Repetition Scheduler)
 * DỰA TRÊN MÔ HÌNH TRÍ NHỚ HIỆN ĐẠI (3 Trụ Cột: R - S - D)
 * ============================================================================
 * 1. Retrievability (R): Xác suất học sinh nhớ được thẻ ngay tại thời điểm hiện tại,
 *    suy giảm theo quy luật hàm mũ công suất (Power Law of Forgetting) kể từ lần ôn cuối:
 *    R(t, S) = (1 + FACTOR * (t / S))^(-0.5)
 *    Với FACTOR = 19/81, khi thời gian trôi qua t = S, xác suất nhớ R đúng bằng 90% (0.90).
 *
 * 2. Stability (S): Độ "bền" của ký ức, tính bằng số ngày để Retrievability (R)
 *    giảm từ 100% xuống mức mục tiêu R_target (mặc định 90%).
 *
 * 3. Difficulty (D): Độ khó của thẻ/dạng bài, thang điểm [1.0 .. 10.0]:
 *    - 1.0 - 3.5: Rất dễ, ghi nhớ nhanh
 *    - 3.6 - 6.5: Độ khó trung bình
 *    - 6.6 - 10.0: Rất khó, cần ôn tập thường xuyên hơn
 *
 * Quy trình lập lịch:
 * - Mức ghi nhớ mục tiêu mặc định R_target = 0.90 (90%).
 * - Thời điểm R giảm xuống đúng 90% chính là sau đúng S ngày => Khoảng cách ôn tiếp theo I = S.
 * - Sau mỗi lần ôn, cập nhật S và D:
 *   + Nhớ được (Recall: Good, Easy, Hard): S tăng, kết hợp hiệu ứng Retrieval Practice
 *     (càng ôn lúc sắp quên R ~ 90% thì S càng tăng vọt).
 *   + Quên (Lapse: Again / Làm sai): S sụt giảm mạnh, hẹn ôn lại ngay trong 1 ngày.
 */

export const FSRS_CONFIG = {
  TARGET_RETENTION: 0.90, // Mức ghi nhớ mục tiêu (90%)
  FACTOR: 19 / 81, // Hệ số chuẩn hóa FSRS để R(S, S) = 0.90
  DECAY: -0.5, // Số mũ suy giảm trí nhớ FSRS
  DEFAULT_DIFFICULTY: 5.0, // Độ khó cơ sở
  MIN_STABILITY: 0.4, // Độ bền tối thiểu (ngày)
  MAX_STABILITY: 365, // Độ bền tối đa (1 năm)
};

export type FSRSGrade = 1 | 2 | 3 | 4;
// 1: Again (Lại / Quên / Làm sai)
// 2: Hard (Khó / Làm đúng nhưng mất nhiều thời gian, vất vả)
// 3: Good (Tốt / Làm đúng với tốc độ chuẩn)
// 4: Easy (Dễ / Làm đúng rất nhanh, tự tin)

export interface KetQuaFSRS {
  stability: number; // S (ngày)
  difficulty: number; // D [1.0 .. 10.0]
  retrievability: number; // R [0.0 .. 1.0] tại thời điểm ôn
  intervalDays: number; // Khoảng cách hẹn ôn tiếp theo I (ngày)
  ngayOnKeTiep: Date; // Thời điểm hẹn ôn tập
  grade: FSRSGrade;
}

export interface DuBaoMucDo {
  q: number; // 1, 2, 3, 4
  nhan: string;
  moTa: string;
  khoangCachNgay: number;
  vanBanKhoangCach: string;
  retrievabilityPct: number;
  mauSac: "rose" | "amber" | "emerald" | "blue";
}

/**
 * 1. Tính Retrievability R(t, S) - Xác suất nhớ ngay lúc này
 * Theo định luật hàm mũ công suất FSRS:
 * R(t, S) = (1 + 19/81 * (t / S))^(-0.5)
 */
export function tinhRetrievabilityFSRS(
  elapsedDays: number,
  stability: number
): number {
  if (elapsedDays <= 0) return 1.0;
  const safeS = Math.max(FSRS_CONFIG.MIN_STABILITY, stability);
  const r = Math.pow(1 + FSRS_CONFIG.FACTOR * (elapsedDays / safeS), FSRS_CONFIG.DECAY);
  return Number(Math.max(0.05, Math.min(1.0, r)).toFixed(4));
}

/**
 * 2. Tính Khoảng cách ôn tiếp theo I(S, targetRetention)
 * Điểm thời gian mà Retrievability giảm về đúng targetRetention:
 * R(I, S) = targetRetention => I = S * (81/19) * (targetRetention^(-2) - 1)
 * Khi targetRetention = 0.90, I đúng bằng S ngày!
 */
export function tinhKhoangCachFSRS(
  stability: number,
  targetRetention: number = FSRS_CONFIG.TARGET_RETENTION
): number {
  const safeR = Math.max(0.70, Math.min(0.98, targetRetention));
  const rawInterval =
    (stability / FSRS_CONFIG.FACTOR) * (Math.pow(safeR, -2) - 1);
  return Math.max(1, Math.round(rawInterval));
}

/**
 * 3. Lõi Cập nhật FSRS (Stability S & Difficulty D) sau mỗi lần ôn
 */
export function tinhToanFSRS(params: {
  currentStability: number;
  currentDifficulty?: number;
  elapsedDays: number;
  grade: FSRSGrade;
  reps?: number;
  desiredRetention?: number;
  now?: Date;
}): KetQuaFSRS {
  const {
    currentStability,
    currentDifficulty = FSRS_CONFIG.DEFAULT_DIFFICULTY,
    elapsedDays,
    grade,
    reps = 0,
    desiredRetention = FSRS_CONFIG.TARGET_RETENTION,
    now = new Date(),
  } = params;

  // Tính Retrievability hiện tại tại thời điểm ôn
  const currentR =
    reps > 0 && currentStability > 0 && elapsedDays > 0
      ? tinhRetrievabilityFSRS(elapsedDays, currentStability)
      : 1.0;

  let newD = currentDifficulty;
  let newS = currentStability;

  // Trường hợp ôn lần đầu tiên (Cold Start)
  if (reps === 0 || currentStability <= 0) {
    // Khởi tạo D0(G) và S0(G) theo phân loại FSRS
    const D0: Record<FSRSGrade, number> = {
      1: 7.4, // Again
      2: 6.2, // Hard
      3: 5.0, // Good
      4: 3.8, // Easy
    };
    const S0: Record<FSRSGrade, number> = {
      1: 0.4, // Hẹn ôn lại trong 1 ngày
      2: 1.4, // Hẹn ôn sau 1-2 ngày
      3: 3.5, // Hẹn ôn sau 3-4 ngày
      4: 8.5, // Hẹn ôn sau 8-9 ngày
    };

    newD = D0[grade] || 5.0;
    newS = S0[grade] || 3.5;
  } else {
    // -----------------------------------------------------------------------
    // BƯỚC 1: Cập nhật Difficulty D với cơ chế hồi quy về trung bình (Mean Reversion)
    // D' = 0.1 * D0(3) + 0.9 * (D + deltaD)
    // -----------------------------------------------------------------------
    const deltaD = -0.8 * (grade - 3);
    newD = 0.1 * FSRS_CONFIG.DEFAULT_DIFFICULTY + 0.9 * (currentDifficulty + deltaD);
    newD = Math.max(1.0, Math.min(10.0, newD));

    // -----------------------------------------------------------------------
    // BƯỚC 2: Cập nhật Stability S
    // -----------------------------------------------------------------------
    if (grade === 1) {
      // TH A: Quên kiến thức / Làm sai (Lapse / Again)
      // Độ bền trí nhớ sụt giảm mạnh về ngưỡng tái củng cố
      const sLapse =
        0.45 *
        Math.pow(newD, -0.3) *
        (Math.pow(currentStability + 1, 0.35) - 1) *
        Math.exp((1 - currentR) * 0.25);
      newS = Math.max(
        FSRS_CONFIG.MIN_STABILITY,
        Math.min(currentStability * 0.35, sLapse)
      );
    } else {
      // TH B: Nhớ được kiến thức (Successful Recall: Hard=2, Good=3, Easy=4)
      // Hệ số đánh giá (Grade Bonus)
      const gradeBonus = grade === 2 ? 0.65 : grade === 4 ? 1.45 : 1.0;
      // Hiệu ứng Retrievability Spacing: Ôn đúng lúc sắp quên (R ~ 0.90 hoặc thấp hơn)
      // kích hoạt khả năng ghi nhớ sâu, làm tăng vọt Stability S!
      const retrievabilityFactor = Math.exp((1 - currentR) * 0.85);
      // Dạng bài khó (D cao) tăng độ bền chậm hơn dạng bài dễ (D thấp)
      const difficultyFactor = (11 - newD) / 6.0;
      // Diminishing returns khi Stability đã rất lớn
      const sPower = Math.pow(Math.max(1.0, currentStability), -0.2);

      const multiplier =
        1 + 1.65 * difficultyFactor * sPower * retrievabilityFactor * gradeBonus;
      newS = Math.min(FSRS_CONFIG.MAX_STABILITY, currentStability * multiplier);
    }
  }

  // Tính khoảng cách hẹn ôn tiếp theo I theo mức ghi nhớ mục tiêu (90%)
  const intervalDays =
    grade === 1 ? 1 : tinhKhoangCachFSRS(newS, desiredRetention);

  const ngayOnKeTiep = new Date(now);
  ngayOnKeTiep.setDate(ngayOnKeTiep.getDate() + intervalDays);
  ngayOnKeTiep.setHours(4, 0, 0, 0); // Đặt vào 4 giờ sáng ngày đến hạn

  return {
    stability: Number(newS.toFixed(2)),
    difficulty: Number(newD.toFixed(2)),
    retrievability: currentR,
    intervalDays,
    ngayOnKeTiep,
    grade,
  };
}

/**
 * 4. Dự báo thời gian ôn tập cho cả 4 mức đánh giá FSRS (Again, Hard, Good, Easy)
 */
export function duBaoKhoangCachTiepTheo(
  currentStability: number = 0,
  currentDifficulty: number = 5.0,
  elapsedDays: number = 0,
  reps: number = 0
): DuBaoMucDo[] {
  const formatText = (days: number) => {
    if (days <= 1) return "1 ngày";
    if (days < 30) return `${days} ngày`;
    const months = Math.round(days / 30);
    return `${months} tháng`;
  };

  const g1 = tinhToanFSRS({
    currentStability,
    currentDifficulty,
    elapsedDays,
    grade: 1,
    reps,
  });
  const g2 = tinhToanFSRS({
    currentStability,
    currentDifficulty,
    elapsedDays,
    grade: 2,
    reps,
  });
  const g3 = tinhToanFSRS({
    currentStability,
    currentDifficulty,
    elapsedDays,
    grade: 3,
    reps,
  });
  const g4 = tinhToanFSRS({
    currentStability,
    currentDifficulty,
    elapsedDays,
    grade: 4,
    reps,
  });

  return [
    {
      q: 1,
      nhan: "Lại (Quên)",
      moTa: "Chọn sai hoặc không nhớ",
      khoangCachNgay: g1.intervalDays,
      vanBanKhoangCach: formatText(g1.intervalDays),
      retrievabilityPct: Math.round(g1.retrievability * 100),
      mauSac: "rose",
    },
    {
      q: 2,
      nhan: "Khó",
      moTa: "Làm đúng nhưng vất vả",
      khoangCachNgay: g2.intervalDays,
      vanBanKhoangCach: formatText(g2.intervalDays),
      retrievabilityPct: Math.round(g2.retrievability * 100),
      mauSac: "amber",
    },
    {
      q: 3,
      nhan: "Tốt",
      moTa: "Làm đúng, nhớ chuẩn xác",
      khoangCachNgay: g3.intervalDays,
      vanBanKhoangCach: formatText(g3.intervalDays),
      retrievabilityPct: Math.round(g3.retrievability * 100),
      mauSac: "emerald",
    },
    {
      q: 4,
      nhan: "Dễ",
      moTa: "Rất quen thuộc, giải nhanh",
      khoangCachNgay: g4.intervalDays,
      vanBanKhoangCach: formatText(g4.intervalDays),
      retrievabilityPct: Math.round(g4.retrievability * 100),
      mauSac: "blue",
    },
  ];
}

/**
 * 5. Cập nhật thẻ ôn tập (TheOnTap) theo chuẩn FSRS vào cơ sở dữ liệu
 */
export async function capNhatTheOnTapFSRS(
  nguoiDungId: string,
  baiTapId: string,
  grade: FSRSGrade,
  now: Date = new Date(),
  lopId: string | null = null
) {
  const theHienTai = await db.theOnTap.findUnique({
    where: {
      nguoiDungId_baiTapId: {
        nguoiDungId,
        baiTapId,
      },
    },
  });

  // Tính số ngày đã trôi qua kể từ lần ôn cuối
  const elapsedDays = theHienTai?.capNhatLuc
    ? Math.max(
        0,
        (now.getTime() - new Date(theHienTai.capNhatLuc).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  // heSoDe lưu trữ Difficulty D [1.0 .. 10.0] trong FSRS (mặc định 5.0)
  // khoangCachNgay lưu trữ Stability S / Interval I
  const currentStability = theHienTai ? theHienTai.khoangCachNgay : 0;
  const currentDifficulty = theHienTai ? theHienTai.heSoDe : 5.0;
  const currentReps = theHienTai ? theHienTai.soLanOnLienTiep : 0;

  const fsrsMoi = tinhToanFSRS({
    currentStability,
    currentDifficulty,
    elapsedDays,
    grade,
    reps: currentReps,
    desiredRetention: FSRS_CONFIG.TARGET_RETENTION,
    now,
  });

  const repsMoi = grade === 1 ? 0 : currentReps + 1;

  return await db.theOnTap.upsert({
    where: {
      nguoiDungId_baiTapId: {
        nguoiDungId,
        baiTapId,
      },
    },
    update: {
      soLanOnLienTiep: repsMoi,
      heSoDe: fsrsMoi.difficulty,
      khoangCachNgay: fsrsMoi.intervalDays,
      ngayOnKeTiep: fsrsMoi.ngayOnKeTiep,
      ...(lopId ? { lopId } : {}),
    },
    create: {
      nguoiDungId,
      baiTapId,
      lopId,
      soLanOnLienTiep: repsMoi,
      heSoDe: fsrsMoi.difficulty,
      khoangCachNgay: fsrsMoi.intervalDays,
      ngayOnKeTiep: fsrsMoi.ngayOnKeTiep,
    },
  });
}

/**
 * Alias tương thích ngược
 */
export async function capNhatTheOnTapSM2(
  nguoiDungId: string,
  baiTapId: string,
  grade: number
) {
  const fsrsGrade: FSRSGrade =
    grade <= 1 ? 1 : grade === 2 || grade === 3 ? 2 : grade === 4 ? 3 : 4;
  return capNhatTheOnTapFSRS(nguoiDungId, baiTapId, fsrsGrade);
}

/**
 * 6. Lấy số liệu thống kê ôn tập ngắt quãng FSRS của học sinh
 */
export async function layThongKeTheOnTap(
  nguoiDungId: string,
  lopId?: string
) {
  const now = new Date();
  const cuoiHomNay = new Date(now);
  cuoiHomNay.setHours(23, 59, 59, 999);

  const cuoiNgayMai = new Date(cuoiHomNay);
  cuoiNgayMai.setDate(cuoiNgayMai.getDate() + 1);

  const allThe = await db.theOnTap.findMany({
    where: { nguoiDungId, ...(lopId ? { lopId } : {}) },
    select: {
      id: true,
      soLanOnLienTiep: true,
      khoangCachNgay: true,
      ngayOnKeTiep: true,
      heSoDe: true,
      capNhatLuc: true,
    },
  });

  const tongSoThe = allThe.length;

  // Tính Retrievability hiện tại cho từng thẻ
  let tongR = 0;
  let denHanHomNay = 0;
  let denHanNgayMai = 0;
  let theMoi = 0;
  let theDangCungCo = 0;
  let theDaiHan = 0;

  for (const t of allThe) {
    const elapsedDays = t.capNhatLuc
      ? Math.max(
          0,
          (now.getTime() - new Date(t.capNhatLuc).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;
    const r = tinhRetrievabilityFSRS(elapsedDays, t.khoangCachNgay);
    tongR += r;

    // Trong FSRS: thẻ đến hạn khi R <= 0.90 hoặc ngày hẹn đã tới
    const isDueToday = t.ngayOnKeTiep <= cuoiHomNay || r <= FSRS_CONFIG.TARGET_RETENTION;
    if (isDueToday) {
      denHanHomNay++;
    } else if (t.ngayOnKeTiep > cuoiHomNay && t.ngayOnKeTiep <= cuoiNgayMai) {
      denHanNgayMai++;
    }

    // Phân loại giai đoạn trí nhớ FSRS:
    // - Mới học: S < 3 ngày hoặc số lần ôn <= 1
    // - Đang củng cố: 3 <= S < 21 ngày
    // - Trí nhớ bền vững dài hạn: S >= 21 ngày
    if (t.soLanOnLienTiep <= 1 || t.khoangCachNgay < 3) {
      theMoi++;
    } else if (t.khoangCachNgay < 21) {
      theDangCungCo++;
    } else {
      theDaiHan++;
    }
  }

  const retrievabilityTrungBinh =
    tongSoThe > 0 ? Number(((tongR / tongSoThe) * 100).toFixed(1)) : 100;

  // Dự báo lịch ôn tập 7 ngày tới
  const lich7Ngay: { ngay: string; soThe: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const dStart = new Date(now);
    dStart.setDate(dStart.getDate() + i);
    dStart.setHours(0, 0, 0, 0);

    const dEnd = new Date(dStart);
    dEnd.setHours(23, 59, 59, 999);

    const count = allThe.filter((t) => {
      if (i === 0) {
        return (
          t.ngayOnKeTiep <= dEnd ||
          tinhRetrievabilityFSRS(
            Math.max(
              0,
              (now.getTime() - new Date(t.capNhatLuc).getTime()) /
                (1000 * 60 * 60 * 24)
            ),
            t.khoangCachNgay
          ) <= FSRS_CONFIG.TARGET_RETENTION
        );
      }
      return t.ngayOnKeTiep >= dStart && t.ngayOnKeTiep <= dEnd;
    }).length;

    const label = i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : `T+${i}`;
    lich7Ngay.push({ ngay: label, soThe: count });
  }

  return {
    tongSoThe,
    denHanHomNay,
    denHanNgayMai,
    theMoi,
    theDangCungCo,
    theDaiHan,
    retrievabilityTrungBinh,
    lich7Ngay,
  };
}

/**
 * 7. Định dạng hiển thị lịch ôn tập FSRS của Dạng bài cho giao diện học sinh
 */
export function dinhDangLichOnTapFSRS(
  ngayOnKeTiep: Date | string | null,
  lanLuyenCuoi: Date | string | null,
  now: Date = new Date()
): {
  trangThaiLich: "CHUA_CO" | "QUA_HAN" | "DEN_HAN" | "SAP_TOI";
  vanBanLich: string;
  soNgayConLai: number;
  mauSacBadge: string;
} {
  if (!ngayOnKeTiep) {
    return {
      trangThaiLich: "CHUA_CO",
      vanBanLich: "Chưa lên lịch",
      soNgayConLai: 0,
      mauSacBadge: "text-slate-500 bg-slate-100 border-slate-200",
    };
  }

  const dNgayOn = new Date(ngayOnKeTiep);
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);

  const endToday = new Date(now);
  endToday.setHours(23, 59, 59, 999);

  const diffMs = dNgayOn.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const ngayThangText = `${pad(dNgayOn.getDate())}/${pad(dNgayOn.getMonth() + 1)}`;

  if (dNgayOn < startToday) {
    const overdueDays = Math.max(
      1,
      Math.floor(
        (startToday.getTime() - dNgayOn.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    return {
      trangThaiLich: "QUA_HAN",
      vanBanLich:
        overdueDays === 1 ? "Quá hạn 1 ngày" : `Quá hạn ${overdueDays} ngày`,
      soNgayConLai: -overdueDays,
      mauSacBadge: "text-rose-700 bg-rose-50 border-rose-200 font-semibold",
    };
  }

  if (dNgayOn <= endToday) {
    return {
      trangThaiLich: "DEN_HAN",
      vanBanLich: "Đến hạn hôm nay",
      soNgayConLai: 0,
      mauSacBadge: "text-amber-800 bg-amber-50 border-amber-300 font-bold",
    };
  }

  if (diffDays <= 1) {
    return {
      trangThaiLich: "SAP_TOI",
      vanBanLich: `Ôn vào ngày mai (${ngayThangText})`,
      soNgayConLai: 1,
      mauSacBadge: "text-blue-700 bg-blue-50 border-blue-200 font-medium",
    };
  }

  return {
    trangThaiLich: "SAP_TOI",
    vanBanLich: `Ôn sau ${diffDays} ngày (${ngayThangText})`,
    soNgayConLai: diffDays,
    mauSacBadge: "text-indigo-700 bg-indigo-50 border-indigo-200 font-medium",
  };
}
