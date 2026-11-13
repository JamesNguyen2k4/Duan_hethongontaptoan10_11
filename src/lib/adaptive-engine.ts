import { db } from "@/lib/db";
import { DANH_MUC_DANG_BAI } from "@/lib/danh-muc-dang-bai";
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
 * LÕI HỌC THÍCH ỨNG LAI (BKT + IRT + PFA) & ÔN TẬP NGẮT QUÃNG FSRS
 * (Hybrid KT-IRT-PFA Adaptive Learning & FSRS Memory Scheduler)
 * ============================================================================
 * Tích hợp và chuẩn hóa 4 mô hình đo lường giáo dục & khoa học nhận thức:
 *
 * 1. Contextual BKT (Bayesian Knowledge Tracing - Corbett & Anderson, CMU;
 *    mở rộng KT-IDEM / Contextual Guess & Slip - Pardos & Heffernan):
 *    - Theo dõi trạng thái kiến thức ẩn P(L_t) qua chuỗi Markov ẩn (HMM).
 *    - Khắc phục điểm yếu "4 tham số cố định" của BKT cổ điển bằng cách tính động
 *      P(Guess), P(Slip) và P(Transit) dựa trên độ khó IRT (b_i), độ phân biệt (a_i)
 *      của từng câu hỏi và thời gian phản hồi thực tế của học sinh.
 *
 * 2. IRT 3PL (Item Response Theory 3-Parameter Logistic - Lord, 1980):
 *    - Ước lượng năng lực liên tục theta_k [-3, +3] của học sinh và độ khó chuẩn hóa
 *      b_i [-3, +3] của từng câu hỏi.
 *    - Khắc phục điểm yếu "chỉ 2 trạng thái rời rạc" của BKT bằng cách quy đổi
 *      năng lực liên tục sang xác suất làm chủ kỳ vọng P_IRT(theta_k).
 *    - Điều phối câu hỏi rơi vào Vùng phát triển gần (ZPD) với P(correct) ~ 0.70.
 *
 * 3. PFA (Performance Factor Analysis - Pavlik, Cen & Koedinger, 2009):
 *    - Mô hình hồi quy logistic theo dõi tích lũy số lần thành công (s) và thất bại (f)
 *      kèm chuỗi phong độ hiện tại (streak):
 *      m_PFA = beta_0 + gamma * s + rho * f + delta * streak
 *    - Dễ giải thích, phản ánh trực diện kết quả rèn luyện thực tế của học sinh.
 *
 * 4. Mô hình Trí nhớ Khoa học Hiện đại FSRS (Free Spaced Repetition Scheduler):
 *    - Theo dõi 3 trụ cột nhận thức: Retrievability (R), Stability (S), Difficulty (D).
 *    - Suy giảm trí nhớ theo định luật hàm mũ công suất:
 *      R(t, S) = (1 + 19/81 * (t / S))^(-0.5)
 *      với mức ghi nhớ mục tiêu R_target = 0.90 (tại t = S, R = 90%).
 *    - Tự động lập lịch khoảng cách ôn tập I = S ngày và kích hoạt ôn tập khi R(t) < 0.90.
 */

export const BKT_DEFAULTS = {
  P_L0: 0.12, // Xác suất biết trước ban đầu cho mô hình Bayes ẩn (Prior thấp khi bắt đầu câu 1)
  P_T_BASE: 0.08, // Tốc độ học cơ sở mỗi câu trung bình (được nhân hệ số độ khó của câu hỏi)
  P_G_BASE: 0.25, // Xác suất đoán mò cơ sở (trắc nghiệm 4 lựa chọn = 1/4)
  P_S_BASE: 0.08, // Xác suất sơ suất (Slip) cơ sở dù đã nắm kiến thức
  MASTERY_THRESHOLD: 0.85, // Ngưỡng công nhận Đã Thành Thạo (Mastered: 85%)
  MIN_PRACTICE_FOR_MASTERY: 10, // Số câu luyện tối thiểu để công nhận Thành thạo thực sự
  TARGET_SAMPLE_SIZE: 12, // Quy mô mẫu chuẩn cho 1 dạng bài để độ tin cậy mẫu đạt 100%
  REVIEW_DECAY_THRESHOLD: 0.90, // Ngưỡng suy giảm trí nhớ FSRS cần ôn lại (< 90%)
  ZPD_TARGET_PROB: 0.70, // Xác suất trả lời đúng tối ưu trong vùng ZPD (70%)
};

