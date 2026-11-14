import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  layCayLyThuyetAdminAction,
  layChiTietBaiLyThuyetAction,
} from "@/features/admin/actions/lay-du-lieu-ly-thuyet";
import { LyThuyetAdminView } from "@/features/admin/components/LyThuyetAdminView";

export const dynamic = "force-dynamic";

interface Props {
  searchParams?: {
    lopId?: string;
    baiId?: string;
  };
}

export default async function AdminLyThuyetPage({ searchParams }: Props) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "QUAN_TRI" && session.user.role !== "GIAO_VIEN")
  ) {
    redirect("/dashboard");
  }

  const lopId = searchParams?.lopId || "lop-10";
  const { cayPhanCap, tongSoBai } = await layCayLyThuyetAdminAction(lopId);

  let initialSelectedBai = null;
  const defaultBaiId = searchParams?.baiId;

  if (defaultBaiId) {
    initialSelectedBai = await layChiTietBaiLyThuyetAction(defaultBaiId);
  } else if (cayPhanCap.length > 0) {
    const firstBai = cayPhanCap[0]?.danhSachBai?.[0];
    if (firstBai) {
      initialSelectedBai = await layChiTietBaiLyThuyetAction(firstBai.id);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <LyThuyetAdminView
        initialLopId={lopId}
        initialCayPhanCap={cayPhanCap}
        initialTongSoBai={tongSoBai}
        initialSelectedBai={initialSelectedBai}
      />
    </div>
  );
}
