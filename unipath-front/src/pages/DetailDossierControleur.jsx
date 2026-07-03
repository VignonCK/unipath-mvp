// src/pages/DetailDossierControleur.jsx
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

const VERDICT_LABELS = {
  VALIDE: 'Validé',
  REJETE: 'Rejeté',
  SOUS_RESERVE: 'Sous réserve',
};

function motifRequis(decision, verdictExaminateur) {
  if (!decision) return false;
  if (decision === 'REJETE' || decision === 'SOUS_RESERVE') return true;
  return Boolean(verdictExaminateur && decision !== verdictExaminateur);
}

function VerdictPanel({ titre, verdictData, divergent, onCorriger, allowCorrection = false }) {
  const hasVerdict = Boolean(verdictData);
  const panelClass = hasVerdict
    ? 'bg-slate-50 border border-slate-200 rounded-xl p-5'
    : 'bg-gray-50 border border-dashed border-gray-200 rounded-xl p-5';
  const divergentClass = divergent ? 'border-2 border-orange-300' : '';
  const auteur = verdictData?.examinateur || verdictData?.controleur;

  return (
    <div className={`${panelClass} ${divergentClass}`}>
      <h3 className="text-sm font-semibold text-slate-700">{titre}</h3>
      {hasVerdict ? (
        <div className="mt-4 space-y-2">
          <InfoRow label="Verdict">
            <VerdictBadge verdict={verdictData.verdict} />
          </InfoRow>
          {auteur && (
            <InfoRow label="Par">
              {auteur.nom} {auteur.prenom}
            </InfoRow>
          )}
          <InfoRow label="Date">
            {new Date(verdictData.date).toLocaleDateString('fr-FR')}
          </InfoRow>
          {verdictData.motif && (
            <div className="pt-2">
              <p className="text-xs font-medium text-gray-500 mb-1">Motif</p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{verdictData.motif}</p>
            </div>
          )}
          {allowCorrection && onCorriger && (
            <button
              type="button"
              className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              onClick={() => onCorriger(verdictData)}
            >
              Corriger ce verdict
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400 mt-4">
          {titre === 'Contrôleur' ? 'En attente de l\'arbitrage du contrôleur' : 'En attente du verdict examinateur'}
        </p>
      )}
    </div>
  );
}

const DetailDossierControleur = () => {
  const { dossierInscriptionId } = useParams();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [decision, setDecision] = useState('');
  const [motif, setMotif] = useState('');
  const [validationError, setValidationError] = useState('');

  const [correctionSlot, setCorrectionSlot] = useState(null);
  const [correctionVerdict, setCorrectionVerdict] = useState('');
  const [correctionMotif, setCorrectionMotif] = useState('');
  const [correctionError, setCorrectionError] = useState('');
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false);

  const chargerDossier = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(`/controleur-commission/dossiers/${dossierInscriptionId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du chargement du dossier');
      }

      const data = await response.json();
      setDossier(data);

      if (data.decisionControleur) {
        setDecision(data.decisionControleur.decision);
        setMotif(data.decisionControleur.motif || '');
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
    if (!decision) {
      setValidationError('Veuillez sélectionner une décision');
      return false;
    }

    const verdictExaminateur = dossier?.verdicts?.verdict1?.verdict;
    const divergent = verdictExaminateur && decision !== verdictExaminateur;

    if (motifRequis(decision, verdictExaminateur) && (!motif || motif.trim().length < 10)) {
      setValidationError(
        divergent
          ? 'Un motif d\'au moins 10 caractères est obligatoire pour expliquer votre arbitrage à l\'examinateur.'
          : 'Le motif est obligatoire et doit contenir au moins 10 caractères pour un rejet ou une validation sous réserve.'
      );
      return false;
    }

    if (motif && motif.trim().length > 1000) {
      setValidationError('Le motif ne peut pas dépasser 1000 caractères');
      return false;
    }

    setValidationError('');
    return true;
  };

  const soumettreDecision = async () => {
    if (!validerFormulaire()) return;

    try {
      setSubmitting(true);
      setError(null);

      const method = dossier.decisionControleur ? 'PUT' : 'POST';
      const response = await apiFetch(`/controleur-commission/dossiers/${dossierInscriptionId}/decision`, {
        method,
        body: JSON.stringify({ decision, motif: motif.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la soumission de la décision');
      }

      setSuccess(true);
      setTimeout(() => {
        chargerDossier();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const ouvrirCorrectionVerdict = (numero, verdictData) => {
    setCorrectionSlot(numero);
    setCorrectionVerdict(verdictData.verdict);
    setCorrectionMotif(verdictData.motif || '');
    setCorrectionError('');
  };

  const validerCorrectionVerdict = () => {
    if (!correctionVerdict) {
      setCorrectionError('Veuillez sélectionner un verdict');
      return false;
    }
    if (
      (correctionVerdict === 'REJETE' || correctionVerdict === 'SOUS_RESERVE') &&
      (!correctionMotif || correctionMotif.trim().length < 10)
    ) {
      setCorrectionError('Motif obligatoire (min. 10 caractères) pour rejet ou sous réserve');
      return false;
    }
    setCorrectionError('');
    return true;
  };

  const soumettreCorrectionVerdict = async () => {
    if (!validerCorrectionVerdict()) return;
    try {
      setCorrectionSubmitting(true);
      setCorrectionError(null);
      const response = await apiFetch(
        `/controleur-commission/dossiers/${dossierInscriptionId}/verdict-examinateur`,
        {
          method: 'PUT',
          body: JSON.stringify({
            numeroVerdict: correctionSlot,
            verdict: correctionVerdict,
            motif: correctionMotif.trim(),
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la correction du verdict');
      }
      setCorrectionSlot(null);
      await chargerDossier();
    } catch (err) {
      setCorrectionError(err.message);
    } finally {
      setCorrectionSubmitting(false);
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
          onClick={() => navigate('/controleur-commission/dossiers')}
        >
          ← Retour à la liste
        </button>
      </ControleurPage>
    );
  }

  const verdictExaminateur = dossier?.verdicts?.verdict1?.verdict;
  const arbitrageDivergent = Boolean(
    verdictExaminateur && decision && decision !== verdictExaminateur
  );
  const motifObligatoire = motifRequis(decision, verdictExaminateur);
  const modInfo = dossier?.modificationControleur;
  const formulaireDecisionVerrouille = Boolean(
    dossier?.decisionControleur && !modInfo?.peutModifier
  );
  const peutSoumettreDecision = !formulaireDecisionVerrouille;

  return (
    <ControleurPage>
      <div>
        <button
          type="button"
          className="mb-4 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          onClick={() => navigate('/controleur-commission/dossiers')}
        >
          ← Retour à la liste
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Examen du dossier</h1>
        <p className="text-sm text-gray-500 mt-1">
          {dossier.inscription.candidat.nom} {dossier.inscription.candidat.prenom}
        </p>
      </div>

      {success && (
        <ControleurAlert type="success">
          <span>✓</span>
          <span>Décision enregistrée avec succès !</span>
        </ControleurAlert>
      )}

      {error && (
        <ControleurAlert type="error">
          <span>⚠️</span>
          <span>{error}</span>
        </ControleurAlert>
      )}

      {dossier.resoumission?.enAttenteNouvelleDecision && (
        <ControleurAlert type="warning">
          <span>↻</span>
          <span>
            <strong>Dossier resoumis par le candidat</strong>
            {dossier.resoumission.date && (
              <>
                {' '}
                le{' '}
                {new Date(dossier.resoumission.date).toLocaleString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </>
            )}
            . Les pièces ont été corrigées — une nouvelle décision de votre part est attendue.
          </span>
        </ControleurAlert>
      )}

      {dossier.verdictsDivergents && (
        <ControleurAlert type="warning">
          <span>⚠️</span>
          <span>
            <strong>Arbitrage divergent !</strong> Votre décision diffère de celle de l&apos;examinateur.
          </span>
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
          <InfoRow label="Sexe">{dossier.inscription.candidat.sexe}</InfoRow>
          <InfoRow label="Nationalité">{dossier.inscription.candidat.nationalite}</InfoRow>
          <InfoRow label="Concours">{dossier.inscription.concours.libelle}</InfoRow>
          <InfoRow label="Établissement">{dossier.inscription.concours.etablissement}</InfoRow>
        </div>
      </BentoCard>

      <BentoCard className="p-5 bg-white">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Examinateur et arbitrage contrôleur</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VerdictPanel
            titre="Examinateur"
            verdictData={dossier.verdicts.verdict1}
            divergent={dossier.verdictsDivergents}
            allowCorrection
            onCorriger={(v) => ouvrirCorrectionVerdict(1, v)}
          />
          <VerdictPanel
            titre="Contrôleur"
            verdictData={dossier.verdicts.verdict2}
            divergent={dossier.verdictsDivergents}
          />
        </div>

        {correctionSlot && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
            <p className="text-sm text-blue-900">
              <strong>Correction du verdict examinateur</strong> — vous pouvez corriger le verdict
              de l&apos;examinateur avant ou après votre arbitrage.
            </p>
            {correctionError && (
              <ControleurAlert type="error">
                <span>{correctionError}</span>
              </ControleurAlert>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Nouveau verdict *</label>
              <div className="flex gap-4 flex-wrap">
                {VERDICT_OPTIONS.map((v) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="correctionVerdict"
                      value={v}
                      checked={correctionVerdict === v}
                      onChange={(e) => setCorrectionVerdict(e.target.value)}
                      disabled={correctionSubmitting}
                      className="text-slate-700"
                    />
                    <VerdictBadge verdict={v} />
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Motif</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                rows="4"
                value={correctionMotif}
                onChange={(e) => setCorrectionMotif(e.target.value)}
                disabled={correctionSubmitting}
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50 transition"
                onClick={soumettreCorrectionVerdict}
                disabled={correctionSubmitting}
              >
                {correctionSubmitting ? 'Enregistrement...' : 'Enregistrer la correction'}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition"
                onClick={() => setCorrectionSlot(null)}
                disabled={correctionSubmitting}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </BentoCard>

      <BentoCard className="p-5 bg-white">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Pièces du dossier</h2>

        <h3 className="text-sm font-medium text-slate-600 mb-3">Pièces de base</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 mb-6">
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

        <h3 className="text-sm font-medium text-slate-600 mb-3">Pièces spécifiques</h3>
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

      {dossier.activiteCandidat?.length > 0 && (
        <BentoCard className="p-5 bg-white">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Activité récente du candidat</h2>
          <ul className="space-y-2">
            {dossier.activiteCandidat.map((evt, index) => (
              <li
                key={`${evt.typeAction}-${evt.date}-${index}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <span className="text-sm text-slate-800">{evt.label}</span>
                {evt.date && (
                  <span className="text-xs text-gray-500">
                    {new Date(evt.date).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </BentoCard>
      )}

      <BentoCard className="p-5 bg-white">
        <h2 className="text-base font-semibold text-slate-800 mb-4">
          {dossier.decisionControleur ? 'Modifier ma décision' : 'Rendre ma décision'}
        </h2>

        {dossier.decisionControleur && modInfo?.peutModifier && (
          <ControleurAlert type="info">
            <span>ℹ️</span>
            <span>
              Décision sous réserve : vous pouvez effectuer <strong>une seule correction</strong> dans les{' '}
              <strong>24 h</strong> suivant votre décision (ex. corriger le motif). Ensuite, seule la
              resoumission du candidat permet un nouvel examen.
            </span>
          </ControleurAlert>
        )}

        {formulaireDecisionVerrouille && (
          <ControleurAlert type="warning">
            <span>🔒</span>
            <span>
              {modInfo?.message
                || (['VALIDE', 'REJETE'].includes(dossier.decisionControleur?.decision)
                  ? 'Cette décision est définitive et ne peut plus être modifiée.'
                  : 'Cette décision ne peut plus être modifiée.')}
            </span>
          </ControleurAlert>
        )}

        {validationError && (
          <ControleurAlert type="error">
            <span>⚠️</span>
            <span>{validationError}</span>
          </ControleurAlert>
        )}

        {arbitrageDivergent && (
          <ControleurAlert type="warning">
            <span>⚠️</span>
            <span>
              Votre décision ({VERDICT_LABELS[decision]}) diffère de celle de l&apos;examinateur (
              {VERDICT_LABELS[verdictExaminateur]}). Un motif est obligatoire : il sera transmis à
              l&apos;examinateur pour ses prochaines évaluations.
            </span>
          </ControleurAlert>
        )}

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-500 mb-2">Décision finale *</label>
          <div className="flex gap-4 flex-wrap">
            {VERDICT_OPTIONS.map((v) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  value={v}
                  checked={decision === v}
                  onChange={(e) => setDecision(e.target.value)}
                  disabled={submitting || success || formulaireDecisionVerrouille}
                  className="text-slate-700"
                />
                <VerdictBadge verdict={v} />
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Motif {motifObligatoire && '*'}
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            rows="6"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder={
              arbitrageDivergent
                ? 'Expliquez pourquoi vous arbitrez différemment de l\'examinateur (min. 10 caractères, envoyé à l\'examinateur)'
                : decision === 'SOUS_RESERVE'
                  ? 'Indiquez la pièce non conforme et la correction attendue (ex. : relevé illisible — merci de le remplacer). Min. 10 caractères.'
                  : decision === 'REJETE'
                    ? 'Motif obligatoire (minimum 10 caractères)'
                    : 'Motif optionnel'
            }
            disabled={submitting || success || formulaireDecisionVerrouille}
          />
          <p className="text-xs text-gray-400 mt-1">{motif.trim().length} / 1000 caractères</p>
        </div>

        {peutSoumettreDecision && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50 transition"
            onClick={soumettreDecision}
            disabled={submitting || success}
          >
            {submitting
              ? 'Envoi en cours...'
              : dossier.decisionControleur
                ? 'Enregistrer la correction'
                : 'Soumettre ma décision'}
          </button>
        </div>
        )}
      </BentoCard>
    </ControleurPage>
  );
};

export default DetailDossierControleur;
