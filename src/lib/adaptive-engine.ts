import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { DANH_MUC_DANG_BAI } from "@/lib/danh-muc-dang-bai";

const laySoCauTheoDangCached = unstable_cache(
  async (chuDeId: string) => {
    return db.baiTap.groupBy({
      by: ["dangBai"],
      where: { chuDeId },
      _count: true,
    });
  },
  ["so-cau-theo-dang-chude"],
  { revalidate: 3600, tags: ["curriculum-stats"] }
);
import {
  FSRS_CONFIG,
  FSRSGrade,
  tinhRetrievabilityFSRS,
  tinhKhoangCachFSRS,
  tinhToanFSRS,
  capNhatTheOnTapFSRS,
  dinhDangLichOnTapFSRS,
} from "@/lib/spaced-repetition";

/**
 * ============================================================================
 * HỆ THỐNG HỌC THÍCH ỨNG LAI (BKT + IRT + PFA) & ÔN TẬP NGẮT QUÃNG FSRS
 * (Hybrid Heuristic Architecture Inspired by KT, IRT, PFA & FSRS)
 * ============================================================================
 * Hệ thống heuristic kết hợp lấy cảm hứng từ 4 mô hình đo lường giáo dục & nhận thức:
 *
 * 1. Contextual BKT (Bayesian Knowledge Tracing - Corbett & Anderson, CMU 1994;
 *    mở rộng Contextual Guess & Slip - Pardos & Heffernan / Baker):
 *    - Theo dõi trạng thái kiến thức ẩn P(L_t) qua chuỗi Markov ẩn (HMM).
 *    - Tham số đoán mò P(G) neo trực tiếp theo cấu trúc câu hỏi (c = 1/k với trắc nghiệm,
 *      c ~ 0.02 với điền đáp án/tự luận) và điều chỉnh nhẹ theo độ khó câu hỏi b_i.
 *    - Áp dụng bước chuyển tiếp học tập P(T) cả khi làm đúng lẫn một phần khi làm sai
 *      (học sinh học được qua việc đọc lời giải chi tiết).
 *
 * 2. IRT 3PL & Online Elo Calibration (Lord, 1980; Pelánek, 2016):
 *    - Ước lượng năng lực liên tục theta_k [-2.5, +2.5] của học sinh và hiệu chỉnh
 *      độ khó thực nghiệm b_i [-2.5, +2.5] của câu hỏi theo cơ chế Elo từ dữ liệu làm bài.
 *    - Điều phối câu hỏi theo Vùng phát triển gần (ZPD: P(correct) ~ 0.70) dựa trên
 *      năng lực hiệu dụng có tính đến suy giảm trí nhớ theta_eff(t).
 *
 * 3. PFA (Performance Factor Analysis - Pavlik, Cen & Koedinger, 2009):
 *    - Hồi quy logistic theo dõi tích lũy số lần đúng (s), sai (f) và chuỗi đúng (streak)
 *      kết hợp làm mịn Laplace để tổng hợp thành Chỉ số làm chủ kỹ năng (Mastery Index).
 *
 * 4. FSRS điều chỉnh theo mức "Bất ngờ" (Surprise-Modulated FSRS Scheduler):
 *    - Theo dõi Retrievability R(t, S) = (1 + 19/81 * (t / S))^(-0.5) và Stability S.
 *    - Phân biệt rõ "quên kiến thức" (sai câu dễ/vừa sức có P_expected >= 0.65) với
 *      "chưa đủ năng lực giải câu khó" (sai câu Vận dụng cao có P_expected < 0.65),
 *      không dùng ngưỡng thời gian cứng (35s/75s) để tránh học sinh đoán nhanh lấy điểm.
 */

export const BKT_DEFAULTS = {
  P_L0: 0.12, // Xác suất biết trước ban đầu (Prior khi bắt đầu câu 1)
  P_T_BASE: 0.08, // Tốc độ học cơ sở mỗi câu khi làm đúng
  P_T_WRONG_FACTOR: 0.30, // Hệ số học từ lời giải chi tiết khi làm sai (30% của P_T)
  P_G_BASE: 0.25, // Xác suất đoán mò cơ sở cho trắc nghiệm 4 lựa chọn (1/4)
  P_S_BASE: 0.08, // Xác suất sơ suất (Slip) cơ sở dù đã nắm kiến thức
  THETA_BASE: -1.0, // Năng lực IRT khởi điểm cơ sở
  SURPRISE_LAPSE_THRESHOLD: 0.65, // Ngưỡng P_expected để phân biệt "quên" vs "câu quá khó"
  MASTERY_THRESHOLD: 0.85, // Ngưỡng Chỉ số làm chủ để công nhận Đã Thành Thạo (85%)
  MIN_PRACTICE_FOR_MASTERY: 10, // Số câu luyện tối thiểu để công nhận Thành thạo
  TARGET_SAMPLE_SIZE: 12, // Quy mô mẫu chuẩn cho 1 dạng bài để hội tụ 100% VolumeFactor
  REVIEW_DECAY_THRESHOLD: 0.90, // Ngưỡng suy giảm trí nhớ FSRS cần ôn lại (< 90%)
  ZPD_TARGET_PROB: 0.70, // Xác suất trả lời đúng mục tiêu trong vùng ZPD (70%)
};

export type MucDoCauHoi =
  | "NHAN_BIET"
  | "THONG_HIEU"
  | "VAN_DUNG"
  | "VAN_DUNG_CAO";

/**
 * Tính tham số đoán mò cơ sở (c) nhất quán cho cả IRT 3PL và BKT:
 * - Câu Điền đáp án / Tự luận: c = 0.02 (hầu như không thể đoán mò)
 * - Câu Trắc nghiệm k lựa chọn: c = 1 / k (mặc định 4 lựa chọn => c = 0.25)
 */
