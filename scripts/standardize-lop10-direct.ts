import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { preprocessMathContent } from "../src/lib/math-preprocess";

dotenv.config({ path: ".env.local", override: true });
const prisma = new PrismaClient();

async function main() {
  console.log("=== CHUẨN HÓA TRỰC TIẾP TOÀN BỘ 933 CÂU HỎI LỚP 10 TRÊN SUPABASE ===");

  const lop10Questions = await prisma.baiTap.findMany({
    where: { id: { startsWith: "bt-lop10" } },
    orderBy: { id: "asc" },
  });

  console.log(`Tìm thấy ${lop10Questions.length} câu hỏi Lớp 10.`);

  const updates = [];
  for (const q of lop10Questions) {
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
      cleanDapAn = preprocessMathContent(q.dapAn);
    }

    if (
      cleanDeBai !== q.deBai ||
      cleanLoiGiai !== q.loiGiaiChiTiet ||
      cleanDapAn !== q.dapAn
    ) {
      updates.push({
        id: q.id,
        deBai: cleanDeBai,
        loiGiaiChiTiet: cleanLoiGiai,
        dapAn: cleanDapAn,
      });
    }
  }

  console.log(`Có ${updates.length} câu hỏi Lớp 10 cần cập nhật.`);

  // Chạy cập nhật theo chunk 25
  const chunkSize = 25;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    await prisma.$transaction(
      chunk.map((item) =>
        prisma.baiTap.update({
          where: { id: item.id },
          data: {
            deBai: item.deBai,
            loiGiaiChiTiet: item.loiGiaiChiTiet,
            dapAn: item.dapAn,
          },
        })
      )
    );
    process.stdout.write(`\rĐã cập nhật: ${Math.min(i + chunkSize, updates.length)}/${updates.length} câu`);
  }

  console.log(`\n Hoàn tất chuẩn hóa toàn bộ câu hỏi Lớp 10!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
