export function LoadingSkeleton() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-16 animate-pulse rounded-brutal border-2 border-ink bg-white shadow-brutal" />
      ))}
    </div>
  );
}
