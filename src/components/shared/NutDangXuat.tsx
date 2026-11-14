"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface NutDangXuatProps {
  className?: string;
  showIcon?: boolean;
}

export function NutDangXuat({
  className,
  showIcon = false,
}: NutDangXuatProps) {
  const handleDangXuat = async (e: React.MouseEvent) => {
    e.preventDefault();
    await signOut({ callbackUrl: "/dang-nhap" });
  };

  return (
    <button
      onClick={handleDangXuat}
      type="button"
      className={cn(
        "cursor-pointer text-xs text-muted-foreground hover:text-destructive transition-colors inline-flex items-center gap-1.5",
        className
      )}
    >
      {showIcon && <LogOut className="w-3.5 h-3.5" />}
      <span>Đăng xuất</span>
    </button>
  );
}
