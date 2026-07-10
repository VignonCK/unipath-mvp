import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationService, preinscriptionEtablissementService } from '../../services/api';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import ParcoursInscriptionGuide from '../../components/admin-etablissement/ParcoursInscriptionGuide';
import { BentoCard } from '../../components/AcademicLayout';
import { getApplicationStatus, needsPreinscriptionDecision } from '../../utils/adminParcoursInscription';

export default function CandidaturesAdmin() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ annee: '' });

  useEffect(() => {
    setLoading(true);
    setError('');
    const yearParams = filters.annee ? { anneeAcademique: filters.annee } : {};
    Promise.all([
      applicationService.getDemandesEtablissement(yearParams),
      preinscriptionEtablissementService.getDemandesEtablissement('EN_ATTENTE'),
    ])
      .then(([appsData, preinData]) => {
        setApplications(appsData.applications || []);
        setPendingCount((preinData.demandes || []).length);
      })
      .catch((err) => setError(err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <AdminEtablissementLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Candidatures</h1>
          <p className="text-sm text-gray-500 mt-1">
            Consultation des dossiers déposés via vos campagnes — lecture seule, sans décision d&apos;admission.
          </p>
        </div>

        <ParcoursInscriptionGuide active="candidatures" pendingCount={pendingCount} />

        {pendingCount > 0 && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900 flex flex-wrap items-center justify-between gap-3">
            <span>
              <strong>{pendingCount}</strong> pré-inscription{pendingCount > 1 ? 's' : ''} attendent votre décision.
            </span>
            <button
              type="button"
              onClick={() => navigate('/admin-etablissement/preinscriptions')}
              className="px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Aller aux pré-inscriptions →
            </button>
          </div>
        )}

        <BentoCard className="p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Année académique</label>
              <input
                type="text"
                placeholder="2025-2026"
                value={filters.annee}
                onChange={(e) => setFilters((p) => ({ ...p, annee: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
        </BentoCard>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <BentoCard className="p-12 text-center text-gray-400 text-sm">
            Aucune candidature pour le moment.
          </BentoCard>
        ) : (
          <BentoCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">N° demande</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Candidat</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Filière</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Année</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Avancement dossier</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Suite</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applications.map((app) => {
                    const statusInfo = getApplicationStatus(app.status);
                    const awaitingDecision = needsPreinscriptionDecision(app);
                    return (
                      <tr key={app.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">{app.numeroApplication}</td>
                        <td className="px-6 py-4">
                          <div>{app.candidat?.prenom} {app.candidat?.nom}</div>
                          <div className="text-xs text-gray-500">{app.candidat?.email}</div>
                        </td>
                        <td className="px-6 py-4">{app.filiere?.nom || '—'}</td>
                        <td className="px-6 py-4">{app.anneeAcademique}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.badge}`}>
                            {statusInfo.label}
                          </span>
                          <p className="text-xs text-gray-400 mt-1 max-w-[200px]">{statusInfo.hint}</p>
                        </td>
                        <td className="px-6 py-4">
                          {awaitingDecision ? (
                            <button
                              type="button"
                              onClick={() => navigate('/admin-etablissement/preinscriptions')}
                              className="text-xs font-semibold text-orange-700 hover:underline"
                            >
                              Décider →
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Côté candidat</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin-etablissement/candidatures/${app.id}`)}
                            className="px-3 py-1.5 text-xs font-semibold border border-teal-200 text-teal-900 rounded-lg hover:bg-teal-50"
                          >
                            Voir le dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </BentoCard>
        )}
      </div>
    </AdminEtablissementLayout>
  );
}
