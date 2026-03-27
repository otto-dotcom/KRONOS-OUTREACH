export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Campaign launcher skeleton */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-6 h-48 animate-pulse" />
      {/* Analytics skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-6 h-96 animate-pulse" />
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-6 h-96 animate-pulse" />
      </div>
    </div>
  );
}
