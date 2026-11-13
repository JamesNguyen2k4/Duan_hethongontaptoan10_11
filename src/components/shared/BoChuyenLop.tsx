"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { doiLopAction } from "@/features/auth/actions/doi-lop";

const LOPS = [
  { id: "lop-10", label: "Toán 10" },
  { id: "lop-11", label: "Toán 11" },
] as const;

export function BoChuyenLop({ lopHienTai }: { lopHienTai: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const chonLop = (lopId: string) => {
    if (lopId === lopHienTai || isPending) return;
    startTransition(async () => {
      const res = await doiLopAction(lopId);
      if (res.ok) {
        router.refresh();
      }
    });
  };

  return (
    <div
      className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80"
      role="group"
      aria-label="Chọn lớp học"
    >
      {LOPS.map((lop) => {
        const active = lop.id === lopHienTai;
        return (
          <button
            key={lop.id}
            type="button"
            disabled={isPending}
            onClick={() => chonLop(lop.id)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
              active
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            } ${isPending ? "opacity-70" : ""}`}
          >
            {lop.label}
          </button>
        );
      })}
    </div>
  );
}

