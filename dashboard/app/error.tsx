"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-3 h-3 bg-red-500 mx-auto mb-4 blink" />
        <h2
          className="text-[#FF6B00] text-xs tracking-[0.3em] mb-2"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          SYSTEM ERROR
        </h2>
        <p className="text-[#888] text-xs tracking-wider mb-6">
          {error.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={reset}
          className="bg-[#FF6B00] text-black font-bold py-3 px-8 text-[10px] tracking-[0.2em] hover:bg-[#E55F00] transition-colors cursor-pointer"
        >
          RETRY
        </button>
      </div>
    </div>
  );
}
