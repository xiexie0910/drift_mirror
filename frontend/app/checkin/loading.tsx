export default function CheckinLoading() {
  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-11 h-11 bg-teal-100/40 rounded-xl" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-teal-100/30 rounded-lg" />
            <div className="h-4 w-48 bg-teal-50/30 rounded-lg" />
          </div>
        </div>

        {/* Card skeleton */}
        <div className="glass-strong rounded-2xl p-6 animate-pulse space-y-5">
          <div className="flex items-start gap-3 p-4 glass-quiet rounded-xl">
            <div className="w-9 h-9 bg-amber-100/40 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-teal-50/20 rounded" />
              <div className="h-5 w-3/4 bg-teal-100/30 rounded-lg" />
            </div>
          </div>
          <div className="h-6 w-64 mx-auto bg-teal-50/20 rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-14 bg-teal-50/20 rounded-xl" />
            <div className="h-14 bg-teal-50/20 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
