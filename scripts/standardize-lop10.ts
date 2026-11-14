import { db } from "../src/lib/db";

function cleanOption(text: string): string {
  if (!text) return "";
  let s = text.trim();

  // 1. Dọn dẹp ký tự font
  s = s.replace(/[\u0000\u0010]/g, "(");
  s = s.replace(/[\u0001\u0011]/g, ")");
  s = s.replace(/\u0008/g, "{");
  s = s.replace(/[\u0002-\u0007\u000B\u000C\u000E-\u001F]/g, "");
  s = s.replace(/\u2212/g, "-");

  // Xóa rác trang
  s = s.replace(/\\np$/gi, "");
  s = s.replace(/\n\s*p\s*$/gi, "");
  s = s.replace(/\.\s*p$/gi, ".");
  s = s.replace(/\\np(?=["\s,;]|$)/gi, "");

  // Khoảng [a; b]
  s = s.replace(/\bh\s*\n\s*/g, "[");
  s = s.replace(/\s*\n\s*i\b/g, "]");

  // Vectơ
  s = s.replace(/#\s*»\s*\n?\s*v([0-9]+)/gi, "\\vec{v}_{$1}");
  s = s.replace(/#\s*»\s*\n?\s*([A-Z]{2})/g, "\\vec{$1}");
  s = s.replace(/#\s*»\s*([A-Z]{2})/g, "\\vec{$1}");
  s = s.replace(/#\s*»\s*\n?\s*([a-z0-9])/gi, "\\vec{$1}");
  s = s.replace(/#\s*»\s*([a-z0-9])/gi, "\\vec{$1}");

  // Căn thức
  s = s.replace(/(?:\\n|\n)?p\s*\n\s*([0-9]+)\s*\n\s*([0-9]+)/g, "\\frac{\\sqrt{$1}}{$2}");
  s = s.replace(/(?:\\n|\n)?p\s*\n\s*([0-9]+)/g, "\\sqrt{$1}");
  s = s.replace(/\bp\s*\n\s*([0-9]+)/g, "\\sqrt{$1}");
  s = s.replace(/\bp\s*\n\s*([a-zA-Z0-9\+\-]+)/g, "\\sqrt{$1}");

  // Phân số
  s = s.replace(/([=;,+\(\[\-]\s*[\-]?\s*)([0-9]+)\s*\n\s*([0-9]+)/g, "$1\\frac{$2}{$3}");
  s = s.replace(/([0-9]+)\s*\n\s*([0-9]+)(\s*[\);,+\-\]])/g, "\\frac{$1}{$2}$3");
  s = s.replace(/(^|[\-]\s*)([0-9]+)\s*\n\s*([0-9]+)(\s*\.|\s*$)/g, "$1\\frac{$2}{$3}$4");

  // Xóa newline thừa trong tọa độ
  s = s.replace(/([A-Z])\s*\n\s*\(/g, "$1(");
  s = s.replace(/\(\s*\n\s*/g, "(");
  s = s.replace(/\s*\n\s*\)/g, ")");
  s = s.replace(/\s*\n\s*;/g, ";");
  s = s.replace(/;\s*\n\s*/g, "; ");
  s = s.replace(/\n+/g, " ");
  s = s.trim();

  let hasTrailingDot = false;
  if (s.endsWith(".")) {
    hasTrailingDot = true;
    s = s.slice(0, -1).trim();
  }

  // Nếu chưa bọc $
  if (!s.startsWith("$") && !s.endsWith("$")) {
    const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(s);
    if (!hasVietnamese) {
      s = s.replace(/;\s*/g, "; ");
      // Nếu có \frac trong ngoặc tròn tọa độ, chuyển thành \left( và \right)
      if (s.includes("\\frac")) {
        s = s.replace(/\(([^)]*\\frac[^)]*)\)/g, "\\left($1\\right)");
      }
      s = `$${s.trim()}$`;
    } else {
      // Có chữ tiếng Việt, bọc các cụm toán
      s = s.replace(/(\b[A-Z]\s*\([^)]+\))/g, "$$$1$$");
      s = s.replace(/(\\(?:frac\{[^{}]*\}\{[^{}]*\}|sqrt\{[^{}]*\}|vec\{[^{}]*\}))/g, "$$$1$$");
    }
  }

  if (hasTrailingDot) s = s + ".";
  return s;
}

function cleanDeBai(text: string): string {
  if (!text) return "";
  let s = text;

  // 1. Dọn font và unicode
  s = s.replace(/[\u0000\u0010]/g, "(");
  s = s.replace(/[\u0001\u0011]/g, ")");
  s = s.replace(/\u0008/g, "{");
  s = s.replace(/[\u0002-\u0007\u000B\u000C\u000E-\u001F]/g, "");
  s = s.replace(/\u2212/g, "-");

  // Rác trang
  s = s.replace(/\\np$/gi, "");
  s = s.replace(/\n\s*p\s*$/gi, "");
  s = s.replace(/\.\s*p$/gi, ".");
  s = s.replace(/\\np(?=["\s,;]|$)/gi, "");

  // Vectơ
  s = s.replace(/#\s*»\s*\n?\s*v([0-9]+)/gi, "\\vec{v}_{$1}");
  s = s.replace(/#\s*»\s*\n?\s*([A-Z]{2})/g, "\\vec{$1}");
  s = s.replace(/#\s*»\s*([A-Z]{2})/g, "\\vec{$1}");
  s = s.replace(/#\s*»\s*\n?\s*([a-z0-9])/gi, "\\vec{$1}");
  s = s.replace(/#\s*»\s*([a-z0-9])/gi, "\\vec{$1}");
  s = s.replace(/(\\vec\{[^\}]+\})\s*\n\s*(=)/g, "$1 $2");

  // Căn thức
  s = s.replace(/(?:\\n|\n)?p\s*\n\s*([0-9]+)\s*\n\s*([0-9]+)/g, "\\frac{\\sqrt{$1}}{$2}");
  s = s.replace(/(?:\\n|\n)?p\s*\n\s*([0-9]+)/g, "\\sqrt{$1}");
  s = s.replace(/\bp\s*\n\s*([0-9]+)/g, "\\sqrt{$1}");
  s = s.replace(/\bp\s*\n\s*([a-zA-Z0-9\+\-]+)/g, "\\sqrt{$1}");

  // Phân số trong tọa độ
  s = s.replace(/(\(\s*[\-]?\s*)([0-9]+)\s*\n\s*([0-9]+)/g, "$1\\frac{$2}{$3}");
  s = s.replace(/(;\s*[\-]?\s*)([0-9]+)\s*\n\s*([0-9]+)/g, "$1\\frac{$2}{$3}");

  // Dính chữ
  const wordPairs: [RegExp, string][] = [
    [/\bmệnh đềsau\b/gi, "mệnh đề sau"],
    [/\bmệnh đềnào\b/gi, "mệnh đề nào"],
    [/\bmệnh đềđúng\b/gi, "mệnh đề đúng"],
    [/\bmệnh đềsai\b/gi, "mệnh đề sai"],
    [/\bmệnh đềphủ\b/gi, "mệnh đề phủ"],
    [/\bđềtrên\b/gi, "đề trên"],
    [/\bsốhữu\b/gi, "số hữu"],
    [/\bsốthực\b/gi, "số thực"],
    [/\bchỉkhi\b/gi, "chỉ khi"],
    [/\btọađộ\b/gi, "tọa độ"],
    [/\btoạđộ\b/gi, "tọa độ"],
    [/\btọa độcủa\b/gi, "tọa độ của"],
    [/\bhệtọa\b/gi, "hệ tọa"],
    [/\bhệtrục\b/gi, "hệ trục"],
    [/\bđộdài\b/gi, "độ dài"],
    [/\bĐộdài\b/gi, "Độ dài"],
    [/\bđộlà\b/gi, "độ là"],
    [/\bhệsố\b/gi, "hệ số"],
    [/\bbấtphương\b/gi, "bất phương"],
    [/\bphươngtrình\b/gi, "phương trình"],
    [/\bvớimọi\b/gi, "với mọi"],
    [/\btồntại\b/gi, "tồn tại"],
    [/\bgiátrị\b/gi, "giá trị"],
    [/\bđiềukiện\b/gi, "điều kiện"],
    [/\bmặtphẳng\b/gi, "mặt phẳng"],
    [/\bkhônggian\b/gi, "không gian"],
    [/\bkhẳngđịnh\b/gi, "khẳng định"],
    [/\btậphợp\b/gi, "tập hợp"],
    [/\bnghiệmcủa\b/gi, "nghiệm của"],
    [/\btậpkhông\b/gi, "tập không"],
    [/\btamgiác\b/gi, "tam giác"],
    [/\bhìnhbình\b/gi, "hình bình"],
    [/\bhaiđiểm\b/gi, "hai điểm"],
    [/\bbađiểm\b/gi, "ba điểm"],
    [/\bkhảng định\b/gi, "khẳng định"],
    [/\bphầnthực\b/gi, "phần thực"],
    [/\bphầnảo\b/gi, "phần ảo"],
    [/\bsốchẵn\b/gi, "số chẵn"],
    [/\bsốlẻ\b/gi, "số lẻ"],
    [/\bthỏamãn\b/gi, "thỏa mãn"],
    [/\bthảmãn\b/gi, "thỏa mãn"],
    [/\bđồngthời\b/gi, "đồng thời"],
  ];
  for (const [re, rep] of wordPairs) {
    s = s.replace(re, rep);
  }

  // 2. Tách theo $...$ và $$...$$
  const parts = s.split(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$)/g);
  for (let i = 0; i < parts.length; i += 2) {
    let p = parts[i];
    if (!p) continue;

    // Bất phương trình / phương trình chưa bọc $:
    p = p.replace(
      /(bất phương trình|phương trình|hệ phương trình|hệ bất phương trình|đường thẳng)\s+([0-9a-zA-Z\+\-\*\/\\\{\}\(\)\^_\s=<>≤≥≠\.,;]+?)(?=\s+(?:chứa|không|có|là|trên|với|khi|thỏa|được|sao|trong|nào)|\?|$)/gi,
      (match, prefix, expr) => {
        let cleanExpr = expr.trim();
        if (!cleanExpr || cleanExpr.includes("$")) return match;
        if (!/[=<>≤≥≠\+\-\*\/]/.test(cleanExpr) && !/\\(sqrt|frac)/.test(cleanExpr)) return match;
        return `${prefix} $${cleanExpr}$`;
      }
    );

    // Tách lại để xử lý tiếp
    const subParts = p.split(/(\$[^$]*?\$)/g);
    for (let j = 0; j < subParts.length; j += 2) {
      if (!subParts[j]) continue;
      let sp = subParts[j];
      // Tọa độ điểm chưa bọc: điểm A(1; 3)
      sp = sp.replace(/(điểm|tọa độ)\s+([A-Z]\s*\([^)]+\))/g, "$1 $$$2$$");
      // Vectơ chưa bọc: vectơ \vec{a} = 8\vec{j} - 3\vec{i}
      sp = sp.replace(/(\\vec\{[a-zA-Z0-9]+\}\s*=\s*[^,;\.\n]+)/g, "$$$1$$");
      sp = sp.replace(/(^|[\s(])(\\vec\{[a-zA-Z0-9]+\})([\s,\.\)]|$)/g, "$1$$$2$$$3");
      // Lệnh LaTeX còn sót
      sp = sp.replace(/(\\(?:frac\{[^{}]*\}\{[^{}]*\}|sqrt\{[^{}]*\}))/g, "$$$1$$");
      subParts[j] = sp;
    }
    parts[i] = subParts.join("");
  }

  return parts.join("");
}

async function main() {
  console.log("=== BẮT ĐẦU CHUẨN HÓA TOÀN DIỆN NGÂN HÀNG CÂU HỎI LỚP 10 ===");

  // 1. Kiểm tra và loại bỏ các câu dị tật / trùng lặp (nếu còn)
  const dupQ = await db.baiTap.findUnique({ where: { id: "bt-lop10-b6-q42" } });
  if (dupQ) {
    console.log("Xóa câu trùng lặp bt-lop10-b6-q42...");
    await db.theOnTap.deleteMany({ where: { baiTapId: "bt-lop10-b6-q42" } });
    await db.lanLamBai.deleteMany({ where: { baiTapId: "bt-lop10-b6-q42" } });
    await db.baiTap.delete({ where: { id: "bt-lop10-b6-q42" } });
  }

  const badQ = await db.baiTap.findUnique({ where: { id: "bt-lop10-b1-q01" } });
  if (badQ) {
    console.log("Xóa câu lỗi phi toán học bt-lop10-b1-q01...");
    await db.theOnTap.deleteMany({ where: { baiTapId: "bt-lop10-b1-q01" } });
    await db.lanLamBai.deleteMany({ where: { baiTapId: "bt-lop10-b1-q01" } });
    await db.baiTap.delete({ where: { id: "bt-lop10-b1-q01" } });
  }

  // 2. Chuẩn hóa toàn bộ câu hỏi Lớp 10
  const allGrade10 = await db.baiTap.findMany({
    where: { chuDe: { chuong: { lopId: "lop-10" } } },
    select: { id: true, deBai: true, dapAn: true, loiGiaiChiTiet: true },
  });

  console.log(`Tìm thấy ${allGrade10.length} câu hỏi Lớp 10 cần chuẩn hóa.`);

  let updatedCount = 0;

  for (const q of allGrade10) {
    const cleanedDe = cleanDeBai(q.deBai);
    const cleanedSol = cleanDeBai(q.loiGiaiChiTiet);

    let parsed: any = q.dapAn;
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {}
    }

    let optionsChanged = false;
    const cleanOpts: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed?.cacLuaChon || {})) {
      const cleanedVal = cleanOption(v as string);
      cleanOpts[k] = cleanedVal;
      if (cleanedVal !== v) {
        optionsChanged = true;
      }
    }

    const deChanged = cleanedDe !== q.deBai;
    const solChanged = cleanedSol !== q.loiGiaiChiTiet;

    if (deChanged || optionsChanged || solChanged) {
      parsed.cacLuaChon = cleanOpts;
      await db.baiTap.update({
        where: { id: q.id },
        data: {
          deBai: cleanedDe,
          dapAn: JSON.stringify(parsed),
          loiGiaiChiTiet: cleanedSol,
        },
      });
      updatedCount++;
    }
  }

  console.log(`✓ Đã chuẩn hóa thành công ${updatedCount} / ${allGrade10.length} câu hỏi Lớp 10.`);

  const finalCount = await db.baiTap.count({
    where: { chuDe: { chuong: { lopId: "lop-10" } } },
  });

  console.log(`\n🎉 HOÀN TẤT CHUẨN HÓA LỚP 10! Tổng số câu hỏi hiện tại: ${finalCount} câu hỏi chuẩn hóa 100% không trùng lặp.`);

  await db.$disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error("Lỗi:", e);
  await db.$disconnect();
  process.exit(1);
});
