// src/pages/ListeDossiersControleur.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/apiConfig';
import CommissionLayout from '../components/CommissionLayout';

const ListeDossiersControleur = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtreActif, setFiltreActif] = useState(searchParams.get('filtre') || '');
  const [pagination, setPagination] = useState({ total: 0, limite: 50, offset: 0, pages: 0 });

  useEffect(() => {
    chargerDossiers();
  }, [filtreActif, pagination.offset]);

  const chargerDossiers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limite: pagination.limite,
        offset: pagination.offset,
      });

      if (filtreActif) {
        params.append('filtre', filtreActif);
      }

      const response = await apiFetch(`/controleur-commission/dossiers?${params}`);

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des dossiers');
      }

      const data = await response.json();
      setDossiers(data.dossiers || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const changerFiltre = (nouveauFiltre) => {
    setFiltreActif(nouveauFiltre);
    setSearchParams(nouveauFiltre ? { filtre: nouveauFiltre } : {});
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const handlePageChange = (newOffset) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
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
          <p className="academic-text-muted">Chargement des dossiers...</p>
        </div>
      </div>
    );
  }

  return (
    <CommissionLayout>
    <div className="academic-container">
      <div className="academic-header">
        <h1 className="academic-title">Dossiers à examiner</h1>
        <p className="academic-subtitle">
          {pagination.total} dossier{pagination.total > 1 ? 's' : ''} avec au moins 1 verdict
        </p>
      </div>

      {error && (
        <div className="academic-alert academic-alert-error">
          <span className="academic-alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Filtres */}
      <div className="academic-bento-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`academic-btn ${!filtreActif ? 'academic-btn-primary' : 'academic-btn-secondary'}`}
            onClick={() => changerFiltre('')}
          >
            Tous
          </button>
          <button
            className={`academic-btn ${filtreActif === '1_verdict' ? 'academic-btn-primary' : 'academic-btn-secondary'}`}
            onClick={() => changerFiltre('1_verdict')}
          >
            1 verdict
          </button>
          <button
            className={`academic-btn ${filtreActif === '2_verdicts' ? 'academic-btn-primary' : 'academic-btn-secondary'}`}
            onClick={() => changerFiltre('2_verdicts')}
          >
            2 verdicts
          </button>
          <button
            className={`academic-btn ${filtreActif === 'divergents' ? 'academic-btn-warning' : 'academic-btn-secondary'}`}
            onClick={() => changerFiltre('divergents')}
          >
            ⚠️ Divergents
          </button>
          <button
            className={`academic-btn ${filtreActif === 'sans_decision' ? 'academic-btn-primary' : 'academic-btn-secondary'}`}
            onClick={() => changerFiltre('sans_decision')}
          >
            Sans décision
          </button>
        </div>
      </div>

      {/* Liste des dossiers */}
      {dossiers.length === 0 ? (
        <div className="academic-bento-card">
          <p className="academic-text-muted">Aucun dossier trouvé avec ce filtre.</p>
        </div>
      ) : (
        <div className="academic-grid">
          {dossiers.map((dossier) => (
            <div
              key={dossier.dossierInscriptionId}
              className={`academic-bento-card academic-card-hover ${
                dossier.verdictsDivergents ? 'academic-card-warning' : ''
              }`}
            >
              <div className="academic-card-header">
                <h3 className="academic-card-title">
                  {dossier.inscription.candidat.nom} {dossier.inscription.candidat.prenom}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="academic-badge academic-badge-info">
                    {dossier.statutVerdicts}
                  </span>
                  {dossier.verdictsDivergents && (
                    <span className="academic-badge academic-badge-warning">
                      ⚠️ Divergents
                    </span>
                  )}
                  {dossier.decisionFinale && (
                    <span className="academic-badge academic-badge-success">
                      ✓ Décision rendue
                    </span>
                  )}
                </div>
              </div>

              <div className="academic-card-content">
                <div className="academic-info-row">
                  <span className="academic-label">Concours :</span>
                  <span className="academic-text">
                    {dossier.inscription.concours.libelle}
                  </span>
                </div>

                <div className="academic-info-row">
                  <span className="academic-label">N° Inscription :</span>
                  <span className="academic-text">
                    {dossier.inscription.numeroInscription}
                  </span>
                </div>

                {/* Verdicts */}
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--academic-bg-secondary)', borderRadius: '8px' }}>
                  <div className="academic-info-row">
                    <span className="academic-label">Verdict 1 :</span>
                    {dossier.verdicts.verdict1 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {getBadgeVerdict(dossier.verdicts.verdict1.verdict)}
                        <small className="academic-text-muted">
                          par {dossier.verdicts.verdict1.nomExaminateur}
                        </small>
                      </div>
                    ) : (
                      <span className="academic-badge">En attente</span>
                    )}
                  </div>

                  <div className="academic-info-row" style={{ marginTop: '0.5rem' }}>
                    <span className="academic-label">Verdict 2 :</span>
                    {dossier.verdicts.verdict2 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {getBadgeVerdict(dossier.verdicts.verdict2.verdict)}
                        <small className="academic-text-muted">
                          par {dossier.verdicts.verdict2.nomExaminateur}
                        </small>
                      </div>
                    ) : (
                      <span className="academic-badge">En attente</span>
                    )}
                  </div>
                </div>

                {dossier.verdictsDivergents && (
                  <div className="academic-alert academic-alert-warning" style={{ marginTop: '1rem' }}>
                    <span className="academic-alert-icon">⚠️</span>
                    <span>Les verdicts sont divergents - Votre décision est requise</span>
                  </div>
                )}
              </div>

              <div className="academic-card-footer">
                <button
                  className="academic-btn academic-btn-primary"
                  onClick={() => navigate(`/controleur-commission/dossiers/${dossier.dossierInscriptionId}`)}
                >
                  Examiner ce dossier
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

export default ListeDossiersControleur;
