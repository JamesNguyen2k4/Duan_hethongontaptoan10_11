"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Image as ImageIcon, X, Loader2, ZoomIn } from "lucide-react";
import { nenAnhClient } from "@/lib/image-compressor";
import { DuLieuAnhUpload } from "../actions/bai-viet-actions";

interface Props {
  danhSachAnh: DuLieuAnhUpload[];
  onChange: (danhSach: DuLieuAnhUpload[]) => void;
  maxFiles?: number;
  actionMacDinh?: string;
}

export function KhuVucUploadAnh({
  danhSachAnh,
  onChange,
  maxFiles = 5,
  actionMacDinh,
}: Props) {
  const [dangXuLy, setDangXuLy] = useState(false);
  const [anhDangXem, setAnhDangXem] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tự động kích hoạt camera hoặc chọn tệp nếu được điều hướng từ ngoài diễn đàn
  useEffect(() => {
    if (!actionMacDinh) return;
    const timer = setTimeout(() => {
      if (actionMacDinh === "camera") {
        cameraInputRef.current?.click();
      } else if (actionMacDinh === "file") {
        fileInputRef.current?.click();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [actionMacDinh]);

  // Xử lý nén và thêm ảnh
  const xuLyFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    if (danhSachAnh.length >= maxFiles) {
      alert(`Bạn chỉ được tải lên tối đa ${maxFiles} ảnh.`);
      return;
    }

    setDangXuLy(true);
    const moi: DuLieuAnhUpload[] = [...danhSachAnh];

    for (let i = 0; i < files.length; i++) {
      if (moi.length >= maxFiles) break;
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;

      try {
        const compressed = await nenAnhClient(file);
        moi.push({
          base64: compressed.base64,
          mimeType: compressed.mimeType,
          dungLuong: compressed.dungLuong,
        });
      } catch (err) {
        console.error("Lỗi khi nén ảnh:", err);
      }
    }

    onChange(moi);
    setDangXuLy(false);
  };

  // Hỗ trợ Paste ảnh từ Clipboard (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        xuLyFiles(imageFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [danhSachAnh]);

  const xoaAnh = (index: number) => {
    const moi = danhSachAnh.filter((_, i) => i !== index);
    onChange(moi);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* 2 nút chụp ảnh & tải ảnh to, thân thiện trên mobile & desktop */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) xuLyFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) xuLyFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {/* Nút chụp ảnh camera điện thoại */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={dangXuLy || danhSachAnh.length >= maxFiles}
          className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <Camera className="w-4 h-4 text-blue-600" />
          <span>📸 Chụp ảnh bài làm</span>
        </button>

        {/* Nút chọn ảnh từ thư viện / máy tính */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={dangXuLy || danhSachAnh.length >= maxFiles}
          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <ImageIcon className="w-4 h-4 text-slate-600" />
          <span>📁 Tải ảnh từ máy</span>
        </button>

        <span className="text-[11px] text-slate-400 font-medium ml-auto">
          Tối đa {maxFiles} ảnh • Hỗ trợ dán trực tiếp (Ctrl+V)
        </span>
      </div>

      {/* Thông báo đang nén ảnh */}
      {dangXuLy && (
        <div className="flex items-center gap-2 text-xs text-blue-600 font-medium py-1 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Đang tối ưu dung lượng ảnh...
        </div>
      )}

      {/* Danh sách ảnh đã chụp / chọn */}
      {danhSachAnh.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
          {danhSachAnh.map((img, idx) => (
            <div
              key={idx}
              className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-4/3 shadow-xs"
            >
              <img
                src={img.base64}
                alt={`Ảnh bài làm ${idx + 1}`}
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity cursor-pointer"
                onClick={() => setAnhDangXem(img.base64)}
              />

              {/* Nút phóng to */}
              <button
                type="button"
                onClick={() => setAnhDangXem(img.base64)}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 text-white transition-opacity cursor-pointer"
              >
                <ZoomIn className="w-6 h-6 drop-shadow-md" />
              </button>

              {/* Nút xóa ảnh */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  xoaAnh(idx);
                }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center hover:bg-red-700 shadow-sm cursor-pointer z-10 transition-transform hover:scale-110"
                title="Xóa ảnh này"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Dung lượng ảnh */}
              <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-black/70 text-white px-1.5 py-0.5 rounded backdrop-blur-xs">
                Ảnh {idx + 1} ({formatSize(img.dungLuong)})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modal phóng to xem ảnh */}
      {anhDangXem && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setAnhDangXem(null)}
        >
          <button
            type="button"
            onClick={() => setAnhDangXem(null)}
            className="absolute top-4 right-4 text-white hover:text-slate-300 bg-white/10 hover:bg-white/20 p-2 rounded-full cursor-pointer z-50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={anhDangXem}
            alt="Phóng to bài làm"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

