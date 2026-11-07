import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    chuDeId: string;
  };
  searchParams?: {
    dangBai?: string;
  };
}

export default async function LuyenTapTheoChuDeRedirectPage({ params, searchParams }: Props) {
  const { chuDeId } = params;
  const dangBai = searchParams?.dangBai;
  const session = await auth();

  // Kiểm tra chủ đề có tồn tại hay không
  const chuDe = await db.chuDe.findUnique({
    where: { id: chuDeId },
    select: { id: true },
  });

  if (!chuDe) {
    notFound();
  }

  const baseWhere: any = { chuDeId };
  if (dangBai) {
    baseWhere.dangBai = dangBai;
  }

  const dangBaiQuery = dangBai ? `?dangBai=${encodeURIComponent(dangBai)}` : "";

  // 1. Nếu học sinh đã đăng nhập: Ưu tiên tìm câu trong bài (hoặc dạng này) mà học sinh CHƯA từng làm
  if (session?.user?.id) {
    const cauChuaLam = await db.baiTap.findFirst({
      where: {
        ...baseWhere,
        lanLamBais: {
          none: {
            nguoiDungId: session.user.id,
          },
        },
      },
      orderBy: { taoLuc: "asc" },
      select: { id: true },
    });

    if (cauChuaLam) {
      redirect(`/lam-bai/${cauChuaLam.id}${dangBaiQuery}`);
    }

    // 2. Nếu đã làm hết câu: Ưu tiên câu làm SAI gần nhất để ôn luyện lại
    const cauTungLamSai = await db.lanLamBai.findFirst({
      where: {
        nguoiDungId: session.user.id,
        ketQua: "SAI",
        baiTap: baseWhere,
      },
      orderBy: { thoiDiem: "desc" },
      select: { baiTapId: true },
    });

    if (cauTungLamSai) {
      redirect(`/lam-bai/${cauTungLamSai.baiTapId}${dangBaiQuery}`);
    }
  }

  // 3. Nếu chưa đăng nhập hoặc đã làm đúng hết các câu: Bắt đầu từ câu 1 của dạng/bài
  const cauDauTien = await db.baiTap.findFirst({
    where: baseWhere,
    orderBy: { taoLuc: "asc" },
    select: { id: true },
  });

  if (cauDauTien) {
    redirect(`/lam-bai/${cauDauTien.id}${dangBaiQuery}`);
  }

  redirect("/bai-tap");
}
