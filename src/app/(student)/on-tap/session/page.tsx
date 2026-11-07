import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { layDanhSachTheOnTapAction } from "@/features/on-tap/actions/on-tap-actions";
import { PhienOnTapPlayer } from "@/features/on-tap/components/PhienOnTapPlayer";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: {
    mode?: string;
    chuDeId?: string;
  };
}

export default async function OnTapSessionPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/dang-nhap?callbackUrl=/on-tap/session");
  }

  const cheDo = (searchParams.mode as any) || "hom-nay";
  const chuDeId = searchParams.chuDeId;

  const res = await layDanhSachTheOnTapAction(cheDo, chuDeId);
  const danhSachThe = res.data || [];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top back link */}
      <div className="flex items-center justify-between">
        <Link
          href="/on-tap"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại tổng quan
        </Link>

        <span className="text-xs text-slate-500 font-medium">
          Chế độ: {cheDo === "tang-cuong" ? "Ôn tập tăng cường" : "Đến hạn hôm nay"}
        </span>
      </div>

      {danhSachThe.length > 0 ? (
        <PhienOnTapPlayer danhSachThe={danhSachThe} />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm max-w-lg mx-auto">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">
            Không có thẻ nào cần ôn tập ở chế độ này!
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Bạn đã hoàn thành các thẻ đến hạn hoặc chưa có thẻ nào được thêm vào.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/on-tap"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Về trang ôn tập
            </Link>
            <Link
              href="/bai-tap"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
            >
              Làm bài tập mới
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

