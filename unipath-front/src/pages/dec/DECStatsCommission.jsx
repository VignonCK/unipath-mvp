import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { concoursService, decService } from '../../services/api';
import DECLayout from '../../components/DECLayout';
import { BentoCard } from '../../components/AcademicLayout';

const ROLE_LABELS = {
  EXAMINATEUR: 'Examinateur',
  CONTROLEUR: 'Contrôleur',
};

export default function DECStatsCommission() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [concoursList, setConcoursList] = useState([]);
  const [loadingConcours, setLoadingConcours] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  const concoursId = searchParams.get('concoursId') || '';
  const role = searchParams.get('role') || '';

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  useEffect(() => {
    setLoadingConcours(true);
    setError('');
    concoursService
      .getAll()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.concours || []);
        setConcoursList(list);
      })
      .catch((err) => setError(err.message || 'Impossible de charger les concours'))
      .finally(() => setLoadingConcours(false));
  }, []);

  const chargerStats = useCallback(async () => {
    setLoadingStats(true);
    setError('');
    try {
      const params = {};
      if (concoursId) params.concoursId = concoursId;
      if (role) params.role = role;
      const data = await decService.getStatsDossiersCommission(params);
      setStats(data);
    } catch (err) {
      setStats(null);
      setError(err.message || 'Impossible de charger les statistiques');
    } finally {
      setLoadingStats(false);
    }
  }, [concoursId, role]);

  useEffect(() => {
    chargerStats();
  }, [chargerStats]);

  const showBreakdown = !role;
  const membres = stats?.membres || [];
  const totaux = stats?.totaux || { membres: 0, dossiersTraites: 0, dossiersExaminateur: 0, dossiersControleur: 0 };

  return (
    <DECLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-slide-in">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Suivi commission</h1>
          <p className="text-gray-500 text-sm mt-1">
            Nombre de dossiers traités par membre de la commission, filtrable par concours et par rôle.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <BentoCard className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Filtres</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Concours</label>
              <select
                value={concoursId}
                onChange={(e) => setFilter('concoursId', e.target.value)}
                disabled={loadingConcours}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
              >
                <option value="">— Tous les concours —</option>
                {concoursList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.libelle}
                    {c.code ? ` (${c.code})` : ''}
                    {c.etablissement ? ` — ${c.etablissement}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Rôle</label>
              <select
                value={role}
                onChange={(e) => setFilter('role', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
              >
                <option value="">— Tous les rôles —</option>
                <option value="EXAMINATEUR">Examinateur</option>
                <option value="CONTROLEUR">Contrôleur</option>
              </select>
            </div>
          </div>
          {(concoursId || role) && (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              Réinitialiser les filtres
            </button>
          )}
        </BentoCard>

        <div className="grid sm:grid-cols-3 gap-4">
          <BentoCard className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Membres</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totaux.membres}</p>
          </BentoCard>
          <BentoCard className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dossiers traités</p>
            <p className="text-2xl font-black text-orange-600 mt-1">{totaux.dossiersTraites}</p>
          </BentoCard>
          {showBreakdown ? (
            <BentoCard className="p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Répartition</p>
              <p className="text-sm text-slate-700 mt-2">
                <span className="font-bold">{totaux.dossiersExaminateur}</span> examinateur
                {' · '}
                <span className="font-bold">{totaux.dossiersControleur}</span> contrôleur
              </p>
            </BentoCard>
          ) : (
            <BentoCard className="p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rôle filtré</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {ROLE_LABELS[role] || role}
              </p>
            </BentoCard>
          )}
        </div>

        <BentoCard className="overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-800">Dossiers par membre</h2>
            {loadingStats && (
              <span className="text-xs text-gray-500">Chargement…</span>
            )}
          </div>

          {loadingStats && !stats ? (
            <div className="px-5 py-10 text-center text-sm text-gray-500">
              Chargement des statistiques…
            </div>
          ) : membres.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-500">
              Aucun membre trouvé pour ces filtres.
              {concoursId && (
                <span className="block mt-1 text-xs">
                  Vérifiez que des membres sont affectés à ce concours
                  {role ? ` en tant que ${ROLE_LABELS[role] || role}` : ''}.
                </span>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <th className="px-5 py-3">Membre</th>
                    <th className="px-5 py-3">Rôle(s)</th>
                    {showBreakdown && (
                      <>
                        <th className="px-5 py-3 text-right">Examinateur</th>
                        <th className="px-5 py-3 text-right">Contrôleur</th>
                      </>
                    )}
                    <th className="px-5 py-3 text-right">Total traités</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {membres.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">
                          {m.prenom} {m.nom}
                        </p>
                        <p className="text-xs text-gray-500">{m.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(m.roles || []).length === 0 ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : (
                            m.roles.map((r) => (
                              <span
                                key={r}
                                className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                                  r === 'EXAMINATEUR'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-violet-50 text-violet-700'
                                }`}
                              >
                                {ROLE_LABELS[r] || r}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      {showBreakdown && (
                        <>
                          <td className="px-5 py-3 text-right font-medium text-slate-700">
                            {m.nbDossiersExaminateur}
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-slate-700">
                            {m.nbDossiersControleur}
                          </td>
                        </>
                      )}
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex min-w-[2rem] justify-center px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 font-bold">
                          {m.nbDossiersTraites}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BentoCard>
      </div>
    </DECLayout>
  );
}