export type MucDoCauHoi =
  | "NHAN_BIET"
  | "THONG_HIEU"
  | "VAN_DUNG"
  | "VAN_DUNG_CAO";

/**
 * Chuẩn hóa Tham số Độ khó IRT (b_i), Độ phân biệt (a_i), Trọng số khó (w_i)
 * và Trần thành thạo tối đa theo Mức độ nhận thức (Bloom's Taxonomy):
 * - Nếu chỉ làm câu NHAN_BIET: Độ thành thạo tối đa của kỹ năng không thể vượt quá 40%.
 * - Nếu làm tới THONG_HIEU: Tối đa ~68%.
 * - Phải giải đúng các câu VAN_DUNG / VAN_DUNG_CAO mới vượt qua mốc 85% (Thành thạo).
 */
export function chuanHoaThamSoCauHoi(
  mucDo?: string | null,
  doKhoIRTGoc?: number | null,
  doPhanBietGoc?: number | null
): {
  b: number; // Độ khó IRT chuẩn [-2.5, +2.5]
  a: number; // Độ phân biệt IRT [0.8, 2.0]
  weight: number; // Hệ số bước nhảy theo độ khó (Difficulty Weight)
  thetaCeiling: number; // Trần năng lực IRT nếu chỉ giải mức độ này
} {
  let defaultB = -0.9;
  let defaultA = 1.0;
  let weight = 0.55;
  let thetaCeiling = -0.35; // Tương đương ~40% Mastery

  switch (mucDo) {
    case "NHAN_BIET":
      defaultB = -1.0;
      defaultA = 1.0;
      weight = 0.50; // Câu Nhận biết chỉ cộng bước nhảy nhỏ (~3% - 4%/câu)
      thetaCeiling = -0.35;
      break;
    case "THONG_HIEU":
      defaultB = -0.15;
      defaultA = 1.15;
      weight = 0.90; // Câu Thông hiểu cộng bước nhảy vừa (~5% - 6%/câu)
      thetaCeiling = 0.45;
      break;
    case "VAN_DUNG":
      defaultB = 0.75;
      defaultA = 1.3;
      weight = 1.35; // Câu Vận dụng chứng minh năng lực cao (~7% - 9%/câu)
      thetaCeiling = 1.45;
      break;
    case "VAN_DUNG_CAO":
      defaultB = 1.55;
      defaultA = 1.45;
      weight = 1.75; // Câu Vận dụng cao
      thetaCeiling = 2.5;
      break;
  }

  // Nếu doKhoIRT trong DB đang ở giá trị mặc định 0.0 chưa hiệu chỉnh thì dùng mốc chuẩn theo mucDo
  const hasCalibratedB =
    typeof doKhoIRTGoc === "number" && Math.abs(doKhoIRTGoc) > 0.001;
  const b = hasCalibratedB ? doKhoIRTGoc! : defaultB;
  const a =
    typeof doPhanBietGoc === "number" && doPhanBietGoc !== 1.0
      ? doPhanBietGoc
      : defaultA;

  // Điều chỉnh tinh trọng số theo b thực tế nếu câu hỏi đã được calibrate
  if (hasCalibratedB) {
    weight = Number(
      Math.max(0.4, Math.min(1.85, 0.95 + 0.45 * b)).toFixed(2)
    );
  }

  return { b, a, weight, thetaCeiling };
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
 * 6. Cập nhật hợp nhất BKT + IRT 3PL + FSRS Memory sau mỗi lần học sinh nộp 1 câu hỏi
 */
export async function capNhatMoHinhNguoiHoc(params: {
  nguoiDungId: string;
  baiTapId: string;
  chuDeId: string;
  dangBai: string | null;
  mucDo?: string | null;
  dung: boolean;
  thoiGianGiay: number;
  doKhoIRT?: number;
  doPhanBiet?: number;
  lopId?: string | null;
}) {
  const {
    nguoiDungId,
    baiTapId,
    chuDeId,
    mucDo,
    dung,
    thoiGianGiay,
    doKhoIRT: rawDoKhoIRT,
    doPhanBiet: rawDoPhanBiet,
  } = params;

  // Lớp của chủ đề – dùng để tách dữ liệu học tập theo lớp
  const lopId =
    params.lopId ??
    (
      await db.chuDe.findUnique({
        where: { id: chuDeId },
        select: { chuong: { select: { lopId: true } } },
      })
    )?.chuong.lopId ??
    null;

  // Chuẩn hóa độ khó IRT b_i, độ phân biệt a_i và trọng số bước nhảy theo Mức độ nhận thức (Bloom's Taxonomy)
  const itemParams = chuanHoaThamSoCauHoi(mucDo, rawDoKhoIRT, rawDoPhanBiet);
  const doKhoIRT = itemParams.b;
  const doPhanBiet = itemParams.a;
  const itemWeight = itemParams.weight;

  // Nếu câu hỏi chưa gán dangBai, lấy dạng 1 của chủ đề hoặc "Dạng chuẩn"
  const fallbackDang =
    DANH_MUC_DANG_BAI[chuDeId]?.dangs[0]?.ten || "Dạng 1. Kiến thức trọng tâm";
  const dangBai = params.dangBai || fallbackDang;

  const now = new Date();

  // Lấy hồ sơ năng lực hiện tại và số câu trong ngân hàng của dạng bài này
  const [hienTai, soCauTrongNganHang] = await Promise.all([
    db.nangLucDangBai.findUnique({
      where: {
        nguoiDungId_chuDeId_dangBai: {
          nguoiDungId,
          chuDeId,
          dangBai,
        },
      },
    }),
    db.baiTap.count({
      where: { chuDeId, dangBai },
    }),
  ]);

  const pLPrev = hienTai ? hienTai.xacSuatThanhThao : BKT_DEFAULTS.P_L0;
  const thetaPrev = hienTai ? hienTai.nangLucIRT : -1.0; // Khởi tạo từ mức cơ bản (Nhận biết) để tiến trình leo bậc chuẩn xác
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
    0.08,
    Math.min(0.98, pLPrev * (0.4 + 0.6 * retention))
  );

  // -------------------------------------------------------------------------
  // BƯỚC B: Cập nhật Contextual BKT phụ thuộc Độ khó câu hỏi (Difficulty-Weighted BKT)
  // -------------------------------------------------------------------------
  // Câu dễ (Nhận biết, b = -1.0): Xác suất đoán mò cao hơn (~29%), tốc độ học P(T) nhỏ (~0.04)
  // Câu khó (Vận dụng/VDC, b >= 0.75): Xác suất đoán mò thấp (~18%), tốc độ học P(T) lớn (~0.11 - 0.14)
  let pGuess = Math.max(
    0.12,
    Math.min(0.32, BKT_DEFAULTS.P_G_BASE - 0.045 * doKhoIRT)
  );
  let pSlip = Math.max(
    0.05,
    Math.min(0.20, BKT_DEFAULTS.P_S_BASE + 0.03 * doKhoIRT)
  );
  let pTransit = BKT_DEFAULTS.P_T_BASE * itemWeight;

  if (thoiGianGiay > 90) {
    pGuess = Math.min(0.35, pGuess + 0.05);
  } else if (thoiGianGiay > 0 && thoiGianGiay <= 30 && dung) {
    pGuess = Math.max(0.12, pGuess - 0.04);
    pSlip = Math.max(0.04, pSlip - 0.02);
  }

  let pPosterior = pPrior;
  if (dung) {
    const num = pPrior * (1 - pSlip);
    const den = num + (1 - pPrior) * pGuess;
    const rawBayes = den > 0 ? num / den : pPrior;
    // Điều tiết bước nhảy Bayes theo trọng số độ khó câu hỏi (damping factor):
    // Câu Nhận biết không làm P(L) nhảy vọt quá mức trong 1 lần thử đơn lẻ
    const bayesDamping = Math.min(0.85, 0.32 * itemWeight);
    pPosterior = pPrior + (rawBayes - pPrior) * bayesDamping;
  } else {
    const num = pPrior * pSlip;
    const den = num + (1 - pPrior) * (1 - pGuess);
    const rawBayes = den > 0 ? num / den : pPrior;
    // Nếu làm sai câu quá khó (Vận dụng cao), phạt nhẹ hơn; nếu làm sai câu cơ bản, giảm rõ hơn
    const failSeverity = Math.max(0.60, Math.min(0.95, 0.80 - 0.12 * doKhoIRT));
    pPosterior = pPrior - (pPrior - rawBayes) * failSeverity;
  }

  // Cập nhật chuyển trạng thái học tập P(T):
  // Chỉ cộng tốc độ tiếp thu học tập khi học sinh làm ĐÚNG; khi SAI không cộng bù để tránh triệt tiêu mức giảm
  const effectiveTransit = dung ? pTransit : 0;
  const pLNew = Number(
    Math.max(0.05, Math.min(0.98, pPosterior + (1 - pPosterior) * effectiveTransit)).toFixed(4)
  );

  // -------------------------------------------------------------------------
  // BƯỚC C: Cập nhật Năng lực IRT (theta_k) theo Độ khó chuẩn & Hiệu chỉnh b_i
  // -------------------------------------------------------------------------
  const pExpected = tinhXacSuatIRT3PL(thetaPrev, doKhoIRT, doPhanBiet, 0.25);
  const y = dung ? 1.0 : 0.0;

  // Hệ số cập nhật K_theta chuẩn hóa theo trọng số độ khó câu hỏi
  const baseK = Math.max(0.18, 0.32 / (1 + 0.04 * soLanLuyenPrev));
  let timeFactor = 1.0;
  if (dung && thoiGianGiay > 0 && thoiGianGiay <= 35) timeFactor = 1.1;
  else if (dung && thoiGianGiay > 90) timeFactor = 0.85;

  let deltaTheta = baseK * doPhanBiet * itemWeight * timeFactor * (y - pExpected);

  // Nếu chỉ làm câu dễ (ví dụ NHAN_BIET có thetaCeiling = -0.35), khi năng lực đã vượt trần của mức độ đó
  // thì làm thêm câu dễ chỉ tăng rất nhỏ (diminishing returns), buộc phải làm câu khó hơn để tăng độ thành thạo!
  if (dung && thetaPrev >= itemParams.thetaCeiling) {
    deltaTheta *= 0.25;
  }

  const thetaNew = Number(
    Math.max(-2.5, Math.min(2.5, thetaPrev + deltaTheta)).toFixed(3)
  );

  // Hiệu chỉnh nhẹ độ khó câu hỏi b_i từ phản hồi thực tế (Online Item Calibration)
  const deltaB = 0.02 * (pExpected - y);
  const bNew = Number(
    Math.max(-2.5, Math.min(2.5, doKhoIRT + deltaB)).toFixed(3)
  );

  // -------------------------------------------------------------------------
  // BƯỚC D: Cập nhật Mô hình Trí nhớ FSRS (Retrievability R, Stability S, Difficulty D)
  // -------------------------------------------------------------------------
  // Phân cấp mức đánh giá FSRS Grade:
  // 1: Again (Sai / Quên kiến thức)
  // 2: Hard (Đúng nhưng vất vả > 75s)
  // 3: Good (Đúng tốc độ tiêu chuẩn)
  // 4: Easy (Đúng nhanh <= 35s hoặc chinh phục thành công câu Vận dụng/VDC khó)
  let fsrsGrade: FSRSGrade = 3;
  if (!dung) {
    fsrsGrade = 1;
  } else if (thoiGianGiay > 75) {
    fsrsGrade = 2;
  } else if ((thoiGianGiay > 0 && thoiGianGiay <= 35) || doKhoIRT >= 0.75) {
    fsrsGrade = 4;
  } else {
    fsrsGrade = 3;
  }

  const elapsedDaysDang = lanLuyenCuoiPrev
    ? Math.max(
        0,
        (now.getTime() - new Date(lanLuyenCuoiPrev).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  // Difficulty D trong FSRS có miền [1.0 .. 10.0] (mặc định 5.0)
  // Nếu dữ liệu cũ đang lưu EF từ SM-2 (<= 3.0), tự động quy đổi về mốc chuẩn FSRS 5.0
  const currentDifficulty =
    efPrev > 3.0 ? efPrev : FSRS_CONFIG.DEFAULT_DIFFICULTY;

  const fsrsDang = tinhToanFSRS({
    currentStability: stabilityPrev,
    currentDifficulty,
    elapsedDays: elapsedDaysDang,
    grade: fsrsGrade,
    reps: soLanLuyenPrev,
    desiredRetention: FSRS_CONFIG.TARGET_RETENTION,
    now,
  });

  const stabilityNew = fsrsDang.stability;
  const dNew = fsrsDang.difficulty;
  const intervalDays = fsrsDang.intervalDays;
  const ngayOnKeTiep = fsrsDang.ngayOnKeTiep;
  const soChuoiDungNew = dung ? soChuoiDungPrev + 1 : 0;

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

  // 3. Đồng bộ thẻ ôn tập cấp câu hỏi (TheOnTap) theo chuẩn FSRS
  await capNhatTheOnTapFSRS(nguoiDungId, baiTapId, fsrsGrade, now, lopId);

  const soLanLuyenMoi = soLanLuyenPrev + 1;
  const soLanDungMoi = soLanDungPrev + (dung ? 1 : 0);

  const retentionMoi = dung ? 1.0 : Math.min(retention, 0.92);

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

  // Đảm bảo tính nhất quán logic: Khi làm SAI thì độ thành thạo không bao giờ được cao hơn trước khi làm
  if (!dung && pEffMoi >= pEffTruoc && pEffTruoc > 0) {
    pEffMoi = Number(Math.max(0.01, pEffTruoc - 0.02).toFixed(4));
  }

  const { trangThai, nhanTrangThai } = phanLoaiTrangThaiDangBai(
    soLanLuyenMoi,
    pLNew,
    pEffMoi,
    1.0,
    ngayOnKeTiep,
    now
  );

  return {
    dangBai,
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
        xacSuatThanhThao: 0,
        doNhoHienTai: 1.0,
        xacSuatHieuDung: 0,
        nangLucIRT: -1.0,
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
        doKhoIRTMucTieu: tinhDoKhoMucTieuZPD(-1.0),
      };
    }

    const doNho = tinhDoDuyTriTriNho(rec.lanLuyenCuoi, rec.doBenTriNho, now);
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
      lyDoChon = `Ôn tập kịp thời: Dạng bài này bạn nên củng cố lại kiến thức (${Math.round(
        dangCanOn.xacSuatHieuDung * 100
      )}%)`;
    } else {
      // Ưu tiên 2: Dạng bài đang rèn luyện dở dang trong vùng ZPD (chưa đạt 85%)
      const dangDangHoc = nangLucList
        .filter((d) => d.trangThai === "DANG_REN_LUYEN" && d.soCauTrongNganHang > 0)
        .sort((a, b) => a.xacSuatHieuDung - b.xacSuatHieuDung)[0];

      if (dangDangHoc) {
        targetDangBai = dangDangHoc.dangBai;
        lyDoChon = `Luyện tập thích ứng: Củng cố dạng bài để đạt mức thành thạo (hiện đạt ${Math.round(
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
  const theta = nangLucDang ? nangLucDang.nangLucIRT : -1.0;
  const bTarget = tinhDoKhoMucTieuZPD(theta, BKT_DEFAULTS.ZPD_TARGET_PROB);

  if (params.dangBai && nangLucDang) {
    if (nangLucDang.trangThai === "CAN_ON_LAI") {
      lyDoChon = `Ôn tập củng cố kiến thức (${Math.round(
        nangLucDang.doNhoHienTai * 100
      )}% mức độ ghi nhớ)`;
    } else if (nangLucDang.trangThai === "THANH_THAO") {
      lyDoChon = `Đã nắm vững (${Math.round(
        nangLucDang.xacSuatHieuDung * 100
      )}%) • Câu hỏi thử thách nâng cao`;
    } else {
      lyDoChon = "Câu hỏi vừa sức, phù hợp với năng lực hiện tại của bạn";
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
  // Sử dụng tham số độ khó chuẩn hóa theo Mức độ nhận thức (NHAN_BIET -> VAN_DUNG_CAO)
  const scored = candidates.map((item) => {
    const calibrated = chuanHoaThamSoCauHoi(
      item.mucDo,
      item.doKhoIRT,
      item.doPhanBiet
    );
    const pCorrect = tinhXacSuatIRT3PL(theta, calibrated.b, calibrated.a, 0.25);
    const zpdDist = Math.abs(pCorrect - BKT_DEFAULTS.ZPD_TARGET_PROB);

    let historyPenalty = 0;
    if (dueCardIds.has(item.id) && answeredWrongIds.has(item.id)) {
      // Câu từng làm sai và đã đến hạn ôn tập FSRS -> Ưu tiên cao!
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

