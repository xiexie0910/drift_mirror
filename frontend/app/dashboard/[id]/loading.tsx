export default function GoalDetailLoading() {
  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-11 h-11 bg-teal-100/40 rounded-xl" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-48 bg-teal-100/30 rounded-lg" />
            <div className="h-4 w-32 bg-teal-50/30 rounded-lg" />
          </div>
        </div>

        {/* Metrics skeleton */}
        <div className="glass-strong rounded-2xl p-5 animate-pulse">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-8 w-12 mx-auto bg-teal-100/30 rounded-lg" />
                <div className="h-3 w-16 mx-auto bg-teal-50/20 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Timeline skeleton */}
        <div className="glass-strong rounded-2xl p-5 animate-pulse space-y-4">
          <div className="h-4 w-24 bg-teal-100/30 rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 bg-teal-50/30 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-teal-50/20 rounded" />
                <div className="h-3 w-1/2 bg-teal-50/15 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
