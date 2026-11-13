/**
 * Khởi tạo khung 9 chương, 27 bài lý thuyết và 27 chủ đề luyện tập cho Toán 10 (KNTT).
 * Chỉ upsert bản ghi có tiền tố `lop10-`, tuyệt đối không ảnh hưởng dữ liệu lớp 11.
 * Chạy: npx tsx scripts/seed-lop10-structure.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  CHUONG_LOP10,
  DANH_MUC_DANG_BAI_LOP10,
} from "../src/lib/danh-muc-dang-bai/lop10";

const db = new PrismaClient();

async function main() {
  await db.lop.upsert({
    where: { id: "lop-10" },
    update: { ten: "Toán 10", thuTu: 1 },
    create: { id: "lop-10", ten: "Toán 10", thuTu: 1 },
  });

  for (const ch of CHUONG_LOP10) {
    await db.chuong.upsert({
      where: { id: ch.id },
      update: { ten: ch.ten, thuTu: ch.thuTu },
      create: { id: ch.id, lopId: "lop-10", ten: ch.ten, thuTu: ch.thuTu },
    });
  }

  let baiCount = 0;
  for (const cfg of Object.values(DANH_MUC_DANG_BAI_LOP10)) {
    const baiId = cfg.chuDeId.replace("-cd", "-b");
    const dangListMd = cfg.dangs
      .map((d) => `- **${d.ten}**: ${d.moTa}`)
      .join("\n");

    const defaultNoiDung = `# ${cfg.tenBai}\n\n## Các dạng toán trọng tâm\n\n${dangListMd}\n\n> Nội dung chi tiết và ví dụ mẫu đang được tiếp tục bổ sung từ bộ tài liệu Toán 10 KNTT.`;

    await db.bai.upsert({
      where: { id: baiId },
      update: { tieu_de: cfg.tenBai, thuTu: cfg.baiNum },
      create: {
        id: baiId,
        chuongId: cfg.chuongId,
        tieu_de: cfg.tenBai,
        noiDung: defaultNoiDung,
        thuTu: cfg.baiNum,
      },
    });

    await db.chuDe.upsert({
      where: { id: cfg.chuDeId },
      update: { ten: cfg.tenBai, thuTu: cfg.baiNum },
      create: {
        id: cfg.chuDeId,
        chuongId: cfg.chuongId,
        ten: cfg.tenBai,
        thuTu: cfg.baiNum,
      },
    });
    baiCount++;
  }

  console.log(
    `✅ Đã đồng bộ khung Toán 10: ${CHUONG_LOP10.length} chương, ${baiCount} bài học & chủ đề.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

