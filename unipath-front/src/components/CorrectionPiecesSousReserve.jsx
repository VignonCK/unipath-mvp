import { useCallback, useEffect, useMemo, useState } from 'react';
import { convertLegacyId, DOSSIER_PERSONNEL_FIELDS, PIECES_PREDEFINIES } from '../constants/pieces';
import { dossierService, inscriptionService, ouvrirPiece } from '../services/api';
import {
  getPieceCorrectionStatus,
  getPiecesACorrigerCodes,
} from '../utils/piecesConcoursSousReserve';

const QUITTANCE = { key: 'quittance', label: 'Quittance de paiement', uploadType: 'quittance', accept: '.pdf' };

const UPLOAD_ACCEPT = {
  acteNaissance: '.pdf',
  carteIdentite: '.pdf,.jpg,.jpeg,.png',
  photo: '.jpg,.jpeg,.png',
  releve: '.pdf',
};

function isDossierBasePieceId(pieceId) {
  const normalized = convertLegacyId(pieceId);
  const meta = PIECES_PREDEFINIES.find((p) => p.id === normalized);
  return Boolean(meta?.sourceDossier);
}

function resolveExtraPieces(concours) {
  const raw = concours?.piecesRequises;
  const list = Array.isArray(raw) ? raw : raw?.pieces || [];
  return list
    .filter((p) => p?.id && p.id !== 'quittance' && !isDossierBasePieceId(p.id))
    .map((p) => ({
      key: p.id,
      label: p.nom || p.id,
      uploadType: 'extra',
      accept: '.pdf,.jpg,.jpeg,.png',
    }));
}

