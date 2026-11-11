"use client";

import { useState } from "react";
import { MessageSquare, Send, Reply, Trash2, Camera, Loader2 } from "lucide-react";
import { KhuVucUploadAnh } from "./KhuVucUploadAnh";
import { BoSuuTapAnh } from "./XemAnhModal";
import { taoBinhLuanAction, DuLieuAnhUpload } from "../actions/bai-viet-actions";

interface NguoiDungBinhLuan {
  id: string;
  tenHienThi: string;
  anhDaiDien: string | null;
  vaiTro: string;
}

interface BinhLuanItem {
  id: string;
  noiDung: string;
  taoLuc: Date | string;
  nguoiDung: NguoiDungBinhLuan;
  hinhAnhs: { id: string }[];
  binhLuanCon?: BinhLuanItem[];
}

interface Props {
  baiVietId: string;
  danhSachBinhLuan: BinhLuanItem[];
  currentUser?: {
    id: string;
    name: string;
    role: string;
  };
}

export function CayBinhLuan({
  baiVietId,
  danhSachBinhLuan,
  currentUser,
}: Props) {
  const [noiDungMoi, setNoiDungMoi] = useState("");
  const [danhSachAnhMoi, setDanhSachAnhMoi] = useState<DuLieuAnhUpload[]>([]);
  const [dangGui, setDangGui] = useState(false);
  const [hienUploadAnhGoc, setHienUploadAnhGoc] = useState(false);

  // Trạng thái phản hồi (reply)
  const [dangReplyId, setDangReplyId] = useState<string | null>(null);
  const [noiDungReply, setNoiDungReply] = useState("");
  const [danhSachAnhReply, setDanhSachAnhReply] = useState<DuLieuAnhUpload[]>([]);
  const [dangGuiReply, setDangGuiReply] = useState(false);

  const formatThoiGian = (dateStr: Date | string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return "Vừa xong";
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${d.getDate()}/${d.getMonth() + 1} lúc ${d.getHours()}:${d.getMinutes() < 10 ? "0" : ""}${d.getMinutes()}`;
  };

  const handleGuiBinhLuan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Vui lòng đăng nhập để bình luận");
      return;
    }
    if (!noiDungMoi.trim() && danhSachAnhMoi.length === 0) {
      alert("Vui lòng nhập câu trả lời hoặc chụp ảnh lời giải");
      return;
    }

    setDangGui(true);
    const res = await taoBinhLuanAction({
      baiVietId,
      noiDung: noiDungMoi,
      danhSachAnh: danhSachAnhMoi,
    });

    if (res.ok) {
      setNoiDungMoi("");
      setDanhSachAnhMoi([]);
      setHienUploadAnhGoc(false);
    } else {
      alert(res.message || "Không thể gửi bình luận");
    }
    setDangGui(false);
  };

  const handleGuiReply = async (binhLuanChaId: string) => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để phản hồi");
      return;
    }
    if (!noiDungReply.trim() && danhSachAnhReply.length === 0) {
      alert("Vui lòng nhập phản hồi hoặc chụp ảnh");
      return;
    }

    setDangGuiReply(true);
    const res = await taoBinhLuanAction({
      baiVietId,
      binhLuanChaId,
      noiDung: noiDungReply,
      danhSachAnh: danhSachAnhReply,
    });

    if (res.ok) {
      setDangReplyId(null);
      setNoiDungReply("");
      setDanhSachAnhReply([]);
    } else {
      alert(res.message || "Không thể gửi phản hồi");
    }
    setDangGuiReply(false);
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <span>Thảo luận & Lời giải ({danhSachBinhLuan.length})</span>
        </h3>
      </div>

      {/* Form gửi câu trả lời mới */}
      <form
        onSubmit={handleGuiBinhLuan}
        className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
            {currentUser?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <span className="text-xs font-bold text-slate-800">
            {currentUser?.name || "Bạn chưa đăng nhập"}
          </span>
        </div>

        <textarea
          value={noiDungMoi}
          onChange={(e) => setNoiDungMoi(e.target.value)}
          placeholder="Nhập câu trả lời, nhận xét bài làm hoặc hướng dẫn bạn..."
          rows={3}
          className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-y transition-all"
        />

        {/* Khu vực chụp ảnh đính kèm trong câu trả lời */}
        {hienUploadAnhGoc ? (
          <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Ảnh lời giải / bài làm đính kèm:
              </span>
              <button
                type="button"
                onClick={() => setHienUploadAnhGoc(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Ẩn khu vực ảnh
              </button>
            </div>
            <KhuVucUploadAnh
              danhSachAnh={danhSachAnhMoi}
              onChange={setDanhSachAnhMoi}
              maxFiles={3}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setHienUploadAnhGoc(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Chụp ảnh lời giải đính kèm</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-end pt-1">
          <button
            type="submit"
            disabled={dangGui}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {dangGui ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang gửi...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Gửi câu trả lời
              </>
            )}
          </button>
        </div>
      </form>

      {/* Danh sách các bình luận */}
      <div className="space-y-4">
        {danhSachBinhLuan.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">
              Chưa có câu trả lời nào. Hãy là người đầu tiên giúp bạn giải bài tập này!
            </p>
          </div>
        ) : (
          danhSachBinhLuan.map((bl) => {
            const isTeacher =
              bl.nguoiDung.vaiTro === "GIAO_VIEN" ||
              bl.nguoiDung.vaiTro === "QUAN_TRI";
            return (
              <div
                key={bl.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3"
              >
                {/* Header bình luận */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                      {bl.nguoiDung.tenHienThi.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {bl.nguoiDung.tenHienThi}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isTeacher
                              ? "bg-purple-100 text-purple-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isTeacher ? "Giáo viên" : "Học sinh"}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {formatThoiGian(bl.taoLuc)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDangReplyId(dangReplyId === bl.id ? null : bl.id);
                      setNoiDungReply("");
                      setDanhSachAnhReply([]);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Trả lời</span>
                  </button>
                </div>

                {/* Nội dung bình luận */}
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap pl-9">
                  {bl.noiDung}
                </p>

                {/* Ảnh lời giải đính kèm (nếu có) */}
                {bl.hinhAnhs && bl.hinhAnhs.length > 0 && (
                  <div className="pl-9">
                    <BoSuuTapAnh danhSachAnhIds={bl.hinhAnhs.map((h) => h.id)} />
                  </div>
                )}

                {/* Khung nhập phản hồi (Reply) khi mở */}
                {dangReplyId === bl.id && (
                  <div className="ml-9 p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                    <textarea
                      value={noiDungReply}
                      onChange={(e) => setNoiDungReply(e.target.value)}
                      placeholder={`Phản hồi cho ${bl.nguoiDung.tenHienThi}...`}
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 outline-none"
                    />
                    <KhuVucUploadAnh
                      danhSachAnh={danhSachAnhReply}
                      onChange={setDanhSachAnhReply}
                      maxFiles={2}
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setDangReplyId(null)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGuiReply(bl.id)}
                        disabled={dangGuiReply}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {dangGuiReply ? "Đang gửi..." : "Gửi phản hồi"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Các phản hồi con (Nested Replies) */}
                {bl.binhLuanCon && bl.binhLuanCon.length > 0 && (
                  <div className="ml-9 space-y-2.5 pt-2 border-t border-slate-100">
                    {bl.binhLuanCon.map((sub) => {
                      const isSubTeacher =
                        sub.nguoiDung.vaiTro === "GIAO_VIEN" ||
                        sub.nguoiDung.vaiTro === "QUAN_TRI";
                      return (
                        <div
                          key={sub.id}
                          className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">
                                {sub.nguoiDung.tenHienThi}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  isSubTeacher
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {isSubTeacher ? "Giáo viên" : "Học sinh"}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {formatThoiGian(sub.taoLuc)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {sub.noiDung}
                          </p>
                          {sub.hinhAnhs && sub.hinhAnhs.length > 0 && (
                            <BoSuuTapAnh
                              danhSachAnhIds={sub.hinhAnhs.map((h) => h.id)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

