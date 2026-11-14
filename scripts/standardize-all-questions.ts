import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { preprocessMathContent } from "../src/lib/math-preprocess";

dotenv.config({ path: ".env.local", override: true });

const prisma = new PrismaClient();

async function main() {
  console.log("=== BẮT ĐẦU RÀ SOÁT & CHUẨN HÓA TOÀN BỘ NGÂN HÀNG CÂU HỎI LỚP 10 & 11 ===");

  const total = await prisma.baiTap.count();
  console.log(`Tổng số câu hỏi cần rà soát: ${total} câu.`);

  const batchSize = 100;
  let skip = 0;
  let totalUpdated = 0;

  while (skip < total) {
    const questions = await prisma.baiTap.findMany({
      skip,
      take: batchSize,
      orderBy: { id: "asc" },
    });

    if (questions.length === 0) break;

    const updates: any[] = [];

    for (const q of questions) {
      const cleanDeBai = preprocessMathContent(q.deBai);
      const cleanLoiGiai = q.loiGiaiChiTiet
        ? preprocessMathContent(q.loiGiaiChiTiet)
        : q.loiGiaiChiTiet;

      let cleanDapAn = q.dapAn;
      try {
        const parsed = JSON.parse(q.dapAn);
        if (parsed.cacLuaChon && typeof parsed.cacLuaChon === "object") {
          let choicesChanged = false;
          const newChoices: Record<string, string> = {};
          for (const [k, v] of Object.entries(parsed.cacLuaChon)) {
            const cleanVal = preprocessMathContent(v as string);
            newChoices[k] = cleanVal;
            if (cleanVal !== v) choicesChanged = true;
          }
          if (choicesChanged) {
            parsed.cacLuaChon = newChoices;
            cleanDapAn = JSON.stringify(parsed);
          }
        }
      } catch {
        cleanDapAn = preprocessMathContent(q.dapAn);
      }

      const hasChange =
        cleanDeBai !== q.deBai ||
        cleanLoiGiai !== q.loiGiaiChiTiet ||
        cleanDapAn !== q.dapAn;

      if (hasChange) {
        updates.push(
          prisma.baiTap.update({
            where: { id: q.id },
            data: {
              deBai: cleanDeBai,
              loiGiaiChiTiet: cleanLoiGiai,
              dapAn: cleanDapAn,
            },
          })
        );
      }
    }

    if (updates.length > 0) {
      const subBatch = 20;
      for (let i = 0; i < updates.length; i += subBatch) {
        const chunk = updates.slice(i, i + subBatch);
        await prisma.$transaction(chunk);
      }
      totalUpdated += updates.length;
      console.log(`Đã cập nhật ${totalUpdated} câu hỏi (tiến độ: ${Math.min(skip + batchSize, total)}/${total})...`);
    }

    skip += batchSize;
  }

  console.log(`\n🎉 HOÀN TẤT CHUẨN HÓA CÂU HỎI: Đã cập nhật thành công ${totalUpdated}/${total} câu hỏi!`);
}

main()
  .catch((e) => {
    console.error("Lỗi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
