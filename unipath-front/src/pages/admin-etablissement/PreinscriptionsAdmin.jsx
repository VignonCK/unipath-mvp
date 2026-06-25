import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { preinscriptionEtablissementService } from '../../services/api';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import ParcoursInscriptionGuide from '../../components/admin-etablissement/ParcoursInscriptionGuide';
import { BentoCard } from '../../components/AcademicLayout';

export default function PreinscriptionsAdmin() {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const charger = () => {
    setLoading(true);
    preinscriptionEtablissementService
      .getDemandesEtablissement('EN_ATTENTE')
      .then((data) => setDemandes(data.demandes || []))
      .catch((err) => setError(err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const decider = async (id, statut) => {
    let motifDecision = '';
    if (statut === 'SOUS_RESERVE' || statut === 'REJETE') {
      motifDecision = window.prompt('Motif de la décision :', '') || '';
      if (!motifDecision.trim()) return;
    }
    setError('');
    setSuccess('');
    try {
      await preinscriptionEtablissementService.decider(id, { statut, motifDecision });
      if (statut === 'VALIDE') {
        setSuccess('Candidat validé — il apparaîtra dans la liste Étudiants.');
      } else if (statut === 'SOUS_RESERVE') {
        setSuccess('Décision enregistrée : sous réserve.');
      } else {
        setSuccess('Pré-inscription rejetée.');
      }
      charger();
    } catch (err) {
      setError(err.message || 'Décision impossible');
    }
  };

  return (
    <AdminEtablissementLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Pré-inscriptions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Décision d&apos;admission : valider crée l&apos;inscription académique. Consultez le dossier dans Candidatures si besoin.
          </p>
        </div>

        <ParcoursInscriptionGuide active="preinscriptions" pendingCount={demandes.length} />

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : demandes.length === 0 ? (
          <BentoCard className="p-12 text-center space-y-2">
            <p className="text-gray-500 text-sm">Aucune demande en attente de décision.</p>
            <p className="text-xs text-gray-400">
              Les demandes apparaissent ici lorsque le candidat finalise son dossier dans Candidatures.
            </p>
          </BentoCard>
        ) : (
          <BentoCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">N° pré-inscription</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Candidat</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Filière</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Année</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Niveau</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Dossier</th>
                    <th className="px-6 py-3 font-semibold text-gray-600">Décision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {demandes.map((d) => (
                    <tr key={d.id}>
                      <td className="px-6 py-4 font-medium">{d.numeroPreinscription}</td>
                      <td className="px-6 py-4">
                        <div>{d.candidat?.prenom} {d.candidat?.nom}</div>
                        <div className="text-xs text-gray-500">{d.candidat?.email}</div>
                      </td>
                      <td className="px-6 py-4">{d.filiere?.nom || '—'}</td>
                      <td className="px-6 py-4">{d.anneeAcademique}</td>
                      <td className="px-6 py-4">L{d.niveau}</td>
                      <td className="px-6 py-4">
                        {d.applicationSource?.id ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/admin-etablissement/candidatures/${d.applicationSource.id}`)}
                            className="text-xs font-semibold text-teal-800 hover:underline"
                          >
                            {d.applicationSource.numeroApplication || 'Voir le dossier'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => decider(d.id, 'VALIDE')} className="px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded hover:bg-green-700" title="Crée l'inscription académique">Valider</button>
                          <button type="button" onClick={() => decider(d.id, 'SOUS_RESERVE')} className="px-2 py-1 text-xs font-semibold bg-amber-500 text-white rounded hover:bg-amber-600">Sous réserve</button>
                          <button type="button" onClick={() => decider(d.id, 'REJETE')} className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded hover:bg-red-700">Rejeter</button>
                        </div>
                      </td>
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
