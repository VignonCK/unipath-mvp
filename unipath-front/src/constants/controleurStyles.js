export const STATUT_STYLES = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  VALIDE: 'bg-green-100 text-green-800 border border-green-200',
  REJETE: 'bg-red-100 text-red-800 border border-red-200',
  SOUS_RESERVE: 'bg-orange-100 text-orange-800 border border-orange-200',
  VALIDE_PAR_COMMISSION: 'bg-blue-100 text-blue-800 border border-blue-200',
  REJETE_PAR_COMMISSION: 'bg-red-100 text-red-800 border border-red-200',
};

export const VERDICT_STYLES = {
  VALIDE: 'bg-green-100 text-green-800 border border-green-200',
  REJETE: 'bg-red-100 text-red-800 border border-red-200',
  SOUS_RESERVE: 'bg-orange-100 text-orange-800 border border-orange-200',
};

export const VERDICT_LABELS = {
  VALIDE: 'Validé',
  REJETE: 'Rejeté',
  SOUS_RESERVE: 'Sous réserve',
};

export const PRIORITE_STYLES = {
  URGENT: 'bg-red-100 text-red-800 border border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border border-orange-200',
  NORMAL: 'bg-blue-100 text-blue-800 border border-blue-200',
};

export const PRIORITE_CARD_STYLES = {
  URGENT: 'border border-red-200 bg-red-50/50',
  HIGH: 'border border-orange-200 bg-orange-50/50',
  NORMAL: '',
};

export const FILTER_BTN_INACTIVE =
  'px-4 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition';

export const FILTER_BTN_ACTIVE =
  'px-4 py-2 rounded-lg text-xs font-medium bg-slate-700 text-white transition';

export const FILTER_BTN_WARNING_ACTIVE =
  'px-4 py-2 rounded-lg text-xs font-medium bg-orange-500 text-white transition';

export function filterBtnClass(isActive, variant = 'default') {
  if (!isActive) return FILTER_BTN_INACTIVE;
  if (variant === 'warning') return FILTER_BTN_WARNING_ACTIVE;
  return FILTER_BTN_ACTIVE;
}

export function badgeClass(map, key, fallback = 'bg-gray-100 text-gray-700 border border-gray-200') {
  return map[key] || fallback;
}
