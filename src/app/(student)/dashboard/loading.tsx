import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-44 sm:h-52 bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="h-5 w-24 bg-white/60 rounded-full" />
            <div className="h-5 w-36 bg-white/50 rounded-full" />
            <div className="h-5 w-20 bg-white/80 rounded-full" />
          </div>
          <div className="h-8 w-72 sm:w-96 bg-white/70 rounded-xl" />
          <div className="h-4 w-full max-w-lg bg-white/50 rounded-lg" />
        </div>
        <div className="h-10 w-44 bg-white/80 rounded-xl" />
      </div>

      {/* 3 Pillars Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100" />
            <div className="h-5 w-48 bg-slate-200 rounded-md" />
            <div className="h-3 w-full bg-slate-100 rounded-md" />
            <div className="h-3 w-3/4 bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2"
          >
            <div className="h-4 w-28 bg-slate-200 rounded-md" />
            <div className="h-8 w-20 bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Floating Center Loading Badge */}
      <div className="fixed bottom-6 right-6 z-50 bg-slate-900/85 backdrop-blur-md text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200">
        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
        <span>Đang tổng hợp dữ liệu học tập...</span>
      </div>
    </div>
  );
}
