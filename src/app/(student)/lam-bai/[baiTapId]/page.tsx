import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PhongLamBaiForm } from "@/features/lam-bai/components/PhongLamBaiForm";

interface Props {
  params: {
    baiTapId: string;
  };
}

export const dynamic = "force-dynamic";

export default async function LamBaiDetailPage({ params }: Props) {
  const { baiTapId } = params;

  const baiTap = await db.baiTap.findUnique({
    where: { id: baiTapId },
    include: {
      chuDe: {
        include: {
          chuong: true,
        },
      },
    },
  });

  if (!baiTap) {
    notFound();
  }

  // Lấy toàn bộ danh sách ID các câu trong bài này để tính thứ tự & câu trước / câu sau
  const allQuestionsInTopic = await db.baiTap.findMany({
    where: { chuDeId: baiTap.chuDeId },
    orderBy: { taoLuc: "asc" },
    select: { id: true },
  });

  const totalCount = allQuestionsInTopic.length;
  const currentIndex = allQuestionsInTopic.findIndex((q) => q.id === baiTap.id);
  const prevBaiTapId = currentIndex > 0 ? allQuestionsInTopic[currentIndex - 1].id : null;
  const nextBaiTapId =
    currentIndex >= 0 && currentIndex < totalCount - 1
      ? allQuestionsInTopic[currentIndex + 1].id
      : null;

  let cacLuaChon = {};
  try {
    const parsed = JSON.parse(baiTap.dapAn);
    cacLuaChon = parsed.cacLuaChon || {};
  } catch {}

  return (
    <div className="py-6 sm:py-10">
      <PhongLamBaiForm
        baiTap={{
          id: baiTap.id,
          deBai: baiTap.deBai,
          mucDo: baiTap.mucDo,
          dangBai: baiTap.dangBai,
          chuDe: {
            id: baiTap.chuDe.id,
            ten: baiTap.chuDe.ten,
            chuongTen: baiTap.chuDe.chuong.ten,
          },
          cacLuaChon,
        }}
        navigation={{
          currentIndex: currentIndex >= 0 ? currentIndex + 1 : 1,
          totalCount,
          prevBaiTapId,
          nextBaiTapId,
        }}
      />
    </div>
  );
}
