import { Loader2 } from "lucide-react";

export default function StudentLoading() {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-44 sm:h-52 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="h-5 w-40 bg-white/60 rounded-full" />
          <div className="h-8 w-64 sm:w-80 bg-white/70 rounded-xl" />
          <div className="h-4 w-full max-w-lg bg-white/50 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-36 bg-white/70 rounded-xl" />
          <div className="h-10 w-32 bg-white/50 rounded-xl" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 shadow-xs"
          >
            <div className="h-4 w-28 bg-slate-200 rounded-md" />
            <div className="h-8 w-20 bg-slate-200 rounded-lg" />
            <div className="h-3 w-36 bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>

      {/* Content Section Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="h-6 w-48 bg-slate-200 rounded-md" />
          <div className="h-4 w-24 bg-slate-100 rounded-md" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="space-y-2">
                <div className="h-4 w-60 bg-slate-200 rounded-md" />
                <div className="h-3 w-40 bg-slate-100 rounded-md" />
              </div>
              <div className="h-8 w-24 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Floating Center Loading Badge */}
      <div className="fixed bottom-6 right-6 z-50 bg-slate-900/85 backdrop-blur-md text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200">
        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
        <span>Đang tải nội dung...</span>
      </div>
    </div>
  );
}
