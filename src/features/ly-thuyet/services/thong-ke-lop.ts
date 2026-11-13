import { cache } from "react";
import { db } from "@/lib/db";

/** Thống kê nội dung (chương / bài / câu hỏi / dạng) của một lớp – lấy động từ DB. */
export const layThongKeNoiDungLop = cache(async (lopId: string) => {
  const [soChuong, soBai, soCauHoi, dangs] = await Promise.all([
    db.chuong.count({ where: { lopId } }),
    db.bai.count({ where: { chuong: { lopId } } }),
    db.baiTap.count({ where: { chuDe: { chuong: { lopId } } } }),
    db.baiTap.groupBy({
      by: ["chuDeId", "dangBai"],
      where: { chuDe: { chuong: { lopId } }, dangBai: { not: null } },
    }),
  ]);

  return { soChuong, soBai, soCauHoi, soDangBai: dangs.length };
});

