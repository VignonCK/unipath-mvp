import { useEffect, useState } from 'react';
import { etablissementService } from '../../services/api';
import { getUser } from '../../utils/auth';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';

export default function StatistiquesEtablissement() {
  const user = getUser();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.etablissementId) {
      setLoading(false);
      setError('Établissement non associé au compte');
      return;
    }

    setLoading(true);
    setError('');
    etablissementService
      .getStatistiques(user.etablissementId)
      .then((data) => setRows(data.statistiques || []))
      .catch((err) => setError(err.message || 'Erreur de chargement des statistiques'))
      .finally(() => setLoading(false));
  }, [user?.etablissementId]);

  const totals = rows.reduce(
    (acc, row) => ({
      total: acc.total + (Number(row.total_inscrits) || 0),
      valides: acc.valides + (Number(row.valides) || 0),
      redoublants: acc.redoublants + (Number(row.redoublants) || 0),
    }),
    { total: 0, valides: 0, redoublants: 0 },
  );
  const tauxGlobal = totals.total > 0
    ? Math.round((totals.valides / totals.total) * 10000) / 100
    : 0;

  return (
    <AdminEtablissementLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Statistiques académiques</h1>
          <p className="text-sm text-gray-500 mt-1">
            Répartition des inscriptions académiques par filière et année.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total inscrits', value: totals.total, color: 'bg-orange-500' },
              { label: 'Validés', value: totals.valides, color: 'bg-green-600' },
              { label: 'Redoublants', value: totals.redoublants, color: 'bg-amber-600' },
              { label: 'Taux réussite', value: `${tauxGlobal}%`, color: 'bg-teal-800' },
            ].map((card) => (
              <div key={card.label} className={`${card.color} rounded-2xl p-4 text-white shadow`}>
                <p className="text-2xl font-black">{card.value}</p>
                <p className="text-xs mt-1 opacity-90">{card.label}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 && !error ? (
          <BentoCard className="p-12 text-center text-gray-400 text-sm">
            Aucune donnée académique pour le moment.
          </BentoCard>
        ) : rows.length > 0 ? (
          <BentoCard className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">Par filière × année</h2>
              <span className="text-xs text-gray-400">{rows.length} ligne(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Filière', 'Niveau', 'Année', 'Total', 'Validés', 'Redoublants', 'Taux réussite'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row) => {
                    const taux = Number(row.taux_reussite) || 0;
                    return (
                      <tr
                        key={`${row.filiere}-${row.annee}-${row.niveau}`}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">{row.filiere}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{row.niveau || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{row.annee || '—'}</td>
                        <td className="px-4 py-3 font-bold text-gray-900">{Number(row.total_inscrits)}</td>
                        <td className="px-4 py-3 text-green-700 font-semibold">{Number(row.valides)}</td>
                        <td className="px-4 py-3 text-amber-700 font-semibold">{Number(row.redoublants)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[40px]">
                              <div
                                className={`h-1.5 rounded-full ${taux >= 50 ? 'bg-green-500' : 'bg-red-400'}`}
                                style={{ width: `${Math.min(taux, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${taux >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                              {taux}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </BentoCard>
        ) : null}
      </div>
    </AdminEtablissementLayout>
  );
}
