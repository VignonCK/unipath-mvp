import CommissionLayout from '../CommissionLayout';
import { BentoCard } from '../AcademicLayout';
import { VERDICT_STYLES, VERDICT_LABELS } from '../../constants/controleurStyles';

export function ControleurLoading({ message = 'Chargement...' }) {
  return (
    <CommissionLayout>
      <div className="min-h-screen academic-bg custom-scrollbar">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{message}</p>
          </div>
        </div>
      </div>
    </CommissionLayout>
  );
}

export function ControleurPage({ children }) {
  return (
    <CommissionLayout>
      <div className="min-h-screen academic-bg custom-scrollbar">
        <main className="max-w-5xl mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6 animate-slide-in">
          {children}
        </main>
      </div>
    </CommissionLayout>
  );
}

export function ControleurAlert({ type = 'error', children }) {
  const styles = {
    error: 'bg-red-50 border border-red-200 text-red-700',
    success: 'bg-green-50 border border-green-200 text-green-700',
    warning: 'bg-orange-50 border border-orange-200 text-orange-800',
    info: 'bg-blue-50 border border-blue-200 text-blue-800',
  };

  return (
    <div className={`px-4 py-3 rounded-lg text-sm flex items-start gap-2 ${styles[type] || styles.error}`}>
      {children}
    </div>
  );
}

export function ControleurPagination({ pagination, onPageChange }) {
  if (pagination.pages <= 1) return null;

  const currentPage = Math.floor(pagination.offset / pagination.limite) + 1;
  const btnClass =
    'px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition';

  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      <button
        type="button"
        className={btnClass}
        disabled={pagination.offset === 0}
        onClick={() => onPageChange(pagination.offset - pagination.limite)}
      >
        ← Précédent
      </button>
      <span className="text-sm text-gray-600">
        Page {currentPage} sur {pagination.pages}
      </span>
      <button
        type="button"
        className={btnClass}
        disabled={pagination.offset + pagination.limite >= pagination.total}
        onClick={() => onPageChange(pagination.offset + pagination.limite)}
      >
        Suivant →
      </button>
    </div>
  );
}

export function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium text-gray-500 shrink-0">{label}</span>
      <div className="text-sm text-slate-800 text-left sm:text-right">{children}</div>
    </div>
  );
}

export function VerdictBadge({ verdict }) {
  const cls = VERDICT_STYLES[verdict] || 'bg-gray-100 text-gray-700 border border-gray-200';
  const label = VERDICT_LABELS[verdict] || verdict || '-';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export function StatCard({ label, value, sub, className = '' }) {
  return (
    <BentoCard className={`p-5 bg-white ${className}`}>
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className="text-3xl font-semibold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </BentoCard>
  );
}
