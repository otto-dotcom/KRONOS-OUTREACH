import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-[#FF6B00] text-4xl font-bold mb-2">404</div>
        <p className="text-[#888] text-xs tracking-[0.2em] uppercase mb-6">
          Route not found
        </p>
        <Link
          href="/"
          className="inline-block bg-[#FF6B00] text-black font-bold py-3 px-8 text-[10px] tracking-[0.2em] hover:bg-[#E55F00] transition-colors"
        >
          RETURN TO BASE
        </Link>
      </div>
    </div>
  );
}