export function tinhXacSuatDoanMoC(
  loai?: string | null,
  dapAnJson?: string | null
): number {
  if (loai === "DIEN_DAP_AN" || loai === "TU_LUAN") {
    return 0.02;
  }
  if (dapAnJson) {
    try {
      const parsed = JSON.parse(dapAnJson);
      const numOptions = parsed?.cacLuaChon
        ? Object.keys(parsed.cacLuaChon).length
        : 4;
      if (numOptions >= 2) {
        return Number((1 / numOptions).toFixed(4));
      }
    } catch {
      // Fallback về 4 lựa chọn nếu chuỗi không phải JSON
    }
  }
  return BKT_DEFAULTS.P_G_BASE;
}

/**
 * Chuẩn hóa Tham số Độ khó IRT (b_i), Độ phân biệt (a_i), Tham số đoán mò (c_i),
 * Trọng số khó (w_i) và Trần năng lực theo mức Bloom + Hiệu chỉnh thực nghiệm (Elo/Pass-rate):
 * - Mức độ Bloom đóng vai trò Prior khởi tạo b_0 khi câu hỏi chưa có dữ liệu thực nghiệm.
 * - Khi câu hỏi đã có dữ liệu làm bài (doKhoIRTGoc đã hiệu chỉnh Elo hoặc có soLanLam),
 *   hệ thống ưu tiên dùng độ khó thực tế từ dữ liệu.
 */
export function chuanHoaThamSoCauHoi(
  mucDo?: string | null,
  doKhoIRTGoc?: number | null,
  doPhanBietGoc?: number | null,
  options?: {
    loai?: string | null;
    dapAnJson?: string | null;
    soLanLam?: number | null;
    soLanDung?: number | null;
  }
): {
  b: number; // Độ khó IRT chuẩn [-2.5, +2.5]
  a: number; // Độ phân biệt IRT [0.8, 2.0]
  c: number; // Tham số đoán mò nhất quán [0.02, 0.5]
  weight: number; // Hệ số bước nhảy theo độ khó (Difficulty Weight)
  thetaCeiling: number; // Trần năng lực IRT nếu chỉ giải mức độ này
} {
  let defaultB = -0.9;
  let defaultA = 1.0;
  let weight = 0.55;
  let thetaCeiling = -0.35; // Tương đương ~40% Mastery Index

  switch (mucDo) {
    case "NHAN_BIET":
      defaultB = -1.0;
      defaultA = 1.0;
      weight = 0.50;
      thetaCeiling = -0.35;
      break;
    case "THONG_HIEU":
      defaultB = -0.15;
      defaultA = 1.15;
      weight = 0.90;
      thetaCeiling = 0.45;
      break;
    case "VAN_DUNG":
      defaultB = 0.75;
      defaultA = 1.3;
      weight = 1.35;
      thetaCeiling = 1.45;
      break;
    case "VAN_DUNG_CAO":
      defaultB = 1.55;
      defaultA = 1.45;
      weight = 1.75;
      thetaCeiling = 2.5;
      break;
  }

  const c = tinhXacSuatDoanMoC(options?.loai, options?.dapAnJson);

  // Kiểm tra xem doKhoIRT trong DB đã được hiệu chỉnh Elo khác 0 chưa
  const hasCalibratedB =
    typeof doKhoIRTGoc === "number" && Math.abs(doKhoIRTGoc) > 0.001;

  let b = defaultB;
  if (hasCalibratedB) {
    b = doKhoIRTGoc!;
  } else if (options?.soLanLam && options.soLanLam > 0) {
    // Nếu chưa có doKhoIRT nhưng đã có thống kê lượt làm: nội suy Empirical Log-Odds với Prior Bloom
    const n = options.soLanLam;
    const k = options.soLanDung ?? 0;
    const empPassRate = (k + 1.5) / (n + 3.0);
    const empB = Number(
      Math.max(-2.2, Math.min(2.2, -Math.log(empPassRate / (1 - empPassRate)))).toFixed(3)
    );
    const credibility = Math.min(0.8, n / (n + 8));
    b = Number(((1 - credibility) * defaultB + credibility * empB).toFixed(3));
  }

  const a =
    typeof doPhanBietGoc === "number" && doPhanBietGoc !== 1.0
      ? doPhanBietGoc
      : defaultA;

  // Điều chỉnh trọng số và trần năng lực theo độ khó b thực tế sau khi hiệu chỉnh
  if (hasCalibratedB || (options?.soLanLam && options.soLanLam >= 3)) {
    weight = Number(
      Math.max(0.4, Math.min(1.85, 0.95 + 0.45 * b)).toFixed(2)
    );
    thetaCeiling = Number(Math.max(thetaCeiling, Math.min(2.5, b + 0.65)).toFixed(2));
  }

  return { b, a, c, weight, thetaCeiling };
}

/**
 * Mô hình PFA có trọng số độ khó (Difficulty-Weighted Performance Factor Analysis - Pavlik 2009):
 * Đánh giá dựa trên số câu đúng, số câu sai, năng lực câu hỏi đã vượt qua và quy mô mẫu.
 */
