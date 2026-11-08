import { db } from "@/lib/db";
import { DANH_MUC_DANG_BAI } from "@/lib/danh-muc-dang-bai";
import { capNhatTheOnTapSM2 } from "@/lib/spaced-repetition";

/**
 * ============================================================================
 * LÕI HỌC THÍCH ỨNG & LẶP LẠI NGẮT QUÃNG HỢP NHẤT
 * (Unified Adaptive Learning & Spaced Repetition Engine)
 * ============================================================================
 * Kết hợp 3 mô hình khoa học nhận thức:
 * 1. BKT (Bayesian Knowledge Tracing - Corbett & Anderson, CMU):
 *    Theo dõi xác suất làm chủ kỹ năng P(L_t) cho từng Dạng bài (Knowledge Component).
 * 2. IRT 3PL (Item Response Theory 3-Parameter Logistic):
 *    Ước lượng năng lực ẩn theta_k [-3, +3] của học sinh và độ khó câu hỏi b_i [-3, +3],
 *    chọn câu hỏi rơi vào Vùng phát triển gần (ZPD) với xác suất làm đúng mục tiêu P* ~ 0.70.
 * 3. Đường cong lãng quên Ebbinghaus & FSRS/SM-2 Memory Decay:
 *    Độ thành thạo thực tế suy giảm theo thời gian:
 *    P_eff(L) = P(L_t) * 0.80^(delta_t / S)
 *    Tự động kích hoạt ôn tập ngắt quãng khi P_eff(L) suy giảm dưới ngưỡng an toàn.
 */

export const BKT_DEFAULTS = {
  P_L0: 0.25, // Xác suất biết trước ban đầu
  P_T_BASE: 0.16, // Xác suất học được thêm sau mỗi câu có đọc lời giải chi tiết
  P_G_BASE: 0.22, // Xác suất đoán mò đúng (trắc nghiệm 4 lựa chọn)
  P_S_BASE: 0.10, // Xác suất sơ suất làm sai dù đã nắm kiến thức
  MASTERY_THRESHOLD: 0.85, // Ngưỡng công nhận Đã Thành Thạo (Mastered)
  REVIEW_DECAY_THRESHOLD: 0.70, // Ngưỡng suy giảm trí nhớ cần ôn lại
  ZPD_TARGET_PROB: 0.70, // Xác suất trả lời đúng tối ưu trong vùng ZPD (70%)
};

export type TrangThaiDangBai =
  | "CHUA_HOC"
  | "DANG_REN_LUYEN"
  | "CAN_ON_LAI"
  | "THANH_THAO";

export interface ThongTinNangLucDangBai {
  chuDeId: string;
  tenChuDe?: string;
  dangBai: string;
  moTaDangBai?: string;
  soCauTrongNganHang: number;
  xacSuatThanhThao: number; // P(L_t) gốc lúc vừa học xong [0..1]
  doNhoHienTai: number; // R(t) = 0.80^(delta_t / S) [0..1]
  xacSuatHieuDung: number; // P_eff(L) = P(L_t) * R(t) [0..1]
  nangLucIRT: number; // theta_k [-3.0 .. +3.0]
  doBenTriNho: number; // Stability S (ngày)
  soLanLuyen: number;
  soLanDung: number;
  soChuoiDung: number;
  lanLuyenCuoi: Date | null;
  ngayOnKeTiep: Date | null;
  trangThai: TrangThaiDangBai;
  nhanTrangThai: string;
  mucDoGoiY: "NHAN_BIET" | "THONG_HIEU" | "VAN_DUNG" | "VAN_DUNG_CAO";
  doKhoIRTMucTieu: number; // b* để P(correct | theta_k, b*) = 0.70
}

/**
 * 1. Hàm tính xác suất trả lời đúng theo mô hình IRT 3PL (3-Parameter Logistic)
 * P(correct | theta, a, b, c=0.25) = c + (1 - c) / (1 + exp(-D * a * (theta - b)))
 */
