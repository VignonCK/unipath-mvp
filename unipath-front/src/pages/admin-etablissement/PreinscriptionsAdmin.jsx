import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationService, preinscriptionEtablissementService } from '../../services/api';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import ParcoursInscriptionGuide from '../../components/admin-etablissement/ParcoursInscriptionGuide';
import { BentoCard } from '../../components/AcademicLayout';

const emptySousReserveModal = () => ({
  open: false,
  id: null,
  commentaire: '',
  selectedCodes: [],
  docs: [],
  loadingDocs: false,
  docsError: '',
});

export default function PreinscriptionsAdmin() {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ annee: '' });
  const [sousReserveModal, setSousReserveModal] = useState(emptySousReserveModal);
  const [rejetModal, setRejetModal] = useState({ open: false, id: null, motif: '' });

  const charger = () => {
    setLoading(true);
    const yearParams = filters.annee ? { anneeAcademique: filters.annee } : {};
    preinscriptionEtablissementService
      .getDemandesEtablissement('EN_ATTENTE', yearParams)
      .then((data) => setDemandes(data.demandes || []))
      .catch((err) => setError(err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, [filters]);

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

  const ouvrirSousReserve = async (demande) => {
    const applicationId = demande.applicationSource?.id;
    setSousReserveModal({
      open: true,
      id: demande.id,
      commentaire: '',
      selectedCodes: [],
      docs: [],
      loadingDocs: true,
      docsError: '',
    });

    if (!applicationId) {
      setSousReserveModal((m) => ({
        ...m,
        loadingDocs: false,
        docsError: 'Aucun dossier (Application) lié — impossible de sélectionner des pièces.',
      }));
      return;
    }

    try {
      const data = await applicationService.getById(applicationId);
      const docs = (data.application?.documents || []).filter(
        (d) =>
          d.status === 'PROVIDED' &&
          d.source !== 'PROFILE_AUTO' &&
          (d.source === 'STUDENT_UPLOAD' || d.source === 'SYSTEM_GENERATED' || d.source === 'DOCUMENT_UPLOAD'),
      );
      setSousReserveModal((m) => ({
        ...m,
        loadingDocs: false,
        docs,
        docsError: docs.length === 0 ? 'Aucune pièce uploadée sélectionnable sur ce dossier.' : '',
      }));
    } catch (err) {
      setSousReserveModal((m) => ({
        ...m,
        loadingDocs: false,
        docsError: err.message || 'Impossible de charger les pièces du dossier',
      }));
    }
  };

  const togglePiece = (code) => {
    setSousReserveModal((m) => {
      const selected = m.selectedCodes.includes(code)
        ? m.selectedCodes.filter((c) => c !== code)
        : [...m.selectedCodes, code];
      return { ...m, selectedCodes: selected };
    });
  };

  const confirmerSousReserve = async () => {
    if (!sousReserveModal.commentaire.trim()) return;
    if (sousReserveModal.selectedCodes.length === 0) return;
    await decider(sousReserveModal.id, 'SOUS_RESERVE', {
      commentaireAdmin: sousReserveModal.commentaire.trim(),
      piecesACorriger: sousReserveModal.selectedCodes,
    });
    setSousReserveModal(emptySousReserveModal());
  };

  const canConfirmSousReserve =
    Boolean(sousReserveModal.commentaire.trim()) &&
    sousReserveModal.selectedCodes.length > 0 &&
    !sousReserveModal.loadingDocs;

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
                          <button type="button" onClick={() => ouvrirSousReserve(d)} className="px-2 py-1 text-xs font-semibold bg-amber-500 text-white rounded hover:bg-amber-600">Sous réserve</button>
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
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Accepter sous réserve</h3>
              <p className="text-xs text-gray-500 mt-1">
                Sélectionnez les pièces à corriger et précisez les conditions pour le candidat.
              </p>
            </div>
            <div className="px-6 py-5 space-y-5 overflow-y-auto">
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">
                  Pièces à corriger <span className="text-red-600">*</span>
                </p>
                {sousReserveModal.loadingDocs ? (
                  <p className="text-sm text-gray-500">Chargement des pièces…</p>
                ) : sousReserveModal.docsError ? (
                  <p className="text-sm text-red-600">{sousReserveModal.docsError}</p>
                ) : (
                  <ul className="space-y-2 rounded-xl border border-gray-200 p-3 max-h-48 overflow-y-auto">
                    {sousReserveModal.docs.map((doc) => (
                      <li key={doc.id || doc.code}>
                        <label className="flex items-start gap-3 cursor-pointer text-sm text-gray-800">
                          <input
                            type="checkbox"
                            className="mt-0.5 rounded border-gray-300"
                            checked={sousReserveModal.selectedCodes.includes(doc.code)}
                            onChange={() => togglePiece(doc.code)}
                          />
                          <span>
                            <span className="font-medium">{doc.label || doc.code}</span>
                            <span className="block text-xs text-gray-400 font-mono">{doc.code}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
                {sousReserveModal.selectedCodes.length === 0 && !sousReserveModal.loadingDocs && !sousReserveModal.docsError && (
                  <p className="text-xs text-amber-700 mt-2">Cochez au moins une pièce.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message / conditions au candidat <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={sousReserveModal.commentaire}
                  onChange={(e) => setSousReserveModal((m) => ({ ...m, commentaire: e.target.value }))}
                  placeholder="Indiquez les compléments attendus du candidat…"
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">Ce message sera envoyé au candidat par email.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setSousReserveModal(emptySousReserveModal())}
                className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmerSousReserve}
                disabled={!canConfirmSousReserve}
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
