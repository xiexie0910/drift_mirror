export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-subtle p-8 rounded-2xl animate-pulse-soft">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <p className="text-neutral-500 text-sm">Loading...</p>
        </div>
      </div>
    </div>
  );
}
