"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  content: string;
  className?: string;
}

/**
 * Tiền xử lý nội dung để bảo đảm các công thức LaTeX, phân số \frac,
 * căn thức \sqrt, vectơ \vec và tọa độ điểm luôn được bọc trong $...$
 * kể cả khi dữ liệu thô chưa bọc math delimiters.
 */
function preprocessMathContent(content: string): string {
  if (!content) return "";

  // 1. Dọn dẹp ký tự điều khiển font scan và dấu trừ Unicode
  let s = content
    .replace(/[\u0000\u0010]/g, "(")
    .replace(/[\u0001\u0011]/g, ")")
    .replace(/\u0008/g, "{")
    .replace(/[\u0002-\u0007\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\u2212/g, "-");

  // Xóa newline thừa trong tọa độ: C\n(\n\sqrt{2} -> C(\sqrt{2}
  s = s.replace(/([A-Z])\s*\n\s*\(/g, "$1(");
  s = s.replace(/\(\s*\n\s*/g, "(");
  s = s.replace(/\s*\n\s*\)/g, ")");

  // 2. Tách theo các khối toán học đã có ($...$ và $$...$$) để không bọc đúp
  const parts = s.split(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$)/g);

  for (let i = 0; i < parts.length; i += 2) {
    let p = parts[i];
    if (!p) continue;

    // Bọc tọa độ hoàn chỉnh: M(1; \frac{3}{2}), C(\sqrt{2}; \sqrt{2})
    p = p.replace(
      /\b([A-Z]\s*\([^\)]*\\(?:frac|sqrt)[^\)]*\))/g,
      (m) => `$${m.replace(/\s+/g, " ").replace(/;\s*/g, "; ")}$`
    );

    // Tách lại để các tọa độ vừa bọc không bị bọc đúp lần 2
    const subParts = p.split(/(\$[^$]*?\$)/g);
    for (let j = 0; j < subParts.length; j += 2) {
      if (!subParts[j]) continue;
      // Bọc các lệnh LaTeX độc lập còn sót ngoài $: \frac{a}{b}, \sqrt{x}, \vec{v}
      subParts[j] = subParts[j].replace(
        /(\\(?:frac\{[^{}]*\}\{[^{}]*\}|sqrt\{[^{}]*\}|vec\{[^{}]*\}))/g,
        "$$$1$"
      );
    }
    parts[i] = subParts.join("");
  }

  return parts.join("");
}

export function MathRenderer({ content, className = "" }: MathRendererProps) {
  const processed = preprocessMathContent(content);

  return (
    <div className={`prose max-w-none text-slate-800 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-slate-900 border-b pb-2 mt-6 mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-blue-900 mt-6 mb-3" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-slate-900 mt-5 mb-2 leading-relaxed" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-base font-semibold text-slate-800 mt-4 mb-2 leading-relaxed" {...props} />,
          p: ({ node, ...props }) => <p className="mb-4 text-slate-700 leading-loose" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 bg-blue-50/70 p-4 my-5 rounded-r-lg text-slate-800 shadow-xs" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-5 rounded-lg border border-slate-200 shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 text-sm bg-white" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => <th className="border border-slate-300 bg-blue-50/80 px-4 py-2.5 font-semibold text-center text-slate-800" {...props} />,
          td: ({ node, ...props }) => <td className="border border-slate-200 px-4 py-2.5 text-center text-slate-700 whitespace-nowrap" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-3 space-y-2 text-slate-700" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-6 my-3 space-y-2 text-slate-700" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed pl-1" {...props} />,
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}

