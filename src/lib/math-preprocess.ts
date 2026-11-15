export function cleanMathExpression(expr: string): string {
  let e = expr.trim();
  e = e.replace(/\s*([=<>])\s*/g, " $1 ");
  e = e.replace(
    /\s*\\(le|ge|ne|leq|geq|neq|in|notin|subset|cap|cup|pm|times|approx|equiv)\s*/g,
    " \\$1 "
  );
  e = e.replace(/\s*\+\s*/g, " + ");
  e = e.replace(/\s*-\s*/g, " - ");
  e = e.replace(/\s*;\s*/g, "; ");
  e = e.replace(/\s{2,}/g, " ").trim();
  return e;
}

export function preprocessMathContent(content: string): string {
  if (!content) return "";

  let s = content;

  // 1. Phục hồi tiếng Việt bị biến dạng do lỗi cũ
  s = s.replace(/Lớ\\sqrt\{(\d+)\}/g, "Lớp $1");
  s = s.replace(/lớ\\sqrt\{(\d+)\}/g, "lớp $1");
  s = s.replace(/tậ\\sqrt\{(\d+)\}/g, "tập $1");
  s = s.replace(/hợ\\sqrt\{(\d+)\}/g, "hợp $1");
  s = s.replace(/\\sinh\b/g, "sinh");

  // 2. Ký tự điều khiển scan / unicode lạ (bao gồm Ä ä Å ã)
  s = s
    .replace(/[\u0000\u0010]/g, "(")
    .replace(/[\u0001\u0011]/g, ")")
    .replace(/\u0008/g, "{")
    .replace(/[\u0002-\u0007\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\u2212/g, "-")
    .replace(/\\np(?=["\s,;]|$)/gi, "")
    .replace(/\s*\\np\s*$/gi, "")
    .replace(/\.\s*p$/gi, ".")
    .replace(/\n\s*p\s*$/g, "")
    .replace(/[Ää]/g, "")
    .replace(/[Å\u00C5]/g, "(")
    .replace(/[ã\u00E3]/g, ")");

  // Dọn dẹp lỗi vỡ số thập phân do $ chèn giữa dấu phẩy: $x = 4$,2m -> x = 4,2m
  s = s.replace(/\$([a-zA-Z]\s*=\s*\d+)\$,(\d+)/g, "$1,$2");
  s = s.replace(/\$(\d+)\$,(\d+)/g, "$1,$2");

  // Sửa lỗi đáp án dạng $M = 25$ 27 -> M = \frac{25}{27}
  s = s.replace(/\$([A-Za-z]\s*=\s*[-+]?\s*\d+)\$\s+(\d+)/g, "$1 / $2");

  // Tách chữ tiếng Việt bị dính liền dấu gạch chéo ngược: để\vec{AB} -> để \vec{AB}
  s = s.replace(/([à-ỹa-zA-Z])\\(?=[a-zA-Z])/g, "$1 \\");

  // Ký hiệu góc scan: ƒ ABC hoặc \x83\nBAD -> \widehat{ABC}
  s = s.replace(/[ƒ\x83]\s*\n?\s*([A-Z]{3})/g, "\\widehat{$1}");

  // Ký hiệu tam giác: △ABC -> \triangle ABC, S△ABC -> S_{\triangle ABC}
  s = s.replace(/S\s*[△∆]\s*([A-Z]{3})/g, "S_{\\triangle $1}");
  s = s.replace(/[△∆]\s*([A-Z]{3})/g, "\\triangle $1");

  // Dọn newline trong tọa độ
  s = s.replace(/([A-Z])\s*\n\s*\(/g, "$1(");
  s = s.replace(/\(\s*\n\s*/g, "(");
  s = s.replace(/\s*\n\s*\)/g, ")");

  // 3. Chuyển đổi hệ phương trình / hệ bất phương trình ký tự Unicode hộp sang \begin{cases}
  s = s.replace(
    /[\u23A7][\s\S]*?[\u23A9]\s*([\s\S]*?)(?=(?:không chứa|chứa điểm|là|tại điểm|thỏa mãn|\?|$))/g,
    (match, inner) => {
      const lines = inner
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0 && /[=<>≤≥]/.test(l))
        .map((l: string) =>
          cleanMathExpression(l.replace(/≤/g, "\\le ").replace(/≥/g, "\\ge "))
        );
      if (lines.length > 0) {
        return `$\\begin{cases} ${lines.join(" \\\\ ")} \\end{cases}$ `;
      }
      return match;
    }
  );

  // 4. Sửa lỗi OCR quét đặc trưng (b2̸, a̸, », #)
  s = s.replace(/a\^2\s*\+\s*b2̸\s*=\s*0/g, "a^2 + b^2 \\ne 0");
  s = s.replace(/\(a\^2\s*\+\s*b2̸\s*=\s*0\s*\)/g, "(a^2 + b^2 \\ne 0)");
  s = s.replace(/b2̸\s*=\s*0/g, "b^2 \\ne 0");
  s = s.replace(/a̸\s*=\s*0/g, "a \\ne 0");
  s = s.replace(/\(a̸\s*=\s*0\)/g, "(a \\ne 0)");
  s = s.replace(/#\s*»\s*\n?\s*v([0-9]+)/gi, "\\vec{v}_{$1}");
  s = s.replace(/#\s*»\s*\n?\s*([A-Z]{2})/g, "\\vec{$1}");
  s = s.replace(/#\s*»\s*([A-Z]{2})/g, "\\vec{$1}");
  s = s.replace(/#\s*»\s*\n?\s*([a-z0-9])/gi, "\\vec{$1}");
  s = s.replace(/#\s*»\s*([a-z0-9])/gi, "\\vec{$1}");

  // 5. Sửa lỗi chính tả OCR font tiếng Việt
  s = s.replace(/\bH\)y\b/g, "Hãy");
  s = s.replace(/\bh\)y\b/g, "hãy");
  s = s.replace(/\bD\)y\b/g, "Dãy");
  s = s.replace(/\bd\)y\b/g, "dãy");
  s = s.replace(/\bL\)i\b/g, "Lãi");
  s = s.replace(/\bl\)i\b/g, "lãi");
  s = s.replace(/\b([Tt]ho[aả])\s*m\)n\b/g, "$1 mãn");
  s = s.replace(/\bhoảm\)n\b/g, "thoả mãn");
  s = s.replace(/\bđ\)\b/g, "đã");
  s = s.replace(/\bĐ\)\b/g, "Đã");
  s = s.replace(/\bqu\)ng\b/g, "quãng");
  s = s.replace(/\bQu\)ng\b/g, "Quãng");
  s = s.replace(/\bh\)ng\b/g, "hãng");
  s = s.replace(/\bH\)ng\b/g, "Hãng");
  s = s.replace(/\bg\)y\b/g, "gãy");
  s = s.replace(/\bKhái nhiệm\b/g, "Khái niệm");
  s = s.replace(/\s*\(\s*giả thiết các biểu thức(?: ở trên)? đều có nghĩa\s*\)/gi, "\n\n*(Giả thiết các biểu thức đều có nghĩa)*\n\n");

  // 6. Xử lý lựa chọn trắc nghiệm ngắn gọn không có xuống dòng (tránh bọc nhầm tiêu đề hay đoạn văn)
  const isShortOption = !s.includes("\n") && s.length < 120 && !s.startsWith("- ") && !s.startsWith("* ") && !s.startsWith("#");
  const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(s);
  const hasMathSymbols = /(?:\\(?:pi|sqrt|frac|vec|le|ge|ne|in|notin|subset|cap|cup|pm|alpha|beta|theta|cos|sin|tan|cot|Leftrightarrow|Rightarrow|cdot|cdots|widehat|triangle|setminus|mathbb|forall|exists)|[=<>+\-*^/]|P_\{\d+\}|C_\{|A_\{|^\d+\.?$)/.test(s);

  if (isShortOption && !hasVietnamese && hasMathSymbols && !s.includes("$")) {
    let clean = s.trim();
    let trailingDot = clean.endsWith(".") ? "." : "";
    if (trailingDot) clean = clean.slice(0, -1).trim();
    return `$${clean}$${trailingDot}`;
  }

  // 7. BẢO VỆ TOÀN BỘ CÔNG THỨC TOÁN HỌC HỢP LỆ (Display Math $$ & Inline Math $)
  const mathBlocks: string[] = [];

  // A) Display math $$...$$ (đa dòng hoặc đơn dòng)
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, (m) => {
    mathBlocks.push(m);
    return `KATEXPH${mathBlocks.length - 1}X`;
  });

  // B) Inline math $...$ (trong cùng dòng)
  s = s.replace(/\$([^\$\n]+?)\$/g, (m) => {
    mathBlocks.push(m);
    return `KATEXPH${mathBlocks.length - 1}X`;
  });

  // 8. XỬ LÝ VĂN BẢN NGOÀI CÔNG THỨC (Chỉ chạy trên text thuần ngoài $)
  // Độ ◦ -> ^\circ
  s = s.replace(/(\d+)\s*◦/g, "$1^\\circ");
  s = s.replace(/◦/g, "^\\circ");
  s = s.replace(/···/g, "\\cdots ");
  s = s.replace(/·/g, " \\cdot ");

  // Toán tử unicode
  s = s.replace(/≤/g, " \\le ");
  s = s.replace(/≥/g, " \\ge ");
  s = s.replace(/≠/g, " \\ne ");
  s = s.replace(/±/g, " \\pm ");
  s = s.replace(/π/g, "\\pi");
  s = s.replace(/⇒/g, " \\Rightarrow ");
  s = s.replace(/⇔/g, " \\Leftrightarrow ");

  // Tách từ tiếng Việt bị dính (OCR word boundary fixes)
  const wordPairs: [RegExp, string][] = [
    [/tọa độOxy/g, "tọa độ Oxy"],
    [/hệ trục tọa độOxy/g, "hệ trục tọa độ Oxy"],
    [/mặt phẳng tọa độOxy/g, "mặt phẳng tọa độ Oxy"],
    [/hệ tọa độOxy/g, "hệ tọa độ Oxy"],
    [/trục tọa độOxy/g, "trục tọa độ Oxy"],
    [/tọa độlà/g, "tọa độ là"],
    [/tọa độcủa/g, "tọa độ của"],
    [/tọađộ/g, "tọa độ"],
    [/toạđộ/g, "tọa độ"],
    [/hệbất/g, "hệ bất"],
    [/bấtphương/g, "bất phương"],
    [/phươngtrình/g, "phương trình"],
    [/mệnh đềphủ/g, "mệnh đề phủ"],
    [/mệnh đềđúng/g, "mệnh đề đúng"],
    [/mệnh đềsai/g, "mệnh đề sai"],
    [/mệnh đềsau/g, "mệnh đề sau"],
    [/mệnh đềnào/g, "mệnh đề nào"],
    [/mệnh đềtrên/g, "mệnh đề trên"],
    [/mệnh đềnày/g, "mệnh đề này"],
    [/mệnhđề/g, "mệnh đề"],
    [/Phủđịnh/g, "Phủ định"],
    [/phủđịnh/g, "phủ định"],
    [/đểmệnh đề/g, "để mệnh đề"],
    [/đểmệnh/g, "để mệnh"],
    [/sẽlà/g, "sẽ là"],
    [/chăm chỉthì/g, "chăm chỉ thì"],
    [/giá trịnào/g, "giá trị nào"],
    [/giátrị/g, "giá trị"],
    [/sốvô tỷ/g, "số vô tỷ"],
    [/vô tỷlà/g, "vô tỷ là"],
    [/sốthập phân/g, "số thập phân"],
    [/sốchính phương/g, "số chính phương"],
    [/sốhữu tỷ/g, "số hữu tỷ"],
    [/sốthực/g, "số thực"],
    [/đồngthời/g, "đồng thời"],
    [/khác0\b/g, "khác 0"],
    [/bằng0\b/g, "bằng 0"],
    [/độdài/g, "độ dài"],
    [/tamgiác/g, "tam giác"],
    [/haiđiểm/g, "hai điểm"],
    [/bađiểm/g, "ba điểm"],
    [/thỏamãn/g, "thỏa mãn"],
    [/khônggian/g, "không gian"],
    [/mặtphẳng/g, "mặt phẳng"],
    [/tậphợp/g, "tập hợp"],
    [/nghiệmcủa/g, "nghiệm của"],
    [/vớimọi/g, "với mọi"],
    [/tồntại/g, "tồn tại"],
    [/điềukiện/g, "điều kiện"],
    [/khẳngđịnh/g, "khẳng định"],
    [/khảng định/g, "khẳng định"],
  ];
  for (const [re, rep] of wordPairs) {
    s = s.replace(re, rep);
  }
  s = s.replace(/Mệnh\s*đề(?=[\\\$a-zA-Z0-9∀∃∈])/g, "Mệnh đề ");

  // 9. BỌC CÔNG THỨC TOÁN TRẦN CHƯA CÓ $ (Chỉ khớp khi KHÔNG chứa placeholder KATEXPH)
  // Vector độc lập bên ngoài $:
  s = s.replace(
    /(?:(?<=[\s(\[{])|^)([+-]?\s*(?:\d+|[a-zA-Z])?\s*\\vec\{[^{}]+\}'?(?:_\{\d+\})?)(?=[“"'\s,;\.\)\]\}?!:]|$)/g,
    (m, v) => {
      if (v.includes("KATEXPH")) return m;
      mathBlocks.push(`$${v.trim()}$`);
      return `KATEXPH${mathBlocks.length - 1}X`;
    }
  );

  // Phân số và căn độc lập chưa có $:
  s = s.replace(/(?<!\$)\\frac\{[^{}]+\}\{[^{}]+\}(?!\$)/g, (m) => {
    if (m.includes("KATEXPH")) return m;
    mathBlocks.push(`$${m}$`);
    return `KATEXPH${mathBlocks.length - 1}X`;
  });
  s = s.replace(/(?<!\$)\\sqrt\{[^{}]+\}(?!\$)/g, (m) => {
    if (m.includes("KATEXPH")) return m;
    mathBlocks.push(`$${m}$`);
    return `KATEXPH${mathBlocks.length - 1}X`;
  });

  // Quantifiers trần: \forall x \in ...
  s = s.replace(
    /(?:(?<=[\s,;:\(\[\{“"'])|^)(\\(?:forall|exists)\s+[^,;]+?,\s*[^;\.\n\r]+?[=<>\\le\\ge\\ne][^;\.\n\r]+?)(?=[“"'\s,;\.\)\]\}?!:]|$)/g,
    (m, expr) => {
      if (expr.includes("KATEXPH")) return m;
      mathBlocks.push(`$${expr.trim()}$`);
      return `KATEXPH${mathBlocks.length - 1}X`;
    }
  );

  // 10. PHỤC HỒI TOÀN BỘ KHỐI TOÁN HỌC (Đệ quy cho đến khi mở hết)
  let loop = 0;
  while (s.includes("KATEXPH") && loop < 5) {
    s = s.replace(/KATEXPH(\d+)X/g, (_, idx) => mathBlocks[parseInt(idx, 10)] ?? "");
    loop++;
  }

  // 11. Chuẩn hóa bố cục Markdown
  s = s.replace(/[“”]/g, '"');
  s = s.replace(/([^\n|:])\s*---\s*([^\n|:])/g, "$1\n\n---\n\n$2");
  s = s.replace(/([^\n])\s*(>\s*(?:📌|💡|✏️|\*\*Ví dụ|Ví dụ|\*Lời giải|Lời giải|Quy tắc|\*\*Quy tắc))/g, "$1\n\n$2");
  s = s.replace(/([^\n])\s*(#{1,6}\s+[^\n]+)/g, "$1\n\n$2\n\n");
  s = s.replace(/([^\n])\s*(\*Lời giải:\*|Lời giải:)\s*/g, "$1\n\n*Lời giải:*\n\n");

  s = s.replace(/[ \t]{2,}/g, " ");
  s = s.replace(/\n[ \t]+/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");

  return s.trim();
}
