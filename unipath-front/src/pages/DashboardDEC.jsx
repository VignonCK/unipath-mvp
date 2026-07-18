// src/pages/DashboardDEC.jsx
// Placeholder Phase 1/6 — le tableau de bord DEC métier arrive en Phase 2+

import { getUser, logout } from '../utils/auth';

export default function DashboardDEC() {
  const user = getUser();
  const nomAffiche = user?.prenom
    ? `${user.prenom} ${user.nom || ''}`.trim()
    : user?.email || 'Administrateur DEC';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">UniPath</p>
          <h1 className="text-lg font-semibold text-slate-900">Espace DEC</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{nomAffiche}</span>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-slate-700 underline underline-offset-2 hover:text-slate-900"
          >
            Déconnexion
          </button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <p className="text-sm font-medium text-emerald-700 mb-2">Rôle authentifié : DEC</p>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            Tableau de bord DEC — bientôt disponible
          </h2>
          <p className="text-sm text-slate-600">
            Phase 1/6 de la séparation DEC/DGES : l’identité et la connexion sont en place.
            Les fonctionnalités concours arriveront dans les phases suivantes.
          </p>
        </div>
      </main>
    </div>
  );
}
