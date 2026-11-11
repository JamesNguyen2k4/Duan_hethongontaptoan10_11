"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { xoaBaiVietAction } from "../actions/bai-viet-actions";

interface Props {
  baiVietId: string;
}

export function NutXoaBaiViet({ baiVietId }: Props) {
  const router = useRouter();
  const [dangXoa, setDangXoa] = useState(false);

  const handleXoa = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;

    setDangXoa(true);
    const res = await xoaBaiVietAction(baiVietId);
    if (res.ok) {
      router.push("/dien-dan");
    } else {
      alert(res.message || "Không thể xóa bài viết");
      setDangXoa(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleXoa}
      disabled={dangXoa}
      className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
      title="Xóa bài viết này"
    >
      {dangXoa ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
      <span>Xóa bài</span>
    </button>
  );
}