export function tinhXacSuatIRT3PL(
  theta: number,
  b: number,
  a: number = 1.0,
  c: number = 0.25
): number {
  const D = 1.702;
  const logit = -D * a * (theta - b);
  const clampedLogit = Math.max(-20, Math.min(20, logit));
  const prob = c + (1 - c) / (1 + Math.exp(clampedLogit));
  return Number(prob.toFixed(4));
}

/**
 * 2. Tìm độ khó câu hỏi mục tiêu b* sao cho xác suất làm đúng P(correct | theta, b*) = P_target (~0.70)
 * Giải phương trình: c + (1-c)/(1 + exp(-D*a*(theta - b*))) = P_target
 * => b* = theta + ln((1 - P_target) / (P_target - c)) / (D * a)
 */
export function tinhDoKhoMucTieuZPD(
  theta: number,
  pTarget: number = BKT_DEFAULTS.ZPD_TARGET_PROB,
  a: number = 1.0,
  c: number = 0.25
): number {
  const D = 1.702;
  const safeP = Math.max(c + 0.05, Math.min(0.95, pTarget));
  const ratio = (1 - safeP) / (safeP - c);
  const bStar = theta + Math.log(ratio) / (D * a);
  return Number(Math.max(-2.5, Math.min(2.5, bStar)).toFixed(2));
}

/**
 * 3. Tính hệ số duy trì trí nhớ Ebbinghaus R(t) = 0.80^(delta_t / S)
 * Khi delta_t = S (đúng vào ngày đến hạn ôn tập ngayOnKeTiep), R(S) = 0.80.
 */
export function tinhDoDuyTriTriNho(
  lanLuyenCuoi: Date | null,
  doBenTriNho: number,
  now: Date = new Date()
): number {
  if (!lanLuyenCuoi) return 1.0;
  const diffMs = Math.max(0, now.getTime() - new Date(lanLuyenCuoi).getTime());
  const deltaDays = diffMs / (1000 * 60 * 60 * 24);
  const stability = Math.max(0.5, doBenTriNho);
  // R(t) = 0.80^(deltaDays / stability)
  const retention = Math.pow(0.8, deltaDays / stability);
  return Number(Math.max(0.15, Math.min(1.0, retention)).toFixed(4));
}

/**
 * 4. Phân loại trạng thái Dạng bài từ P(L_t), R(t), P_eff(L) và số lần luyện
 */
export function phanLoaiTrangThaiDangBai(
  soLanLuyen: number,
  xacSuatThanhThao: number,
  xacSuatHieuDung: number,
  doNhoHienTai: number,
  ngayOnKeTiep: Date | null,
  now: Date = new Date()
): { trangThai: TrangThaiDangBai; nhanTrangThai: string } {
  if (soLanLuyen === 0) {
    return {
      trangThai: "CHUA_HOC",
      nhanTrangThai: "Chưa luyện tập",
    };
  }

  const isDueByDate = ngayOnKeTiep ? new Date(ngayOnKeTiep) <= now : false;
  // Nếu đã từng đạt độ thành thạo khá (>= 0.55) nhưng trí nhớ suy giảm hoặc đã đến hạn ôn
  if (
    (xacSuatThanhThao >= 0.55 && xacSuatHieuDung < BKT_DEFAULTS.REVIEW_DECAY_THRESHOLD && doNhoHienTai < 0.85) ||
    (isDueByDate && xacSuatHieuDung < 0.82)
  ) {
    return {
      trangThai: "CAN_ON_LAI",
      nhanTrangThai: "Đang quên • Cần ôn lại",
    };
  }

  if (xacSuatHieuDung >= BKT_DEFAULTS.MASTERY_THRESHOLD) {
    return {
      trangThai: "THANH_THAO",
      nhanTrangThai: "Đã thành thạo",
    };
  }

  return {
    trangThai: "DANG_REN_LUYEN",
    nhanTrangThai: "Đang rèn luyện (ZPD)",
  };
}

/**
 * 5. Chuyển đổi năng lực IRT theta_k sang mức độ câu hỏi gợi ý
 */
