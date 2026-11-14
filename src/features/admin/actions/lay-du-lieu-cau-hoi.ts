"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { DANH_MUC_DANG_BAI } from "@/lib/danh-muc-dang-bai";

export interface DangBaiTreeNode {
  ten: string;
  moTa?: string;
  soCauHoi: number;
}

export interface ChuDeTreeNode {
  id: string;
  ten: string;
  thuTu: number;
  soCauHoi: number;
  danhSachDang: DangBaiTreeNode[];
}

export interface ChuongTreeNode {
  id: string;
  ten: string;
  thuTu: number;
  lopId: string;
  soCauHoi: number;
  danhSachChuDe: ChuDeTreeNode[];
}

export interface CauHoiAdminItem {
  id: string;
  deBai: string;
  loai: string;
  mucDo: string;
  dapAnDung: string;
  cacLuaChon: Record<string, string>;
  loiGiaiChiTiet: string;
  dangBai: string | null;
  doKhoIRT: number;
  doPhanBiet: number;
  soLanLam: number;
  soLanDung: number;
  chuDe: {
    id: string;
    ten: string;
    chuongTen: string;
    lopId: string;
  };
}

/**
 * 1. Lấy cây phân cấp Ngân hàng câu hỏi: Lớp -> Chương -> Bài học (Chủ đề) -> Dạng bài
 */
export async function layCayNganHangCauHoiAction(lopId: string = "lop-10") {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "QUAN_TRI" && session.user.role !== "GIAO_VIEN")
  ) {
    throw new Error("Không có quyền truy cập");
  }

  // 1. Lấy danh sách chương và chủ đề thuộc lớp này
  const chuongs = await db.chuong.findMany({
    where: { lopId },
    orderBy: { thuTu: "asc" },
    include: {
      chuDes: {
        orderBy: { thuTu: "asc" },
      },
    },
  });

  // 2. Lấy thống kê số câu hỏi nhóm theo chuDeId và dangBai
  const questionGroups = await db.baiTap.groupBy({
    by: ["chuDeId", "dangBai"],
    where: {
      chuDe: {
        chuong: { lopId },
      },
    },
    _count: true,
  });

  // Map: `${chuDeId}__${dangBai}` -> count
  const countMap = new Map<string, number>();
  // Map: `chuDeId` -> total questions
  const chuDeCountMap = new Map<string, number>();

  questionGroups.forEach((g) => {
    const dangKey = `${g.chuDeId}__${g.dangBai || "Khác"}`;
    countMap.set(dangKey, g._count);

    const prevCount = chuDeCountMap.get(g.chuDeId) || 0;
    chuDeCountMap.set(g.chuDeId, prevCount + g._count);
  });

  // 3. Xây dựng cây phân cấp hoàn chỉnh
  let tongSoCauLop = 0;

  const cayPhanCap: ChuongTreeNode[] = chuongs.map((chuong) => {
    let soCauChuong = 0;

    const danhSachChuDe: ChuDeTreeNode[] = chuong.chuDes.map((chuDe) => {
      const soCauChuDe = chuDeCountMap.get(chuDe.id) || 0;
      soCauChuong += soCauChuDe;

      // Lấy danh mục dạng bài chuẩn từ file cấu hình
      const configDangs = DANH_MUC_DANG_BAI[chuDe.id]?.dangs || [];

      // Tập hợp tất cả các dạng có trong DB của chuDe này
      const dbDangsForChuDe = questionGroups
        .filter((g) => g.chuDeId === chuDe.id)
        .map((g) => g.dangBai || "Khác");

      // Ghép danh mục cấu hình và các dạng trong DB
      const danhSachDangNames = Array.from(
        new Set([...configDangs.map((d) => d.ten), ...dbDangsForChuDe])
      );

      const danhSachDang: DangBaiTreeNode[] = danhSachDangNames.map((tenDang) => {
        const dangKey = `${chuDe.id}__${tenDang}`;
        const soCauDang = countMap.get(dangKey) || 0;
        const configDang = configDangs.find((d) => d.ten === tenDang);

        return {
          ten: tenDang,
          moTa: configDang?.moTa || "",
          soCauHoi: soCauDang,
        };
      });

      return {
        id: chuDe.id,
        ten: chuDe.ten,
        thuTu: chuDe.thuTu,
        soCauHoi: soCauChuDe,
        danhSachDang,
      };
    });

    tongSoCauLop += soCauChuong;

    return {
      id: chuong.id,
      ten: chuong.ten,
      thuTu: chuong.thuTu,
      lopId: chuong.lopId,
      soCauHoi: soCauChuong,
      danhSachChuDe,
    };
  });

  return {
    lopId,
    tongSoCauLop,
    cayPhanCap,
  };
}

/**
 * 2. Lấy danh sách câu hỏi cụ thể theo Dạng bài (hoặc theo Bài học)
 */
export async function layDanhSachCauHoiTheoDangAction({
  chuDeId,
  dangBai,
  mucDo,
  tuKhoa,
}: {
  chuDeId: string;
  dangBai?: string;
  mucDo?: string;
  tuKhoa?: string;
}): Promise<CauHoiAdminItem[]> {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "QUAN_TRI" && session.user.role !== "GIAO_VIEN")
  ) {
    throw new Error("Không có quyền truy cập");
  }

  const whereCondition: any = {
    chuDeId,
  };

  if (dangBai && dangBai !== "all") {
    whereCondition.dangBai = dangBai;
  }

  if (mucDo && mucDo !== "all") {
    whereCondition.mucDo = mucDo;
  }

  if (tuKhoa && tuKhoa.trim()) {
    const kw = tuKhoa.trim();
    whereCondition.OR = [
      { id: { contains: kw, mode: "insensitive" } },
      { deBai: { contains: kw, mode: "insensitive" } },
      { loiGiaiChiTiet: { contains: kw, mode: "insensitive" } },
    ];
  }

  const questions = await db.baiTap.findMany({
    where: whereCondition,
    include: {
      chuDe: {
        include: {
          chuong: true,
        },
      },
    },
    orderBy: [{ mucDo: "asc" }, { doKhoIRT: "asc" }, { id: "asc" }],
  });

  return questions.map((q) => {
    let dapAnDung = "";
    let cacLuaChon: Record<string, string> = {};

    try {
      const parsed = JSON.parse(q.dapAn);
      dapAnDung = parsed.dapAnDung || "";
      cacLuaChon = parsed.cacLuaChon || {};
    } catch {
      dapAnDung = q.dapAn;
    }

    return {
      id: q.id,
      deBai: q.deBai,
      loai: q.loai,
      mucDo: q.mucDo,
      dapAnDung,
      cacLuaChon,
      loiGiaiChiTiet: q.loiGiaiChiTiet,
      dangBai: q.dangBai,
      doKhoIRT: q.doKhoIRT,
      doPhanBiet: q.doPhanBiet,
      soLanLam: q.soLanLam,
      soLanDung: q.soLanDung,
      chuDe: {
        id: q.chuDe.id,
        ten: q.chuDe.ten,
        chuongTen: q.chuDe.chuong.ten,
        lopId: q.chuDe.chuong.lopId,
      },
    };
  });
}
