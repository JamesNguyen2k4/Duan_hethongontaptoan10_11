"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { preprocessMathContent } from "@/lib/math-preprocess";

export { preprocessMathContent };

interface MathRendererProps {
  content: string;
  className?: string;
}

export function MathRenderer({ content, className = "" }: MathRendererProps) {
  const processed = preprocessMathContent(content);

  return (
    <div className={`prose max-w-none text-slate-800 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 border-b border-slate-200 pb-3 mt-6 mb-4 tracking-tight" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-lg sm:text-xl font-bold text-blue-900 mt-6 mb-3 border-l-4 border-blue-600 pl-3 leading-snug" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-5 mb-2 leading-snug" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-sm sm:text-base font-semibold text-slate-800 mt-3 mb-1.5 leading-snug" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4 text-slate-700 text-[15px] sm:text-base leading-relaxed tracking-normal" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 p-4 sm:p-5 my-5 rounded-r-xl text-slate-700 text-[14.5px] sm:text-[15px] leading-relaxed space-y-2 shadow-2xs" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 text-sm bg-white border-collapse" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="border border-slate-200 bg-slate-50 px-4 py-2.5 font-semibold text-center text-slate-700 text-xs sm:text-sm tracking-wider" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-slate-200 px-4 py-2 text-center text-slate-700 text-xs sm:text-sm" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 my-4 space-y-2 text-slate-800 text-[15px] sm:text-base leading-relaxed" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 my-4 space-y-2 text-slate-800 text-[15px] sm:text-base leading-relaxed" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed pl-1 my-1.5" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-8 border-slate-200" {...props} />
          ),
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
