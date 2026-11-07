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

export function MathRenderer({ content, className = "" }: MathRendererProps) {
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
        {content}
      </ReactMarkdown>
    </div>
  );
}

