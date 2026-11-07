import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    chuDeId: string;
  };
}

export default async function LuyenTapTheoChuDeRedirectPage({ params }: Props) {
  const { chuDeId } = params;
  const session = await auth();

  // Kiểm tra chủ đề có tồn tại hay không
  const chuDe = await db.chuDe.findUnique({
    where: { id: chuDeId },
    select: { id: true },
  });

  if (!chuDe) {
    notFound();
  }

  // 1. Nếu học sinh đã đăng nhập: Ưu tiên tìm câu trong bài này mà học sinh CHƯA từng làm
  if (session?.user?.id) {
    const cauChuaLam = await db.baiTap.findFirst({
      where: {
        chuDeId,
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
      redirect(`/lam-bai/${cauChuaLam.id}`);
    }

    // 2. Nếu đã làm hết câu trong bài: Ưu tiên câu làm SAI gần nhất để ôn luyện lại
    const cauTungLamSai = await db.lanLamBai.findFirst({
      where: {
        nguoiDungId: session.user.id,
        ketQua: "SAI",
        baiTap: { chuDeId },
      },
      orderBy: { thoiDiem: "desc" },
      select: { baiTapId: true },
    });

    if (cauTungLamSai) {
      redirect(`/lam-bai/${cauTungLamSai.baiTapId}`);
    }
  }

  // 3. Nếu chưa đăng nhập hoặc đã làm đúng hết các câu: Bắt đầu từ câu 1
  const cauDauTien = await db.baiTap.findFirst({
    where: { chuDeId },
    orderBy: { taoLuc: "asc" },
    select: { id: true },
  });

  if (cauDauTien) {
    redirect(`/lam-bai/${cauDauTien.id}`);
  }

  redirect("/bai-tap");
}

