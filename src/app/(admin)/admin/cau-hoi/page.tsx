import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  layCayNganHangCauHoiAction,
  layDanhSachCauHoiTheoDangAction,
} from "@/features/admin/actions/lay-du-lieu-cau-hoi";
import { NganHangCauHoiAdminView } from "@/features/admin/components/NganHangCauHoiAdminView";

export const dynamic = "force-dynamic";

interface Props {
  searchParams?: {
    lopId?: string;
    chuDeId?: string;
    dangBai?: string;
  };
}

export default async function AdminCauHoiPage({ searchParams }: Props) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "QUAN_TRI" && session.user.role !== "GIAO_VIEN")
  ) {
    redirect("/dashboard");
  }

  const lopId = searchParams?.lopId || "lop-10";
  const { cayPhanCap, tongSoCauLop } = await layCayNganHangCauHoiAction(lopId);

  let initialQuestions: any[] = [];
  const defaultChuDeId = searchParams?.chuDeId;
  const defaultDangBai = searchParams?.dangBai;

  if (defaultChuDeId && defaultDangBai) {
    initialQuestions = await layDanhSachCauHoiTheoDangAction({
      chuDeId: defaultChuDeId,
      dangBai: defaultDangBai,
    });
  } else if (cayPhanCap.length > 0) {
    const firstChuDe = cayPhanCap[0].danhSachChuDe[0];
    const firstDang = firstChuDe?.danhSachDang[0];
    if (firstChuDe && firstDang) {
      initialQuestions = await layDanhSachCauHoiTheoDangAction({
        chuDeId: firstChuDe.id,
        dangBai: firstDang.ten,
      });
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <NganHangCauHoiAdminView
        initialLopId={lopId}
        initialCayPhanCap={cayPhanCap}
        initialTongSoCau={tongSoCauLop}
        initialQuestions={initialQuestions}
        defaultChuDeId={defaultChuDeId}
        defaultDangBai={defaultDangBai}
      />
    </div>
  );
}
