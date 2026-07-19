/** Niveaux d'étude Module 2 : L1–L3, M1–M2 ↔ 1ʳᵉ–5ᵉ année. */
export const NIVEAUX_ETUDE = [
  { value: 1, code: 'L1', label: 'L1 — 1ère année' },
  { value: 2, code: 'L2', label: 'L2 — 2ème année' },
  { value: 3, code: 'L3', label: 'L3 — 3ème année' },
  { value: 4, code: 'M1', label: 'M1 — 4ème année' },
  { value: 5, code: 'M2', label: 'M2 — 5ème année' },
];

export function labelNiveauEtude(niveau) {
  if (niveau == null || niveau === '') return '—';
  const found = NIVEAUX_ETUDE.find((n) => n.value === Number(niveau));
  return found?.label || String(niveau);
}

export function codeNiveauEtude(niveau) {
  if (niveau == null || niveau === '') return '—';
  const found = NIVEAUX_ETUDE.find((n) => n.value === Number(niveau));
  return found?.code || String(niveau);
}
