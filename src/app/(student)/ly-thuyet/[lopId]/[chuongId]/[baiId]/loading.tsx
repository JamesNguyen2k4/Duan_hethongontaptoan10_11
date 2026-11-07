export default function BaiLyThuyetLoading() {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 w-28 bg-slate-200 rounded" />
        <span className="text-slate-300">/</span>
        <div className="h-4 w-48 bg-slate-200 rounded" />
        <span className="text-slate-300">/</span>
        <div className="h-4 w-36 bg-slate-200 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content Skeleton */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="h-8 w-3/4 bg-slate-200 rounded-lg" />
            <div className="h-4 w-1/3 bg-slate-200 rounded" />
            <div className="border-b border-slate-100 my-4" />

            <div className="space-y-3">
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-11/12 bg-slate-100 rounded" />
              <div className="h-4 w-4/5 bg-slate-100 rounded" />
            </div>

            {/* Formula Block placeholder */}
            <div className="h-28 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-center">
              <div className="h-6 w-1/2 bg-blue-200/60 rounded" />
            </div>

            <div className="space-y-3 pt-2">
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-10/12 bg-slate-100 rounded" />
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 h-36" />
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 h-64 space-y-3">
            <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 w-full bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

