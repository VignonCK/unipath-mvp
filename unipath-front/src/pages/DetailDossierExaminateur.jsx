// src/pages/DetailDossierExaminateur.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiConfig';
import { ouvrirPiece } from '../services/api';
import { BentoCard } from '../components/AcademicLayout';
import {
  ControleurLoading,
  ControleurPage,
  ControleurAlert,
  InfoRow,
  VerdictBadge,
} from '../components/controleur/ControleurShell';

const VERDICT_OPTIONS = ['VALIDE', 'REJETE', 'SOUS_RESERVE'];

const DetailDossierExaminateur = () => {
  const { dossierInscriptionId } = useParams();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [verdict, setVerdict] = useState('');
  const [motif, setMotif] = useState('');
  const [commentaireSousReserve, setCommentaireSousReserve] = useState('');
  const [validationError, setValidationError] = useState('');

  const chargerDossier = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(`/examinateur/dossiers/${dossierInscriptionId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du chargement du dossier');
      }

      const data = await response.json();
      setDossier(data);

      if (data.monVerdict.rendu) {
        setVerdict(data.monVerdict.verdict);
        setMotif(data.monVerdict.motif || '');
        setCommentaireSousReserve(data.monVerdict.commentaireSousReserve || '');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dossierInscriptionId]);

  useEffect(() => {
    chargerDossier();
  }, [chargerDossier]);

  const validerFormulaire = () => {
    if (!verdict) {
      setValidationError('Veuillez sélectionner un verdict');
      return false;
    }

    if (verdict === 'REJETE' && (!motif || motif.trim().length < 10)) {
      setValidationError(
        'Le motif de rejet est obligatoire et doit contenir au moins 10 caractères'
      );
      return false;
    }

    if (
      verdict === 'SOUS_RESERVE'
      && (!commentaireSousReserve || commentaireSousReserve.trim().length < 10)
    ) {
      setValidationError(
        'Le commentaire sous réserve est obligatoire et doit contenir au moins 10 caractères'
      );
      return false;
    }

    const texteActif = verdict === 'REJETE' ? motif : commentaireSousReserve;
    if (texteActif && texteActif.trim().length > 1000) {
      setValidationError('Le texte ne peut pas dépasser 1000 caractères');
      return false;
    }

    setValidationError('');
    return true;
  };

  const peutAgir =
    dossier?.permissions?.peutRendreVerdict || dossier?.permissions?.peutModifierMonVerdict;
  const lectureSeule = dossier?.permissions?.lectureSeule ?? false;

  const soumettreVerdict = async () => {
    if (!peutAgir) return;
    if (!validerFormulaire()) return;

    try {
      setSubmitting(true);
      setError(null);

      const method = dossier.monVerdict.rendu ? 'PUT' : 'POST';
      const response = await apiFetch(`/examinateur/dossiers/${dossierInscriptionId}/verdict`, {
        method,
        body: JSON.stringify({
          verdict,
          motif: verdict === 'REJETE' ? motif.trim() : null,
          commentaireSousReserve: verdict === 'SOUS_RESERVE' ? commentaireSousReserve.trim() : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la soumission du verdict');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/examinateur/dossiers');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <ControleurLoading message="Chargement du dossier..." />;
  }

  if (error && !dossier) {
    return (
      <ControleurPage>
        <ControleurAlert type="error">
          <span>⚠️</span>
          <span>{error}</span>
        </ControleurAlert>
        <button
          type="button"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          onClick={() => navigate('/examinateur/dossiers')}
        >
          ← Retour à la liste
        </button>
      </ControleurPage>
    );
  }

  return (
    <ControleurPage>
      <div>
        <button
          type="button"
          className="mb-4 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          onClick={() => navigate('/examinateur/dossiers')}
        >
          ← Retour à la liste
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Évaluation du dossier</h1>
        <p className="text-sm text-gray-500 mt-1">
          {dossier.inscription.candidat.nom} {dossier.inscription.candidat.prenom}
        </p>
      </div>

      {success && (
        <ControleurAlert type="success">
          <span>✓</span>
          <span>Verdict enregistré avec succès ! Redirection en cours...</span>
        </ControleurAlert>
      )}

      {error && (
        <ControleurAlert type="error">
          <span>⚠️</span>
          <span>{error}</span>
        </ControleurAlert>
      )}

      <BentoCard className="p-5 bg-white">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Informations du candidat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <InfoRow label="Nom complet">
            {dossier.inscription.candidat.nom} {dossier.inscription.candidat.prenom}
          </InfoRow>
          <InfoRow label="Email">{dossier.inscription.candidat.email}</InfoRow>
          <InfoRow label="ANIP">{dossier.inscription.candidat.anip}</InfoRow>
          <InfoRow label="Série">{dossier.inscription.candidat.serie}</InfoRow>
          <InfoRow label="Concours">{dossier.inscription.concours.libelle}</InfoRow>
          <InfoRow label="Établissement">{dossier.inscription.concours.etablissement}</InfoRow>
        </div>
      </BentoCard>

      <BentoCard className="p-5 bg-white">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Pièces du dossier</h2>

        <h3 className="text-sm font-medium text-gray-600 mt-2 mb-3">Pièces de base</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {Object.entries(dossier.piecesBase).map(([key, piece]) => (
            <InfoRow key={key} label={key}>
              {piece.url ? (
                <button
                  type="button"
                  onClick={() => ouvrirPiece(piece.url)}
                  className="text-sm text-blue-700 hover:underline"
                >
                  Voir la pièce
                </button>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                  Manquante
                </span>
              )}
            </InfoRow>
          ))}
        </div>

        <h3 className="text-sm font-medium text-gray-600 mt-6 mb-3">Pièces spécifiques</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {Object.entries(dossier.piecesSpecifiques).map(([key, piece]) => (
            <InfoRow key={key} label={key}>
              {piece.url ? (
                <button
                  type="button"
                  onClick={() => ouvrirPiece(piece.url)}
                  className="text-sm text-blue-700 hover:underline"
                >
                  Voir la pièce
                </button>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                  Manquante
                </span>
              )}
            </InfoRow>
          ))}
        </div>
      </BentoCard>

      {dossier.autreVerdictRendu && !lectureSeule && (
        <ControleurAlert type="info">
          <span>ℹ️</span>
          <span>
            Un autre examinateur a déjà rendu son verdict. Vous ne pouvez pas modifier son verdict,
            seulement rendre le vôtre ou corriger le vôtre (une fois).
          </span>
        </ControleurAlert>
      )}

      {dossier.retourArbitrage && (
        <ControleurAlert type="warning">
          <span>⚠️</span>
          <div>
            <p className="font-semibold">Retour du contrôleur — arbitrage divergent</p>
            <p className="mt-2">
              Vous aviez arbitré « {dossier.retourArbitrage.verdictExaminateurLabel} », le contrôleur
              a rendu « {dossier.retourArbitrage.decisionControleurLabel} ».
            </p>
            {dossier.retourArbitrage.motif && dossier.retourArbitrage.decisionControleur === 'REJETE' && (
              <p className="mt-3 whitespace-pre-wrap">
                <strong>Motif du rejet :</strong> {dossier.retourArbitrage.motif}
              </p>
            )}
            {dossier.retourArbitrage.commentaireSousReserve
              && dossier.retourArbitrage.decisionControleur === 'SOUS_RESERVE' && (
              <p className="mt-3 whitespace-pre-wrap">
                <strong>Conditions :</strong> {dossier.retourArbitrage.commentaireSousReserve}
              </p>
            )}
            <p className="mt-3 text-sm opacity-90">
              Tenez compte de ce retour pour vos prochaines évaluations.
            </p>
          </div>
        </ControleurAlert>
      )}

      {dossier.messageLectureSeule && (
        <ControleurAlert type="warning">
          <span>🔒</span>
          <span>{dossier.messageLectureSeule}</span>
        </ControleurAlert>
      )}

      <BentoCard className="p-5 bg-white">
        <h2 className="text-base font-semibold text-slate-800 mb-4">
          {lectureSeule
            ? dossier.monVerdict.rendu
              ? 'Mon verdict (lecture seule)'
              : 'Évaluation (lecture seule)'
            : dossier.monVerdict.rendu
              ? 'Modifier mon verdict'
              : 'Rendre mon verdict'}
        </h2>

        {dossier.monVerdict.rendu && peutAgir && (
          <ControleurAlert type="warning">
            <span>⚠️</span>
            <span>
              Modifications restantes : {dossier.monVerdict.modificationsPossibles} (seul le
              contrôleur peut corriger le verdict d&apos;un autre examinateur)
            </span>
          </ControleurAlert>
        )}

        {validationError && (
          <ControleurAlert type="error">
            <span>⚠️</span>
            <span>{validationError}</span>
          </ControleurAlert>
        )}

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-500 mb-2">Verdict *</label>
          <div className="flex gap-4 flex-wrap">
            {VERDICT_OPTIONS.map((v) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="verdict"
                  value={v}
                  checked={verdict === v}
                  onChange={(e) => {
                    setVerdict(e.target.value);
                    if (e.target.value !== 'REJETE') setMotif('');
                    if (e.target.value !== 'SOUS_RESERVE') setCommentaireSousReserve('');
                  }}
                  disabled={submitting || success || lectureSeule || !peutAgir}
                  className="text-slate-700"
                />
                <VerdictBadge verdict={v} />
              </label>
            ))}
          </div>
        </div>

        {verdict === 'REJETE' && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Motif du rejet *
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              rows="6"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Motif obligatoire (minimum 10 caractères)"
              disabled={submitting || success || lectureSeule || !peutAgir}
            />
            <p className="text-xs text-gray-400 mt-1">{motif.trim().length} / 1000 caractères</p>
          </div>
        )}

        {verdict === 'SOUS_RESERVE' && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Conditions à remplir *
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              rows="6"
              value={commentaireSousReserve}
              onChange={(e) => setCommentaireSousReserve(e.target.value)}
              placeholder="Indiquez la pièce non conforme et la correction attendue (min. 10 caractères)."
              disabled={submitting || success || lectureSeule || !peutAgir}
            />
            <p className="text-xs text-gray-400 mt-1">
              {commentaireSousReserve.trim().length} / 1000 caractères
            </p>
          </div>
        )}

        {peutAgir && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50 transition"
              onClick={soumettreVerdict}
              disabled={submitting || success}
            >
              {submitting
                ? 'Envoi en cours...'
                : dossier.monVerdict.rendu
                  ? 'Modifier mon verdict'
                  : 'Soumettre mon verdict'}
            </button>
          </div>
        )}
      </BentoCard>
    </ControleurPage>
  );
};

export default DetailDossierExaminateur;
