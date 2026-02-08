export default function MirrorLoading() {
  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-11 h-11 bg-teal-100/40 rounded-xl" />
          <div className="space-y-2">
            <div className="h-6 w-36 bg-teal-100/30 rounded-lg" />
            <div className="h-5 w-24 bg-teal-50/20 rounded-full" />
          </div>
        </div>

        {/* Finding card skeletons */}
        {[1, 2].map((i) => (
          <div key={i} className="glass-strong rounded-2xl p-5 animate-pulse space-y-3">
            <div className="h-5 w-20 bg-teal-50/20 rounded-lg" />
            <div className="h-5 w-full bg-teal-100/20 rounded-lg" />
            <div className="h-4 w-3/4 bg-teal-50/15 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
