// src/pages/DossiersSansVerdictControleur.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiConfig';
import CommissionLayout from '../components/CommissionLayout';

const DossiersSansVerdictControleur = () => {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState([]);
  const [statistiques, setStatistiques] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, limite: 50, offset: 0, pages: 0 });

  const chargerDossiers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limite: pagination.limite,
        offset: pagination.offset,
      });

      const response = await apiFetch(`/controleur-commission/dossiers/sans-verdict?${params}`);

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des dossiers');
      }

      const data = await response.json();
      setDossiers(data.dossiers || []);
      setPagination(data.pagination);
      setStatistiques(data.statistiques);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.limite, pagination.offset]);

  useEffect(() => {
    chargerDossiers();
  }, [chargerDossiers]);

  const handlePageChange = (newOffset) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const getPrioriteBadge = (priorite) => {
    switch (priorite) {
      case 'URGENT':
        return <span className="academic-badge academic-badge-error">🚨 Urgent</span>;
      case 'HIGH':
        return <span className="academic-badge academic-badge-warning">⚠️ Prioritaire</span>;
      default:
        return <span className="academic-badge academic-badge-info">Normal</span>;
    }
  };

  if (loading) {
    return (
      <div className="academic-container">
        <div className="academic-bento-card">
          <p className="academic-text-muted">Chargement des dossiers...</p>
        </div>
      </div>
    );
  }

  return (
    <CommissionLayout>
    <div className="academic-container">
      <div className="academic-header">
        <button
          className="academic-btn academic-btn-secondary"
          onClick={() => navigate('/controleur-commission/tableau-de-bord')}
          style={{ marginBottom: '1rem' }}
        >
          ← Retour au tableau de bord
        </button>
        <h1 className="academic-title">Dossiers sans verdict</h1>
        <p className="academic-subtitle">
          Dossiers en attente d'évaluation depuis plus de 2 jours
        </p>
      </div>

      {error && (
        <div className="academic-alert academic-alert-error">
          <span className="academic-alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Statistiques */}
      {statistiques && (
        <div className="academic-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
          <div className="academic-bento-card">
            <h3 className="academic-card-title">Total</h3>
            <p className="academic-stat-number">{statistiques.totalDossiersSansVerdict}</p>
          </div>
          <div className="academic-bento-card academic-card-warning">
            <h3 className="academic-card-title">🚨 Urgents</h3>
            <p className="academic-stat-number">{statistiques.dossiersUrgents}</p>
            <small className="academic-text-muted">&gt; 5 jours</small>
          </div>
          <div className="academic-bento-card">
            <h3 className="academic-card-title">⚠️ Prioritaires</h3>
            <p className="academic-stat-number">{statistiques.dossiersHigh}</p>
            <small className="academic-text-muted">3-5 jours</small>
          </div>
        </div>
      )}

      {/* Liste des dossiers */}
      {dossiers.length === 0 ? (
        <div className="academic-bento-card">
          <p className="academic-text-muted">✓ Aucun dossier sans verdict depuis plus de 2 jours. Excellent travail !</p>
        </div>
      ) : (
        <div className="academic-grid">
          {dossiers.map((dossier) => (
            <div
              key={dossier.dossierInscriptionId}
              className={`academic-bento-card academic-card-hover ${
                dossier.priorite === 'URGENT' ? 'academic-card-error' : 
                dossier.priorite === 'HIGH' ? 'academic-card-warning' : ''
              }`}
            >
              <div className="academic-card-header">
                <h3 className="academic-card-title">
                  {dossier.inscription.candidat.nom} {dossier.inscription.candidat.prenom}
                </h3>
                {getPrioriteBadge(dossier.priorite)}
              </div>

              <div className="academic-card-content">
                <div className="academic-info-row">
                  <span className="academic-label">Concours :</span>
                  <span className="academic-text">
                    {dossier.inscription.concours.libelle}
                  </span>
                </div>

                <div className="academic-info-row">
                  <span className="academic-label">Établissement :</span>
                  <span className="academic-text">
                    {dossier.inscription.concours.etablissement}
                  </span>
                </div>

                <div className="academic-info-row">
                  <span className="academic-label">N° Inscription :</span>
                  <span className="academic-text">
                    {dossier.inscription.numeroInscription}
                  </span>
                </div>

                <div className="academic-info-row">
                  <span className="academic-label">Date de création :</span>
                  <span className="academic-text">
                    {new Date(dossier.dateCreation).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div className="academic-alert academic-alert-warning" style={{ marginTop: '1rem' }}>
                  <span className="academic-alert-icon">⏰</span>
                  <span>
                    <strong>{dossier.joursEcoules} jour{dossier.joursEcoules > 1 ? 's' : ''}</strong> sans aucun verdict
                  </span>
                </div>
              </div>

              <div className="academic-card-footer">
                <button
                  className="academic-btn academic-btn-primary"
                  onClick={() => navigate(`/controleur-commission/dossiers/${dossier.dossierInscriptionId}`)}
                >
                  Voir le dossier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="academic-pagination">
          <button
            className="academic-btn academic-btn-secondary"
            disabled={pagination.offset === 0}
            onClick={() => handlePageChange(pagination.offset - pagination.limite)}
          >
            ← Précédent
          </button>
          <span className="academic-text">
            Page {Math.floor(pagination.offset / pagination.limite) + 1} sur {pagination.pages}
          </span>
          <button
            className="academic-btn academic-btn-secondary"
            disabled={pagination.offset + pagination.limite >= pagination.total}
            onClick={() => handlePageChange(pagination.offset + pagination.limite)}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
    </CommissionLayout>
  );
};

export default DossiersSansVerdictControleur;
