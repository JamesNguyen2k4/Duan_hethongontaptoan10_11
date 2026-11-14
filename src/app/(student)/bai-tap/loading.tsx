import { Loader2, Layers } from "lucide-react";

export default function BaiTapLoading() {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
      {/* Quick Chapter Filter Buttons Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-48 bg-slate-200 rounded-md" />
          <div className="h-4 w-32 bg-slate-100 rounded-md" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div
              key={i}
              className="h-8 w-20 bg-slate-200 rounded-xl shrink-0"
            />
          ))}
        </div>
      </div>

      {/* Chapter Cards Skeleton */}
      <div className="space-y-8">
        {[1, 2].map((ch) => (
          <div
            key={ch}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Chapter Header */}
            <div className="p-5 sm:px-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-200" />
                <div className="space-y-1.5">
                  <div className="h-5 w-56 bg-slate-200 rounded-md" />
                  <div className="h-3 w-36 bg-slate-100 rounded-md" />
                </div>
              </div>
              <div className="h-6 w-24 bg-blue-100 rounded-full" />
            </div>

            {/* Lessons Rows */}
            <div className="divide-y divide-slate-100">
              {[1, 2, 3].map((lesson) => (
                <div
                  key={lesson}
                  className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 max-w-xl flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-48 bg-slate-200 rounded-md" />
                      <div className="h-4 w-20 bg-blue-100 rounded-md" />
                      <div className="h-4 w-16 bg-slate-100 rounded-md" />
                    </div>
                    <div className="h-3 w-72 bg-slate-100 rounded-md" />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-8 w-24 bg-slate-100 rounded-xl" />
                    <div className="h-8 w-28 bg-blue-100 rounded-xl" />
                    <div className="h-8 w-32 bg-blue-200 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Center Loading Badge */}
      <div className="fixed bottom-6 right-6 z-50 bg-slate-900/85 backdrop-blur-md text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200">
        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
        <span>Đang nạp ngân hàng bài tập...</span>
      </div>
    </div>
  );
}