export default function CorrectionPiecesSousReserve({
  candidatId,
  inscriptionId,
  concours,
  quittanceUrl,
  piecesExtras = {},
  piecesACorriger = null,
  onCorrectionChange,
  onError,
}) {
  const [dossierPersonnel, setDossierPersonnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadBusy, setUploadBusy] = useState(null);
  const [correctionsSession, setCorrectionsSession] = useState(0);
  const [correctionsServeur, setCorrectionsServeur] = useState(false);
  const [toutesCorrigees, setToutesCorrigees] = useState(false);
  const [localQuittance, setLocalQuittance] = useState(quittanceUrl);
  const [localExtras, setLocalExtras] = useState(piecesExtras);

  const refreshEtat = useCallback(async () => {
    if (!candidatId || !inscriptionId) return;
    const [dp, status] = await Promise.all([
      dossierService.getDossierPersonnel(candidatId),
      inscriptionService.getStatutCorrectionsSousReserve(inscriptionId).catch(() => ({
        correctionsEffectuees: false,
        toutesPiecesCibleesCorrigees: null,
      })),
    ]);
    setDossierPersonnel(dp);
    const effectuees = Boolean(status.correctionsEffectuees);
    setCorrectionsServeur(effectuees);
    setToutesCorrigees(
      status.toutesPiecesCibleesCorrigees === true
      || (status.toutesPiecesCibleesCorrigees == null && effectuees),
    );
    return effectuees;
  }, [candidatId, inscriptionId]);

  useEffect(() => {
    setLocalQuittance(quittanceUrl);
  }, [quittanceUrl]);

  useEffect(() => {
    setLocalExtras(piecesExtras || {});
  }, [piecesExtras]);

  useEffect(() => {
    let cancelled = false;
    refreshEtat()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [refreshEtat]);

  useEffect(() => {
    const codesCibles = getPiecesACorrigerCodes(piecesACorriger);
    const peutResoumettre = codesCibles.length > 0
      ? toutesCorrigees
      : (correctionsSession > 0 || correctionsServeur);
    onCorrectionChange?.(peutResoumettre);
  }, [correctionsSession, correctionsServeur, toutesCorrigees, piecesACorriger, onCorrectionChange]);

  const codesACorriger = useMemo(
    () => getPiecesACorrigerCodes(piecesACorriger),
    [piecesACorriger],
  );

  const handleUpload = async (piece, file) => {
    if (!file) return;
    setUploadBusy(piece.key);
    try {
      if (piece.uploadType === 'base') {
        await dossierService.uploadPiece(candidatId, piece.key, file);
      } else if (piece.uploadType === 'quittance') {
        const data = await inscriptionService.uploadQuittance(inscriptionId, file);
        setLocalQuittance(data.dossierInscription?.quittanceUrl || data.quittanceUrl || localQuittance);
      } else {
        await inscriptionService.uploadPieceExtra(inscriptionId, piece.key, file);
        setLocalExtras((prev) => ({ ...prev, [piece.key]: true }));
      }
      setCorrectionsSession((n) => n + 1);
      await refreshEtat();
    } catch (err) {
      onError?.(err.message || 'Erreur lors du remplacement de la pièce');
    } finally {
      setUploadBusy(null);
    }
  };

  const basePieces = DOSSIER_PERSONNEL_FIELDS.map((p) => ({
    ...p,
    uploadType: 'base',
    accept: UPLOAD_ACCEPT[p.key] || '.pdf',
    url: dossierPersonnel?.piecesBase?.[p.key]?.url ?? null,
    statut: dossierPersonnel?.piecesBase?.[p.key]?.statut ?? (dossierPersonnel?.piecesBase?.[p.key]?.url ? 'fournie' : 'manquante'),
  }));

  const quittancePiece = {
    ...QUITTANCE,
    url: localQuittance,
    statut: localQuittance ? 'fournie' : 'manquante',
  };

  const extraPieces = resolveExtraPieces(concours).map((p) => ({
    ...p,
    url: typeof localExtras[p.key] === 'string' ? localExtras[p.key] : localExtras[p.key] ? 'present' : null,
    statut: localExtras[p.key] ? 'fournie' : 'manquante',
  }));

  const allPieces = [...basePieces, quittancePiece, ...extraPieces];
  const piecesAffichees = codesACorriger.length > 0
    ? allPieces.filter((p) => codesACorriger.includes(p.key))
    : allPieces;

  if (loading) {
    return (
      <div className='rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500'>
        Chargement de vos pièces…
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
        {codesACorriger.length > 0
          ? 'Pièces à corriger — remplacez uniquement celles listées ci-dessous'
          : 'Pièces de votre dossier — remplacez celles signalées comme non conformes'}
      </p>
      <ul className='space-y-2'>
        {piecesAffichees.map((piece) => {
          const statutCible = getPieceCorrectionStatus(piecesACorriger, piece.key);
          const corrigee = statutCible === 'PROVIDED';
          return (
          <li
            key={piece.key}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
              corrigee ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50/40'
            }`}
          >
            <div className='min-w-0'>
              <p className='text-sm font-medium text-gray-900'>{piece.label}</p>
              <p className={`text-xs mt-0.5 ${corrigee ? 'text-green-700' : 'text-orange-700'}`}>
                {corrigee ? 'Pièce corrigée' : 'À remplacer'}
              </p>
            </div>
            <div className='flex items-center gap-2 flex-shrink-0'>
              {piece.url && piece.url !== 'present' && (
                <button
                  type='button'
                  onClick={() => ouvrirPiece(piece.url)}
                  className='text-xs font-medium text-blue-800 hover:underline'
                >
                  Voir
                </button>
              )}
              <label className='cursor-pointer rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800'>
                {uploadBusy === piece.key ? 'Envoi…' : 'Remplacer'}
                <input
                  type='file'
                  accept={piece.accept}
                  className='hidden'
                  disabled={Boolean(uploadBusy)}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) handleUpload(piece, f);
                  }}
                />
              </label>
            </div>
          </li>
          );
        })}
      </ul>
      {codesACorriger.length > 0 && piecesAffichees.length === 0 && (
        <p className='text-sm text-amber-700'>Aucune pièce ciblée trouvée dans votre dossier.</p>
      )}
    </div>
  );
}
