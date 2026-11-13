import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { layDanhSachChuDeDienDan } from "@/features/dien-dan/services/bai-viet";
import { FormTaoBaiViet } from "@/features/dien-dan/components/FormTaoBaiViet";
import { layLopHienTai } from "@/lib/lop-context";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: {
    baiTapId?: string;
    chuDeId?: string;
    action?: string;
  };
}

export default async function TaoBaiVietPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/dang-nhap");
  }

  const { baiTapId, chuDeId } = searchParams;
  const lopId = await layLopHienTai();

  const [danhSachChuDe, baiTapMacDinh] = await Promise.all([
    layDanhSachChuDeDienDan(lopId),
    baiTapId
      ? db.baiTap.findUnique({
          where: { id: baiTapId },
          select: {
            id: true,
            deBai: true,
            dangBai: true,
            mucDo: true,
            chuDeId: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      <FormTaoBaiViet
        danhSachChuDe={danhSachChuDe}
        baiTapMacDinh={baiTapMacDinh}
        chuDeIdMacDinh={baiTapMacDinh?.chuDeId || chuDeId}
        actionMacDinh={searchParams.action}
      />
    </div>
  );
}

