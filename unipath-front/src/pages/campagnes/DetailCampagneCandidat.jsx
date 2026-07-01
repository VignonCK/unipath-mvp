import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { campagneService } from '../../services/api';
import CandidatLayout from '../../components/CandidatLayout';
import { BentoCard } from '../../components/AcademicLayout';

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function DetailCampagneCandidat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campagne, setCampagne] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    campagneService
      .getById(id)
      .then((data) => setCampagne(data.campagne))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const postuler = (cf) => {
    navigate('/demande-inscription', {
      state: {
        etablissementId: campagne.etablissement?.id,
        filiereId: cf.filiereId || cf.filiere?.id,
        anneeAcademique: campagne.anneeAcademique,
        niveau: '1',
        campagneFiliereId: cf.id,
      },
    });
  };

  if (loading) {
    return (
      <CandidatLayout>
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin" />
        </div>
      </CandidatLayout>
    );
  }

  if (!campagne) {
    return (
      <CandidatLayout>
        <div className="p-6 text-center text-red-600">{error || 'Campagne introuvable'}</div>
      </CandidatLayout>
    );
  }

  const etab = campagne.etablissement;

  return (
    <CandidatLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <button type="button" onClick={() => navigate('/campagnes-inscription')} className="text-sm text-blue-900 hover:underline">← Campagnes</button>

        <BentoCard className="p-6">
          <h1 className="text-2xl font-black text-gray-900">{campagne.titre}</h1>
          <p className="text-gray-600 mt-1">{campagne.anneeAcademique}</p>
          <p className="text-sm text-gray-500 mt-2">
            Inscriptions du {formatDate(campagne.dateOuverture)} au {formatDate(campagne.dateCloture)}
          </p>
          {campagne.description && <p className="text-sm text-gray-700 mt-4">{campagne.description}</p>}
        </BentoCard>

        {etab && (
          <BentoCard className="p-6">
            <h2 className="font-bold text-gray-900 mb-2">{etab.nom}</h2>
            <p className="text-sm text-gray-600">{etab.ville}{etab.adresse ? ` — ${etab.adresse}` : ''}</p>
            {etab.email && <p className="text-sm text-gray-500 mt-1">{etab.email}</p>}
          </BentoCard>
        )}

        <BentoCard className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Filières proposées</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Filière</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Niveau</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Frais</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Places</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Séries</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Critères</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(campagne.filieres || []).map((cf) => (
                  <tr key={cf.id}>
                    <td className="px-4 py-4 font-medium">{cf.filiere?.nom}</td>
                    <td className="px-4 py-4 text-gray-600">{cf.filiere?.niveau || '—'}</td>
                    <td className="px-4 py-4">{cf.fraisDossier?.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-4">{cf.placesDisponibles ?? '—'}</td>
                    <td className="px-4 py-4">{(cf.seriesAcceptees || []).join(', ') || 'Toutes'}</td>
                    <td className="px-4 py-4 text-gray-600 max-w-xs">{cf.criteresSelection || '—'}</td>
                    <td className="px-4 py-4">
                      <button type="button" onClick={() => postuler(cf)} className="px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 whitespace-nowrap">
                        Postuler
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      </div>
    </CandidatLayout>
  );
}
