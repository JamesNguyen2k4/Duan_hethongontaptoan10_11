/**
 * Backfill cột lopId cho dữ liệu học tập cũ (trước khi tách lớp 10 / 11).
 * Chạy: npx tsx scripts/backfill-lop-id.ts
 * An toàn khi chạy lại nhiều lần (idempotent).
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const r1 = await db.$executeRawUnsafe(`
    UPDATE lan_lam_bai l
    JOIN bai_tap bt ON bt.id = l.baiTapId
    JOIN chu_de cd ON cd.id = bt.chuDeId
    JOIN chuong c ON c.id = cd.chuongId
    SET l.lopId = c.lopId
    WHERE l.lopId IS NULL OR l.lopId <> c.lopId`);

  const r2 = await db.$executeRawUnsafe(`
    UPDATE the_on_tap t
    JOIN bai_tap bt ON bt.id = t.baiTapId
    JOIN chu_de cd ON cd.id = bt.chuDeId
    JOIN chuong c ON c.id = cd.chuongId
    SET t.lopId = c.lopId
    WHERE t.lopId IS NULL OR t.lopId <> c.lopId`);

  const r3 = await db.$executeRawUnsafe(`
    UPDATE nang_luc_dang_bai n
    JOIN chu_de cd ON cd.id = n.chuDeId
    JOIN chuong c ON c.id = cd.chuongId
    SET n.lopId = c.lopId
    WHERE n.lopId IS NULL OR n.lopId <> c.lopId`);

  const r4 = await db.$executeRawUnsafe(`
    UPDATE tien_do td
    JOIN bai b ON b.id = td.baiId
    JOIN chuong c ON c.id = b.chuongId
    SET td.lopId = c.lopId
    WHERE td.lopId IS NULL OR td.lopId <> c.lopId`);

  // Bài viết: ưu tiên chủ đề, sau đó bài tập, cuối cùng mặc định lớp 11 (dữ liệu cũ)
  const r5 = await db.$executeRawUnsafe(`
    UPDATE bai_viet bv
    JOIN chu_de cd ON cd.id = bv.chuDeId
    JOIN chuong c ON c.id = cd.chuongId
    SET bv.lopId = c.lopId
    WHERE bv.lopId IS NULL`);
  const r6 = await db.$executeRawUnsafe(`
    UPDATE bai_viet bv
    JOIN bai_tap bt ON bt.id = bv.baiTapId
    JOIN chu_de cd ON cd.id = bt.chuDeId
    JOIN chuong c ON c.id = cd.chuongId
    SET bv.lopId = c.lopId
    WHERE bv.lopId IS NULL`);
  const r7 = await db.$executeRawUnsafe(
    `UPDATE bai_viet SET lopId = 'lop-11' WHERE lopId IS NULL`
  );

  const r8 = await db.$executeRawUnsafe(
    `UPDATE nguoi_dung SET lopDangHocId = 'lop-11' WHERE lopDangHocId IS NULL`
  );

  console.log({
    lanLamBai: r1,
    theOnTap: r2,
    nangLucDangBai: r3,
    tienDo: r4,
    baiViet: r5 + r6 + r7,
    nguoiDung: r8,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

