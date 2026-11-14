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

  // 3. Chuyển đổi hệ phương trình / hệ bất phương trình ký tự Unicode hộp [] sang \begin{cases}
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

  // Vector có chỉ số hoặc dấu phẩy: \vec{F}2 -> \vec{F}_2, \vec{AB}′ -> \vec{AB}'
  s = s.replace(/\\vec\{([A-Za-z]+)\}(\d+)/g, "\\vec{$1}_{$2}");
  s = s.replace(/\\vec\{([A-Za-z]+)\}[′']/g, "\\vec{$1}'");

  // Tách ký tự Hy Lạp Unicode thành LaTeX có khoảng trắng đệm
  s = s.replace(/α/g, " \\alpha ");
  s = s.replace(/β/g, " \\beta ");
  s = s.replace(/θ/g, " \\theta ");

  // Số mũ OCR bị mất dấu ^: (.. )2 -> (.. )^2, x2 -> x^2
  s = s.replace(/(\([^)]+\))2(?=\s*[\+\-\*=<>≤≥≠,\)\\/.;:?!]|\s+bằng|$)/g, "$1^2");
  s = s.replace(/(\b[a-zA-Z])2(?=\s*[\+\-\*=<>≤≥≠,\)\\/.;:?!]|$|\\(?:le|ge|ne))/g, "$1^2");
  s = s.replace(/([0-9]+[a-zA-Z])2(?=\s*[\+\-\*=<>≤≥≠,\)\\/.;:?!]|$|\\(?:le|ge|ne))/g, "$1^2");
  s = s.replace(/π2/g, "\\pi^2");

  // 5. Tách từ tiếng Việt bị dính (OCR word boundary fixes)
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
    [/hệ sốa,b,\s*c/g, "hệ số a, b, c"],
    [/hệ sốa,\s*b/g, "hệ số a, b"],
    [/hệ sốa/g, "hệ số a"],
    [/hệsố/g, "hệ số"],
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
  s = s.replace(/\bđể([a-zà-ỹA-Z0-9\\])/g, "để $1");
  s = s.replace(/\bthì([a-zà-ỹA-Z0-9\\])/g, "thì $1");

  // 6. Ký hiệu độ "◦" -> "^\circ"
  s = s.replace(/(\d+)\s*◦/g, "$1^\\circ");
  s = s.replace(/◦/g, "^\\circ");

  // Dấu nhân chấm giữa "·" -> "\cdot "
  s = s.replace(/···/g, "\\cdots ");
  s = s.replace(/·/g, " \\cdot ");

  // Tách dính chữ lượng giác: \sina -> \sin a, \cosa -> \cos a
  s = s.replace(/\\(sin|cos|tan|cot)([a-zA-Z0-9])/g, "\\$1 $2");
  s = s.replace(/\\(sin|cos|tan|cot)4\s*([a-zA-Z])/g, "\\$1^4 $2");
  s = s.replace(/\\\\(cos|sin|tan|cot)/g, "\\$1");

  // 7. Tổ hợp / Chỉnh hợp / Hoán vị:
  s = s.replace(/\bC(\d+)\s*\n\s*(\d+)\b/g, "C_{$2}^{$1}");
  s = s.replace(/\bA(\d+)\s*\n\s*(\d+)\b/g, "A_{$2}^{$1}");
  s = s.replace(/\bP(\d+)\b/g, "P_{$1}");

  // Phân số lượng giác dạng đặc thù:
  s = s.replace(/(?:\\cos|\\sin|\\tan|\\cot)\s*\$?([A-Z])\$?\s*=\s*(\d+)\s+(\d+)/gi, "\\cos $1 = \\frac{$2}{$3}");
  s = s.replace(/(?:\\cos|\\sin|\\tan|\\cot)\s*([A-Z])\s*=\s*(\d+)\s*\n\s*(\d+)/gi, "\\cos $1 = \\frac{$2}{$3}");

  // 8. Xử lý căn thức dạng OCR "p":
  s = s.replace(/p\s*\$([^\$]+)=\s*p\$\s*([0-9a-zA-Z_\-+]+)/gi, "\\sqrt{$1} = \\sqrt{$2}");
  s = s.replace(/(\d+)\s*(?:\n|\s+)\s*p\s*(?:\n|\s+)\s*(\d+)\s*(?:\n|\s+)\s*(\d+)/gi, "\\frac{$1\\sqrt{$2}}{$3}");
  s = s.replace(/(\d+)\s*(?:\n|\s+)\s*(\d+)\s*(?:\n|\s+)\s*p\s*(?:\n|\s+)\s*(\d+)/gi, "\\frac{$1}{$2}\\sqrt{$3}");

  // Dính liền $expr$ p\n<num> -> $expr\sqrt{num}$
  s = s.replace(/\$([^\$]+)\$\s*p\s*(?:\n|\s+)\s*(\d+)/gi, "$$$1\\sqrt{$2}$$");
  s = s.replace(/\$([a-zA-Z]+)\s*=\s*p\$\s*(\d+)/gi, "$$$1 = \\sqrt{$2}$$");

  // 1\nsin2 \alpha -> \frac{1}{\sin^2\alpha}
  s = s.replace(/1\s*\n\s*\\sin\^?2?\s*\\alpha/gi, "\\frac{1}{\\sin^2\\alpha}");
  s = s.replace(/1\s*\n\s*\\cos\^?2?\s*\\alpha/gi, "\\frac{1}{\\cos^2\\alpha}");
  s = s.replace(/1\s*\n\s*\\tan\^?2?\s*\\alpha/gi, "\\frac{1}{\\tan^2\\alpha}");
  s = s.replace(/1\s*\n\s*\\cot\^?2?\s*\\alpha/gi, "\\frac{1}{\\cot^2\\alpha}");

  // Hệ số đi liền với p: 3\np\n2 -> 3\sqrt{2}, 2\np\n23 -> 2\sqrt{23}
  s = s.replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])(-?\d+)\s*(?:\n|\s+)\s*p\s*(?:\n|\s+)\s*(\d+)/gi, "$1\\sqrt{$2}");
  s = s.replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])([a-zA-Z]+)\$?\s*(?:\n|\s+)\s*p\s*(?:\n|\s+)\s*(\d+)/gi, "$1\\sqrt{$2}");

  // Căn thức chứa biểu thức hoặc số: p\n 2x-1 hoặc p\n x-1 -> \sqrt{2x-1}
  s = s.replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])p\s*(?:\n|\s+)\s*([0-9a-zA-Z][0-9a-zA-Z_\-+]*)/gi, "\\sqrt{$1}");

  // Phân số đơn giản dạng 23\n8 hoặc a^2\n4 hoặc 3a^2\n2 trong đáp án
  s = s.replace(/^(\d*a\^?2?|[-+]?\d+)\s*(?:\n|\s*\/\s*)\s*(\d+)\s*(\.?)$/gm, "\\frac{$1}{$2}$3");

  // 9. Unicode toán học -> LaTeX
  s = s.replace(/≤/g, " \\le ");
  s = s.replace(/≥/g, " \\ge ");
  s = s.replace(/≠/g, " \\ne ");
  s = s.replace(/±/g, " \\pm ");
  s = s.replace(/π/g, "\\pi");
  s = s.replace(/⇒/g, " \\Rightarrow ");
  s = s.replace(/⇔/g, " \\Leftrightarrow ");
  s = s.replace(/∀\s*([a-zA-Z])\s*∈\s*R\b/g, "\\forall $1 \\in \\mathbb{R}");
  s = s.replace(/∃\s*([a-zA-Z])\s*∈\s*R\b/g, "\\exists $1 \\in \\mathbb{R}");
  s = s.replace(/∀\s*([a-zA-Z])\s*∈\s*N\b/g, "\\forall $1 \\in \\mathbb{N}");
  s = s.replace(/∃\s*([a-zA-Z])\s*∈\s*N\b/g, "\\exists $1 \\in \\mathbb{N}");
  s = s.replace(/∀\s*([a-zA-Z])\s*∈\s*Z\b/g, "\\forall $1 \\in \\mathbb{Z}");
  s = s.replace(/∃\s*([a-zA-Z])\s*∈\s*Z\b/g, "\\exists $1 \\in \\mathbb{Z}");
  s = s.replace(/∀\s*([a-zA-Z])\s*∈\s*Q\b/g, "\\forall $1 \\in \\mathbb{Q}");
  s = s.replace(/∃\s*([a-zA-Z])\s*∈\s*Q\b/g, "\\exists $1 \\in \\mathbb{Q}");
  s = s.replace(/∈\s*R\b/g, "\\in \\mathbb{R}");
  s = s.replace(/∈\s*N\b/g, "\\in \\mathbb{N}");
  s = s.replace(/∈\s*Z\b/g, "\\in \\mathbb{Z}");
  s = s.replace(/∈\s*Q\b/g, "\\in \\mathbb{Q}");
  s = s.replace(/∉\s*R\b/g, "\\notin \\mathbb{R}");
  s = s.replace(/∉\s*N\b/g, "\\notin \\mathbb{N}");
  s = s.replace(/∉\s*Z\b/g, "\\notin \\mathbb{Z}");
  s = s.replace(/∉\s*Q\b/g, "\\notin \\mathbb{Q}");
  s = s.replace(/∈/g, "\\in ");
  s = s.replace(/∉/g, "\\notin ");
  s = s.replace(/∀/g, "\\forall ");
  s = s.replace(/∃/g, "\\exists ");

  // Hiệu tập hợp: A \B -> A \setminus B
  s = s.replace(/\b([A-Z])\s*\\B\b/g, "$1 \\setminus B");

  // Dọn các khoảng trắng thừa bên trong biểu thức toán
  s = s.replace(/\$\s*\\Rightarrow\s*\$/g, " \\Rightarrow ");
  s = s.replace(/\$\s*\\Leftrightarrow\s*\$/g, " \\Leftrightarrow ");
  s = s.replace(/\$\s*\\Rightarrow\s*/g, " \\Rightarrow ");
  s = s.replace(/\s*\\Rightarrow\s*\$/g, " \\Rightarrow ");
  s = s.replace(/\$\s*\\Leftrightarrow\s*/g, " \\Leftrightarrow ");
  s = s.replace(/\s*\\Leftrightarrow\s*\$/g, " \\Leftrightarrow ");

  // 10. Nếu là lựa chọn thuần toán học (không chứa tiếng Việt): Bọc toàn bộ vào $...$
  const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(s);
  const hasMathSymbols = /(?:\\(?:pi|sqrt|frac|vec|le|ge|ne|in|notin|subset|cap|cup|pm|alpha|beta|theta|cos|sin|tan|cot|Leftrightarrow|Rightarrow|cdot|cdots|widehat|triangle|setminus|mathbb|forall|exists)|[=<>+\-*^/]|P_\{\d+\}|C_\{|A_\{|^\d+\.?$)/.test(s);

  if (!hasVietnamese && hasMathSymbols) {
    let cleanInside = s.replace(/\$/g, "").replace(/\n+/g, " ").trim();
    let trailingDot = "";
    if (cleanInside.endsWith(".")) {
      trailingDot = ".";
      cleanInside = cleanInside.slice(0, -1).trim();
    }
    let leadingQuote = "";
    let trailingQuote = "";
    if (cleanInside.startsWith("“") || cleanInside.startsWith('"')) {
      leadingQuote = "“";
      cleanInside = cleanInside.slice(1).trim();
    }
    if (cleanInside.endsWith("”") || cleanInside.endsWith('"')) {
      trailingQuote = "”";
      cleanInside = cleanInside.slice(0, -1).trim();
    }

    cleanInside = cleanInside.replace(/\s{2,}/g, " ");
    return `${leadingQuote}$${cleanInside}$${trailingQuote}${trailingDot}`;
  }

  // 11. Xử lý trong văn bản tiếng Việt: Bọc các biểu thức toán rời rạc
  const mathBlocks: string[] = [];
  s = s.replace(/\$[^$]+?\$/g, (m) => {
    mathBlocks.push(m);
    return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
  });

  // Vector chains: \vec{AB} + \vec{CD} (hỗ trợ cả dấu phẩy ')
  s = s.replace(
    /(?:(?<=[\s(\[{])|^)(?:[+-]?\s*(?:\d+|[a-zA-Z])?\s*\\vec\{[^{}]+\}'?(?:\s*[-+=·\.]\s*[+-]?\s*(?:\d+|[a-zA-Z])?\s*\\vec\{[^{}]+\}'?)+)/g,
    (m) => {
      mathBlocks.push(`$${m.trim()}$`);
      return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
    }
  );

  // Single vectors: \vec{a}, \vec{0}
  s = s.replace(
    /(?:(?<=[\s(\[{])|^)([+-]?\s*(?:\d+|[a-zA-Z])?\s*\\vec\{[^{}]+\}'?(?:_\{\d+\})?)(?=[“"'\s,;\.\)\]\}?!:]|$)/g,
    (m, v) => {
      mathBlocks.push(`$${v.trim()}$`);
      return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
    }
  );

  // Sai số với \pm: e.g. a = 17658 \pm 16, 152m \pm 0,2m
  s = s.replace(
    /(?:(?<=[\s(\[{])|^)([a-zA-Z]\s*=\s*)?(\d+(?:,\d+)?(?:\s*[a-zA-Z]+\^?\d*)?\s*\\pm\s*\d+(?:,\d+)?(?:\s*[a-zA-Z]+\^?\d*)?)(?=[“"'\s,;\.\)\]\}?!:]|$)/g,
    (m) => {
      mathBlocks.push(`$${m.trim()}$`);
      return ` __MATH_BLOCK_${mathBlocks.length - 1}__ `;
    }
  );

  // Trig fractions: tan\alpha = 1\n2 hoặc sin\alpha = 4\n5 -> $\sin\alpha = \frac{4}{5}$
  s = s.replace(
    /(?:(?<=[\s(\[{])|^)((?:\\cos|\\sin|\\tan|\\cot)\s*\\alpha\s*=\s*[-+]?\s*\d+\s*(?:\n|\s*\/\s*)\s*\d+)(?=[“"'\s,;\.\)\]\}?!:]|$)/gi,
    (m) => {
      let expr = m.replace(/([-+]?\d+)\s*(?:\n|\s*\/\s*)\s*(\d+)/, "\\frac{$1}{$2}");
      mathBlocks.push(`$${expr.trim()}$`);
      return ` __MATH_BLOCK_${mathBlocks.length - 1}__ `;
    }
  );

  // Simple trig with alpha/beta/a/b/x: \tan\alpha, \cos A, \sin x, \cot\alpha
  s = s.replace(
    /(?:(?<=[\s(\[{])|^)((?:\\cos|\\sin|\\tan|\\cot)\s*\\?(?:alpha|beta|[a-zA-Z]))(?=[“"'\s,;\.\)\]\}?!:]|$)/gi,
    (m) => {
      mathBlocks.push(`$${m.trim()}$`);
      return ` __MATH_BLOCK_${mathBlocks.length - 1}__ `;
    }
  );

  // Quantifier: \forall x \in \mathbb{R}, x^2 ...
  s = s.replace(
    /(?:(?<=[\s,;:\(\[\{“"'])|^)(\\(?:forall|exists)\s+[^,;]+?,\s*[^;\.\n\r]+?[=<>\\le\\ge\\ne][^;\.\n\r]+?)(?=[“"'\s,;\.\)\]\}?!:]|$)/g,
    (m, expr) => {
      mathBlocks.push(`$${expr.trim()}$`);
      return ` __MATH_BLOCK_${mathBlocks.length - 1}__ `;
    }
  );

  // Biểu thức lượng giác phức tạp: \tan^2\alpha\sin^2 x - \tan^2\alpha + \sin^2\alpha
  s = s.replace(
    /(?:(?<=Biểu thức\s+)|(?<=biểu thức\s+)|(?<=Tổng\s+)|(?<=tổng\s+))([\\a-zA-Z0-9\s+\-*^/()]+?\\(?:sin|cos|tan|cot)[\\a-zA-Z0-9\s+\-*^/()]*)(?=\s+(?:có|bằng|tại|\.|\?|$))/gi,
    (m, expr) => {
      mathBlocks.push(`$${expr.trim()}$`);
      return ` __MATH_BLOCK_${mathBlocks.length - 1}__ `;
    }
  );

  // Phương trình lượng giác: 3\cos\alpha - \sin\alpha = 1
  s = s.replace(
    /(?:(?<=[\s(\[{])|^)(-?\d*\s*\\(?:cos|sin|tan|cot)\s*\\alpha\s*[-+]\s*\d*\s*\\(?:cos|sin|tan|cot)\s*\\alpha\s*=\s*-?\d+)(?=[“"'\s,;\.\)\]\}?!:]|$)/gi,
    (m) => {
      mathBlocks.push(`$${m.trim()}$`);
      return ` __MATH_BLOCK_${mathBlocks.length - 1}__ `;
    }
  );

  // Formula expressions: f(x) = ... hoặc P = ... hoặc A = ... hoặc E = ... hoặc M = ...
  s = s.replace(
    /(?:(?<=Biểu thức\s+)|(?<=biểu thức\s+)|(?<=tính\s+)|(?<=Tính\s+))([fPABEM]\s*(?:\([xX]\))?\s*=\s*[^.,;]+?)(?=\s+(?:có|bằng|tại|\.|\?|$))/gi,
    (m, expr) => {
      let cleaned = expr.replace(/\n+/g, " ");
      mathBlocks.push(`$${cleaned.trim()}$`);
      return ` __MATH_BLOCK_${mathBlocks.length - 1}__ `;
    }
  );

  // Hiệu tập hợp: A \setminus B hoặc (A \setminus B) \cap C
  s = s.replace(
    /(?:(?<=[\s(\[{])|^)(\(?[A-Z]\s*\\setminus\s*[A-Z]\)?(?:\s*[∩∪]\s*[A-Z])?)(?=[“"'\s,;\.\)\]\}?!:]|$)/g,
    (m, expr) => {
      const cleaned = expr.replace(/∩/g, "\\cap ").replace(/∪/g, "\\cup ");
      mathBlocks.push(`$${cleaned.trim()}$`);
      return ` __MATH_BLOCK_${mathBlocks.length - 1}__ `;
    }
  );

  // Ký hiệu góc \widehat{...} và \triangle ...
  s = s.replace(
    /(?:(?<=[\s(\[{])|^)(\\(?:widehat|triangle)\s*\{?[A-Z]{3}\}?)(?=[“"'\s,;\.\)\]\}?!:]|$)/g,
    (m, expr) => {
      mathBlocks.push(`$${expr.trim()}$`);
      return ` __MATH_BLOCK_${mathBlocks.length - 1}__ `;
    }
  );

  // Bất đẳng thức kép hoặc đơn: 3x-3y \ge 4 hoặc 90^\circ \le \alpha \le 180^\circ
  s = s.replace(
    /(?:(?<=[\s(\[{])|^)(\d*(?:\^\\circ)?[a-zA-Z0-9_|()]+\s*\\(?:le|ge|[<>])\s*[^.,;?!\n]+?)(?=[“"'\s,;\.\)\]\}?!:]|$)/g,
    (m) => {
      mathBlocks.push(`$${m.trim()}$`);
      return ` __MATH_BLOCK_${mathBlocks.length - 1}__ `;
    }
  );

  // Phân số và căn độc lập:
  s = s.replace(/(?<!\$)\\frac\{[^{}]+\}\{[^{}]+\}(?!\$)/g, (m) => {
    mathBlocks.push(`$${m}$`);
    return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
  });
  s = s.replace(/(?<!\$)\\sqrt\{[^{}]+\}(?!\$)/g, (m) => {
    mathBlocks.push(`$${m}$`);
    return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
  });

  // Độ độc lập: 120^\circ -> $120^\circ$
  s = s.replace(/(\d+)\s*\^\\circ/g, (m) => {
    mathBlocks.push(`$${m}$`);
    return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
  });

  // Angle sums: \alpha + \beta = 90^\circ hoặc \alpha + \beta
  s = s.replace(
    /(?:(?<=[\s(\[{])|^)(\\alpha\s*[-+]\s*\\beta(?:\s*=\s*[^,;.\s]+)?)(?=[“"'\s,;\.\)\]\}?!:]|$)/gi,
    (m, expr) => {
      mathBlocks.push(`$${expr.trim()}$`);
      return ` __MATH_BLOCK_${mathBlocks.length - 1}__ `;
    }
  );

  // Standalone Greek letters (kèm số mũ tùy chọn): \alpha, \beta, \theta, \pi^2
  s = s.replace(
    /(?:(?<=[\s(\[{])|^)(\\(?:alpha|beta|theta|pi)(?:\^\{?\d+\}?)?)(?=[“"'\s,;\.\)\]\}?!:]|$)/g,
    (m, sym) => {
      mathBlocks.push(`$${sym}$`);
      return ` __MATH_BLOCK_${mathBlocks.length - 1}__ `;
    }
  );

  // Math relations: m \in [a;b]... hoặc \in S
  s = s.replace(
    /(?:(?<=[\s(\[{])|^)([^$\s,;]+\s*\\(?:in|notin)\s*[^.,;]+?)(?=[“"'\s,;\.\)\]\}?!:]|$)/g,
    (m) => {
      mathBlocks.push(`$${m.trim()}$`);
      return ` __MATH_BLOCK_${mathBlocks.length - 1}__ `;
    }
  );

  // Bất đẳng thức rỗng ( \le \le )
  s = s.replace(/\(\s*\\le\s*\\le\s*\)/g, () => "($0^\\circ \\le \\alpha \\le 180^\\circ$)");

  // Dots outside $: \cdots, \cdot
  s = s.replace(
    /(?:(?<=[\s(\[{])|^)([^$\s,;]+\s*\\c?dots?\s*[^$\s,;]+)(?=[“"'\s,;\.\)\]\}?!:]|$)/g,
    (m) => {
      mathBlocks.push(`$${m.trim()}$`);
      return ` __MATH_BLOCK_${mathBlocks.length - 1}__ `;
    }
  );

  // Tích vô hướng hoặc nhân: \cdot outside $
  s = s.replace(/(?:(?<=[\s(\[{])|^)([^$\s,;]+\s*\\cdot\s*[^$\s,;]+)(?=[“"'\s,;\.\)\]\}?!:]|$)/g, (m) => {
    mathBlocks.push(`$${m.trim()}$`);
    return ` __MATH_BLOCK_${mathBlocks.length - 1}__ `;
  });

  // Quét vét bất kỳ lệnh LaTeX nào còn sót lại chưa có $ bao quanh
  s = s.replace(/(?:(?<=[\s(\[{])|^)(\\(?:[a-zA-Z]+)(?:\{[^{}]*\})*)(?=[“"'\s,;\.\)\]\}?!:]|$)/g, (m) => {
    mathBlocks.push(`$${m.trim()}$`);
    return ` __MATH_BLOCK_${mathBlocks.length - 1}__ `;
  });

  // Hồi phục lại tất cả các khối toán học
  s = s.replace(/__MATH_BLOCK_(\d+)__/g, (_, idx) => mathBlocks[parseInt(idx, 10)]);

  s = s.replace(/\s{2,}/g, " ");
  return s.trim();
}
