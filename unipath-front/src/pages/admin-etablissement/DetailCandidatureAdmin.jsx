import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { applicationService, preinscriptionEtablissementService } from '../../services/api';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';
import {
  getCandidatureDisplayStatus,
  needsPreinscriptionDecision,
  isVerdictLocked,
  PREINSCRIPTION_STATUS,
} from '../../utils/adminParcoursInscription';
import { buildUnifiedPieces } from '../../utils/application-pieces';

export default function DetailCandidatureAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openingPiece, setOpeningPiece] = useState(null);
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [sousReserveModal, setSousReserveModal] = useState({ open: false, commentaire: '' });

  const reload = () => {
    setLoading(true);
    applicationService
      .getById(id)
      .then((data) => {
        setApplication(data.application);
        setCompletion(data.completion || null);
      })
      .catch((err) => setError(err.message || 'Candidature introuvable'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const pieces = useMemo(() => buildUnifiedPieces(application), [application]);

  const handleOpenPiece = (url, key) => {
    if (!url) {
      setError('Fichier introuvable pour cette pièce.');
      return;
    }
    setOpeningPiece(key);
    setError('');
    try {
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        setError('Le navigateur a bloqué l\'ouverture du fichier. Autorisez les pop-ups.');
      }
    } catch (err) {
      setError(err.message || 'Impossible d\'ouvrir le document');
    } finally {
      setOpeningPiece(null);
    }
  };

  const decider = async (statut, extra = {}) => {
    const preinscriptionId = application?.preinscription?.id;
    if (!preinscriptionId) {
      setError('Aucune pré-inscription liée à ce dossier.');
      return;
    }
    if (application?.preinscription?.statut !== 'EN_ATTENTE') {
      setError(
        application?.preinscription?.statut === 'SOUS_RESERVE'
          ? 'Dossier sous réserve : attendez la resoumission du candidat avant un nouveau verdict.'
          : 'Cette décision est définitive et ne peut plus être modifiée.'
      );
      return;
    }
    setError('');
    setSuccess('');
    setDecisionBusy(true);
    try {
      await preinscriptionEtablissementService.decider(preinscriptionId, { statut, ...extra });
      if (statut === 'VALIDE') {
        setSuccess('Candidat validé — il apparaîtra dans la liste Étudiants.');
      } else if (statut === 'SOUS_RESERVE') {
        setSuccess('Décision enregistrée : sous réserve. Le candidat a été notifié.');
      } else {
        setSuccess('Dossier rejeté.');
      }
      reload();
    } catch (err) {
      setError(err.message || 'Décision impossible');
    } finally {
      setDecisionBusy(false);
    }
  };

  if (loading && !application) {
    return (
      <AdminEtablissementLayout>
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
        </div>
      </AdminEtablissementLayout>
    );
  }

  if (!application) {
    return (
      <AdminEtablissementLayout>
        <div className="p-6 text-center text-red-600">{error || 'Candidature introuvable'}</div>
      </AdminEtablissementLayout>
    );
  }

  const candidat = application.candidat;
  const statusInfo = getCandidatureDisplayStatus(application);
  const awaitingDecision = needsPreinscriptionDecision(application);
  const verdictLocked = isVerdictLocked(application);
  const preinStatut = application.preinscription?.statut;
  const preinInfo = preinStatut ? PREINSCRIPTION_STATUS[preinStatut] : null;

  return (
    <AdminEtablissementLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <button
          type="button"
          onClick={() => navigate('/admin-etablissement/candidatures')}
          className="text-sm text-teal-900 hover:underline"
        >
          ← Candidatures
        </button>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
        )}

        <BentoCard className="p-6 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-black text-gray-900">{application.numeroApplication}</h1>
              <p className="text-sm text-gray-500">{application.filiere?.nom} — {application.anneeAcademique}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.badge}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">{statusInfo.hint}</p>
          {completion && (
            <p className="text-sm text-gray-600">
              Complétude du dossier :{' '}
              <strong>
                {completion.percentage
                  ?? completion.pourcentage
                  ?? (completion.isComplete ? 100 : 0)}
                %
              </strong>
            </p>
          )}
          {application.preinscription && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
              <span className="text-gray-600">Pré-inscription </span>
              <strong>{application.preinscription.numeroPreinscription}</strong>
              {preinInfo && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${preinInfo.badge}`}>
                  {preinInfo.label}
                </span>
              )}
            </div>
          )}
        </BentoCard>

        <BentoCard className="p-6 space-y-2">
          <h2 className="font-bold text-gray-900">Candidat</h2>
          <p className="text-sm text-gray-800">{candidat?.prenom} {candidat?.nom}</p>
          <p className="text-sm text-gray-500">{candidat?.email}</p>
          {candidat?.telephone && <p className="text-sm text-gray-500">{candidat.telephone}</p>}
          {candidat?.matricule && <p className="text-xs text-gray-400">Matricule : {candidat.matricule}</p>}
        </BentoCard>

        <BentoCard className="p-6">
          <h2 className="font-bold text-gray-900 mb-4">Pièces du dossier</h2>
          {pieces.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune pièce enregistrée.</p>
          ) : (
            <ul className="space-y-2">
              {pieces.map((piece) => (
                <li
                  key={piece.key}
                  className="flex items-center justify-between gap-3 text-sm border-b border-gray-50 pb-2 last:border-0"
                >
                  <span className="text-gray-700">{piece.label}</span>
                  {piece.openUrl ? (
                    <button
                      type="button"
                      disabled={openingPiece === piece.key}
                      onClick={() => handleOpenPiece(piece.openUrl, piece.key)}
                      className="text-teal-800 font-semibold text-xs hover:underline disabled:opacity-50"
                    >
                      {openingPiece === piece.key ? 'Ouverture...' : 'Consulter'}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {piece.status === 'PROVIDED' ? 'Fichier non disponible' : (piece.status || 'Manquant')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </BentoCard>

        {awaitingDecision && application.preinscription?.id && (
          <BentoCard className="p-6 space-y-3 border border-orange-200 bg-orange-50/50">
            <h2 className="font-bold text-orange-950">Décision d&apos;admission</h2>
            <p className="text-sm text-orange-900">
              Valider crée l&apos;inscription académique et envoie la fiche au candidat.
              Une fois rendue, la décision ne pourra plus être modifiée
              (sauf nouveau passage en attente après sous réserve).
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={decisionBusy}
                onClick={() => decider('VALIDE')}
                className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Valider
              </button>
              <button
                type="button"
                disabled={decisionBusy}
                onClick={() => setSousReserveModal({ open: true, commentaire: '' })}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                Sous réserve
              </button>
              <button
                type="button"
                disabled={decisionBusy}
                onClick={() => {
                  const motifDecision = window.prompt('Motif du rejet :', '') || '';
                  if (!motifDecision.trim()) return;
                  decider('REJETE', { motifDecision: motifDecision.trim() });
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Rejeter
              </button>
            </div>
          </BentoCard>
        )}

        {verdictLocked && (
          <BentoCard className="p-6 space-y-2">
            <h2 className="font-bold text-gray-900">
              Verdict : {preinInfo?.label || preinStatut}
            </h2>
            <p className="text-sm text-gray-600">
              {preinStatut === 'SOUS_RESERVE'
                ? 'En attente des corrections du candidat. Vous pourrez redonner un verdict uniquement après sa resoumission.'
                : 'Cette décision est définitive et ne peut plus être modifiée.'}
            </p>
            {application.preinscription?.motifDecision && (
              <p className="text-sm text-gray-700">
                Motif : {application.preinscription.motifDecision}
              </p>
            )}
          </BentoCard>
        )}
      </div>

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
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setSousReserveModal({ open: false, commentaire: '' })}
                className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!sousReserveModal.commentaire.trim() || decisionBusy}
                onClick={async () => {
                  await decider('SOUS_RESERVE', {
                    motifDecision: sousReserveModal.commentaire.trim(),
                  });
                  setSousReserveModal({ open: false, commentaire: '' });
                }}
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
