import { db } from "@/lib/db";

export interface ThongKeChuDe {
  chuDeId: string;
  tenChuDe: string;
  tongSoLam: number;
  soLanDung: number;
  doThanhThao: number; // smoothed: (dung + 2) / (tong + 4)
  tiLeDung: number;
  laDiemYeu: boolean;
  mucDoGoiY: "NHAN_BIET" | "THONG_HIEU" | "VAN_DUNG" | "VAN_DUNG_CAO";
}

/**
 * Phân tích năng lực học sinh và phát hiện điểm yếu theo phương pháp Adaptive Learning
 */
export async function phanTichDiemYeuHocSinh(nguoiDungId: string) {
  // Lấy toàn bộ lịch sử làm bài
  const lanLamBais = await db.lanLamBai.findMany({
    where: { nguoiDungId },
    include: {
      baiTap: {
        include: {
          chuDe: true,
        },
      },
    },
    orderBy: { thoiDiem: "desc" },
  });

  // Gom nhóm theo chủ đề
  const statsMap: Record<string, { ten: string; tong: number; dung: number; levels: Record<string, { tong: number; dung: number }> }> = {};

  for (const item of lanLamBais) {
    const cdId = item.baiTap.chuDeId;
    if (!statsMap[cdId]) {
      statsMap[cdId] = {
        ten: item.baiTap.chuDe.ten,
        tong: 0,
        dung: 0,
        levels: {
          NHAN_BIET: { tong: 0, dung: 0 },
          THONG_HIEU: { tong: 0, dung: 0 },
          VAN_DUNG: { tong: 0, dung: 0 },
          VAN_DUNG_CAO: { tong: 0, dung: 0 },
        },
      };
    }

    statsMap[cdId].tong += 1;
    const isCorrect = item.ketQua === "DUNG";
    if (isCorrect) statsMap[cdId].dung += 1;

    const lvl = item.baiTap.mucDo;
    if (statsMap[cdId].levels[lvl]) {
      statsMap[cdId].levels[lvl].tong += 1;
      if (isCorrect) statsMap[cdId].levels[lvl].dung += 1;
    }
  }

  const danhSachChuDe: ThongKeChuDe[] = [];
  const diemYeuList: ThongKeChuDe[] = [];

  for (const [cdId, stat] of Object.entries(statsMap)) {
    // Độ thành thạo có làm mượt Laplacian: (dung + 2) / (tong + 4)
    const doThanhThao = Number(((stat.dung + 2) / (stat.tong + 4)).toFixed(2));
    const tiLeDung = Number(((stat.dung / (stat.tong || 1)) * 100).toFixed(0));

    // Điểm yếu nếu thành thạo < 0.6 và đã làm ít nhất 3 bài
    const laDiemYeu = doThanhThao < 0.6 && stat.tong >= 3;

    // Xác định mức độ bài tập gợi ý thích ứng:
    let mucDoGoiY: "NHAN_BIET" | "THONG_HIEU" | "VAN_DUNG" | "VAN_DUNG_CAO" = "THONG_HIEU";
    if (doThanhThao < 0.45) {
      mucDoGoiY = "NHAN_BIET";
    } else if (doThanhThao < 0.7) {
      mucDoGoiY = "THONG_HIEU";
    } else if (doThanhThao < 0.85) {
      mucDoGoiY = "VAN_DUNG";
    } else {
      mucDoGoiY = "VAN_DUNG_CAO";
    }

    const item: ThongKeChuDe = {
      chuDeId: cdId,
      tenChuDe: stat.ten,
      tongSoLam: stat.tong,
      soLanDung: stat.dung,
      doThanhThao,
      tiLeDung,
      laDiemYeu,
      mucDoGoiY,
    };

    danhSachChuDe.push(item);
    if (laDiemYeu) diemYeuList.push(item);
  }

  // Gợi ý bài tập nhắm vào điểm yếu
  let baiTapGoiY: any[] = [];
  if (diemYeuList.length > 0) {
    const weakCdIds = diemYeuList.map((d) => d.chuDeId);
    baiTapGoiY = await db.baiTap.findMany({
      where: {
        chuDeId: { in: weakCdIds },
      },
      take: 6,
      include: { chuDe: true },
    });
  } else {
    // Nếu chưa có điểm yếu rõ ràng, lấy các bài tập mới để khảo sát
    baiTapGoiY = await db.baiTap.findMany({
      take: 6,
      include: { chuDe: true },
    });
  }

  return {
    tongBaiDaLam: lanLamBais.length,
    soBaiDung: lanLamBais.filter((l) => l.ketQua === "DUNG").length,
    danhSachChuDe,
    diemYeuList,
    baiTapGoiY,
  };
}

