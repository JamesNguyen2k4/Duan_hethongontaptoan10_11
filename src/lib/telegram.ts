/**
 * Dịch vụ gửi thông báo qua Telegram Bot API
 * Sử dụng cho Giáo viên & Quản trị viên khi có học sinh gửi bài hỏi mới
 */

interface InlineButton {
  text: string;
  url: string;
}

/**
 * Escape các ký tự đặc biệt cho chế độ HTML của Telegram Bot
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Gửi tin nhắn HTML qua Telegram Bot API
 */
export async function guiTinNhanTelegram(
  htmlText: string,
  buttons?: InlineButton[]
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // Không có cấu hình token, bỏ qua không báo lỗi hệ thống
    return {
      ok: false,
      message: "Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong biến môi trường",
    };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: htmlText,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    };

    if (buttons && buttons.length > 0) {
      body.reply_markup = {
        inline_keyboard: [
          buttons.map((btn) => ({
            text: btn.text,
            url: btn.url,
          })),
        ],
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.warn("Telegram Bot API trả về lỗi:", data);
      return { ok: false, error: data.description || "Lỗi gửi Telegram" };
    }

    return { ok: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn("Không thể gửi thông báo Telegram (có thể do mạng/timeout):", errorMsg);
    return { ok: false, error: errorMsg };
  }
}

/**
 * Gửi thông báo khi có bài viết/câu hỏi mới từ học sinh
 */
export async function guiThongBaoBaiVietMoiTelegram(params: {
  tieuDe: string;
  noiDung: string;
  nguoiDangTen: string;
  lopId?: string | null;
  baiVietId: string;
}) {
  const { tieuDe, noiDung, nguoiDangTen, lopId, baiVietId } = params;

  // Xác định tên khối lớp
  let tenLop = "Chung";
  if (lopId === "lop-10") tenLop = "Toán 10";
  else if (lopId === "lop-11") tenLop = "Toán 11";

  // Cắt ngắn trích đoạn nội dung
  const trichDoan = noiDung.trim().slice(0, 200) + (noiDung.length > 200 ? "..." : "");

  // Domain app
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  const postUrl = `${appUrl}/dien-dan/${baiVietId}`;

  // Thời gian định dạng VN
  const now = new Date();
  const thoiGian = now.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  const message = [
    `🔔 <b>[HỆ THỐNG ÔN TẬP TOÁN] CÓ BÀI HỎI MỚI!</b>`,
    ``,
    `📚 <b>Khối lớp:</b> ${escapeHtml(tenLop)}`,
    `👤 <b>Người hỏi:</b> ${escapeHtml(nguoiDangTen)}`,
    `📝 <b>Tiêu đề:</b> ${escapeHtml(tieuDe)}`,
    `💬 <b>Nội dung:</b> <i>${escapeHtml(trichDoan)}</i>`,
    `⏰ <b>Thời gian:</b> ${thoiGian}`,
  ].join("\n");

  // Gửi với inline button
  return guiTinNhanTelegram(message, [
    {
      text: "👉 Xem & Giải đáp bài viết",
      url: postUrl,
    },
  ]);
}
