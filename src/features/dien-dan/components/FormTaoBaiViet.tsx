"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Send, Loader2, ArrowLeft, Target } from "lucide-react";
import Link from "next/link";
import { KhuVucUploadAnh } from "./KhuVucUploadAnh";
import { taoBaiVietAction, DuLieuAnhUpload } from "../actions/bai-viet-actions";

interface Props {
  danhSachChuDe: {
    id: string;
    ten: string;
    chuong: {
      id: string;
      ten: string;
      lopId: string;
    };
  }[];
  baiTapMacDinh?: {
    id: string;
    deBai: string;
    dangBai: string | null;
    mucDo: string;
  } | null;
  chuDeIdMacDinh?: string;
  actionMacDinh?: string;
}

export function FormTaoBaiViet({
  danhSachChuDe,
  baiTapMacDinh,
  chuDeIdMacDinh,
  actionMacDinh,
}: Props) {
  const router = useRouter();

  const [tieuDe, setTieuDe] = useState(
    baiTapMacDinh
      ? `Hỏi cách giải câu hỏi: ${baiTapMacDinh.dangBai || "Bài tập rèn luyện"}`
      : ""
  );
  const [chuDeId, setChuDeId] = useState(chuDeIdMacDinh || "");
  const [noiDung, setNoiDung] = useState("");
  const [danhSachAnh, setDanhSachAnh] = useState<DuLieuAnhUpload[]>([]);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoi(null);

    if (!tieuDe.trim()) {
      setLoi("Vui lòng nhập tiêu đề bài hỏi");
      return;
    }

    if (!noiDung.trim() && danhSachAnh.length === 0) {
      setLoi("Vui lòng chụp ảnh bài làm hoặc nhập nội dung thắc mắc");
      return;
    }

    setDangGui(true);
    const res = await taoBaiVietAction({
      tieuDe,
      noiDung,
      chuDeId: chuDeId || undefined,
      baiTapId: baiTapMacDinh?.id,
      danhSachAnh,
    });

    if (res.ok && res.baiVietId) {
      router.push(`/dien-dan/${res.baiVietId}`);
    } else {
      setLoi(res.message || "Không thể đăng bài. Vui lòng thử lại!");
      setDangGui(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            Đặt câu hỏi & Chụp bài làm
          </h2>
          <p className="text-xs text-slate-500">
            Học sinh chỉ cần chụp lại các bước biến đổi trên nháp/vở để được hướng dẫn trực tiếp.
          </p>
        </div>

        <Link
          href="/dien-dan"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
        </Link>
      </div>

      {loi && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl animate-shake">
          {loi}
        </div>
      )}

      {/* Thông tin bài tập gắn kèm (nếu học sinh hỏi từ phòng làm bài) */}
      {baiTapMacDinh && (
        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
          <Target className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <strong>Đang gắn kèm câu hỏi trắc nghiệm:</strong>{" "}
            {baiTapMacDinh.dangBai} ({baiTapMacDinh.mucDo})
          </div>
        </div>
      )}

      {/* 1. Tiêu đề câu hỏi */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-800 block">
          Tiêu đề câu hỏi <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={tieuDe}
          onChange={(e) => setTieuDe(e.target.value)}
          placeholder="Ví dụ: Nhờ thầy cô xem giúp em bước tìm điều kiện nghiệm câu này ạ"
          className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium"
        />
      </div>

      {/* 2. Chọn chủ đề bài học */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-800 block">
          Chủ đề / Bài học liên quan
        </label>
        <select
          value={chuDeId}
          onChange={(e) => setChuDeId(e.target.value)}
          className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
        >
          <option value="">-- Chọn bài học liên quan (tùy chọn) --</option>
          {danhSachChuDe.map((cd) => (
            <option key={cd.id} value={cd.id}>
              {cd.chuong.ten} • {cd.ten}
            </option>
          ))}
        </select>
      </div>

      {/* 3. KHU VỰC CHỤP ẢNH / TẢI ẢNH BÀI LÀM */}
      <div className="space-y-2 p-4 bg-slate-50 border border-slate-200/90 rounded-2xl">
        <div>
          <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Ảnh chụp bài làm / Đề bài (Khuyên dùng)</span>
          </label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Bấm nút dưới để chụp trực tiếp từ camera điện thoại, chọn ảnh có sẵn, hoặc dán ảnh (Ctrl+V).
          </p>
        </div>

        <KhuVucUploadAnh
          danhSachAnh={danhSachAnh}
          onChange={setDanhSachAnh}
          maxFiles={5}
          actionMacDinh={actionMacDinh}
        />
      </div>

      {/* 4. Ghi chú mô tả thêm */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-800 block">
          Ghi chú / Thắc mắc cụ thể
        </label>
        <textarea
          value={noiDung}
          onChange={(e) => setNoiDung(e.target.value)}
          rows={3}
          placeholder="Mô tả cụ thể chỗ em chưa hiểu (ví dụ: Em biến đổi đến dòng thứ 2 thì ra nghiệm khác với đáp án, nhờ các bạn chỉ ra chỗ sai giúp em)..."
          className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
        />
      </div>

      {/* Nút gửi bài */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          Ảnh được lưu an toàn trong cơ sở dữ liệu hệ thống
        </span>

        <button
          type="submit"
          disabled={dangGui}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {dangGui ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Đang đăng bài...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Đăng câu hỏi
            </>
          )}
        </button>
      </div>
    </form>
  );
}