export function quyDoiThetaSangMucDo(
  theta: number
): "NHAN_BIET" | "THONG_HIEU" | "VAN_DUNG" | "VAN_DUNG_CAO" {
  if (theta < -0.6) return "NHAN_BIET";
  if (theta < 0.4) return "THONG_HIEU";
  if (theta < 1.25) return "VAN_DUNG";
  return "VAN_DUNG_CAO";
}

/**
 * 6. Cập nhật hợp nhất BKT + IRT 3PL + FSRS/SM-2 sau mỗi lần học sinh nộp 1 câu hỏi
 */
export async function capNhatMoHinhNguoiHoc(params: {
  nguoiDungId: string;
  baiTapId: string;
  chuDeId: string;
  dangBai: string | null;
  dung: boolean;
  thoiGianGiay: number;
  doKhoIRT?: number;
  doPhanBiet?: number;
}) {
  const {
    nguoiDungId,
    baiTapId,
    chuDeId,
    dung,
    thoiGianGiay,
    doKhoIRT = 0.0,
    doPhanBiet = 1.0,
  } = params;

  // Nếu câu hỏi chưa gán dangBai, lấy dạng 1 của chủ đề hoặc "Dạng chuẩn"
  const fallbackDang =
    DANH_MUC_DANG_BAI[chuDeId]?.dangs[0]?.ten || "Dạng 1. Kiến thức trọng tâm";
  const dangBai = params.dangBai || fallbackDang;

  const now = new Date();

  // Lấy hồ sơ năng lực hiện tại của học sinh ở dạng bài này
  const hienTai = await db.nangLucDangBai.findUnique({
    where: {
      nguoiDungId_chuDeId_dangBai: {
        nguoiDungId,
        chuDeId,
        dangBai,
      },
    },
  });

  const pLPrev = hienTai ? hienTai.xacSuatThanhThao : BKT_DEFAULTS.P_L0;
  const thetaPrev = hienTai ? hienTai.nangLucIRT : -0.4; // Khởi tạo hơi dưới trung bình để ZPD bắt đầu từ Nhận biết/Thông hiểu
  const stabilityPrev = hienTai ? hienTai.doBenTriNho : 1.0;
  const efPrev = hienTai ? hienTai.heSoDe : 2.5;
  const soLanLuyenPrev = hienTai ? hienTai.soLanLuyen : 0;
  const soLanDungPrev = hienTai ? hienTai.soLanDung : 0;
  const soChuoiDungPrev = hienTai ? hienTai.soChuoiDung : 0;
  const lanLuyenCuoiPrev = hienTai ? hienTai.lanLuyenCuoi : null;

  // -------------------------------------------------------------------------
  // BƯỚC A: Tính suy giảm trí nhớ Ebbinghaus trước khi cập nhật BKT
  // -------------------------------------------------------------------------
  const retention = tinhDoDuyTriTriNho(lanLuyenCuoiPrev, stabilityPrev, now);
  // Kiến thức nền chỉ phai một phần theo đường cong quên
  const pPrior = Math.max(
    0.1,
    Math.min(0.98, pLPrev * (0.35 + 0.65 * retention))
  );

  // -------------------------------------------------------------------------
  // BƯỚC B: Cập nhật Bayesian Knowledge Tracing (BKT Posterior + Learning)
  // -------------------------------------------------------------------------
  // Điều chỉnh P(G) và P(S) theo thời gian phản hồi và độ khó IRT của câu hỏi
  let pGuess = BKT_DEFAULTS.P_G_BASE;
  let pSlip = BKT_DEFAULTS.P_S_BASE;
  let pTransit = BKT_DEFAULTS.P_T_BASE;

  if (thoiGianGiay > 90) {
    // Làm quá lâu -> nếu đúng có khả năng vừa tra cứu/đoán cao hơn
    pGuess = Math.min(0.35, pGuess + 0.07);
  } else if (thoiGianGiay > 0 && thoiGianGiay <= 30 && dung) {
    // Làm nhanh và chính xác -> xác suất đoán mò thấp
    pGuess = Math.max(0.15, pGuess - 0.05);
  }

  if (doKhoIRT >= 0.6 && dung) {
    // Giải đúng câu Vận dụng / Vận dụng cao -> bước nhảy học tập P(T) lớn hơn
    pTransit = 0.22;
  }

  let pPosterior = pPrior;
  if (dung) {
    const num = pPrior * (1 - pSlip);
    const den = num + (1 - pPrior) * pGuess;
    pPosterior = den > 0 ? num / den : pPrior;
  } else {
    const num = pPrior * pSlip;
    const den = num + (1 - pPrior) * (1 - pGuess);
    pPosterior = den > 0 ? num / den : pPrior;
  }

  // Cập nhật chuyển trạng thái học tập sau khi xem lời giải
  const pLNew = Number(
    Math.max(0.05, Math.min(0.99, pPosterior + (1 - pPosterior) * pTransit)).toFixed(4)
  );

  // -------------------------------------------------------------------------
  // BƯỚC C: Cập nhật Năng lực IRT (theta_k) & Hiệu chỉnh độ khó câu hỏi (b_i)
  // -------------------------------------------------------------------------
  const pExpected = tinhXacSuatIRT3PL(thetaPrev, doKhoIRT, doPhanBiet, 0.25);
  const y = dung ? 1.0 : 0.0;

  // Hệ số cập nhật K_theta giảm dần nhẹ khi số câu đã làm tăng để hội tụ ổn định
  const baseK = Math.max(0.2, 0.48 / (1 + 0.06 * soLanLuyenPrev));
  let timeFactor = 1.0;
  if (dung && thoiGianGiay > 0 && thoiGianGiay <= 35) timeFactor = 1.15;
  else if (dung && thoiGianGiay > 90) timeFactor = 0.8;

  const deltaTheta = baseK * doPhanBiet * timeFactor * (y - pExpected);
  const thetaNew = Number(
    Math.max(-3.0, Math.min(3.0, thetaPrev + deltaTheta)).toFixed(3)
  );

  // Hiệu chỉnh nhẹ độ khó câu hỏi b_i từ phản hồi thực tế (Online Item Calibration)
  const deltaB = 0.025 * (pExpected - y);
  const bNew = Number(
    Math.max(-2.5, Math.min(2.5, doKhoIRT + deltaB)).toFixed(3)
  );

  // -------------------------------------------------------------------------
  // BƯỚC D: Cập nhật Độ bền trí nhớ (Stability S - FSRS/SM-2) & Lịch ôn tập
  // -------------------------------------------------------------------------
  let chatLuongNho = 4;
  if (!dung) {
    chatLuongNho = 1;
  } else if (thoiGianGiay > 75) {
    chatLuongNho = 3;
  } else if (thoiGianGiay <= 35 || doKhoIRT >= 0.7) {
    chatLuongNho = 5;
  } else {
    chatLuongNho = 4;
  }

  // Cập nhật Ease Factor EF
  let efNew =
    efPrev + (0.1 - (5 - chatLuongNho) * (0.08 + (5 - chatLuongNho) * 0.02));
  efNew = Number(Math.max(1.3, Math.min(3.0, efNew)).toFixed(2));

  let soChuoiDungNew = dung ? soChuoiDungPrev + 1 : 0;
  let stabilityNew = stabilityPrev;

  if (!dung) {
    // Làm sai -> Độ bền trí nhớ sụt giảm, cần củng cố lại trong 1 ngày
    stabilityNew = Number(Math.max(1.0, stabilityPrev * 0.45).toFixed(2));
  } else {
    if (soChuoiDungNew === 1) {
      stabilityNew = Number(Math.max(1.5, stabilityPrev * 1.4).toFixed(2));
    } else if (soChuoiDungNew === 2) {
      stabilityNew = Number(Math.max(3.5, stabilityPrev * 1.9).toFixed(2));
    } else {
      const masteryBonus = 1 + 0.2 * pLNew;
      const recallBonus = retention < 0.85 ? 1.25 : 1.0; // Hiệu ứng Spacing Effect: Ôn đúng lúc sắp quên giúp tăng vọt độ bền trí nhớ!
      stabilityNew = Number(
        Math.min(180, stabilityPrev * efNew * 0.85 * masteryBonus * recallBonus).toFixed(2)
      );
    }
  }

  // Ngày ôn kế tiếp: Khi R(t) giảm về 0.80 -> tức sau đúng `round(stabilityNew)` ngày!
  // Nếu làm sai hoặc chưa thành thạo (< 0.55), hẹn ôn lại sau 1 ngày.
  const intervalDays = !dung
    ? 1
    : pLNew < 0.55
    ? Math.max(1, Math.min(2, Math.round(stabilityNew)))
    : Math.max(1, Math.round(stabilityNew));

  const ngayOnKeTiep = new Date(now);
  ngayOnKeTiep.setDate(ngayOnKeTiep.getDate() + intervalDays);
  ngayOnKeTiep.setHours(4, 0, 0, 0);

  // 1. Lưu cập nhật vào bảng NangLucDangBai
  const banGhiNangLuc = await db.nangLucDangBai.upsert({
    where: {
      nguoiDungId_chuDeId_dangBai: {
        nguoiDungId,
        chuDeId,
        dangBai,
      },
    },
    update: {
      xacSuatThanhThao: pLNew,
      nangLucIRT: thetaNew,
      doBenTriNho: stabilityNew,
      heSoDe: efNew,
      soLanLuyen: { increment: 1 },
      soLanDung: dung ? { increment: 1 } : undefined,
      soChuoiDung: soChuoiDungNew,
      lanLuyenCuoi: now,
      ngayOnKeTiep,
    },
    create: {
      nguoiDungId,
      chuDeId,
      dangBai,
      xacSuatThanhThao: pLNew,
      nangLucIRT: thetaNew,
      doBenTriNho: stabilityNew,
      heSoDe: efNew,
      soLanLuyen: 1,
      soLanDung: dung ? 1 : 0,
      soChuoiDung: soChuoiDungNew,
      lanLuyenCuoi: now,
      ngayOnKeTiep,
    },
  });

  // 2. Cập nhật tham số câu hỏi (soLanLam, soLanDung, doKhoIRT)
  await db.baiTap.update({
    where: { id: baiTapId },
    data: {
      soLanLam: { increment: 1 },
      soLanDung: dung ? { increment: 1 } : undefined,
      doKhoIRT: bNew,
    },
  });

  // 3. Đồng bộ thẻ ôn tập cấp câu hỏi (TheOnTap) cho những câu làm sai hoặc làm chậm
  await capNhatTheOnTapSM2(nguoiDungId, baiTapId, chatLuongNho);

  const { trangThai, nhanTrangThai } = phanLoaiTrangThaiDangBai(
     soLanLuyenPrev + 1,
    pLNew,
    pLNew, // Vừa ôn xong nên R(0) = 1 => P_eff = P(L_t)
    1.0,
    ngayOnKeTiep,
    now
  );

  return {
    dangBai,
    xacSuatThanhThaoTruoc: pLPrev,
    xacSuatThanhThaoMoi: pLNew,
    nangLucIRTTruoc: thetaPrev,
    nangLucIRTMoi: thetaNew,
    doBenTriNhoMoi: stabilityNew,
    khoangCachOnNgay: intervalDays,
    ngayOnKeTiep,
    trangThai,
    nhanTrangThai,
    daDatThanhThao: pLNew >= BKT_DEFAULTS.MASTERY_THRESHOLD,
    banGhiNangLuc,
  };
}

