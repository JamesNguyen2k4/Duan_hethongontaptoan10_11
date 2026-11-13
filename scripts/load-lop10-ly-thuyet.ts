/**
 * Nạp 27 bài lý thuyết Toán 10 KNTT (đã biên soạn từ SGK Tập 1 & Tập 2) vào bảng `bai`.
 * Chỉ cập nhật các bản ghi `lop10-*`, không ảnh hưởng dữ liệu lớp 11.
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const MD_DIR =
  "C:\\Users\\TruongND\\.gemini\\antigravity\\brain\\026ab1a3-8ad2-42bd-9bf3-9e3e7ca9278b\\scratch\\sgk10\\md";

async function main() {
  const files = fs
    .readdirSync(MD_DIR)
    .filter((f) => /^lop10-c\d+-b\d+\.md$/.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/-b(\d+)\.md$/)?.[1] || "0", 10);
      const nb = parseInt(b.match(/-b(\d+)\.md$/)?.[1] || "0", 10);
      return na - nb;
    });

  let updated = 0;
  for (const file of files) {
    const baiId = file.replace(/\.md$/, "");
    const content = fs.readFileSync(path.join(MD_DIR, file), "utf8").trim();

    // Kiểm tra cân bằng dấu $ (loại trừ $$)
    const singleDollars = (content.replace(/\$\$/g, "").match(/\$/g) || []).length;
    if (singleDollars % 2 !== 0) {
      console.warn(`⚠️ ${baiId}: số dấu $ lẻ (${singleDollars})`);
    }

    const res = await db.bai.updateMany({
      where: { id: baiId },
      data: { noiDung: content },
    });

    if (res.count === 0) {
      console.warn(`⚠️ Không tìm thấy bản ghi bai.id = ${baiId}`);
    } else {
      updated++;
    }
  }

  console.log(`✅ Đã nạp thành công ${updated}/${files.length} bài lý thuyết Toán 10 vào DB.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

