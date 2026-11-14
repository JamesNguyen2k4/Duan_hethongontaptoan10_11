import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { DANH_MUC_DANG_BAI_LOP10 } from "../src/lib/danh-muc-dang-bai/lop10";
import { PHUONG_PHAP_84_DANG } from "./danh-sach-phuong-phap-lop10";
import { preprocessMathContent } from "../src/lib/math-preprocess";

dotenv.config({ path: ".env.local", override: true });

const db = new PrismaClient();

const MD_DIR_LOP10 =
  "C:\\Users\\TruongND\\.gemini\\antigravity\\brain\\026ab1a3-8ad2-42bd-9bf3-9e3e7ca9278b\\scratch\\sgk10\\md";

interface DapAnJson {
  dapAnDung?: string;
  cacLuaChon?: Record<string, string>;
}

function cleanMathText(text: string): string {
  let s = text.trim();
  s = s.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, "");
  s = s.replace(/(?<!\$)(∀[a-zA-Z]\s*∈\s*[a-zA-Z0-9]+[,\s]+[^\$\n]+)(?!\$)/g, (m) => `$${m.trim()}$`);
  const singleDollars = (s.replace(/\$\$/g, "").match(/\$/g) || []).length;
  if (singleDollars % 2 !== 0) {
    s += "$";
  }
  return s;
}

function formatExample(
  sample: {
    deBai: string;
    dapAn: string;
    loiGiaiChiTiet: string;
  },
  index: number
): string {
  let res = `**Ví dụ ${index}:** ${cleanMathText(sample.deBai)}\n\n`;

  try {
    const da: DapAnJson = JSON.parse(sample.dapAn);
    if (da.cacLuaChon && Object.keys(da.cacLuaChon).length > 0) {
      const opts = Object.entries(da.cacLuaChon)
        .map(([key, val]) => `- **${key}.** ${cleanMathText(val)}`)
        .join("\n");
      res += `${opts}\n\n`;
    }
    res += `*Hướng dẫn giải:*\n\n`;
    if (da.dapAnDung) {
      res += `Chọn đáp án **${da.dapAnDung}**.\n\n`;
    }
  } catch {
    res += `*Hướng dẫn giải:*\n\n`;
  }

  res += `${cleanMathText(sample.loiGiaiChiTiet)}\n`;
  return res;
}

