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
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 border-b border-slate-200 pb-3 mt-8 mb-5 tracking-tight" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl sm:text-2xl font-black text-blue-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3 leading-snug" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-6 mb-3 leading-snug" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base sm:text-lg font-bold text-indigo-900 mt-5 mb-2.5 leading-snug" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4 text-slate-800 text-[15px] sm:text-base leading-relaxed sm:leading-loose tracking-normal" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/40 p-4 sm:p-5 my-6 rounded-r-2xl text-slate-800 shadow-2xs space-y-2 text-[15px] sm:text-base leading-relaxed" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-slate-300 shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 text-sm bg-white" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="border border-slate-200 bg-slate-100 px-4 py-3 font-bold text-center text-slate-800 text-xs sm:text-sm tracking-wider uppercase" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-slate-200 px-4 py-2.5 text-center text-slate-700 text-xs sm:text-sm" {...props} />
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
