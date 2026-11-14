import { db } from '../src/lib/db'
import {
  BKT_DEFAULTS,
  tinhXacSuatIRT3PL,
  tinhXacSuatPFA,
  tinhDoDuyTriTriNho,
  chuanHoaThamSoCauHoi,
  tinhThetaHieuDung,
  capNhatMoHinhNguoiHoc,
} from '../src/lib/adaptive-engine'
import { DANH_MUC_DANG_BAI } from '../src/lib/danh-muc-dang-bai'

function clampProb(p: number): number {
  return Math.max(0.001, Math.min(0.999, p))
}

function computeAUC(labels: number[], preds: number[]): number {
  const pairs = labels.map((y, i) => ({ y, p: preds[i] }))
  const pos = pairs.filter((x) => x.y === 1)
  const neg = pairs.filter((x) => x.y === 0)
  if (pos.length === 0 || neg.length === 0) return 0.5

  let concordant = 0
  for (const p of pos) {
    for (const n of neg) {
      if (p.p > n.p) concordant += 1
      else if (Math.abs(p.p - n.p) < 1e-9) concordant += 0.5
    }
  }
  return concordant / (pos.length * neg.length)
}

function evaluatePredictions(name: string, labels: number[], preds: number[]) {
  const n = labels.length
  if (n === 0) return { name, n: 0, logLoss: 0, brier: 0, auc: 0.5, ece: 0 }

  let logLossSum = 0
  let brierSum = 0
  const bins = Array.from({ length: 5 }, () => ({ count: 0, sumPred: 0, sumActual: 0 }))

  for (let i = 0; i < n; i++) {
    const y = labels[i]
    const p = clampProb(preds[i])
    logLossSum += -(y * Math.log(p) + (1 - y) * Math.log(1 - p))
    brierSum += Math.pow(p - y, 2)

    const binIdx = Math.min(4, Math.floor(p * 5))
    bins[binIdx].count += 1
    bins[binIdx].sumPred += p
    bins[binIdx].sumActual += y
  }

  let ece = 0
  for (const b of bins) {
    if (b.count > 0) {
      ece += (b.count / n) * Math.abs(b.sumPred / b.count - b.sumActual / b.count)
    }
  }

  return {
    name,
    n,
    logLoss: Number((logLossSum / n).toFixed(4)),
    brier: Number((brierSum / n).toFixed(4)),
    auc: Number(computeAUC(labels, preds).toFixed(4)),
    ece: Number(ece.toFixed(4)),
  }
}

