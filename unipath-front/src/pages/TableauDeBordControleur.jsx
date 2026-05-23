// src/pages/TableauDeBordControleur.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiConfig';
import CommissionLayout from '../components/CommissionLayout';

const TableauDeBordControleur = () => {
  const navigate = useNavigate();
  const [indicateurs, setIndicateurs] = useState(null);
  const [repartition, setRepartition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    chargerTableauDeBord();
  }, []);

  const chargerTableauDeBord = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch('/controleur-commission/tableau-de-bord');

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du tableau de bord');
      }

      const data = await response.json();
      setIndicateurs(data.indicateurs);
      setRepartition(data.repartitionVerdicts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="academic-container">
        <div className="academic-bento-card">
          <p className="academic-text-muted">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <CommissionLayout>
    <div className="academic-container">
      <div className="academic-header">
        <h1 className="academic-title">Tableau de bord - Contrôleur</h1>
        <p className="academic-subtitle">Vue d'ensemble des évaluations</p>
      </div>

      {error && (
        <div className="academic-alert academic-alert-error">
          <span className="academic-alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Indicateurs clés */}
      <div className="academic-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div className="academic-bento-card academic-card-hover" onClick={() => navigate('/controleur-commission/dossiers?filtre=1_verdict')}>
          <div className="academic-card-header">
            <h3 className="academic-card-title">Dossiers avec 1 verdict</h3>
          </div>
          <div className="academic-card-content">
            <p className="academic-stat-number">{indicateurs?.dossiersAvec1Verdict || 0}</p>
            <p className="academic-text-muted">En attente du 2ème verdict</p>
          </div>
        </div>

        <div className="academic-bento-card academic-card-hover" onClick={() => navigate('/controleur-commission/dossiers?filtre=2_verdicts')}>
          <div className="academic-card-header">
            <h3 className="academic-card-title">Dossiers avec 2 verdicts</h3>
          </div>
          <div className="academic-card-content">
            <p className="academic-stat-number">{indicateurs?.dossiersAvec2Verdicts || 0}</p>
            <p className="academic-text-muted">Prêts pour décision</p>
          </div>
        </div>

        <div className="academic-bento-card academic-card-hover academic-card-warning" onClick={() => navigate('/controleur-commission/dossiers?filtre=divergents')}>
          <div className="academic-card-header">
            <h3 className="academic-card-title">⚠️ Verdicts divergents</h3>
          </div>
          <div className="academic-card-content">
            <p className="academic-stat-number">{indicateurs?.dossiersVerdictsDivergents || 0}</p>
            <p className="academic-text-muted">Nécessitent votre attention</p>
          </div>
        </div>

        <div className="academic-bento-card">
          <div className="academic-card-header">
            <h3 className="academic-card-title">Décisions finales</h3>
          </div>
          <div className="academic-card-content">
            <p className="academic-stat-number">{indicateurs?.dossiersAvecDecisionFinale || 0}</p>
            <p className="academic-text-muted">Dossiers traités</p>
          </div>
        </div>

        <div className="academic-bento-card">
          <div className="academic-card-header">
            <h3 className="academic-card-title">Taux de divergence</h3>
          </div>
          <div className="academic-card-content">
            <p className="academic-stat-number">{indicateurs?.tauxDivergence?.toFixed(1) || 0}%</p>
            <p className="academic-text-muted">
              {indicateurs?.tauxDivergence > 30 ? '⚠️ Élevé' : indicateurs?.tauxDivergence > 15 ? '⚡ Modéré' : '✓ Normal'}
            </p>
          </div>
        </div>
      </div>

      {/* Répartition des verdicts */}
      {repartition && (
        <div className="academic-bento-card">
          <h2 className="academic-card-title">Répartition des verdicts</h2>
          
          <div className="academic-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Verdict 1 */}
            <div>
              <h3 className="academic-subtitle">Examinateur 1</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="academic-info-row">
                  <span className="academic-badge academic-badge-success">Validé</span>
                  <span className="academic-text">{repartition.verdict1.VALIDE || 0}</span>
                </div>
                <div className="academic-info-row">
                  <span className="academic-badge academic-badge-error">Rejeté</span>
                  <span className="academic-text">{repartition.verdict1.REJETE || 0}</span>
                </div>
                <div className="academic-info-row">
                  <span className="academic-badge academic-badge-warning">Sous réserve</span>
                  <span className="academic-text">{repartition.verdict1.SOUS_RESERVE || 0}</span>
                </div>
              </div>
            </div>

            {/* Verdict 2 */}
            <div>
              <h3 className="academic-subtitle">Examinateur 2</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="academic-info-row">
                  <span className="academic-badge academic-badge-success">Validé</span>
                  <span className="academic-text">{repartition.verdict2.VALIDE || 0}</span>
                </div>
                <div className="academic-info-row">
                  <span className="academic-badge academic-badge-error">Rejeté</span>
                  <span className="academic-text">{repartition.verdict2.REJETE || 0}</span>
                </div>
                <div className="academic-info-row">
                  <span className="academic-badge academic-badge-warning">Sous réserve</span>
                  <span className="academic-text">{repartition.verdict2.SOUS_RESERVE || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="academic-bento-card">
        <h2 className="academic-card-title">Actions rapides</h2>
        <div className="academic-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <button
            className="academic-btn academic-btn-primary"
            onClick={() => navigate('/controleur-commission/dossiers')}
          >
            Voir tous les dossiers
          </button>
          <button
            className="academic-btn academic-btn-warning"
            onClick={() => navigate('/controleur-commission/dossiers?filtre=divergents')}
          >
            Dossiers divergents
          </button>
          <button
            className="academic-btn academic-btn-secondary"
            onClick={() => navigate('/controleur-commission/dossiers-sans-verdict')}
          >
            Dossiers sans verdict
          </button>
          <button
            className="academic-btn academic-btn-secondary"
            onClick={() => navigate('/controleur-commission/dossiers?filtre=sans_decision')}
          >
            Dossiers sans décision
          </button>
        </div>
      </div>
    </div>
    </CommissionLayout>
  );
};

export default TableauDeBordControleur;
