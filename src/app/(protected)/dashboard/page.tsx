export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500">Monthly Financial Summary (Asia/Dhaka)</p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700">
          August 2026
        </div>
      </header>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">Income</span>
          <p className="text-xl font-bold text-slate-900 mt-2">৳ 0.00</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <span className="text-xs font-medium text-rose-600 uppercase tracking-wider">Expenses</span>
          <p className="text-xl font-bold text-slate-900 mt-2">৳ 0.00</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Saved</span>
          <p className="text-xl font-bold text-slate-900 mt-2">৳ 0.00</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">Available</span>
          <p className="text-xl font-bold text-slate-900 mt-2">৳ 0.00</p>
        </div>
      </div>

      {/* Target Progress Section Placeholder */}
      <div className="p-6 rounded-2xl bg-white border border-slate-100 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Allocation Target Progress</h2>
        <div className="space-y-3 text-xs text-slate-500">
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span>Needs (Target 20%)</span>
            <span className="font-semibold text-slate-700">৳ 0.00 / ৳ 0.00</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span>Wants (Target 10%)</span>
            <span className="font-semibold text-slate-700">৳ 0.00 / ৳ 0.00</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span>Savings (Target 70%)</span>
            <span className="font-semibold text-slate-700">৳ 0.00 / ৳ 0.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
