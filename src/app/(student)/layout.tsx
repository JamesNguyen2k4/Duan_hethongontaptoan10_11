import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { layLopHienTai } from "@/lib/lop-context";
import { BoChuyenLop } from "@/components/shared/BoChuyenLop";
import { NutDangXuat } from "@/components/shared/NutDangXuat";
import {
  ThanhDieuHuongNav,
  MobileBottomNav,
} from "@/components/shared/ThanhDieuHuongNav";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/dang-nhap");
  const lopHienTai = await layLopHienTai();
  const isQuanTri =
    session.user?.role === "QUAN_TRI" || session.user?.role === "GIAO_VIEN";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Thanh điều hướng trên mobile */}
      <header className="flex md:hidden sticky top-0 z-50 h-14 items-center justify-between border-b bg-white px-4 shadow-xs">
        <Link href="/dashboard" className="font-black text-blue-600 text-base">
          Σ Ôn Tập Toán
        </Link>
        <div className="flex items-center gap-2">
          {isQuanTri && (
            <Link
              href="/admin"
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
            >
              Quản trị
            </Link>
          )}
          <BoChuyenLop lopHienTai={lopHienTai} />
          <NutDangXuat />
        </div>
      </header>

      {/* Thanh điều hướng trên desktop */}
      <header className="hidden md:flex sticky top-0 z-50 h-16 items-center border-b bg-white px-6 gap-6 shadow-xs">
        <Link
          href="/dashboard"
          className="font-black text-blue-600 text-lg tracking-tight hover:opacity-90 transition-opacity"
        >
          Σ Ôn Tập Toán
        </Link>
        <ThanhDieuHuongNav vaiTro={session.user?.role} />
        <div className="ml-auto flex items-center gap-3">
          <BoChuyenLop lopHienTai={lopHienTai} />
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            {session.user?.name}
          </span>
          <NutDangXuat />
        </div>
      </header>

      {/* Nội dung */}
      <main className="flex-1 pb-20 md:pb-8">{children}</main>

      {/* Thanh điều hướng dưới đáy trên mobile */}
      <MobileBottomNav vaiTro={session.user?.role} />
    </div>
  );
}
