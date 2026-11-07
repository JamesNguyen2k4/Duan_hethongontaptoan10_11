export default function LyThuyetIndexLoading() {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
      {/* Header Banner Skeleton */}
      <div className="bg-slate-200 rounded-2xl p-6 sm:p-8 h-44" />

      {/* Chapters list Skeleton */}
      <div className="grid grid-cols-1 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-200" />
                <div className="h-5 w-64 bg-slate-200 rounded" />
              </div>
              <div className="h-5 w-20 bg-slate-200 rounded-full" />
            </div>

            <div className="divide-y divide-slate-100 p-6 space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center justify-between py-2">
                  <div className="space-y-2">
                    <div className="h-4 w-56 bg-slate-200 rounded" />
                    <div className="h-3 w-28 bg-slate-100 rounded" />
                  </div>
                  <div className="h-8 w-24 bg-slate-200 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

