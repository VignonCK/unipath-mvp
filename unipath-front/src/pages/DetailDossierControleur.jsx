// src/pages/DetailDossierControleur.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiConfig';
import CommissionLayout from '../components/CommissionLayout';

const DetailDossierControleur = () => {
  const { dossierInscriptionId } = useParams();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Formulaire de décision
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

      // Pré-remplir le formulaire si une décision existe déjà
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

    if ((decision === 'REJETE' || decision === 'SOUS_RESERVE') && (!motif || motif.trim().length < 10)) {
      setValidationError('Le motif est obligatoire et doit contenir au moins 10 caractères pour un rejet ou une validation sous réserve');
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
      // Recharger le dossier pour afficher la décision mise à jour
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

  const getBadgeVerdict = (verdict) => {
    switch (verdict) {
      case 'VALIDE':
        return <span className="academic-badge academic-badge-success">Validé</span>;
      case 'REJETE':
        return <span className="academic-badge academic-badge-error">Rejeté</span>;
      case 'SOUS_RESERVE':
        return <span className="academic-badge academic-badge-warning">Sous réserve</span>;
      default:
        return <span className="academic-badge">-</span>;
    }
  };

  if (loading) {
    return (
      <div className="academic-container">
        <div className="academic-bento-card">
          <p className="academic-text-muted">Chargement du dossier...</p>
        </div>
      </div>
    );
  }

  if (error && !dossier) {
    return (
      <div className="academic-container">
        <div className="academic-alert academic-alert-error">
          <span className="academic-alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
        <button
          className="academic-btn academic-btn-secondary"
          onClick={() => navigate('/controleur-commission/dossiers')}
        >
          ← Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <CommissionLayout>
    <div className="academic-container">
      <div className="academic-header">
        <button
          className="academic-btn academic-btn-secondary"
          onClick={() => navigate('/controleur-commission/dossiers')}
          style={{ marginBottom: '1rem' }}
        >
          ← Retour à la liste
        </button>
        <h1 className="academic-title">Examen du dossier</h1>
        <p className="academic-subtitle">
          {dossier.inscription.candidat.nom} {dossier.inscription.candidat.prenom}
        </p>
      </div>

      {success && (
        <div className="academic-alert academic-alert-success">
          <span className="academic-alert-icon">✓</span>
          <span>Décision enregistrée avec succès !</span>
        </div>
      )}

      {error && (
        <div className="academic-alert academic-alert-error">
          <span className="academic-alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Alerte verdicts divergents */}
      {dossier.verdictsDivergents && (
        <div className="academic-alert academic-alert-warning">
          <span className="academic-alert-icon">⚠️</span>
          <span><strong>Verdicts divergents détectés !</strong> Les deux examinateurs ont rendu des verdicts différents. Votre décision est requise.</span>
        </div>
      )}

      {/* Informations candidat */}
      <div className="academic-bento-card">
        <h2 className="academic-card-title">Informations du candidat</h2>
        <div className="academic-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div className="academic-info-row">
            <span className="academic-label">Nom complet :</span>
            <span className="academic-text">
              {dossier.inscription.candidat.nom} {dossier.inscription.candidat.prenom}
            </span>
          </div>
          <div className="academic-info-row">
            <span className="academic-label">Email :</span>
            <span className="academic-text">{dossier.inscription.candidat.email}</span>
          </div>
          <div className="academic-info-row">
            <span className="academic-label">ANIP :</span>
            <span className="academic-text">{dossier.inscription.candidat.anip}</span>
          </div>
          <div className="academic-info-row">
            <span className="academic-label">Série :</span>
            <span className="academic-text">{dossier.inscription.candidat.serie}</span>
          </div>
          <div className="academic-info-row">
            <span className="academic-label">Sexe :</span>
            <span className="academic-text">{dossier.inscription.candidat.sexe}</span>
          </div>
          <div className="academic-info-row">
            <span className="academic-label">Nationalité :</span>
            <span className="academic-text">{dossier.inscription.candidat.nationalite}</span>
          </div>
          <div className="academic-info-row">
            <span className="academic-label">Concours :</span>
            <span className="academic-text">{dossier.inscription.concours.libelle}</span>
          </div>
          <div className="academic-info-row">
            <span className="academic-label">Établissement :</span>
            <span className="academic-text">{dossier.inscription.concours.etablissement}</span>
          </div>
        </div>
      </div>

      {/* Verdicts des examinateurs */}
      <div className="academic-bento-card">
        <h2 className="academic-card-title">Verdicts des examinateurs</h2>
        
        <div className="academic-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Verdict 1 */}
          <div style={{ 
            padding: '1.5rem', 
            backgroundColor: dossier.verdicts.verdict1 ? 'var(--academic-bg-secondary)' : 'var(--academic-bg-muted)', 
            borderRadius: '12px',
            border: dossier.verdictsDivergents ? '2px solid var(--academic-warning)' : 'none'
          }}>
            <h3 className="academic-subtitle">Examinateur 1</h3>
            {dossier.verdicts.verdict1 ? (
              <>
                <div className="academic-info-row" style={{ marginTop: '1rem' }}>
                  <span className="academic-label">Verdict :</span>
                  {getBadgeVerdict(dossier.verdicts.verdict1.verdict)}
                </div>
                <div className="academic-info-row">
                  <span className="academic-label">Par :</span>
                  <span className="academic-text">
                    {dossier.verdicts.verdict1.examinateur.nom} {dossier.verdicts.verdict1.examinateur.prenom}
                  </span>
                </div>
                <div className="academic-info-row">
                  <span className="academic-label">Date :</span>
                  <span className="academic-text">
                    {new Date(dossier.verdicts.verdict1.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {dossier.verdicts.verdict1.motif && (
                  <div style={{ marginTop: '1rem' }}>
                    <span className="academic-label">Motif :</span>
                    <p className="academic-text" style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                      {dossier.verdicts.verdict1.motif}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  className="academic-btn academic-btn-secondary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => ouvrirCorrectionVerdict(1, dossier.verdicts.verdict1)}
                >
                  Corriger ce verdict
                </button>
              </>
            ) : (
              <p className="academic-text-muted" style={{ marginTop: '1rem' }}>En attente du verdict</p>
            )}
          </div>

          {/* Verdict 2 */}
          <div style={{ 
            padding: '1.5rem', 
            backgroundColor: dossier.verdicts.verdict2 ? 'var(--academic-bg-secondary)' : 'var(--academic-bg-muted)', 
            borderRadius: '12px',
            border: dossier.verdictsDivergents ? '2px solid var(--academic-warning)' : 'none'
          }}>
            <h3 className="academic-subtitle">Examinateur 2</h3>
            {dossier.verdicts.verdict2 ? (
              <>
                <div className="academic-info-row" style={{ marginTop: '1rem' }}>
                  <span className="academic-label">Verdict :</span>
                  {getBadgeVerdict(dossier.verdicts.verdict2.verdict)}
                </div>
                <div className="academic-info-row">
                  <span className="academic-label">Par :</span>
                  <span className="academic-text">
                    {dossier.verdicts.verdict2.examinateur.nom} {dossier.verdicts.verdict2.examinateur.prenom}
                  </span>
                </div>
                <div className="academic-info-row">
                  <span className="academic-label">Date :</span>
                  <span className="academic-text">
                    {new Date(dossier.verdicts.verdict2.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {dossier.verdicts.verdict2.motif && (
                  <div style={{ marginTop: '1rem' }}>
                    <span className="academic-label">Motif :</span>
                    <p className="academic-text" style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                      {dossier.verdicts.verdict2.motif}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  className="academic-btn academic-btn-secondary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => ouvrirCorrectionVerdict(2, dossier.verdicts.verdict2)}
                >
                  Corriger ce verdict
                </button>
              </>
            ) : (
              <p className="academic-text-muted" style={{ marginTop: '1rem' }}>En attente du verdict</p>
            )}
          </div>
        </div>

        {correctionSlot && (
          <div className="academic-alert academic-alert-info" style={{ marginTop: '1.5rem' }}>
            <p className="academic-text" style={{ marginBottom: '1rem' }}>
              <strong>Correction du verdict examinateur {correctionSlot}</strong> — seul le contrôleur peut
              modifier le verdict d&apos;un examinateur.
            </p>
            {correctionError && (
              <div className="academic-alert academic-alert-error" style={{ marginBottom: '1rem' }}>
                <span>{correctionError}</span>
              </div>
            )}
            <div className="academic-form-group">
              <label className="academic-label">Nouveau verdict *</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {['VALIDE', 'REJETE', 'SOUS_RESERVE'].map((v) => (
                  <label key={v} className="academic-radio-label">
                    <input
                      type="radio"
                      name="correctionVerdict"
                      value={v}
                      checked={correctionVerdict === v}
                      onChange={(e) => setCorrectionVerdict(e.target.value)}
                      disabled={correctionSubmitting}
                    />
                    {getBadgeVerdict(v)}
                  </label>
                ))}
              </div>
            </div>
            <div className="academic-form-group">
              <label className="academic-label">Motif</label>
              <textarea
                className="academic-input"
                rows="4"
                value={correctionMotif}
                onChange={(e) => setCorrectionMotif(e.target.value)}
                disabled={correctionSubmitting}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="academic-btn academic-btn-primary"
                onClick={soumettreCorrectionVerdict}
                disabled={correctionSubmitting}
              >
                {correctionSubmitting ? 'Enregistrement...' : 'Enregistrer la correction'}
              </button>
              <button
                type="button"
                className="academic-btn academic-btn-secondary"
                onClick={() => setCorrectionSlot(null)}
                disabled={correctionSubmitting}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pièces du dossier */}
      <div className="academic-bento-card">
        <h2 className="academic-card-title">Pièces du dossier</h2>
        
        <h3 className="academic-subtitle" style={{ marginTop: '1rem' }}>Pièces de base</h3>
        <div className="academic-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {Object.entries(dossier.piecesBase).map(([key, piece]) => (
            <div key={key} className="academic-info-row">
              <span className="academic-label">{key} :</span>
              {piece.url ? (
                <a
                  href={piece.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="academic-link"
                >
                  Voir la pièce
                </a>
              ) : (
                <span className="academic-badge academic-badge-warning">Manquante</span>
              )}
            </div>
          ))}
        </div>

        <h3 className="academic-subtitle" style={{ marginTop: '1.5rem' }}>Pièces spécifiques</h3>
        <div className="academic-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {Object.entries(dossier.piecesSpecifiques).map(([key, piece]) => (
            <div key={key} className="academic-info-row">
              <span className="academic-label">{key} :</span>
              {piece.url ? (
                <a
                  href={piece.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="academic-link"
                >
                  Voir la pièce
                </a>
              ) : (
                <span className="academic-badge academic-badge-warning">Manquante</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Formulaire de décision */}
      <div className="academic-bento-card">
        <h2 className="academic-card-title">
          {dossier.decisionControleur ? 'Modifier ma décision' : 'Rendre ma décision'}
        </h2>

        {dossier.decisionControleur && (
          <div className="academic-alert academic-alert-info">
            <span className="academic-alert-icon">ℹ️</span>
            <span>
              Vous avez déjà rendu votre décision. Vous pouvez la modifier autant de fois que nécessaire.
            </span>
          </div>
        )}

        {validationError && (
          <div className="academic-alert academic-alert-error">
            <span className="academic-alert-icon">⚠️</span>
            <span>{validationError}</span>
          </div>
        )}

        <div className="academic-form-group">
          <label className="academic-label">Décision finale *</label>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <label className="academic-radio-label">
              <input
                type="radio"
                name="decision"
                value="VALIDE"
                checked={decision === 'VALIDE'}
                onChange={(e) => setDecision(e.target.value)}
                disabled={submitting || success}
              />
              <span className="academic-badge academic-badge-success">Validé</span>
            </label>
            <label className="academic-radio-label">
              <input
                type="radio"
                name="decision"
                value="REJETE"
                checked={decision === 'REJETE'}
                onChange={(e) => setDecision(e.target.value)}
                disabled={submitting || success}
              />
              <span className="academic-badge academic-badge-error">Rejeté</span>
            </label>
            <label className="academic-radio-label">
              <input
                type="radio"
                name="decision"
                value="SOUS_RESERVE"
                checked={decision === 'SOUS_RESERVE'}
                onChange={(e) => setDecision(e.target.value)}
                disabled={submitting || success}
              />
              <span className="academic-badge academic-badge-warning">Sous réserve</span>
            </label>
          </div>
        </div>

        <div className="academic-form-group">
          <label className="academic-label">
            Motif {(decision === 'REJETE' || decision === 'SOUS_RESERVE') && '*'}
          </label>
          <textarea
            className="academic-input"
            rows="6"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder={
              decision === 'REJETE' || decision === 'SOUS_RESERVE'
                ? 'Motif obligatoire (minimum 10 caractères)'
                : 'Motif optionnel'
            }
            disabled={submitting || success}
          />
          <small className="academic-text-muted">
            {motif.trim().length} / 1000 caractères
          </small>
        </div>

        <div className="academic-card-footer">
          <button
            className="academic-btn academic-btn-primary"
            onClick={soumettreDecision}
            disabled={submitting || success}
          >
            {submitting ? 'Envoi en cours...' : dossier.decisionControleur ? 'Modifier ma décision' : 'Soumettre ma décision'}
          </button>
        </div>
      </div>
    </div>
    </CommissionLayout>
  );
};

export default DetailDossierControleur;
