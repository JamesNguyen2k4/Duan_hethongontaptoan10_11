import { db } from "../src/lib/db";
import { DANH_MUC_DANG_BAI_LOP10 } from "../src/lib/danh-muc-dang-bai/lop10";
import fs from "fs";

interface RawQuestion {
  id: string;
  chuDeId: string;
  deBai: string;
  loai: "TRAC_NGHIEM";
  mucDo: "NHAN_BIET" | "THONG_HIEU" | "VAN_DUNG" | "VAN_DUNG_CAO";
  dapAn: string;
  loiGiaiChiTiet: string;
  doKhoIRT: number;
  doPhanBiet: number;
  baiNum: number;
}

async function main() {
  console.log("=== BẮT ĐẦU NẠP NGÂN HÀNG CÂU HỎI TOÁN 10 ===");

  const jsonPath = "C:/Users/TruongND/.gemini/antigravity/brain/026ab1a3-8ad2-42bd-9bf3-9e3e7ca9278b/scratch/lop10_questions.json";
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Không tìm thấy file: ${jsonPath}`);
  }

  const rawList: RawQuestion[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`Đã đọc ${rawList.length} câu hỏi từ tệp trích xuất.`);

  // Gom theo chuDeId
  const byChuDe = new Map<string, RawQuestion[]>();
  for (const q of rawList) {
    if (!byChuDe.has(q.chuDeId)) {
      byChuDe.set(q.chuDeId, []);
    }
    byChuDe.get(q.chuDeId)!.push(q);
  }

  const preparedQuestions: any[] = [];

  for (const [chuDeId, questions] of byChuDe.entries()) {
    const config = DANH_MUC_DANG_BAI_LOP10[chuDeId];
    const dangs = config?.dangs || [];
    const numDangs = Math.max(1, dangs.length);

    console.log(`Bài ${config?.baiNum ?? chuDeId}: ${questions.length} câu, ${numDangs} dạng bài.`);

    questions.forEach((q, idx) => {
      // Phân bổ đều câu hỏi vào các dạng toán của bài học
      const dangIndex = Math.min(
        numDangs - 1,
        Math.floor((idx / questions.length) * numDangs)
      );
      const dangTen = dangs[dangIndex]?.ten || `Dạng ${dangIndex + 1}`;

      preparedQuestions.push({
        id: q.id,
        chuDeId: q.chuDeId,
        deBai: q.deBai,
        loai: q.loai,
        mucDo: q.mucDo,
        dapAn: q.dapAn,
        loiGiaiChiTiet: q.loiGiaiChiTiet,
        dangBai: dangTen,
        doKhoIRT: q.doKhoIRT,
        doPhanBiet: q.doPhanBiet,
      });
    });
  }

  console.log(`Tổng số câu hỏi sẵn sàng nạp: ${preparedQuestions.length}`);

  // Xóa sạch câu hỏi cũ của Toán 10 (nếu có)
  const existingIds = await db.baiTap.findMany({
    where: { chuDe: { chuong: { lopId: "lop-10" } } },
    select: { id: true },
  });
  if (existingIds.length > 0) {
    console.log(`Đang xóa ${existingIds.length} câu hỏi cũ của Toán 10...`);
    const idList = existingIds.map((e) => e.id);
    await db.theOnTap.deleteMany({ where: { baiTapId: { in: idList } } });
    await db.lanLamBai.deleteMany({ where: { baiTapId: { in: idList } } });
    await db.baiViet.deleteMany({ where: { baiTapId: { in: idList } } });
    await db.baiTap.deleteMany({ where: { id: { in: idList } } });
  }

  // Nạp theo lô 100 câu
  const batchSize = 100;
  for (let i = 0; i < preparedQuestions.length; i += batchSize) {
    const batch = preparedQuestions.slice(i, i + batchSize);
    await db.baiTap.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(`Đã nạp ${Math.min(i + batchSize, preparedQuestions.length)} / ${preparedQuestions.length} câu`);
  }

  // Kiểm tra tổng số câu trong DB
  const count10 = await db.baiTap.count({
    where: { chuDe: { chuong: { lopId: "lop-10" } } },
  });
  const totalAll = await db.baiTap.count();

  console.log("=== HOÀN TẤT NẠP BÀI TẬP TOÁN 10 ===");
  console.log(`Toán 10 hiện có: ${count10} câu hỏi.`);
  console.log(`Tổng toàn hệ thống: ${totalAll} câu hỏi.`);

  await db.$disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error("Lỗi khi nạp:", e);
  await db.$disconnect();
  process.exit(1);
});