export function tinhXacSuatPFA(
  soLanDung: number,
  soLanSai: number,
  soChuoiDung: number = 0,
  nangLucIRT: number = -1.2
): number {
  const tongSo = soLanDung + soLanSai;
  if (tongSo <= 0) return 0;

  // Tỉ lệ chính xác thực nghiệm có làm mịn Laplace (Laplace-smoothed accuracy)
  // Giúp khi mới làm 1-2 câu không bị 100% ảo:
  // VD: 1/1 -> (1 + 0.5)/(1 + 3) = 37.5%; 5/5 -> 68.7%; 10/10 -> 80.7%
  const smoothedAcc = (soLanDung + 0.5) / (tongSo + 3.0);

  // Hồi quy logistic PFA chuẩn với hệ số tăng từ tốn theo từng câu (gamma = 0.26 thay vì 0.58)
  const beta0 = -1.65; // Khởi điểm thấp (~16%)
  const gamma = 0.26; // Mỗi câu đúng tăng logit từ tốn
  const rho = -0.18; // Mỗi câu sai giảm logit hợp lý
  const effectiveFails = Math.min(soLanSai, 8);
  const difficultyBonus = Math.max(-0.5, Math.min(1.0, (nangLucIRT + 0.8) * 0.35));
  const streakBonus = Math.min(5, soChuoiDung) * 0.08;

  const logit =
    beta0 +
    gamma * soLanDung +
    rho * effectiveFails +
    difficultyBonus +
    streakBonus;
  const logisticProb = 1 / (1 + Math.exp(-Math.max(-15, Math.min(15, logit))));

  return Number((0.6 * logisticProb + 0.4 * smoothedAcc).toFixed(4));
}

/**
 * Quy đổi năng lực liên tục IRT (theta_k trong [-3, +3]) sang thang xác suất làm chủ [0, 1]
 * Chuẩn hóa theo thang Bloom's Taxonomy:
 * - theta = -1.2 (Khởi đầu / Chưa làm) -> ~12%
 * - theta = -0.5 (Làm đúng các câu Nhận biết) -> ~34%
 * - theta = +0.2 (Làm đúng các câu Thông hiểu) -> ~61%
 * - theta = +1.0 (Làm đúng các câu Vận dụng) -> ~85% (Đạt ngưỡng Thành thạo)
 * - theta = +1.6 (Làm đúng các câu Vận dụng cao) -> ~94%
 */
export function tinhXacSuatMasteryTuIRT(theta: number): number {
  const k = 1.45;
  const thetaCenter = -0.1;
  const prob = 1 / (1 + Math.exp(-k * (theta - thetaCenter)));
  return Number(prob.toFixed(4));
}

/**
 * HÀM TỔNG HỢP ĐỘ THÀNH THẠO CHUẨN HÓA (Difficulty & Volume-Aware Hybrid KT-IRT-PFA):
 * Đảm bảo 3 nguyên tắc đo lường giáo dục:
 * 1. Phụ thuộc chặt chẽ vào SỐ LƯỢNG CÂU ĐÃ LÀM (Volume Factor):
 *    Sử dụng hàm bão hòa tuyến tính - mũ: câu thứ 1 chỉ có thể đạt tối đa ~4% - 7%
 *    (tùy độ khó câu hỏi), mỗi câu tiếp theo tăng đều ~4% - 8%.
 * 2. Phụ thuộc chặt chẽ vào ĐỘ KHÓ BÀI TOÁN (IRT Ability theta_k):
 *    Chiếm trọng số lớn nhất (45% IRT + 30% BKT + 25% PFA). Nếu chỉ làm câu dễ (Nhận biết),
 *    năng lực IRT bị chặn trần nên độ thành thạo không thể vượt quá mức trung bình (~40-50%).
 * 3. Suy giảm theo đường cong lãng quên Ebbinghaus R(t) khi lâu không ôn tập.
 */
export function tinhDoThanhThaoThucTe(
  pBKT: number,
  soLanLuyen: number,
  soLanDung: number,
  doNhoHienTai: number = 1.0,
  soChuoiDung: number = 0,
  nangLucIRT: number = -1.0,
  soCauTrongNganHang: number = 25
): number {
  if (soLanLuyen <= 0 || soLanDung <= 0) return 0;

  const soLanSai = Math.max(0, soLanLuyen - soLanDung);

  // 1. Thành phần IRT Continuous Mastery (45% trọng số - Phản ánh độ khó bài toán đã chinh phục)
  const pIRT = tinhXacSuatMasteryTuIRT(nangLucIRT);

  // 2. Thành phần Contextual BKT (30% trọng số - Xác suất trạng thái ẩn Bayes)
  const pBKTClamped = Math.max(0.05, Math.min(0.99, pBKT));

  // 3. Thành phần PFA & Tỉ lệ đúng thực nghiệm (25% trọng số - Phản ánh lịch sử đúng/sai)
  const pPFA = tinhXacSuatPFA(soLanDung, soLanSai, soChuoiDung, nangLucIRT);

  // Tổ hợp chất lượng kỹ năng (Skill Quality Score) dựa trên Độ khó IRT + BKT + PFA
  const skillQuality = 0.45 * pIRT + 0.30 * pBKTClamped + 0.25 * pPFA;

  // 4. Hệ số Quy mô Luyện tập (Sample Volume Factor):
  // Đảm bảo cần rèn luyện đủ số lượng câu hỏi chuẩn (tối thiểu ~10-12 câu của dạng bài,
  // hoặc 60% ngân hàng nếu dạng bài có ít câu) mới hội tụ 100% độ tin cậy.
  // Khi làm 1 câu đầu tiên: volumeFactor ~ 0.14 -> Độ thành thạo chỉ tăng +4% đến +7%!
  // LƯU Ý: Quy mô chỉ tính theo SỐ CÂU LÀM ĐÚNG (bằng chứng thành thạo).
  // Nếu tính theo tổng số lần luyện, mỗi câu SAI vẫn làm tăng volumeFactor và bù trừ
  // phần giảm của BKT/IRT/PFA -> làm sai mà độ thành thạo không giảm (lỗi logic).
  const targetN = Math.max(
    6,
    Math.min(
      BKT_DEFAULTS.TARGET_SAMPLE_SIZE,
      Math.ceil(soCauTrongNganHang * 0.45)
    )
  );
  const volumeFactor = Math.min(
    1.0,
    (soLanDung / targetN) * 0.65 + (1 - Math.exp(-0.22 * soLanDung)) * 0.35
  );

  const rawEff = skillQuality * volumeFactor * doNhoHienTai;
  return Number(Math.max(0.01, Math.min(0.98, rawEff)).toFixed(4));
}

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
  thongTinLich?: {
    trangThaiLich: "CHUA_CO" | "QUA_HAN" | "DEN_HAN" | "SAP_TOI";
    vanBanLich: string;
    soNgayConLai: number;
    mauSacBadge: string;
  };
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
 * 3. Tính Khả năng duy trì trí nhớ Retrievability R(t) theo chuẩn FSRS
 * R(t, S) = (1 + 19/81 * (t / S))^(-0.5)
 * Khi t = S (số ngày trôi qua đúng bằng độ bền Stability), Retrievability giảm về đúng 90% (0.90).
 */
