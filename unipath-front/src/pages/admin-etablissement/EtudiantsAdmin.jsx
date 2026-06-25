import { useEffect, useState } from 'react';
import { etablissementService, filiereService } from '../../services/api';
import { getUser } from '../../utils/auth';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';

export default function EtudiantsAdmin() {
  const user = getUser();
  const [filieres, setFilieres] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ filiere: '', annee: '' });

  useEffect(() => {
    if (!user?.etablissementId) return;
    filiereService.getByEtablissement(user.etablissementId).then((data) => {
      setFilieres(data.filieres || []);
    });
  }, [user?.etablissementId]);

  useEffect(() => {
    if (!user?.etablissementId) return;
    setLoading(true);
    etablissementService
      .getEtudiants(user.etablissementId, filters)
      .then((data) => setEtudiants(data.etudiants || []))
      .catch((err) => setError(err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [user?.etablissementId, filters]);

  return (
    <AdminEtablissementLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Étudiants inscrits</h1>
          <p className="text-sm text-gray-500 mt-1">Inscriptions académiques validées à votre établissement.</p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <BentoCard className="p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Filière</label>
              <select
                value={filters.filiere}
                onChange={(e) => setFilters((p) => ({ ...p, filiere: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">Toutes</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
            </div>
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

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : etudiants.length === 0 ? (
          <BentoCard className="p-12 text-center text-gray-400 text-sm">Aucun étudiant trouvé.</BentoCard>
        ) : (
          <BentoCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Matricule</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Étudiant</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Filière</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Année</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Niveau</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {etudiants.map((ins) => (
                    <tr key={ins.id}>
                      <td className="px-6 py-4">{ins.candidat?.matricule || '—'}</td>
                      <td className="px-6 py-4">{ins.candidat?.prenom} {ins.candidat?.nom}</td>
                      <td className="px-6 py-4">{ins.filiere?.nom || '—'}</td>
                      <td className="px-6 py-4">{ins.anneeAcademique}</td>
                      <td className="px-6 py-4">{ins.niveau}</td>
                      <td className="px-6 py-4">{ins.statut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        )}
      </div>
    </AdminEtablissementLayout>
  );
}
