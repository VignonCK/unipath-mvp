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
  const [sousReserveModal, setSousReserveModal] = useState({ open: false, id: null, commentaire: '' });
  const [rejetModal, setRejetModal] = useState({ open: false, id: null, motif: '' });

  const charger = () => {
    setLoading(true);
    preinscriptionEtablissementService
      .getDemandesEtablissement('EN_ATTENTE')
      .then((data) => setDemandes(data.demandes || []))
      .catch((err) => setError(err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const decider = async (id, statut, extra = {}) => {
    setError('');
    setSuccess('');
    try {
      await preinscriptionEtablissementService.decider(id, { statut, ...extra });
      if (statut === 'VALIDE') {
        setSuccess('Candidat validé — il apparaîtra dans la liste Étudiants.');
      } else if (statut === 'SOUS_RESERVE') {
        setSuccess('Décision enregistrée : sous réserve. Le candidat a été notifié.');
      } else {
        setSuccess('Pré-inscription rejetée.');
      }
      charger();
    } catch (err) {
      setError(err.message || 'Décision impossible');
    }
  };

  const ouvrirRejet = (id) => {
    setRejetModal({ open: true, id, motif: '' });
  };

  const confirmerRejet = async () => {
    if (!rejetModal.id || !rejetModal.motif.trim()) return;
    await decider(rejetModal.id, 'REJETE', { motifDecision: rejetModal.motif.trim() });
    setRejetModal({ open: false, id: null, motif: '' });
  };

  const ouvrirSousReserve = (id) => {
    setSousReserveModal({ open: true, id, commentaire: '' });
  };

  const confirmerSousReserve = async () => {
    if (!sousReserveModal.commentaire.trim()) return;
    await decider(sousReserveModal.id, 'SOUS_RESERVE', {
      commentaireAdmin: sousReserveModal.commentaire.trim(),
    });
    setSousReserveModal({ open: false, id: null, commentaire: '' });
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
                          <button type="button" onClick={() => ouvrirSousReserve(d.id)} className="px-2 py-1 text-xs font-semibold bg-amber-500 text-white rounded hover:bg-amber-600">Sous réserve</button>
                          <button type="button" onClick={() => ouvrirRejet(d.id)} className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded hover:bg-red-700">Rejeter</button>
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

      {rejetModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Rejeter la pré-inscription</h3>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif du rejet <span className="text-red-600">*</span>
              </label>
              <textarea
                value={rejetModal.motif}
                onChange={(e) => setRejetModal((m) => ({ ...m, motif: e.target.value }))}
                placeholder="Expliquez pourquoi la candidature n'est pas retenue…"
                rows={5}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setRejetModal({ open: false, id: null, motif: '' })}
                className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmerRejet}
                disabled={!rejetModal.motif.trim()}
                className="text-sm bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {sousReserveModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Accepter sous réserve</h3>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message au candidat <span className="text-red-600">*</span>
              </label>
              <textarea
                value={sousReserveModal.commentaire}
                onChange={(e) => setSousReserveModal((m) => ({ ...m, commentaire: e.target.value }))}
                placeholder="Indiquez les compléments attendus du candidat…"
                rows={5}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">Ce message sera envoyé au candidat par email.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setSousReserveModal({ open: false, id: null, commentaire: '' })}
                className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmerSousReserve}
                disabled={!sousReserveModal.commentaire.trim()}
                className="text-sm bg-amber-500 text-white px-5 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-60"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminEtablissementLayout>
  );
}
