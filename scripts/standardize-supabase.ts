import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { preprocessMathContent } from "../src/lib/math-preprocess";

dotenv.config({ path: ".env.local", override: true });

const prisma = new PrismaClient();

async function main() {
  console.log("=== BẮT ĐẦU CHUẨN HÓA TOÀN BỘ CÂU HỎI VÀ LÝ THUYẾT TRÊN SUPABASE ===");

  // 1. Chuẩn hóa Lý thuyết (Bai)
  const bais = await prisma.bai.findMany();
  console.log(`Tìm thấy ${bais.length} bài học lý thuyết.`);
  let baiUpdated = 0;
  for (const b of bais) {
    const cleanNoiDung = preprocessMathContent(b.noiDung);
    if (cleanNoiDung !== b.noiDung) {
      await prisma.bai.update({
        where: { id: b.id },
        data: { noiDung: cleanNoiDung },
      });
      baiUpdated++;
    }
  }
  console.log(`Đã cập nhật ${baiUpdated}/${bais.length} bài học lý thuyết.`);

  // 2. Chuẩn hóa Câu hỏi (BaiTap)
  const totalQuestions = await prisma.baiTap.count();
  console.log(`Tổng số câu hỏi trong DB: ${totalQuestions}`);

  const batchSize = 100;
  let skip = 0;
  let totalUpdated = 0;

  while (skip < totalQuestions) {
    const questions = await prisma.baiTap.findMany({
      skip,
      take: batchSize,
      orderBy: { id: "asc" },
    });

    if (questions.length === 0) break;

    const updates = [];

    for (const q of questions) {
      const cleanDeBai = preprocessMathContent(q.deBai);
      const cleanLoiGiai = q.loiGiaiChiTiet ? preprocessMathContent(q.loiGiaiChiTiet) : q.loiGiaiChiTiet;

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
      } catch (err) {
        // Nếu dapAn không phải JSON thì chuẩn hóa chuỗi
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
      // Chạy theo từng nhóm nhỏ 20 để tránh timeout pooler
      const subBatchSize = 20;
      for (let i = 0; i < updates.length; i += subBatchSize) {
        const chunk = updates.slice(i, i + subBatchSize);
        await prisma.$transaction(chunk);
      }
      totalUpdated += updates.length;
    }

    skip += questions.length;
    process.stdout.write(`\rĐã quét: ${skip}/${totalQuestions} câu hỏi | Đã chuẩn hóa: ${totalUpdated} câu`);
  }

  console.log(`\n Hoàn tất! Tổng số câu hỏi đã chuẩn hóa: ${totalUpdated}/${totalQuestions}`);
}

main()
  .catch((e) => {
    console.error("Lỗi chuẩn hóa:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