/**
 * 7. Lấy danh sách trạng thái năng lực của toàn bộ các Dạng bài trong 1 Chủ đề (Bài học)
 */
export async function layNangLucTheoChuDe(
  nguoiDungId: string | undefined,
  chuDeId: string
): Promise<ThongTinNangLucDangBai[]> {
  const configDangs = DANH_MUC_DANG_BAI[chuDeId]?.dangs || [];

  const [dangsCount, userRecords] = await Promise.all([
    db.baiTap.groupBy({
      by: ["dangBai"],
      where: { chuDeId },
      _count: true,
    }),
    nguoiDungId
      ? db.nangLucDangBai.findMany({
          where: { nguoiDungId, chuDeId },
        })
      : Promise.resolve([]),
  ]);

  const countMap = new Map(dangsCount.map((d) => [d.dangBai || "", d._count]));
  const recordMap = new Map(userRecords.map((r) => [r.dangBai, r]));
  const now = new Date();

  const danhSachDangs =
    configDangs.length > 0
      ? configDangs
      : dangsCount.map((d, idx) => ({
          id: `dang-${idx + 1}`,
          ten: d.dangBai || `Dạng ${idx + 1}`,
          moTa: "Rèn luyện kỹ năng giải toán theo từng mức độ nhận thức.",
          tuKhoa: [],
        }));

  return danhSachDangs.map((dang) => {
    const rec = recordMap.get(dang.ten);
    const soCau = countMap.get(dang.ten) || 0;

    if (!rec || rec.soLanLuyen === 0) {
      return {
        chuDeId,
        dangBai: dang.ten,
        moTaDangBai: dang.moTa,
        soCauTrongNganHang: soCau,
        xacSuatThanhThao: BKT_DEFAULTS.P_L0,
        doNhoHienTai: 1.0,
        xacSuatHieuDung: BKT_DEFAULTS.P_L0,
        nangLucIRT: -0.4,
        doBenTriNho: 1.0,
        soLanLuyen: 0,
        soLanDung: 0,
        soChuoiDung: 0,
        lanLuyenCuoi: null,
        ngayOnKeTiep: null,
        trangThai: "CHUA_HOC",
        nhanTrangThai: "Chưa luyện tập",
        mucDoGoiY: "NHAN_BIET",
        doKhoIRTMucTieu: tinhDoKhoMucTieuZPD(-0.4),
      };
    }

    const doNho = tinhDoDuyTriTriNho(rec.lanLuyenCuoi, rec.doBenTriNho, now);
    const pEff = Number((rec.xacSuatThanhThao * doNho).toFixed(4));
    const { trangThai, nhanTrangThai } = phanLoaiTrangThaiDangBai(
      rec.soLanLuyen,
      rec.xacSuatThanhThao,
      pEff,
      doNho,
      rec.ngayOnKeTiep,
      now
    );

    return {
      chuDeId,
      dangBai: dang.ten,
      moTaDangBai: dang.moTa,
      soCauTrongNganHang: soCau,
      xacSuatThanhThao: rec.xacSuatThanhThao,
      doNhoHienTai: doNho,
      xacSuatHieuDung: pEff,
      nangLucIRT: rec.nangLucIRT,
      doBenTriNho: rec.doBenTriNho,
      soLanLuyen: rec.soLanLuyen,
      soLanDung: rec.soLanDung,
      soChuoiDung: rec.soChuoiDung,
      lanLuyenCuoi: rec.lanLuyenCuoi,
      ngayOnKeTiep: rec.ngayOnKeTiep,
      trangThai,
      nhanTrangThai,
      mucDoGoiY: quyDoiThetaSangMucDo(rec.nangLucIRT),
      doKhoIRTMucTieu: tinhDoKhoMucTieuZPD(rec.nangLucIRT),
    };
  });
}

