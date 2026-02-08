export default function DashboardLoading() {
  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-7 w-32 bg-teal-200/30 rounded-lg" />
          <div className="h-4 w-48 bg-teal-100/30 rounded-lg mt-2" />
        </div>

        {/* Goal card skeletons */}
        {[1, 2].map((i) => (
          <div key={i} className="glass-strong rounded-2xl p-5 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-teal-100/40 rounded-xl" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-3/4 bg-teal-100/30 rounded-lg" />
                <div className="h-4 w-full bg-teal-50/30 rounded-lg" />
                <div className="flex gap-3">
                  <div className="h-3 w-16 bg-teal-50/20 rounded" />
                  <div className="h-3 w-12 bg-teal-50/20 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
