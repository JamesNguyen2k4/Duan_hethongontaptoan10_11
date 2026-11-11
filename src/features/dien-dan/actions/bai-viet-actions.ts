"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface DuLieuAnhUpload {
  base64: string;
  mimeType: string;
  dungLuong: number;
}

export async function taoBaiVietAction(params: {
  tieuDe: string;
  noiDung: string;
  chuDeId?: string;
  baiTapId?: string;
  danhSachAnh?: DuLieuAnhUpload[];
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Vui lòng đăng nhập để đăng bài" };
  }

  const { tieuDe, noiDung, chuDeId, baiTapId, danhSachAnh = [] } = params;

  if (!tieuDe || tieuDe.trim().length < 5) {
    return { ok: false, message: "Tiêu đề bài viết cần có ít nhất 5 ký tự" };
  }

  if ((!noiDung || noiDung.trim().length < 5) && danhSachAnh.length === 0) {
    return {
      ok: false,
      message: "Vui lòng nhập nội dung thắc mắc hoặc chụp ảnh bài làm đưa lên",
    };
  }

  try {
    const baiVietMoi = await db.$transaction(async (tx) => {
      const baiViet = await tx.baiViet.create({
        data: {
          nguoiDungId: session.user.id,
          tieuDe: tieuDe.trim(),
          noiDung: noiDung.trim() || "Em có đính kèm ảnh bài làm chi tiết bên dưới, nhờ thầy cô và các bạn xem giúp em.",
          chuDeId: chuDeId || null,
          baiTapId: baiTapId || null,
          noiDungSearch: `${tieuDe} ${noiDung}`.slice(0, 1000),
        },
      });

      if (danhSachAnh.length > 0) {
        await tx.hinhAnh.createMany({
          data: danhSachAnh.map((img) => ({
            baiVietId: baiViet.id,
            duLieuBase64: img.base64,
            mimeType: img.mimeType || "image/jpeg",
            dungLuong: img.dungLuong || 0,
          })),
        });
      }

      return baiViet;
    });

    revalidatePath("/dien-dan");
    return { ok: true, baiVietId: baiVietMoi.id };
  } catch (error) {
    console.error("Lỗi khi tạo bài viết:", error);
    return { ok: false, message: "Có lỗi xảy ra khi lưu bài viết. Vui lòng thử lại!" };
  }
}

export async function taoBinhLuanAction(params: {
  baiVietId: string;
  binhLuanChaId?: string;
  noiDung: string;
  danhSachAnh?: DuLieuAnhUpload[];
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Vui lòng đăng nhập để bình luận" };
  }

  const { baiVietId, binhLuanChaId, noiDung, danhSachAnh = [] } = params;

  if ((!noiDung || noiDung.trim().length < 2) && danhSachAnh.length === 0) {
    return { ok: false, message: "Vui lòng nhập câu trả lời hoặc chụp ảnh lời giải" };
  }

  try {
    await db.$transaction(async (tx) => {
      const binhLuan = await tx.binhLuan.create({
        data: {
          baiVietId,
          nguoiDungId: session.user.id,
          binhLuanChaId: binhLuanChaId || null,
          noiDung: noiDung.trim() || "Lời giải đính kèm hình ảnh:",
        },
      });

      if (danhSachAnh.length > 0) {
        await tx.hinhAnh.createMany({
          data: danhSachAnh.map((img) => ({
            binhLuanId: binhLuan.id,
            duLieuBase64: img.base64,
            mimeType: img.mimeType || "image/jpeg",
            dungLuong: img.dungLuong || 0,
          })),
        });
      }
    });

    revalidatePath(`/dien-dan/${baiVietId}`);
    return { ok: true };
  } catch (error) {
    console.error("Lỗi khi gửi bình luận:", error);
    return { ok: false, message: "Có lỗi xảy ra khi gửi bình luận. Vui lòng thử lại!" };
  }
}

export async function xoaBaiVietAction(baiVietId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Chưa đăng nhập" };
  }

  const baiViet = await db.baiViet.findUnique({
    where: { id: baiVietId },
    select: { nguoiDungId: true },
  });

  if (!baiViet) {
    return { ok: false, message: "Không tìm thấy bài viết" };
  }

  const isAuthor = baiViet.nguoiDungId === session.user.id;
  const isMod =
    session.user.role === "GIAO_VIEN" || session.user.role === "QUAN_TRI";

  if (!isAuthor && !isMod) {
    return { ok: false, message: "Bạn không có quyền xóa bài viết này" };
  }

  try {
    await db.baiViet.update({
      where: { id: baiVietId },
      data: { trangThai: "DA_XOA" },
    });

    revalidatePath("/dien-dan");
    return { ok: true };
  } catch (error) {
    console.error("Lỗi khi xóa bài viết:", error);
    return { ok: false, message: "Không thể xóa bài viết" };
  }
}

export async function baoCaoAction(params: {
  baiVietId?: string;
  binhLuanId?: string;
  lyDo: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Vui lòng đăng nhập để gửi báo cáo" };
  }

  const { baiVietId, binhLuanId, lyDo } = params;
  if (!lyDo || lyDo.trim().length < 3) {
    return { ok: false, message: "Vui lòng nhập lý do báo cáo" };
  }

  try {
    await db.baoCao.create({
      data: {
        nguoiDungId: session.user.id,
        baiVietId: baiVietId || null,
        binhLuanId: binhLuanId || null,
        lyDo: lyDo.trim(),
      },
    });

    return { ok: true, message: "Đã gửi báo cáo cho quản trị viên xem xét!" };
  } catch (error) {
    console.error("Lỗi khi gửi báo cáo:", error);
    return { ok: false, message: "Lỗi hệ thống khi gửi báo cáo" };
  }
}

