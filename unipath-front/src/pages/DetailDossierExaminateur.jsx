// src/pages/DetailDossierExaminateur.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiConfig';
import CommissionLayout from '../components/CommissionLayout';

const DetailDossierExaminateur = () => {
  const { dossierInscriptionId } = useParams();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Formulaire de verdict
  const [verdict, setVerdict] = useState('');
  const [motif, setMotif] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    chargerDossier();
  }, [dossierInscriptionId]);

  const chargerDossier = async () => {
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

      // Pré-remplir le formulaire si un verdict existe déjà
      if (data.monVerdict.rendu) {
        setVerdict(data.monVerdict.verdict);
        setMotif(data.monVerdict.motif || '');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validerFormulaire = () => {
    if (!verdict) {
      setValidationError('Veuillez sélectionner un verdict');
      return false;
    }

    if ((verdict === 'REJETE' || verdict === 'SOUS_RESERVE') && (!motif || motif.trim().length < 10)) {
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
        body: JSON.stringify({ verdict, motif: motif.trim() }),
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
          onClick={() => navigate('/examinateur/dossiers')}
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
          onClick={() => navigate('/examinateur/dossiers')}
          style={{ marginBottom: '1rem' }}
        >
          ← Retour à la liste
        </button>
        <h1 className="academic-title">Évaluation du dossier</h1>
        <p className="academic-subtitle">
          {dossier.inscription.candidat.nom} {dossier.inscription.candidat.prenom}
        </p>
      </div>

      {success && (
        <div className="academic-alert academic-alert-success">
          <span className="academic-alert-icon">✓</span>
          <span>Verdict enregistré avec succès ! Redirection en cours...</span>
        </div>
      )}

      {error && (
        <div className="academic-alert academic-alert-error">
          <span className="academic-alert-icon">⚠️</span>
          <span>{error}</span>
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
            <span className="academic-label">Concours :</span>
            <span className="academic-text">{dossier.inscription.concours.libelle}</span>
          </div>
          <div className="academic-info-row">
            <span className="academic-label">Établissement :</span>
            <span className="academic-text">{dossier.inscription.concours.etablissement}</span>
          </div>
        </div>
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

      {/* Statut de l'évaluation */}
      {dossier.autreVerdictRendu && !lectureSeule && (
        <div className="academic-alert academic-alert-info">
          <span className="academic-alert-icon">ℹ️</span>
          <span>
            Un autre examinateur a déjà rendu son verdict. Vous ne pouvez pas modifier son verdict, seulement
            rendre le vôtre ou corriger le vôtre (une fois).
          </span>
        </div>
      )}

      {dossier.messageLectureSeule && (
        <div className="academic-alert academic-alert-warning">
          <span className="academic-alert-icon">🔒</span>
          <span>{dossier.messageLectureSeule}</span>
        </div>
      )}

      {/* Formulaire de verdict */}
      <div className="academic-bento-card">
        <h2 className="academic-card-title">
          {lectureSeule
            ? dossier.monVerdict.rendu
              ? 'Mon verdict (lecture seule)'
              : 'Évaluation (lecture seule)'
            : dossier.monVerdict.rendu
              ? 'Modifier mon verdict'
              : 'Rendre mon verdict'}
        </h2>

        {dossier.monVerdict.rendu && peutAgir && (
          <div className="academic-alert academic-alert-warning">
            <span className="academic-alert-icon">⚠️</span>
            <span>
              Modifications restantes : {dossier.monVerdict.modificationsPossibles} (seul le contrôleur peut
              corriger le verdict d&apos;un autre examinateur)
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
          <label className="academic-label">Verdict *</label>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <label className="academic-radio-label">
              <input
                type="radio"
                name="verdict"
                value="VALIDE"
                checked={verdict === 'VALIDE'}
                onChange={(e) => setVerdict(e.target.value)}
                disabled={submitting || success || lectureSeule || !peutAgir}
              />
              <span className="academic-badge academic-badge-success">Validé</span>
            </label>
            <label className="academic-radio-label">
              <input
                type="radio"
                name="verdict"
                value="REJETE"
                checked={verdict === 'REJETE'}
                onChange={(e) => setVerdict(e.target.value)}
                disabled={submitting || success || lectureSeule || !peutAgir}
              />
              <span className="academic-badge academic-badge-error">Rejeté</span>
            </label>
            <label className="academic-radio-label">
              <input
                type="radio"
                name="verdict"
                value="SOUS_RESERVE"
                checked={verdict === 'SOUS_RESERVE'}
                onChange={(e) => setVerdict(e.target.value)}
                disabled={submitting || success || lectureSeule || !peutAgir}
              />
              <span className="academic-badge academic-badge-warning">Sous réserve</span>
            </label>
          </div>
        </div>

        <div className="academic-form-group">
          <label className="academic-label">
            Motif {(verdict === 'REJETE' || verdict === 'SOUS_RESERVE') && '*'}
          </label>
          <textarea
            className="academic-input"
            rows="6"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder={
              verdict === 'REJETE' || verdict === 'SOUS_RESERVE'
                ? 'Motif obligatoire (minimum 10 caractères)'
                : 'Motif optionnel'
            }
            disabled={submitting || success || lectureSeule || !peutAgir}
          />
          <small className="academic-text-muted">
            {motif.trim().length} / 1000 caractères
          </small>
        </div>

        {peutAgir && (
          <div className="academic-card-footer">
            <button
              className="academic-btn academic-btn-primary"
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
      </div>
    </div>
    </CommissionLayout>
  );
};

export default DetailDossierExaminateur;
