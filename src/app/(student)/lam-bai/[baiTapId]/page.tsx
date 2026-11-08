import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PhongLamBaiForm } from "@/features/lam-bai/components/PhongLamBaiForm";
import {
  layNangLucTheoChuDe,
  tinhXacSuatIRT3PL,
} from "@/lib/adaptive-engine";

interface Props {
  params: {
    baiTapId: string;
  };
  searchParams?: {
    dangBai?: string;
  };
}

export const dynamic = "force-dynamic";

export default async function LamBaiDetailPage({
  params,
  searchParams,
}: Props) {
  const { baiTapId } = params;
  const dangBaiFilter = searchParams?.dangBai;
  const session = await auth();

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

  // Lọc theo Dạng bài nếu có yêu cầu luyện theo dạng
  const activeDangBai = dangBaiFilter || baiTap.dangBai || undefined;
  const whereScope: any = { chuDeId: baiTap.chuDeId };
  if (activeDangBai) {
    whereScope.dangBai = activeDangBai;
  }

  const [allQuestionsInScope, nangLucList] = await Promise.all([
    db.baiTap.findMany({
      where: whereScope,
      orderBy: [{ doKhoIRT: "asc" }, { taoLuc: "asc" }],
      select: { id: true },
    }),
    layNangLucTheoChuDe(session?.user?.id, baiTap.chuDeId),
  ]);

  const totalCount = allQuestionsInScope.length;
  const currentIndex = allQuestionsInScope.findIndex((q) => q.id === baiTap.id);
  const prevBaiTapId =
    currentIndex > 0 ? allQuestionsInScope[currentIndex - 1].id : null;
  const nextBaiTapId =
    currentIndex >= 0 && currentIndex < totalCount - 1
      ? allQuestionsInScope[currentIndex + 1].id
      : null;

  const nangLucHienTai =
    nangLucList.find((d) => d.dangBai === (baiTap.dangBai || activeDangBai)) ||
    nangLucList[0] ||
    null;

  const xacSuatDuDoanZPD = nangLucHienTai
    ? tinhXacSuatIRT3PL(
        nangLucHienTai.nangLucIRT,
        baiTap.doKhoIRT,
        baiTap.doPhanBiet
      )
    : tinhXacSuatIRT3PL(-0.4, baiTap.doKhoIRT, baiTap.doPhanBiet);

  let cacLuaChon = {};
  try {
    const parsed = JSON.parse(baiTap.dapAn);
    cacLuaChon = parsed.cacLuaChon || {};
  } catch {}

  return (
    <div className="py-6 sm:py-8">
      <PhongLamBaiForm
        baiTap={{
          id: baiTap.id,
          deBai: baiTap.deBai,
          mucDo: baiTap.mucDo,
          dangBai: baiTap.dangBai,
          doKhoIRT: baiTap.doKhoIRT,
          doPhanBiet: baiTap.doPhanBiet,
          chuDe: {
            id: baiTap.chuDe.id,
            ten: baiTap.chuDe.ten,
            chuongTen: baiTap.chuDe.chuong.ten,
          },
          cacLuaChon,
        }}
        adaptiveContext={{
          xacSuatThanhThao: nangLucHienTai?.xacSuatHieuDung ?? 0.25,
          nangLucIRT: nangLucHienTai?.nangLucIRT ?? -0.4,
          doBenTriNho: nangLucHienTai?.doBenTriNho ?? 1.0,
          soLanLuyen: nangLucHienTai?.soLanLuyen ?? 0,
          xacSuatDuDoan: xacSuatDuDoanZPD,
          dangBaiFilter: activeDangBai,
        }}
        navigation={{
          currentIndex: currentIndex >= 0 ? currentIndex + 1 : 1,
          totalCount,
          prevBaiTapId,
          nextBaiTapId,
          dangBaiQuery: activeDangBai
            ? `?dangBai=${encodeURIComponent(activeDangBai)}`
            : "",
        }}
      />
    </div>
  );
}
