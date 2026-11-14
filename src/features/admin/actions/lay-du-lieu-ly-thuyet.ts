"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export interface BaiLyThuyetTreeNode {
  id: string;
  tieu_de: string;
  thuTu: number;
}

export interface ChuongLyThuyetTreeNode {
  id: string;
  ten: string;
  thuTu: number;
  lopId: string;
  danhSachBai: BaiLyThuyetTreeNode[];
}

/**
 * 1. Lấy cây danh mục Lý thuyết theo Lớp: Lớp -> Chương -> Bài học
 */
export async function layCayLyThuyetAdminAction(lopId: string = "lop-10") {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "QUAN_TRI" && session.user.role !== "GIAO_VIEN")
  ) {
    throw new Error("Không có quyền truy cập");
  }

  const chuongs = await db.chuong.findMany({
    where: { lopId },
    orderBy: { thuTu: "asc" },
    include: {
      bais: {
        select: {
          id: true,
          tieu_de: true,
          thuTu: true,
        },
        orderBy: { thuTu: "asc" },
      },
    },
  });

  let tongSoBai = 0;
  const cayPhanCap: ChuongLyThuyetTreeNode[] = chuongs.map((c) => {
    tongSoBai += c.bais.length;
    return {
      id: c.id,
      ten: c.ten,
      thuTu: c.thuTu,
      lopId: c.lopId,
      danhSachBai: c.bais,
    };
  });

  return {
    lopId,
    tongSoBai,
    cayPhanCap,
  };
}

/**
 * 2. Lấy nội dung chi tiết bài học lý thuyết
 */
export async function layChiTietBaiLyThuyetAction(baiId: string) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "QUAN_TRI" && session.user.role !== "GIAO_VIEN")
  ) {
    throw new Error("Không có quyền truy cập");
  }

  const bai = await db.bai.findUnique({
    where: { id: baiId },
    include: {
      chuong: true,
    },
  });

  if (!bai) {
    throw new Error("Không tìm thấy bài học lý thuyết");
  }

  return {
    id: bai.id,
    tieu_de: bai.tieu_de,
    noiDung: bai.noiDung,
    thuTu: bai.thuTu,
    capNhatLuc: bai.capNhatLuc,
    chuong: {
      id: bai.chuong.id,
      ten: bai.chuong.ten,
      lopId: bai.chuong.lopId,
    },
  };
}