/**
 * 8. Bộ chọn câu hỏi thích ứng theo Vùng phát triển gần (ZPD Selector: P(correct) ~ 0.70)
 * Kết hợp tự động giữa:
 * - Ôn tập ngắt quãng các dạng bài đang suy giảm trí nhớ (Spaced Repetition)
 * - Rèn luyện nâng cấp độ thành thạo BKT và năng lực IRT (Adaptive Progression)
 */
export async function chonCauHoiThichUngZPD(params: {
  nguoiDungId?: string;
  chuDeId: string;
  dangBai?: string;
  excludeBaiTapId?: string;
}) {
  const { nguoiDungId, chuDeId, excludeBaiTapId } = params;
  let targetDangBai = params.dangBai;
  let lyDoChon = "Câu hỏi khởi động phù hợp với trình độ hiện tại (Vùng ZPD ~ 70%)";

  const nangLucList = await layNangLucTheoChuDe(nguoiDungId, chuDeId);

  // Nếu không chỉ định dangBai cụ thể, thuật toán tự động điều phối dạng bài tối ưu:
  if (!targetDangBai && nangLucList.length > 0) {
    // Ưu tiên 1: Dạng bài đang bị suy giảm trí nhớ (CAN_ON_LAI)
    const dangCanOn = nangLucList
      .filter((d) => d.trangThai === "CAN_ON_LAI" && d.soCauTrongNganHang > 0)
      .sort((a, b) => a.xacSuatHieuDung - b.xacSuatHieuDung)[0];

    if (dangCanOn) {
      targetDangBai = dangCanOn.dangBai;
      lyDoChon = `Ôn tập ngắt quãng: Dạng bài này đang suy giảm trí nhớ (${Math.round(
        dangCanOn.xacSuatHieuDung * 100
      )}%)`;
    } else {
      // Ưu tiên 2: Dạng bài đang rèn luyện dở dang trong vùng ZPD (chưa đạt 85%)
      const dangDangHoc = nangLucList
        .filter((d) => d.trangThai === "DANG_REN_LUYEN" && d.soCauTrongNganHang > 0)
        .sort((a, b) => a.xacSuatHieuDung - b.xacSuatHieuDung)[0];

      if (dangDangHoc) {
        targetDangBai = dangDangHoc.dangBai;
        lyDoChon = `Rèn luyện thích ứng ZPD: Củng cố dạng bài lên ngưỡng thành thạo 85% (hiện đạt ${Math.round(
          dangDangHoc.xacSuatHieuDung * 100
        )}%)`;
      } else {
        // Ưu tiên 3: Dạng bài mới chưa học theo thứ tự chuẩn sư phạm
        const dangMoi = nangLucList.find(
          (d) => d.trangThai === "CHUA_HOC" && d.soCauTrongNganHang > 0
        );
        if (dangMoi) {
          targetDangBai = dangMoi.dangBai;
          lyDoChon = "Khám phá dạng toán mới theo lộ trình từ cơ bản đến nâng cao";
        } else {
          // Ưu tiên 4: Mọi dạng đã thành thạo -> chọn dạng có P_eff thấp nhất để thử thách đỉnh cao
          const sortedAll = [...nangLucList]
            .filter((d) => d.soCauTrongNganHang > 0)
            .sort((a, b) => a.xacSuatHieuDung - b.xacSuatHieuDung);
          targetDangBai = sortedAll[0]?.dangBai;
          lyDoChon = "Thử thách nâng cao duy trì phong độ đỉnh cao";
        }
      }
    }
  }

  const nangLucDang =
    nangLucList.find((d) => d.dangBai === targetDangBai) || nangLucList[0];
  const theta = nangLucDang ? nangLucDang.nangLucIRT : -0.4;
  const bTarget = tinhDoKhoMucTieuZPD(theta, BKT_DEFAULTS.ZPD_TARGET_PROB);

  if (params.dangBai && nangLucDang) {
    if (nangLucDang.trangThai === "CAN_ON_LAI") {
      lyDoChon = `Ôn tập khôi phục trí nhớ (${Math.round(
        nangLucDang.doNhoHienTai * 100
      )}% độ nhớ) • Mục tiêu ZPD P ≈ 70%`;
    } else if (nangLucDang.trangThai === "THANH_THAO") {
      lyDoChon = `Đã thành thạo (${Math.round(
        nangLucDang.xacSuatHieuDung * 100
      )}%) • Câu hỏi thử thách nâng cao`;
    } else {
      lyDoChon = `Chọn theo năng lực θ = ${theta >= 0 ? `+${theta}` : theta} • Độ khó mục tiêu b* = ${
        bTarget >= 0 ? `+${bTarget}` : bTarget
      } (Xác suất giải đúng ~70%)`;
    }
  }

  // Truy vấn danh sách câu hỏi ứng viên
  const candidates = await db.baiTap.findMany({
    where: {
      chuDeId,
      ...(targetDangBai ? { dangBai: targetDangBai } : {}),
      ...(excludeBaiTapId ? { id: { not: excludeBaiTapId } } : {}),
    },
    select: {
      id: true,
      mucDo: true,
      dangBai: true,
      doKhoIRT: true,
      doPhanBiet: true,
    },
  });

  if (candidates.length === 0) {
    const fallback = await db.baiTap.findFirst({
      where: {
        chuDeId,
        ...(excludeBaiTapId ? { id: { not: excludeBaiTapId } } : {}),
      },
      select: { id: true, doKhoIRT: true, doPhanBiet: true, dangBai: true },
    });
    return fallback
      ? {
          baiTapId: fallback.id,
          dangBai: fallback.dangBai,
          xacSuatDuDoan: tinhXacSuatIRT3PL(theta, fallback.doKhoIRT, fallback.doPhanBiet),
          doKhoIRT: fallback.doKhoIRT,
          nangLucDang,
          lyDoChon,
        }
      : null;
  }

  // Nếu đã đăng nhập: kiểm tra lịch sử làm bài của học sinh trên tập ứng viên
  let answeredCorrectIds = new Set<string>();
  let answeredWrongIds = new Set<string>();
  let dueCardIds = new Set<string>();

  if (nguoiDungId) {
    const candidateIds = candidates.map((c) => c.id);
    const [history, dueCards] = await Promise.all([
      db.lanLamBai.findMany({
        where: {
          nguoiDungId,
          baiTapId: { in: candidateIds },
        },
        orderBy: { thoiDiem: "asc" },
        select: { baiTapId: true, ketQua: true },
      }),
      db.theOnTap.findMany({
        where: {
          nguoiDungId,
          baiTapId: { in: candidateIds },
          ngayOnKeTiep: { lte: new Date() },
        },
        select: { baiTapId: true },
      }),
    ]);

    for (const h of history) {
      if (h.ketQua === "DUNG") {
        answeredCorrectIds.add(h.baiTapId);
        answeredWrongIds.delete(h.baiTapId);
      } else {
        answeredWrongIds.add(h.baiTapId);
      }
    }

    for (const d of dueCards) {
      dueCardIds.add(d.baiTapId);
    }
  }

  // Chấm điểm từng câu hỏi theo khoảng cách ZPD |P(correct | theta, b_i) - 0.70|
  const scored = candidates.map((item) => {
    const pCorrect = tinhXacSuatIRT3PL(theta, item.doKhoIRT, item.doPhanBiet, 0.25);
    const zpdDist = Math.abs(pCorrect - BKT_DEFAULTS.ZPD_TARGET_PROB);

    let historyPenalty = 0;
    if (dueCardIds.has(item.id) && answeredWrongIds.has(item.id)) {
      // Câu từng làm sai và đã đến hạn ôn tập SM-2 -> Ưu tiên cao!
      historyPenalty = -0.12;
    } else if (!answeredCorrectIds.has(item.id) && !answeredWrongIds.has(item.id)) {
      // Câu mới chưa làm bao giờ -> Ưu tiên chuẩn ZPD
      historyPenalty = 0;
    } else if (answeredWrongIds.has(item.id)) {
      // Câu từng làm sai gần đây -> Phạt nhẹ để không lặp lại ngay lập tức câu vừa làm
      historyPenalty = 0.18;
    } else {
      // Câu đã làm đúng -> Chỉ chọn lại khi đã hết câu mới trong vùng ZPD
      historyPenalty = 0.65;
    }

    return {
      item,
      pCorrect,
      score: zpdDist + historyPenalty,
    };
  });

  scored.sort((a, b) => a.score - b.score);
  const best = scored[0];

  return {
    baiTapId: best.item.id,
    dangBai: best.item.dangBai || targetDangBai || null,
    xacSuatDuDoan: best.pCorrect,
    doKhoIRT: best.item.doKhoIRT,
    nangLucDang,
    lyDoChon,
  };
}

