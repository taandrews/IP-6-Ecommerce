export default function Loading() {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <span
        className="size-8 rounded-full border-2 border-forest-300 border-t-forest-700 animate-spin"
        aria-label="Loading"
      />
    </div>
  );
}
