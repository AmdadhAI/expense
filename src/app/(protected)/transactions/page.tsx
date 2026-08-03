export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transactions</h1>
        <p className="text-sm text-slate-500">Record and Filter Dated Transactions</p>
      </header>

      <div className="p-12 text-center rounded-2xl bg-white border border-slate-100 space-y-3">
        <p className="text-sm font-medium text-slate-600">No transactions recorded yet.</p>
        <p className="text-xs text-slate-400">Transaction CRUD operations will be enabled in Phase 2.</p>
      </div>
    </div>
  );
}
