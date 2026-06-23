const STYLES = {
  BROUILLON: 'bg-gray-100 text-gray-700 border-gray-200',
  PUBLIEE: 'bg-green-100 text-green-800 border-green-200',
  CLOTUREE: 'bg-red-100 text-red-800 border-red-200',
  ANNULEE: 'bg-orange-100 text-orange-800 border-orange-200',
};

const LABELS = {
  BROUILLON: 'Brouillon',
  PUBLIEE: 'Publiée',
  CLOTUREE: 'Clôturée',
  ANNULEE: 'Annulée',
};

export default function StatutCampagneBadge({ statut }) {
  const key = statut || 'BROUILLON';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STYLES[key] || STYLES.BROUILLON}`}>
      {LABELS[key] || key}
    </span>
  );
}