async function main() {
  console.log('=== ĐÁNH GIÁ OFFLINE (PREQUENTIAL VALIDATION) & HIỆU CHỈNH DỮ LIỆU ===\n')

  const attempts = await db.lanLamBai.findMany({
    include: {
      baiTap: {
        select: {
          id: true,
          chuDeId: true,
          dangBai: true,
          mucDo: true,
          loai: true,
          dapAn: true,
          doKhoIRT: true,
          doPhanBiet: true,
          chuDe: {
            select: {
              chuong: {
                select: { lopId: true },
              },
            },
          },
        },
      },
    },
    orderBy: { thoiDiem: 'asc' },
  })

  console.log(`Tổng số lượt làm bài thực tế trong DB: ${attempts.length}`)

  // Trạng thái theo dõi cho 4 mô hình đánh giá prequential (dự đoán lượt tiếp theo trước khi cập nhật)
  // 1. Baseline Empirical Pass Rate (Laplace-smoothed per user-skill)
  const empSkillState = new Map<string, { total: number; correct: number }>()
  // 2. Baseline Pure PFA
  const pfaSkillState = new Map<string, { correct: number; fail: number; streak: number }>()
  // 3. Baseline Pure IRT 3PL (Bloom prior tĩnh, c cố định 0.25)
  const irtThetaState = new Map<string, { theta: number; total: number }>()
  // 4. Mô hình Hybrid Cải tiến (Dynamic c, Elo item difficulty, BKT error learning, Surprise-Modulated FSRS, ZPD Forgetting)
  const hybridState = new Map<
    string,
    {
      theta: number
      pLearnBkt: number
      correct: number
      fail: number
      streak: number
      stability: number
      lastTime: Date | null
      total: number
    }
  >()
  const hybridItemState = new Map<string, { b: number; count: number; correct: number }>()

  const labels: number[] = []
  const predsEmpirical: number[] = []
  const predsPFA: number[] = []
  const predsIRT: number[] = []
  const predsHybrid: number[] = []

  for (const att of attempts) {
    const bt = att.baiTap
    if (!bt || !bt.chuDeId) continue

    const isCorrect = att.ketQua === 'DUNG'
    const y = isCorrect ? 1 : 0
    labels.push(y)

    const fallbackDang =
      DANH_MUC_DANG_BAI[bt.chuDeId]?.dangs[0]?.ten || 'Dạng 1. Kiến thức trọng tâm'
    const dangBai = bt.dangBai || fallbackDang
    const skillKey = `${att.nguoiDungId}::${bt.chuDeId}::${dangBai}`
    const mucDo = bt.mucDo || 'THONG_HIEU'

    // --- 1. Baseline Empirical ---
    const emp = empSkillState.get(skillKey) ?? { total: 0, correct: 0 }
    const pEmp = (emp.correct + 1) / (emp.total + 2)
    predsEmpirical.push(pEmp)
    emp.total += 1
    emp.correct += y
    empSkillState.set(skillKey, emp)

    // --- 2. Baseline Pure PFA ---
    const pfa = pfaSkillState.get(skillKey) ?? { correct: 0, fail: 0, streak: 0 }
    const bloomParams = chuanHoaThamSoCauHoi(mucDo)
    const pPfa =
      pfa.correct + pfa.fail === 0
        ? 0.35
        : tinhXacSuatPFA(pfa.correct, pfa.fail, pfa.streak, bloomParams.b)
    predsPFA.push(pPfa)
    if (isCorrect) {
      pfa.correct += 1
      pfa.streak += 1
    } else {
      pfa.fail += 1
      pfa.streak = 0
    }
    pfaSkillState.set(skillKey, pfa)

    // --- 3. Baseline Pure IRT (Bloom cố định, c = 0.25) ---
    const irtUser = irtThetaState.get(skillKey) ?? { theta: BKT_DEFAULTS.THETA_BASE, total: 0 }
    const pIrt = tinhXacSuatIRT3PL(irtUser.theta, bloomParams.b, bloomParams.a, 0.25)
    predsIRT.push(pIrt)
    const kUser = Math.max(0.16, 0.32 / (1 + 0.04 * irtUser.total))
    irtUser.theta = Math.max(
      -2.5,
      Math.min(2.5, irtUser.theta + kUser * bloomParams.a * bloomParams.weight * (y - pIrt))
    )
    irtUser.total += 1
    irtThetaState.set(skillKey, irtUser)

    // --- 4. Mô hình Hybrid Cải tiến ---
    const hyb = hybridState.get(skillKey) ?? {
      theta: BKT_DEFAULTS.THETA_BASE,
      pLearnBkt: BKT_DEFAULTS.P_L0,
      correct: 0,
      fail: 0,
      streak: 0,
      stability: 1.0,
      lastTime: null,
      total: 0,
    }
    const hybItem = hybridItemState.get(bt.id) ?? {
      b: bloomParams.b,
      count: 0,
      correct: 0,
    }

    const itemParams = chuanHoaThamSoCauHoi(
      mucDo,
      hybItem.count > 0 ? hybItem.b : null,
      bt.doPhanBiet,
      {
        loai: bt.loai,
        dapAnJson: bt.dapAn,
        soLanLam: hybItem.count,
        soLanDung: hybItem.correct,
      }
    )

    const retentionBefore = tinhDoDuyTriTriNho(hyb.lastTime, hyb.stability, att.thoiDiem)
    const thetaEffBefore = tinhThetaHieuDung(hyb.theta, retentionBefore)
    const pPrior = Math.max(0.08, Math.min(0.98, hyb.pLearnBkt * (0.4 + 0.6 * retentionBefore)))

    const pIrtHyb = tinhXacSuatIRT3PL(thetaEffBefore, itemParams.b, itemParams.a, itemParams.c)
    const pGuess =
      itemParams.c <= 0.05
        ? itemParams.c
        : Math.max(
            itemParams.c * 0.68,
            Math.min(itemParams.c * 1.18, itemParams.c - 0.03 * itemParams.b)
          )
    const pSlip = Math.max(
      0.05,
      Math.min(0.2, BKT_DEFAULTS.P_S_BASE + 0.03 * itemParams.b)
    )
    const pBktObs = pPrior * (1 - pSlip) + (1 - pPrior) * pGuess
    const pPfaHyb =
      hyb.total === 0
        ? pBktObs
        : tinhXacSuatPFA(hyb.correct, hyb.fail, hyb.streak, thetaEffBefore)

    // Dự đoán xác suất trả lời đúng lượt kế tiếp (kết hợp PFA lịch sử làm bài + BKT trạng thái ẩn + IRT hiệu chỉnh Elo)
    const pHybPred = 0.45 * pPfaHyb + 0.30 * pBktObs + 0.25 * pIrtHyb
    predsHybrid.push(pHybPred)

    // Cập nhật trạng thái Hybrid sau lượt làm
    const pTransit = BKT_DEFAULTS.P_T_BASE * itemParams.weight
    let pPosterior = pPrior
    if (isCorrect) {
      const num = pPrior * (1 - pSlip)
      const den = num + (1 - pPrior) * pGuess
      const rawBayes = den > 0 ? num / den : pPrior
      const bayesDamping = Math.min(0.85, 0.35 * itemParams.weight)
      pPosterior = pPrior + (rawBayes - pPrior) * bayesDamping
      hyb.correct += 1
      hyb.streak += 1
    } else {
      const num = pPrior * pSlip
      const den = num + (1 - pPrior) * (1 - pGuess)
      const rawBayes = den > 0 ? num / den : pPrior
      const failSeverity = Math.max(0.55, Math.min(0.92, 0.78 - 0.12 * itemParams.b))
      pPosterior = pPrior - (pPrior - rawBayes) * failSeverity
      hyb.fail += 1
      hyb.streak = 0
    }

    const effectiveTransit = isCorrect
      ? pTransit
      : pTransit * BKT_DEFAULTS.P_T_WRONG_FACTOR
    hyb.pLearnBkt = Math.max(
      0.05,
      Math.min(0.98, pPosterior + (1 - pPosterior) * effectiveTransit)
    )

    const kHybUser = Math.max(0.16, 0.32 / (1 + 0.04 * hyb.total))
    let deltaTheta = kHybUser * itemParams.a * itemParams.weight * (y - pIrtHyb)
    if (isCorrect && hyb.theta >= itemParams.thetaCeiling) {
      deltaTheta *= 0.25
    }
    hyb.theta = Math.max(-2.5, Math.min(2.5, hyb.theta + deltaTheta))

    if (isCorrect) {
      const surpriseGain = Math.max(0.15, 1 - pIrtHyb)
      hyb.stability = Math.min(
        180,
        Math.max(1.0, hyb.stability * (1 + 0.85 * surpriseGain * itemParams.weight))
      )
    } else if (pIrtHyb >= BKT_DEFAULTS.SURPRISE_LAPSE_THRESHOLD) {
      hyb.stability = Math.max(0.5, hyb.stability * 0.45)
    } else {
      hyb.stability = Math.max(0.5, hyb.stability * 0.94)
    }

    hyb.lastTime = att.thoiDiem
    hyb.total += 1
    hybridState.set(skillKey, hyb)

    const kHybItem = Math.max(0.025, 0.16 / (1 + 0.06 * hybItem.count))
    hybItem.b = Math.max(-2.5, Math.min(2.5, itemParams.b + kHybItem * (pIrtHyb - y)))
    hybItem.count += 1
    hybItem.correct += y
    hybridItemState.set(bt.id, hybItem)
  }

  const results = [
    evaluatePredictions('1. Baseline: Empirical Pass Rate', labels, predsEmpirical),
    evaluatePredictions('2. Baseline: Pure PFA', labels, predsPFA),
    evaluatePredictions('3. Baseline: Pure IRT 3PL (Bloom tĩnh, c=0.25)', labels, predsIRT),
    evaluatePredictions('4. Hybrid Cải tiến (IRT+Elo+BKT+FSRS)', labels, predsHybrid),
  ]

  console.table(results)

  // === PHẦN 2: ĐỒNG BỘ LẠI TOÀN BỘ DỮ LIỆU TRONG DATABASE THEO MÔ HÌNH MỚI ===
  console.log(
    '\nĐang tái đồng bộ (recalibrate) bảng NangLucDangBai, TheOnTap và BaiTap từ lịch sử LanLamBai...'
  )

  await db.nangLucDangBai.deleteMany({})
  await db.theOnTap.deleteMany({})

  // Reset thống kê số lần làm và doKhoIRT về 0 trước khi replay
  await db.baiTap.updateMany({
    data: {
      soLanLam: 0,
      soLanDung: 0,
      doKhoIRT: 0,
    },
  })

  let replayed = 0
  for (const att of attempts) {
    const bt = att.baiTap
    if (!bt || !bt.chuDeId) continue

    // Đọc trạng thái mới nhất của câu hỏi (vì capNhatMoHinhNguoiHoc tự động cập nhật soLanLam & doKhoIRT)
    const freshBt = await db.baiTap.findUnique({
      where: { id: bt.id },
      select: {
        doKhoIRT: true,
        doPhanBiet: true,
        loai: true,
        dapAn: true,
        soLanLam: true,
        soLanDung: true,
      },
    })

    await capNhatMoHinhNguoiHoc({
      nguoiDungId: att.nguoiDungId,
      baiTapId: bt.id,
      chuDeId: bt.chuDeId,
      dangBai: bt.dangBai,
      mucDo: bt.mucDo,
      loai: freshBt?.loai ?? bt.loai,
      dapAnJson: freshBt?.dapAn ?? bt.dapAn,
      dung: att.ketQua === 'DUNG',
      thoiGianGiay: att.thoiGianGiay ?? 30,
      doKhoIRT: freshBt?.doKhoIRT ?? 0,
      doPhanBiet: freshBt?.doPhanBiet ?? bt.doPhanBiet,
      soLanLam: freshBt?.soLanLam ?? 0,
      soLanDung: freshBt?.soLanDung ?? 0,
      lopId: att.lopId ?? bt.chuDe?.chuong.lopId ?? null,
      thoiDiem: att.thoiDiem,
    })

    replayed += 1
  }

  const totalSkills = await db.nangLucDangBai.count()
  console.log(
    `Hoàn tất tái tính toán ${replayed} lượt làm bài -> Cập nhật ${totalSkills} bản ghi NangLucDangBai!`
  )

  const sampleSkills = await db.nangLucDangBai.findMany({
    include: {
      chuDe: {
        select: {
          ten: true,
          chuong: { select: { lop: { select: { ten: true } } } },
        },
      },
    },
    orderBy: { capNhatLuc: 'desc' },
    take: 10,
  })

  console.log('\nMẫu trạng thái NangLucDangBai sau khi hiệu chỉnh:')
  for (const s of sampleSkills) {
    console.log(
      `- [${s.chuDe.chuong.lop.ten}] ${s.chuDe.ten} (${s.dangBai}): P(L) BKT = ${(s.xacSuatThanhThao * 100).toFixed(1)}%, θ = ${s.nangLucIRT.toFixed(2)}, Độ bền S = ${s.doBenTriNho.toFixed(2)} ngày (${s.soLanDung}/${s.soLanLuyen} câu đúng)`
    )
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
