"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tổng quan & Năng lực" },
  { href: "/ly-thuyet", label: "Lý thuyết" },
  { href: "/bai-tap", label: "Luyện tập thích ứng" },
  { href: "/dien-dan", label: "Diễn đàn" },
];

export function ThanhDieuHuongNav({
  className = "",
  vaiTro,
}: {
  className?: string;
  vaiTro?: string;
}) {
  const pathname = usePathname();
  const isQuanTri = vaiTro === "QUAN_TRI" || vaiTro === "GIAO_VIEN";

  const navItems = [
    ...NAV_ITEMS,
    ...(isQuanTri ? [{ href: "/admin", label: "Trang Quản trị" }] : []),
  ];

  return (
    <nav className={cn("flex items-center gap-2 text-sm font-medium", className)}>
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : item.href === "/admin"
            ? pathname.startsWith("/admin")
            : pathname.startsWith(item.href) ||
              (item.href === "/bai-tap" && pathname.startsWith("/lam-bai"));

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={cn(
              "px-3 py-1.5 rounded-xl transition-all font-semibold text-xs sm:text-sm cursor-pointer select-none",
              isActive
                ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileBottomNav({ vaiTro }: { vaiTro?: string }) {
  const pathname = usePathname();
  const isQuanTri = vaiTro === "QUAN_TRI" || vaiTro === "GIAO_VIEN";

  const mobileItems = [
    ...[
      { href: "/dashboard", label: "Tổng quan", icon: "🏠" },
      { href: "/ly-thuyet", label: "Lý thuyết", icon: "📚" },
      { href: "/bai-tap", label: "Luyện tập", icon: "🎯" },
      { href: "/dien-dan", label: "Diễn đàn", icon: "💬" },
    ],
    ...(isQuanTri ? [{ href: "/admin", label: "Quản trị", icon: "⚙️" }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden h-16 items-center justify-around border-t bg-white px-2 shadow-lg">
      {mobileItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : item.href === "/admin"
            ? pathname.startsWith("/admin")
            : pathname.startsWith(item.href) ||
              (item.href === "/bai-tap" && pathname.startsWith("/lam-bai"));

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={cn(
              "flex flex-col items-center gap-0.5 text-xs transition-colors py-1 px-3 rounded-xl",
              isActive
                ? "text-blue-600 font-bold bg-blue-50/80"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[11px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