export function tinhDoDuyTriTriNho(
  lanLuyenCuoi: Date | null,
  doBenTriNho: number,
  now: Date = new Date()
): number {
  if (!lanLuyenCuoi) return 1.0;
  const diffMs = Math.max(0, now.getTime() - new Date(lanLuyenCuoi).getTime());
  const deltaDays = diffMs / (1000 * 60 * 60 * 24);
  return tinhRetrievabilityFSRS(deltaDays, doBenTriNho);
}

/**
 * 4. Phân loại trạng thái Dạng bài theo chuẩn FSRS (R, S, D) và Năng lực thực tế
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
  const isMemoryDecayed = doNhoHienTai < FSRS_CONFIG.TARGET_RETENTION;

  // Nếu đến ngày hẹn ôn hoặc Retrievability giảm dưới 90% (chuẩn FSRS)
  if (isDueByDate || isMemoryDecayed) {
    return {
      trangThai: "CAN_ON_LAI",
      nhanTrangThai: "Đang quên • Cần ôn lại",
    };
  }

  if (
    xacSuatHieuDung >= BKT_DEFAULTS.MASTERY_THRESHOLD &&
    soLanLuyen >= BKT_DEFAULTS.MIN_PRACTICE_FOR_MASTERY
  ) {
    return {
      trangThai: "THANH_THAO",
      nhanTrangThai: "Đã thành thạo",
    };
  }

  return {
    trangThai: "DANG_REN_LUYEN",
    nhanTrangThai: "Đang rèn luyện",
  };
}

/**
 * 5. Tính năng lực IRT hiệu dụng (Effective Ability theta_eff) có điều chỉnh theo hệ số nhớ R(t):
 * Khi học sinh nghỉ lâu không ôn tập (R(t) giảm), năng lực phản xạ thực tế tại thời điểm làm bài
 * hồi quy một phần về mức cơ sở theta_base, giúp bộ chọn ZPD tự động hạ nhẹ độ khó câu mở đầu.
 */
export function tinhThetaHieuDung(
  theta: number,
  doNho: number = 1.0
): number {
  const safeR = Math.max(0.1, Math.min(1.0, doNho));
  const thetaEff = theta * safeR + BKT_DEFAULTS.THETA_BASE * (1 - safeR);
  return Number(Math.max(-2.5, Math.min(2.5, thetaEff)).toFixed(3));
}

/**
 * 6. Chuyển đổi năng lực IRT theta_k sang mức độ câu hỏi gợi ý
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
 * 7. Cập nhật hợp nhất BKT + IRT 3PL + Elo Item Calibration + Surprise-Modulated FSRS
 */
