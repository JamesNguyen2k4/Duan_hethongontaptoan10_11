import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { chonCauHoiThichUngZPD } from "@/lib/adaptive-engine";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    chuDeId: string;
  };
  searchParams?: {
    dangBai?: string;
  };
}

export default async function LuyenTapTheoChuDeRedirectPage({
  params,
  searchParams,
}: Props) {
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

  // Sử dụng bộ chọn câu hỏi thích ứng ZPD (BKT + IRT 3PL + Spaced Repetition)
  // chọn câu hỏi có xác suất trả lời đúng P(correct | theta_k, b_i) ~ 0.70
  const selected = await chonCauHoiThichUngZPD({
    nguoiDungId: session?.user?.id,
    chuDeId,
    dangBai: dangBai || undefined,
  });

  if (selected?.baiTapId) {
    const queryDang = dangBai || selected.dangBai;
    const dangBaiQuery = queryDang
      ? `?dangBai=${encodeURIComponent(queryDang)}`
      : "";
    redirect(`/lam-bai/${selected.baiTapId}${dangBaiQuery}`);
  }

  redirect(`/bai-tap?chuDeId=${chuDeId}`);
}
