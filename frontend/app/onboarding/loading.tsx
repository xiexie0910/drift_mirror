export default function OnboardingLoading() {
  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Progress bar skeleton */}
        <div className="animate-pulse">
          <div className="h-1 w-full bg-teal-100/30 rounded-full" />
        </div>

        {/* Header skeleton */}
        <div className="text-center space-y-3 animate-pulse">
          <div className="h-7 w-48 mx-auto bg-teal-100/30 rounded-lg" />
          <div className="h-4 w-64 mx-auto bg-teal-50/30 rounded-lg" />
        </div>

        {/* Form skeleton */}
        <div className="glass-strong rounded-2xl p-6 animate-pulse space-y-5">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-teal-50/20 rounded" />
            <div className="h-12 w-full bg-teal-50/15 rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-teal-50/20 rounded" />
            <div className="h-20 w-full bg-teal-50/15 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