export async function capNhatMoHinhNguoiHoc(params: {
  nguoiDungId: string;
  baiTapId: string;
  chuDeId: string;
  dangBai: string | null;
  mucDo?: string | null;
  loai?: string | null;
  dapAnJson?: string | null;
  dung: boolean;
  thoiGianGiay: number;
  doKhoIRT?: number;
  doPhanBiet?: number;
  soLanLam?: number;
  soLanDung?: number;
  lopId?: string | null;
  thoiDiem?: Date;
}) {
  const {
    nguoiDungId,
    baiTapId,
    chuDeId,
    mucDo,
    dung,
    doKhoIRT: rawDoKhoIRT,
    doPhanBiet: rawDoPhanBiet,
  } = params;

  const now = params.thoiDiem ?? new Date();

  // Truy vấn thông tin bổ sung của bài tập và chủ đề nếu caller chưa truyền đầy đủ
  const [baiTapMeta, chuDeMeta] = await Promise.all([
    params.loai !== undefined && params.soLanLam !== undefined
      ? Promise.resolve({
          loai: params.loai,
          dapAn: params.dapAnJson ?? null,
          soLanLam: params.soLanLam,
          soLanDung: params.soLanDung ?? 0,
        })
      : db.baiTap.findUnique({
          where: { id: baiTapId },
          select: { loai: true, dapAn: true, soLanLam: true, soLanDung: true },
        }),
    params.lopId
      ? Promise.resolve(null)
      : db.chuDe.findUnique({
          where: { id: chuDeId },
          select: { chuong: { select: { lopId: true } } },
        }),
  ]);

  const lopId = params.lopId ?? chuDeMeta?.chuong.lopId ?? null;
  const soLanLamPrev = baiTapMeta?.soLanLam ?? 0;

  // Chuẩn hóa tham số câu hỏi (b_i, a_i, c_i, weight) kết hợp mức Bloom và dữ liệu thực nghiệm
  const itemParams = chuanHoaThamSoCauHoi(mucDo, rawDoKhoIRT, rawDoPhanBiet, {
    loai: baiTapMeta?.loai,
    dapAnJson: baiTapMeta?.dapAn,
    soLanLam: soLanLamPrev,
    soLanDung: baiTapMeta?.soLanDung ?? 0,
  });
  const doKhoIRT = itemParams.b;
  const doPhanBiet = itemParams.a;
  const cGuess = itemParams.c;
  const itemWeight = itemParams.weight;

  // Nếu câu hỏi chưa gán dangBai, lấy dạng 1 của chủ đề
  const fallbackDang =
    DANH_MUC_DANG_BAI[chuDeId]?.dangs[0]?.ten || "Dạng 1. Kiến thức trọng tâm";
  const dangBai = params.dangBai || fallbackDang;

  // Lấy hồ sơ năng lực hiện tại và số câu trong ngân hàng (từ cache) của dạng bài này
  const [hienTai, dangsCount] = await Promise.all([
    db.nangLucDangBai.findUnique({
      where: {
        nguoiDungId_chuDeId_dangBai: {
          nguoiDungId,
          chuDeId,
          dangBai,
        },
      },
    }),
    laySoCauTheoDangCached(chuDeId),
  ]);
  const soCauTrongNganHang =
    dangsCount.find((d) => (d.dangBai || "") === dangBai)?._count ?? 0;

  const pLPrev = hienTai ? hienTai.xacSuatThanhThao : BKT_DEFAULTS.P_L0;
  const thetaPrev = hienTai ? hienTai.nangLucIRT : BKT_DEFAULTS.THETA_BASE;
  const stabilityPrev = hienTai ? hienTai.doBenTriNho : 1.0;
  const efPrev = hienTai ? hienTai.heSoDe : FSRS_CONFIG.DEFAULT_DIFFICULTY;
  const soLanLuyenPrev = hienTai ? hienTai.soLanLuyen : 0;
  const soLanDungPrev = hienTai ? hienTai.soLanDung : 0;
  const soChuoiDungPrev = hienTai ? hienTai.soChuoiDung : 0;
  const lanLuyenCuoiPrev = hienTai ? hienTai.lanLuyenCuoi : null;

  // -------------------------------------------------------------------------
  // BƯỚC A: Tính suy giảm trí nhớ R(t) và Năng lực hiệu dụng theta_eff trước cập nhật
  // -------------------------------------------------------------------------
  const retention = tinhDoDuyTriTriNho(lanLuyenCuoiPrev, stabilityPrev, now);
  const thetaEffPrev = tinhThetaHieuDung(thetaPrev, retention);
  const pPrior = Math.max(
    0.08,
    Math.min(0.98, pLPrev * (0.4 + 0.6 * retention))
  );

  // Xác suất dự đoán trả lời đúng câu hỏi theo IRT 3PL (dùng chung cGuess và thetaEffPrev)
  const pExpected = tinhXacSuatIRT3PL(thetaEffPrev, doKhoIRT, doPhanBiet, cGuess);
  const y = dung ? 1.0 : 0.0;

  // -------------------------------------------------------------------------
  // BƯỚC B: Cập nhật Contextual BKT nhất quán với tham số đoán mò cGuess
  // -------------------------------------------------------------------------
  // Neo P(G) trực tiếp quanh cGuess (nếu tự luận/điền đáp án c=0.02 thì pGuess ~ 0.02;
  // nếu trắc nghiệm 4 lựa chọn c=0.25 thì pGuess dao động nhẹ theo độ khó quanh 0.25)
  const pGuess =
    cGuess <= 0.05
      ? cGuess
      : Math.max(
          cGuess * 0.68,
          Math.min(cGuess * 1.18, cGuess - 0.03 * doKhoIRT)
        );
  const pSlip = Math.max(
    0.05,
    Math.min(0.20, BKT_DEFAULTS.P_S_BASE + 0.03 * doKhoIRT)
  );
  const pTransit = BKT_DEFAULTS.P_T_BASE * itemWeight;

  let pPosterior = pPrior;
  if (dung) {
    const num = pPrior * (1 - pSlip);
    const den = num + (1 - pPrior) * pGuess;
    const rawBayes = den > 0 ? num / den : pPrior;
    const bayesDamping = Math.min(0.85, 0.35 * itemWeight);
    pPosterior = pPrior + (rawBayes - pPrior) * bayesDamping;
  } else {
    const num = pPrior * pSlip;
    const den = num + (1 - pPrior) * (1 - pGuess);
    const rawBayes = den > 0 ? num / den : pPrior;
    const failSeverity = Math.max(0.55, Math.min(0.92, 0.78 - 0.12 * doKhoIRT));
    pPosterior = pPrior - (pPrior - rawBayes) * failSeverity;
  }

  // Chuẩn BKT: Học sinh vẫn tiếp thu kiến thức sau khi làm sai nhờ đọc lời giải chi tiết,
  // với tốc độ bằng 30% so với khi tự giải đúng (P_T_WRONG_FACTOR = 0.30).
  const effectiveTransit = dung
    ? pTransit
    : pTransit * BKT_DEFAULTS.P_T_WRONG_FACTOR;
  const pLNew = Number(
    Math.max(
      0.05,
      Math.min(0.98, pPosterior + (1 - pPosterior) * effectiveTransit)
    ).toFixed(4)
  );

  // -------------------------------------------------------------------------
  // BƯỚC C: Cập nhật Năng lực IRT (theta_k) & Hiệu chỉnh Độ khó Elo (b_i)
  // -------------------------------------------------------------------------
  // Đã loại bỏ hệ số nhân thời gian (timeFactor) để tránh nhiễu từ bài toán tính dài hoặc đoán nhanh
  const baseKTheta = Math.max(0.16, 0.32 / (1 + 0.04 * soLanLuyenPrev));
  let deltaTheta = baseKTheta * doPhanBiet * itemWeight * (y - pExpected);

  // Chặn trần diminishing returns nếu chỉ làm câu dễ đã vượt ngưỡng mức độ đó
  if (dung && thetaPrev >= itemParams.thetaCeiling) {
    deltaTheta *= 0.25;
  }

  const thetaNew = Number(
    Math.max(-2.5, Math.min(2.5, thetaPrev + deltaTheta)).toFixed(3)
  );

  // Hiệu chỉnh độ khó câu hỏi b_i từ dữ liệu thực tế theo mô hình Elo (K_b giảm dần khi mẫu lớn):
  // Nếu học sinh làm sai câu có pExpected cao -> (pExpected - y) > 0 -> độ khó b_i tăng lên.
  const kItemElo = Math.max(0.025, 0.16 / (1 + 0.06 * soLanLamPrev));
  const deltaB = kItemElo * (pExpected - y);
  const bNew = Number(
    Math.max(-2.5, Math.min(2.5, doKhoIRT + deltaB)).toFixed(3)
  );

  // -------------------------------------------------------------------------
  // BƯỚC D: Cập nhật FSRS theo mức "Bất ngờ" (Surprise-Modulated FSRS)
  // -------------------------------------------------------------------------
  // Không dùng thời gian làm bài (35s/75s) để chấm Grade vì dễ bị lợi dụng và không hợp giải toán.
  // Chấm Grade dựa trên chênh lệch giữa Kết quả thực tế (y) và Kỳ vọng (pExpected):
  // - Làm ĐÚNG câu vượt tầm (pExpected < 0.55): Củng cố sâu sắc -> Grade 4 (Easy)
  // - Làm ĐÚNG câu vừa sức trong vùng ZPD (0.55 <= pExpected <= 0.85): Chuẩn -> Grade 3 (Good)
  // - Làm ĐÚNG câu quá dễ so với trình độ (pExpected > 0.85): Ít nỗ lực truy xuất -> Grade 2 (Hard / tăng S ít)
  // - Làm SAI: Phân biệt rõ:
  //   + Sai câu lẽ ra phải làm được (pExpected >= 0.65): Quên kiến thức thực sự -> Grade 1 (Again / Lapse)
  //   + Sai câu khó vượt tầm (pExpected < 0.65): Thiếu năng lực giải bài khó chứ KHÔNG phải quên kiến thức!
  const elapsedDaysDang = lanLuyenCuoiPrev
    ? Math.max(
        0,
        (now.getTime() - new Date(lanLuyenCuoiPrev).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const currentDifficulty =
    efPrev > 3.0 ? efPrev : FSRS_CONFIG.DEFAULT_DIFFICULTY;

  let fsrsGrade: FSRSGrade = 3;
  let stabilityNew = stabilityPrev;
  let dNew = currentDifficulty;
  let intervalDays = Math.max(1, Math.round(stabilityPrev));
  let ngayOnKeTiep = hienTai?.ngayOnKeTiep ?? new Date(now.getTime() + 86400000);

  const isStretchFailure = !dung && pExpected < BKT_DEFAULTS.SURPRISE_LAPSE_THRESHOLD;

  if (dung) {
    if (pExpected < 0.55) {
      fsrsGrade = 4;
    } else if (pExpected <= 0.85) {
      fsrsGrade = 3;
    } else {
      fsrsGrade = 2;
    }
  } else {
    fsrsGrade = 1;
  }

  if (isStretchFailure && soLanLuyenPrev > 0) {
    // Sai một câu hỏi khó (Vận dụng / VDC) vượt tầm năng lực hiện tại:
    // KHÔNG đánh sập độ bền trí nhớ S của dạng bài và không ép ôn lại sau 1 ngày như quên thẻ.
    stabilityNew = Number(
      Math.max(FSRS_CONFIG.MIN_STABILITY, stabilityPrev * 0.94).toFixed(2)
    );
    dNew = Number(Math.min(10.0, currentDifficulty + 0.15).toFixed(2));
    intervalDays = tinhKhoangCachFSRS(stabilityNew, FSRS_CONFIG.TARGET_RETENTION);
    ngayOnKeTiep = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  } else {
    // Cập nhật FSRS tiêu chuẩn cho trường hợp làm đúng hoặc thực sự quên câu cơ bản
    const fsrsDang = tinhToanFSRS({
      currentStability: stabilityPrev,
      currentDifficulty,
      elapsedDays: elapsedDaysDang,
      grade: fsrsGrade,
      reps: soLanLuyenPrev,
      desiredRetention: FSRS_CONFIG.TARGET_RETENTION,
      now,
    });
    stabilityNew = fsrsDang.stability;
    dNew = fsrsDang.difficulty;
    intervalDays = fsrsDang.intervalDays;
    ngayOnKeTiep = fsrsDang.ngayOnKeTiep;
  }

  const soChuoiDungNew = dung ? soChuoiDungPrev + 1 : 0;

  // 1-3. Lưu đồng thời cập nhật NangLucDangBai, thống kê câu hỏi và thẻ FSRS để giảm độ trễ
  const [banGhiNangLuc] = await Promise.all([
    db.nangLucDangBai.upsert({
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
        heSoDe: dNew,
        soLanLuyen: { increment: 1 },
        soLanDung: dung ? { increment: 1 } : undefined,
        soChuoiDung: soChuoiDungNew,
        lanLuyenCuoi: now,
        ngayOnKeTiep,
        lopId,
      },
      create: {
        nguoiDungId,
        chuDeId,
        dangBai,
        lopId,
        xacSuatThanhThao: pLNew,
        nangLucIRT: thetaNew,
        doBenTriNho: stabilityNew,
        heSoDe: dNew,
        soLanLuyen: 1,
        soLanDung: dung ? 1 : 0,
        soChuoiDung: soChuoiDungNew,
        lanLuyenCuoi: now,
        ngayOnKeTiep,
      },
    }),
    db.baiTap.update({
      where: { id: baiTapId },
      data: {
        soLanLam: { increment: 1 },
        soLanDung: dung ? { increment: 1 } : undefined,
        doKhoIRT: bNew,
      },
    }),
    capNhatTheOnTapFSRS(nguoiDungId, baiTapId, fsrsGrade, now, lopId),
  ]);

  const soLanLuyenMoi = soLanLuyenPrev + 1;
  const soLanDungMoi = soLanDungPrev + (dung ? 1 : 0);

  const retentionMoi = dung
    ? 1.0
    : isStretchFailure
    ? retention
    : Math.min(retention, 0.88);

  const pEffTruoc = tinhDoThanhThaoThucTe(
    pLPrev,
    soLanLuyenPrev,
    soLanDungPrev,
    retention,
    soChuoiDungPrev,
    thetaPrev,
    soCauTrongNganHang
  );
  let pEffMoi = tinhDoThanhThaoThucTe(
    pLNew,
    soLanLuyenMoi,
    soLanDungMoi,
    retentionMoi,
    soChuoiDungNew,
    thetaNew,
    soCauTrongNganHang
  );

  // Đảm bảo tính nhất quán: Khi làm SAI thì Chỉ số làm chủ không tăng
  if (!dung && pEffMoi >= pEffTruoc && pEffTruoc > 0) {
    pEffMoi = Number(Math.max(0.0, pEffTruoc - 0.005).toFixed(4));
  }

  const { trangThai, nhanTrangThai } = phanLoaiTrangThaiDangBai(
    soLanLuyenMoi,
    pLNew,
    pEffMoi,
    retentionMoi,
    ngayOnKeTiep,
    now
  );

  return {
    dangBai,
    xacSuatDuDoanTruoc: pExpected,
    xacSuatThanhThaoTruoc: pEffTruoc,
    xacSuatThanhThaoMoi: pEffMoi,
    nangLucIRTTruoc: thetaPrev,
    nangLucIRTMoi: thetaNew,
    doBenTriNhoMoi: stabilityNew,
    khoangCachOnNgay: intervalDays,
    ngayOnKeTiep,
    soLanLuyenMoi,
    soLanDungMoi,
    soChuoiDungMoi: soChuoiDungNew,
    trangThai,
    nhanTrangThai,
    daDatThanhThao:
      pEffMoi >= BKT_DEFAULTS.MASTERY_THRESHOLD &&
      soLanLuyenMoi >= BKT_DEFAULTS.MIN_PRACTICE_FOR_MASTERY,
    banGhiNangLuc,
  };
}

/**
 * 8. Lấy danh sách trạng thái năng lực của toàn bộ các Dạng bài trong 1 Chủ đề (Bài học)
 */
export async function layNangLucTheoChuDe(
  nguoiDungId: string | undefined,
  chuDeId: string
): Promise<ThongTinNangLucDangBai[]> {
  const configDangs = DANH_MUC_DANG_BAI[chuDeId]?.dangs || [];

  const [dangsCount, userRecords] = await Promise.all([
    laySoCauTheoDangCached(chuDeId),
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
        xacSuatThanhThao: 0,
        doNhoHienTai: 1.0,
        xacSuatHieuDung: 0,
        nangLucIRT: BKT_DEFAULTS.THETA_BASE,
        doBenTriNho: 1.0,
        soLanLuyen: 0,
        soLanDung: 0,
        soChuoiDung: 0,
        lanLuyenCuoi: null,
        ngayOnKeTiep: null,
        thongTinLich: {
          trangThaiLich: "CHUA_CO",
          vanBanLich: "Chưa luyện tập",
          soNgayConLai: 0,
          mauSacBadge: "text-slate-400 bg-slate-100 border-slate-200",
        },
        trangThai: "CHUA_HOC",
        nhanTrangThai: "Chưa luyện tập",
        mucDoGoiY: "NHAN_BIET",
        doKhoIRTMucTieu: tinhDoKhoMucTieuZPD(BKT_DEFAULTS.THETA_BASE),
      };
    }

    const doNho = tinhDoDuyTriTriNho(rec.lanLuyenCuoi, rec.doBenTriNho, now);
    const thetaEff = tinhThetaHieuDung(rec.nangLucIRT, doNho);
    const pEff = tinhDoThanhThaoThucTe(
      rec.xacSuatThanhThao,
      rec.soLanLuyen,
      rec.soLanDung,
      doNho,
      rec.soChuoiDung,
      rec.nangLucIRT,
      soCau
    );
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
      thongTinLich: dinhDangLichOnTapFSRS(rec.ngayOnKeTiep, rec.lanLuyenCuoi, now),
      trangThai,
      nhanTrangThai,
      mucDoGoiY: quyDoiThetaSangMucDo(thetaEff),
      doKhoIRTMucTieu: tinhDoKhoMucTieuZPD(thetaEff),
    };
  });
}

