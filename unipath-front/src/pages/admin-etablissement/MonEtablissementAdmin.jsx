import { useEffect, useState } from 'react';
import { etablissementService, filiereService } from '../../services/api';
import { getUser } from '../../utils/auth';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';

export default function MonEtablissementAdmin() {
  const user = getUser();
  const [etablissement, setEtablissement] = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.etablissementId) {
      setError('Établissement non associé à votre compte');
      setLoading(false);
      return;
    }
    Promise.all([
      etablissementService.getById(user.etablissementId),
      filiereService.getByEtablissement(user.etablissementId),
    ])
      .then(([etabData, filData]) => {
        setEtablissement(etabData.etablissement);
        setFilieres(filData.filieres || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.etablissementId]);

  return (
    <AdminEtablissementLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-black text-gray-900">Mon Établissement</h1>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : etablissement && (
          <>
            <BentoCard className="p-6 space-y-2">
              <h2 className="text-xl font-bold text-gray-900">{etablissement.nom}</h2>
              <p className="text-gray-600">{etablissement.ville}{etablissement.adresse ? ` — ${etablissement.adresse}` : ''}</p>
              <p className="text-sm">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${etablissement.type === 'PRIVE' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                  {etablissement.type}
                </span>
              </p>
              {etablissement.email && <p className="text-sm text-gray-500">{etablissement.email}</p>}
            </BentoCard>

            <BentoCard className="p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Filières ({filieres.length})</h3>
              </div>
              {filieres.length === 0 ? (
                <p className="px-6 py-8 text-sm text-gray-400">Aucune filière enregistrée.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filieres.map((f) => (
                    <li key={f.id} className="px-6 py-4 flex justify-between text-sm">
                      <span className="font-medium text-gray-900">{f.nom}</span>
                      <span className="text-gray-500">{f.niveau} · {f.dureeAnnees} an(s)</span>
                    </li>
                  ))}
                </ul>
              )}
            </BentoCard>
          </>
        )}
      </div>
    </AdminEtablissementLayout>
  );
}
