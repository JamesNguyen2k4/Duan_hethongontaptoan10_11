import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { layDanhSachHocSinhAction } from "@/features/admin/actions/lay-bao-cao-hoc-sinh";
import { DanhSachHocSinhView } from "@/features/admin/components/DanhSachHocSinhView";
import { Users, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  searchParams?: {
    lopId?: string;
    tuKhoa?: string;
  };
}

export default async function AdminHocSinhPage({ searchParams }: Props) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "QUAN_TRI" && session.user.role !== "GIAO_VIEN")
  ) {
    redirect("/dashboard");
  }

  const currentLopId = searchParams?.lopId === "lop-11" ? "lop-11" : "lop-10";

  const danhSachHocSinh = await layDanhSachHocSinhAction({
    lopId: currentLopId,
    tuKhoa: searchParams?.tuKhoa,
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" /> Quản lý người học & Báo cáo
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Báo Cáo Ôn Tập Theo Khối Lớp
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi độ thành thạo, số lần luyện tập và lịch sử rèn luyện kiến thức từng lớp của học sinh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl font-bold border border-blue-100 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4" />
            Đang xem: {currentLopId === "lop-11" ? "Toán 11" : "Toán 10"}
          </span>
        </div>
      </div>

      {/* Main View */}
      <DanhSachHocSinhView
        danhSachHocSinh={danhSachHocSinh}
        currentLopId={currentLopId}
      />
    </div>
  );
}