/**
 * 9. Bộ chọn câu hỏi thích ứng theo Vùng phát triển gần (ZPD Selector: P(correct) ~ 0.70)
 * Có tích hợp hệ số suy giảm trí nhớ R(t) thông qua năng lực hiệu dụng theta_eff:
 * - Khi học sinh lâu ngày quay lại (R(t) thấp), theta_eff giảm nhẹ giúp chọn câu hỏi
 *   khởi động vừa sức hơn thay vì ném ngay câu quá khó ở đỉnh phong độ cũ.
 */
export async function chonCauHoiThichUngZPD(params: {
  nguoiDungId?: string;
  chuDeId: string;
  dangBai?: string;
  excludeBaiTapId?: string;
}) {
  const { nguoiDungId, chuDeId, excludeBaiTapId } = params;
  let targetDangBai = params.dangBai;
  let lyDoChon = "Câu hỏi phù hợp với trình độ hiện tại của bạn";

  const nangLucList = await layNangLucTheoChuDe(nguoiDungId, chuDeId);

  // Nếu không chỉ định dangBai cụ thể, thuật toán tự động điều phối dạng bài tối ưu:
  if (!targetDangBai && nangLucList.length > 0) {
    // Ưu tiên 1: Dạng bài đang bị suy giảm trí nhớ (CAN_ON_LAI)
    const dangCanOn = nangLucList
      .filter((d) => d.trangThai === "CAN_ON_LAI" && d.soCauTrongNganHang > 0)
      .sort((a, b) => a.xacSuatHieuDung - b.xacSuatHieuDung)[0];

    if (dangCanOn) {
      targetDangBai = dangCanOn.dangBai;
      lyDoChon = `Ôn tập kịp thời: Khởi động lại dạng bài đang suy giảm trí nhớ (${Math.round(
        dangCanOn.doNhoHienTai * 100
      )}% ghi nhớ)`;
    } else {
      // Ưu tiên 2: Dạng bài đang rèn luyện dở dang trong vùng ZPD (chưa đạt 85%)
      const dangDangHoc = nangLucList
        .filter((d) => d.trangThai === "DANG_REN_LUYEN" && d.soCauTrongNganHang > 0)
        .sort((a, b) => a.xacSuatHieuDung - b.xacSuatHieuDung)[0];

      if (dangDangHoc) {
        targetDangBai = dangDangHoc.dangBai;
        lyDoChon = `Luyện tập thích ứng: Củng cố dạng bài để đạt ngưỡng làm chủ (hiện đạt ${Math.round(
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
  const rawTheta = nangLucDang ? nangLucDang.nangLucIRT : BKT_DEFAULTS.THETA_BASE;
  const doNho = nangLucDang ? nangLucDang.doNhoHienTai : 1.0;
  // Sử dụng năng lực hiệu dụng có điều chỉnh theo hệ số nhớ R(t)
  const thetaEff = tinhThetaHieuDung(rawTheta, doNho);

  if (params.dangBai && nangLucDang) {
    if (nangLucDang.trangThai === "CAN_ON_LAI") {
      lyDoChon = `Ôn tập khôi phục trí nhớ (${Math.round(
        nangLucDang.doNhoHienTai * 100
      )}% mức độ ghi nhớ)`;
    } else if (nangLucDang.trangThai === "THANH_THAO") {
      lyDoChon = `Đã nắm vững (${Math.round(
        nangLucDang.xacSuatHieuDung * 100
      )}%) • Câu hỏi thử thách nâng cao`;
    } else {
      lyDoChon = "Câu hỏi vừa sức trong vùng ZPD phù hợp với năng lực hiện tại";
    }
  }

  // Truy vấn danh sách câu hỏi ứng viên (bỏ cột dapAn nặng không cần thiết khi lọc ZPD)
  const candidates = await db.baiTap.findMany({
    where: {
      chuDeId,
      ...(targetDangBai ? { dangBai: targetDangBai } : {}),
      ...(excludeBaiTapId ? { id: { not: excludeBaiTapId } } : {}),
    },
    select: {
      id: true,
      loai: true,
      mucDo: true,
      dangBai: true,
      doKhoIRT: true,
      doPhanBiet: true,
      soLanLam: true,
      soLanDung: true,
    },
  });

  if (candidates.length === 0) {
    const fallback = await db.baiTap.findFirst({
      where: {
        chuDeId,
        ...(excludeBaiTapId ? { id: { not: excludeBaiTapId } } : {}),
      },
      select: {
        id: true,
        loai: true,
        doKhoIRT: true,
        doPhanBiet: true,
        dangBai: true,
      },
    });
    if (!fallback) return null;
    const cFallback = tinhXacSuatDoanMoC(fallback.loai);
    return {
      baiTapId: fallback.id,
      dangBai: fallback.dangBai,
      xacSuatDuDoan: tinhXacSuatIRT3PL(
        thetaEff,
        fallback.doKhoIRT,
        fallback.doPhanBiet,
        cFallback
      ),
      doKhoIRT: fallback.doKhoIRT,
      nangLucDang,
      lyDoChon,
    };
  }

  // Kiểm tra lịch sử làm bài của học sinh trên tập ứng viên
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

  // Chấm điểm từng câu hỏi theo khoảng cách ZPD |P(correct | theta_eff, b_i, a_i, c_i) - 0.70|
  const scored = candidates.map((item) => {
    const calibrated = chuanHoaThamSoCauHoi(
      item.mucDo,
      item.doKhoIRT,
      item.doPhanBiet,
      {
        loai: item.loai,
        soLanLam: item.soLanLam,
        soLanDung: item.soLanDung,
      }
    );
    const pCorrect = tinhXacSuatIRT3PL(
      thetaEff,
      calibrated.b,
      calibrated.a,
      calibrated.c
    );
    const zpdDist = Math.abs(pCorrect - BKT_DEFAULTS.ZPD_TARGET_PROB);

    let historyPenalty = 0;
    if (dueCardIds.has(item.id) && answeredWrongIds.has(item.id)) {
      // Câu từng làm sai và đã đến hạn ôn tập FSRS -> Ưu tiên cao
      historyPenalty = -0.12;
    } else if (!answeredCorrectIds.has(item.id) && !answeredWrongIds.has(item.id)) {
      // Câu mới chưa làm bao giờ -> Ưu tiên chuẩn ZPD
      historyPenalty = 0;
    } else if (answeredWrongIds.has(item.id)) {
      // Câu từng làm sai gần đây -> Phạt nhẹ để tránh lặp lại ngay lập tức câu vừa làm
      historyPenalty = 0.18;
    } else {
      // Câu đã làm đúng -> Chỉ chọn lại khi đã hết câu mới trong vùng ZPD
      historyPenalty = 0.65;
    }

    return {
      item,
      calibratedB: calibrated.b,
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
    doKhoIRT: best.calibratedB,
    nangLucDang,
    lyDoChon,
  };
}

