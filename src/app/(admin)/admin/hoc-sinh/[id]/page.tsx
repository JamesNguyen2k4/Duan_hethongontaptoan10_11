import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { layBaoCaoChiTietHocSinhAction } from "@/features/admin/actions/lay-bao-cao-hoc-sinh";
import { BaoCaoHocSinhChiTiet } from "@/features/admin/components/BaoCaoHocSinhChiTiet";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    id: string;
  };
  searchParams?: {
    lopId?: string;
  };
}

export default async function AdminHocSinhDetailPage({
  params,
  searchParams,
}: Props) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "QUAN_TRI" && session.user.role !== "GIAO_VIEN")
  ) {
    redirect("/dashboard");
  }

  const { id } = params;
  const lopId = searchParams?.lopId;

  try {
    const reportData = await layBaoCaoChiTietHocSinhAction(id, lopId);
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <BaoCaoHocSinhChiTiet data={reportData} />
      </div>
    );
  } catch (err: any) {
    notFound();
  }
}
