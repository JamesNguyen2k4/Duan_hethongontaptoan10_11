import { db } from "@/lib/db";

export interface BoLocBaiViet {
  lopId?: string;
  chuDeId?: string;
  dangBai?: string;
  tuKhoa?: string;
  baiTapId?: string;
  chiBaiTap?: boolean;
  nguoiDungId?: string;
  trang?: number;
  soLuongMoiTrang?: number;
}

export async function layDanhSachBaiViet(boLoc: BoLocBaiViet = {}) {
  const {
    lopId,
    chuDeId,
    dangBai,
    tuKhoa,
    baiTapId,
    chiBaiTap,
    nguoiDungId,
    trang = 1,
    soLuongMoiTrang = 12,
  } = boLoc;

  const whereClause: any = {
    trangThai: "HIEN_THI",
  };

  if (lopId && lopId !== "all") {
    whereClause.lopId = lopId;
  }

  if (chuDeId) {
    whereClause.chuDeId = chuDeId;
  }

  if (dangBai && dangBai.trim().length > 0) {
    const dang = dangBai.trim();
    whereClause.AND = [
      ...(whereClause.AND || []),
      {
        OR: [
          { dangBai: { contains: dang } },
          { baiTap: { dangBai: { contains: dang } } },
        ],
      },
    ];
  }

  if (baiTapId) {
    whereClause.baiTapId = baiTapId;
  } else if (chiBaiTap) {
    whereClause.baiTapId = { not: null };
  }

  if (nguoiDungId) {
    whereClause.nguoiDungId = nguoiDungId;
  }

  if (tuKhoa && tuKhoa.trim().length > 0) {
    const kw = tuKhoa.trim();
    const searchFilter = {
      OR: [
        { tieuDe: { contains: kw } },
        { noiDung: { contains: kw } },
      ],
    };
    if (whereClause.AND) {
      whereClause.AND.push(searchFilter);
    } else {
      whereClause.OR = searchFilter.OR;
    }
  }

  const [tongSo, danhSach] = await Promise.all([
    db.baiViet.count({ where: whereClause }),
    db.baiViet.findMany({
      where: whereClause,
      orderBy: { taoLuc: "desc" },
      skip: (trang - 1) * soLuongMoiTrang,
      take: soLuongMoiTrang,
      include: {
        nguoiDung: {
          select: {
            id: true,
            tenHienThi: true,
            anhDaiDien: true,
            vaiTro: true,
          },
        },
        chuDe: {
          select: {
            id: true,
            ten: true,
            chuong: {
              select: {
                id: true,
                ten: true,
                lopId: true,
              },
            },
          },
        },
        baiTap: {
          select: {
            id: true,
            dangBai: true,
            mucDo: true,
          },
        },
        hinhAnhs: {
          select: {
            id: true,
          },
          orderBy: { taoLuc: "asc" },
        },
        _count: {
          select: {
            binhLuans: true,
            hinhAnhs: true,
          },
        },
      },
    }),
  ]);

  return {
    danhSach,
    tongSo,
    trangHienTai: trang,
    tongSoTrang: Math.max(1, Math.ceil(tongSo / soLuongMoiTrang)),
  };
}

export async function layChiTietBaiViet(baiVietId: string) {
  const baiViet = await db.baiViet.findUnique({
    where: { id: baiVietId },
    include: {
      nguoiDung: {
        select: {
          id: true,
          tenHienThi: true,
          anhDaiDien: true,
          vaiTro: true,
        },
      },
      chuDe: {
        select: {
          id: true,
          ten: true,
          chuong: {
            select: {
              id: true,
              ten: true,
              lopId: true,
            },
          },
        },
      },
      baiTap: {
        select: {
          id: true,
          deBai: true,
          dapAn: true,
          loiGiaiChiTiet: true,
          dangBai: true,
          mucDo: true,
        },
      },
      hinhAnhs: {
        select: {
          id: true,
          mimeType: true,
          dungLuong: true,
          taoLuc: true,
        },
        orderBy: { taoLuc: "asc" },
      },
      binhLuans: {
        where: {
          trangThai: "HIEN_THI",
          binhLuanChaId: null, // Lấy bình luận gốc
        },
        orderBy: { taoLuc: "asc" },
        include: {
          nguoiDung: {
            select: {
              id: true,
              tenHienThi: true,
              anhDaiDien: true,
              vaiTro: true,
            },
          },
          hinhAnhs: {
            select: {
              id: true,
              mimeType: true,
              dungLuong: true,
            },
            orderBy: { taoLuc: "asc" },
          },
          binhLuanCon: {
            where: { trangThai: "HIEN_THI" },
            orderBy: { taoLuc: "asc" },
            include: {
              nguoiDung: {
                select: {
                  id: true,
                  tenHienThi: true,
                  anhDaiDien: true,
                  vaiTro: true,
                },
              },
              hinhAnhs: {
                select: {
                  id: true,
                  mimeType: true,
                  dungLuong: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return baiViet;
}

export async function layDanhSachChuDeDienDan(lopId?: string) {
  const chuDes = await db.chuDe.findMany({
    where: lopId && lopId !== "all" ? { chuong: { lopId } } : undefined,
    orderBy: [{ chuong: { thuTu: "asc" } }, { thuTu: "asc" }],
    select: {
      id: true,
      ten: true,
      chuong: {
        select: {
          id: true,
          ten: true,
          lopId: true,
        },
      },
      baiTaps: {
        where: { dangBai: { not: null } },
        distinct: ["dangBai"],
        select: {
          dangBai: true,
        },
        orderBy: {
          dangBai: "asc",
        },
      },
    },
  });

  return chuDes.map((cd) => ({
    id: cd.id,
    ten: cd.ten,
    chuong: cd.chuong,
    danhSachDangBai: cd.baiTaps
      .map((b) => b.dangBai)
      .filter((d): d is string => Boolean(d)),
  }));
}