/** Phục hồi và định dạng chuẩn Markdown cho bài học lớp 11 */
function restoreLop11TheoryMarkdown(raw: string): string {
  if (!raw) return "";

  let s = raw;

  // 1. Chuẩn hóa dấu ngoặc kép scan bị ngược hoặc dính
  s = s.replace(/[“”]/g, '"');
  s = s.replace(/:\s*"/g, ': "');
  s = s.replace(/([à-ỹa-zA-Z0-9])"/g, '$1 "');
  s = s.replace(/"([à-ỹa-zA-Z0-9])/g, '" $1');
  s = s.replace(/\$"\s*([a-zA-Z0-9+\-*/= ]+)\s*"\$/g, '"$$$1$$"');
  s = s.replace(/\$"\s*([a-zA-Z0-9+\-*/= ]+)\$/g, '"$$$1$$');
  s = s.replace(/\$([a-zA-Z0-9+\-*/= ]+)"\$/g, '$$$1$$"');

  // 2. Tách đường phân cách --- ra khỏi dòng trước/sau (loại trừ alignment bảng :---:)
  s = s.replace(/([^\n|])\s*---\s*([^\n|])/g, "$1\n\n---\n\n$2");
  s = s.replace(/([^\n|])\s*---\s*$/gm, "$1\n\n---");

  // 3. Tách các Blockquote (> 📌, > 💡, > ✏️, > Ví dụ, > **Ví dụ)
  s = s.replace(/([^\n])\s*(>\s*(?:📌|💡|✏️|\*\*Ví dụ|Ví dụ|\*Lời giải|Lời giải|Quy tắc|\*\*Quy tắc))/g, "$1\n\n$2");
  s = s.replace(/([^\n])\s*(>\s*-\s+)/g, "$1\n$2");
  s = s.replace(/([^\n])\s*(>\s*[a-d]\)\s+)/g, "$1\n$2");

  // 4. Tách Heading (#, ##, ###, ####)
  s = s.replace(/([^\n])\s*(#{1,6}\s+)/g, "$1\n\n$2");
  s = s.replace(/(#{1,6}\s+[^\n]+?)(?=\s*(?:#{1,6}\s|>|Lời giải:|\*Lời giải:))/g, "$1\n\n");

  // 5. Tách Lời giải
  s = s.replace(/([^\n])\s*(\*Lời giải:\*|Lời giải:)\s*/g, "$1\n\n*Lời giải:*\n\n");

  // 6. Phục hồi Bảng Markdown:
  s = s.replace(/([^\n|])\s*(\|(?:\s*Độ\s*|\s*GTLG\s*|[^|\n]+\|[^|\n]+\|))/g, "$1\n\n$2");
  s = s.replace(/\|\s*\|\s*/g, "|\n| ");
  s = s.replace(/(\|\s*(?:\n|$))\s*(####|[a-zA-ZÀ-Ỹà-ỹ>#])/g, "$1\n\n$2");

  // 7. Chuẩn hóa đơn vị đo lường trong KaTeX
  s = s.replace(/(\d+)\s*km\b/g, "$1~\\text{km}");
  s = s.replace(/(\d+)\s*cm\b/g, "$1~\\text{cm}");
  s = s.replace(/(\d+)\s*m\b(?![a-zA-Z])/g, "$1~\\text{m}");
  s = s.replace(/\brad\b/g, "\\text{rad}");

  // 8. Tách các dòng biểu thức độc lập dạng $$...$$
  s = s.replace(/([^\n])\s*(\$\$[^\$]+?\$\$)/g, "$1\n\n$2\n\n");

  // 9. Dọn dẹp khoảng trắng ngang và dòng trống
  s = s.replace(/[ \t]{2,}/g, " ");
  s = s.replace(/\n[ \t]+/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");

  return s.trim();
}

async function main() {
  console.log("=== BẮT ĐẦU PHỤC HỒI TOÀN DIỆN LÝ THUYẾT VÀ BÀI TẬP 2 LỚP 10 & 11 ===");

  // =========================================================================
  // BƯỚC 1: PHỤC HỒI NGUYÊN BẢN VÀ BỔ SUNG PHẦN B CHO 27 BÀI LỚP 10
  // =========================================================================
  console.log("\n--- [1/3] Phục hồi 27 bài lý thuyết Lớp 10 từ file Markdown gốc ---");
  const files10 = fs
    .readdirSync(MD_DIR_LOP10)
    .filter((f) => /^lop10-c\d+-b\d+\.md$/.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/-b(\d+)\.md$/)?.[1] || "0", 10);
      const nb = parseInt(b.match(/-b(\d+)\.md$/)?.[1] || "0", 10);
      return na - nb;
    });

  let count10 = 0;
  for (const file of files10) {
    const baiId = file.replace(/\.md$/, "");
    let rawContent = fs.readFileSync(path.join(MD_DIR_LOP10, file), "utf8").trim();

    // Lấy thông tin bài từ DB
    const bai = await db.bai.findUnique({
      where: { id: baiId },
      include: { chuong: true },
    });

    if (!bai) {
      console.warn(`⚠️ Không tìm thấy bai.id = ${baiId}`);
      continue;
    }

    const baiNum = bai.thuTu;
    const chuDeId = `lop10-c${bai.chuong.thuTu}-cd${baiNum}`;
    const config = DANH_MUC_DANG_BAI_LOP10[chuDeId];

    // Chuẩn hóa Phần A
    if (!rawContent.includes("PHẦN A. LÝ THUYẾT")) {
      if (/^# [^\n]+/m.test(rawContent)) {
        rawContent = rawContent.replace(
          /^(# [^\n]+)\n+/m,
          "$1\n\n## PHẦN A. LÝ THUYẾT CỐT LÕI VÀ VÍ DỤ MINH HỌA\n\n"
        );
      } else {
        rawContent = `# ${bai.tieu_de}\n\n## PHẦN A. LÝ THUYẾT CỐT LÕI VÀ VÍ DỤ MINH HỌA\n\n${rawContent}`;
      }
    }

    // Nối Phần B các dạng toán & phương pháp giải
    let phanB = "";
    if (config && config.dangs.length > 0) {
      phanB = "\n\n---\n\n## PHẦN B. CÁC DẠNG TOÁN VÀ PHƯƠNG PHÁP GIẢI\n\n";
      for (const d of config.dangs) {
        phanB += `### 📌 ${d.ten}\n\n`;
        const method = PHUONG_PHAP_84_DANG[d.id];
        if (method) {
          phanB += `${method}\n\n`;
        } else {
          phanB += `**Phương pháp giải:**\n\n${d.moTa}\n\n`;
        }

        const samples = await db.baiTap.findMany({
          where: { chuDeId, dangBai: d.ten },
          take: 2,
          orderBy: [{ mucDo: "asc" }, { id: "asc" }],
        });

        if (samples.length > 0) {
          phanB += `**Ví dụ minh họa:**\n\n`;
          samples.forEach((sample, idx) => {
            phanB += formatExample(sample, idx + 1) + "\n\n";
          });
        }
      }
    }

    const fullContent = (rawContent.trim() + phanB).trim();

    await db.bai.update({
      where: { id: baiId },
      data: { noiDung: fullContent },
    });

    count10++;
    console.log(`✅ [${baiId}] "${bai.tieu_de}": Đã phục hồi chuẩn đẹp (${fullContent.length} ký tự).`);
  }
  console.log(`🎉 Đã phục hồi thành công ${count10}/27 bài học lý thuyết Lớp 10!`);

  // =========================================================================
  // BƯỚC 2: PHỤC HỒI CẤU TRÚC VÀ ĐỊNH DẠNG CHO 33 BÀI LÝ THUYẾT LỚP 11
  // =========================================================================
  console.log("\n--- [2/3] Phục hồi và định dạng chuẩn cho 33 bài lý thuyết Lớp 11 ---");
  const bais11 = await db.bai.findMany({
    where: { chuong: { lopId: "lop-11" } },
    include: { chuong: true },
    orderBy: { thuTu: "asc" },
  });

  let count11 = 0;
  for (const bai of bais11) {
    const formatted = restoreLop11TheoryMarkdown(bai.noiDung);
    if (formatted !== bai.noiDung) {
      await db.bai.update({
        where: { id: bai.id },
        data: { noiDung: formatted },
      });
      count11++;
      console.log(`✅ [${bai.id}] "${bai.tieu_de}": Đã định dạng lại bảng biểu & ngắt dòng (${formatted.length} ký tự).`);
    } else {
      console.log(`ℹ️ [${bai.id}] "${bai.tieu_de}": Đã chuẩn.`);
    }
  }
  console.log(`🎉 Đã cập nhật ${count11}/${bais11.length} bài học lý thuyết Lớp 11!`);

  console.log("\n🎉 HOÀN THÀNH TOÀN BỘ TIẾN TRÌNH PHỤC HỒI LÝ THUYẾT 2 LỚP!");
}

main()
  .catch((e) => {
    console.error("Lỗi:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
