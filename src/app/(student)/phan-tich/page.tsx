import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { phanTichDiemYeuHocSinh } from "@/features/phan-tich/services/adaptive";
import { BangPhanTichNangLuc } from "@/features/phan-tich/components/BangPhanTichNangLuc";

export const dynamic = "force-dynamic";

export default async function PhanTichPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/dang-nhap?callbackUrl=/phan-tich");
  }

  const analysisData = await phanTichDiemYeuHocSinh(session.user.id);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          Phân Tích Năng Lực & Học Thích Ứng (Adaptive Learning)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Hệ thống AI tự động phân tích độ thành thạo, phát hiện lỗ hổng kiến thức và gợi ý bài tập phù hợp.
        </p>
      </div>

      <BangPhanTichNangLuc data={analysisData} />
    </div>
  );
}

